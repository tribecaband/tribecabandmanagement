import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile, UserPermissions } from '../types';

// Debug logging utility
const debugLog = (message: string, data?: any) => {
  console.log(`[AuthContext] ${message}`, data || '');
};

const debugError = (message: string, error?: any) => {
  console.error(`[AuthContext ERROR] ${message}`, error || '');
};

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  permissions: UserPermissions | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
  hasPermission: (permission: keyof UserPermissions) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 30000; // 30 seconds timeout

  useEffect(() => {
    debugLog('Initializing AuthContext');
    
    // Get initial session with aggressive timeout and fallback
    const initializeAuth = async () => {
      try {
        debugLog('Getting initial session...');
        
        // Create timeout promise for session (15 seconds)
        const sessionTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session timeout')), 15000);
        });
        
        let session = null;
        let sessionError = null;
        
        try {
          const result = await Promise.race([
            supabase.auth.getSession(),
            sessionTimeoutPromise
          ]) as any;
          session = result.data?.session;
          sessionError = result.error;
        } catch (timeoutErr) {
          debugError('Session retrieval timed out, trying alternative approach:', timeoutErr);
          
          // Fallback: try to get user directly
          try {
            const { data: { user }, error: userError } = await Promise.race([
              supabase.auth.getUser(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('User timeout')), 10000))
            ]) as any;
            
            if (user && !userError) {
              debugLog('Got user via fallback method:', { userId: user.id });
              setUser(user);
              await loadUserProfile(user.id);
              return;
            }
          } catch (userErr) {
            debugError('Fallback user retrieval also failed:', userErr);
          }
          
          // Final fallback: assume no session and continue
          debugLog('All session retrieval methods failed, assuming no session');
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        
        if (sessionError) {
          debugError('Error getting initial session:', sessionError);
          setError('Error al obtener la sesión inicial');
          setLoading(false);
          return;
        }
        
        debugLog('Initial session obtained:', { hasUser: !!session?.user });
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          debugLog('No user in session, setting loading to false');
          setLoading(false);
        }
      } catch (err) {
        debugError('Unexpected error during auth initialization:', err);
        setError('Error inesperado durante la inicialización');
        setLoading(false);
      }
    };
    
    // Initialize with timeout
    const timeoutId = setTimeout(() => {
      debugError('Auth initialization timeout');
      setError('Tiempo de espera agotado durante la inicialización');
      setLoading(false);
    }, TIMEOUT_MS);
    
    initializeAuth().finally(() => {
      clearTimeout(timeoutId);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      debugLog('Auth state changed:', { event, hasUser: !!session?.user });
      setSession(session);
      setUser(session?.user ?? null);
      setError(null); // Clear previous errors
      
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        debugLog('User logged out, clearing profile and permissions');
        setProfile(null);
        setPermissions(null);
        setLoading(false);
      }
    });

    return () => {
      debugLog('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string, attempt: number = 1) => {
    debugLog(`Loading user profile (attempt ${attempt}/${MAX_RETRIES})`, { userId });
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('[AuthContext DEBUG] Starting profile load for user:', userId);
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), TIMEOUT_MS);
      });
      
      // Obtener información del usuario autenticado con timeout
      debugLog('Getting authenticated user info...');
      const getUserPromise = supabase.auth.getUser();
      const { data: { user } } = await Promise.race([
        getUserPromise,
        timeoutPromise
      ]) as any;
      
      if (!user) {
        throw new Error('No authenticated user found');
      }
      debugLog('Authenticated user info retrieved', { userId: user.id });
      
      // Load user profile with timeout
      debugLog('Fetching user profile from database...');
      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const { data: profileData, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;

      // Si no existe el perfil, crearlo automáticamente
      if (profileError && profileError.code === 'PGRST116') {
        debugLog('No profile found, creating new profile...');
        const { data: newProfile, error: createProfileError } = await Promise.race([
          supabase
            .from('user_profiles')
            .insert({
              id: userId,
              email: user?.email || '',
              full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuario',
              role: 'user'
            })
            .select()
            .single(),
          timeoutPromise
        ]) as any;

        if (createProfileError) {
          debugError('Error creating profile:', createProfileError);
          throw new Error(`Error creando perfil: ${createProfileError.message}`);
        }
        debugLog('New profile created successfully');
        setProfile({
          ...newProfile,
          permissions: null
        });
      } else if (profileError) {
        debugError('Error loading profile:', profileError);
        console.error('[AuthContext DEBUG] Profile fetch error:', profileError);
        throw new Error(`Error cargando perfil: ${profileError.message}`);
      } else {
        debugLog('Profile loaded successfully');
        console.log('[AuthContext DEBUG] Profile data received:', profileData);
        console.log('[AuthContext DEBUG] Profile role from database:', profileData?.role);
        console.log('[AuthContext DEBUG] Profile email from database:', profileData?.email);
        setProfile(profileData);
      }

      // Load user permissions with timeout
      debugLog('Fetching user permissions from database...');
      const permissionsPromise = supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      const { data: permissionsData, error: permissionsError } = await Promise.race([
        permissionsPromise,
        timeoutPromise
      ]) as any;

      // Si no existen los permisos, crearlos automáticamente
      if (permissionsError && permissionsError.code === 'PGRST116') {
        debugLog('No permissions found, creating default permissions...');
        const { data: newPermissions, error: createPermissionsError } = await Promise.race([
          supabase
            .from('user_permissions')
            .insert({
              user_id: userId,
              can_create_events: false,
              can_edit_events: false,
              can_delete_events: false,
              can_view_accounting: false,
              can_manage_users: false
            })
            .select()
            .single(),
          timeoutPromise
        ]) as any;

        if (createPermissionsError) {
          debugError('Error creating permissions:', createPermissionsError);
          throw new Error(`Error creando permisos: ${createPermissionsError.message}`);
        }
        debugLog('Default permissions created successfully');
        setPermissions(newPermissions);
        
        // Update profile with permissions
        setProfile(prev => prev ? {
          ...prev,
          permissions: newPermissions
        } : null);
      } else if (permissionsError) {
        debugError('Error loading permissions:', permissionsError);
        throw new Error(`Error cargando permisos: ${permissionsError.message}`);
      } else {
        debugLog('Permissions loaded successfully');
        setPermissions(permissionsData);
        
        // Update profile with permissions
        setProfile(prev => prev ? {
          ...prev,
          permissions: permissionsData
        } : null);
      }

      debugLog('User profile loading completed successfully');
      setLoading(false);
      setRetryCount(0); // Reset retry count on success
      
    } catch (error: any) {
      debugError(`Error loading user data (attempt ${attempt}):`, error);
      
      if (attempt < MAX_RETRIES && error.message !== 'Timeout') {
        debugLog(`Retrying in 2 seconds... (${attempt + 1}/${MAX_RETRIES})`);
        setRetryCount(attempt);
        setTimeout(() => {
          loadUserProfile(userId, attempt + 1);
        }, 2000);
      } else {
        // Final fallback - set minimal working state
        debugError('Max retries reached or timeout, setting fallback state');
        setError(error.message || 'Error cargando datos del usuario');
        
        // Set minimal fallback data to unblock the UI
        if (!profile) {
          setProfile({
            id: userId,
            email: user?.email || '',
            full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuario',
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            permissions: null
          });
        }
        
        if (!permissions) {
          const fallbackPermissions = {
            id: 'fallback',
            user_id: userId,
            can_create_events: false,
            can_edit_events: false,
            can_delete_events: false,
            can_view_accounting: false,
            can_manage_users: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setPermissions(fallbackPermissions);
        }
        
        setLoading(false);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user?.id) {
      debugLog('Refreshing user profile manually');
      console.log('[AuthContext DEBUG] Manual refresh triggered for user:', user.id);
      await loadUserProfile(user.id);
      console.log('[AuthContext DEBUG] Manual refresh completed');
    } else {
      debugError('Cannot refresh profile: no user logged in');
      console.error('[AuthContext DEBUG] Cannot refresh: no user logged in');
    }
  };

  const isAdmin = profile?.role === 'admin';

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (isAdmin) return true;
    return permissions?.[permission] ?? false;
  };

  const value: AuthContextType = {
    user,
    profile,
    permissions,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    isAdmin,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};