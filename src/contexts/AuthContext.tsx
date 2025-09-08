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
    let mounted = true;
    let authSubscription: any = null;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('🔄 Inicializando autenticación...');

        // Obtener sesión de forma directa sin timeouts excesivos
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ Error al obtener sesión:', sessionError);
          if (mounted) {
            setSession(null);
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          console.log('✅ Sesión encontrada:', session.user.email);
          setSession(session);
          setUser(session.user);

          // Cargar perfil de forma directa
          try {
            await loadUserProfile(session.user.id);
          } catch (error) {
            console.error('❌ Error al cargar perfil:', error);
          }
        } else if (mounted) {
          console.log('ℹ️ No hay sesión activa');
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Error en inicialización:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      debugLog('Auth state changed:', { event, hasUser: !!session?.user });
      
      // Evitar procesamiento durante logout manual
      if (event === 'SIGNED_OUT') {
        debugLog('User signed out, clearing all state');
        setSession(null);
        setUser(null);
        setProfile(null);
        setPermissions(null);
        setError(null);
        setLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setError(null); // Clear previous errors
      
      if (session?.user) {
        // Check if we're in an invitation flow and should skip profile loading
        const isInInvitationFlow = window.location.pathname === '/auth/callback' && 
                                   window.location.hash.includes('type=invite');
        
        if (isInInvitationFlow) {
          debugLog('In invitation flow, skipping profile load for now');
          setLoading(false);
        } else {
          try {
            await loadUserProfile(session.user.id);
          } catch (error) {
            console.error('Error loading profile:', error);
          } finally {
            if (mounted) {
              setLoading(false);
            }
          }
        }
      } else {
        debugLog('User logged out, clearing profile and permissions');
        setProfile(null);
        setPermissions(null);
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      debugLog('Cleaning up auth subscription');
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('🔄 Cargando perfil de usuario:', userId);
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error al cargar perfil:', error);
        throw error;
      }

      console.log('✅ Perfil cargado exitosamente:', profile.email);
      setProfile(profile);
      await loadUserPermissions(userId);
    } catch (error) {
      console.error('❌ Error al cargar perfil del usuario:', error);
      setError('Error al cargar el perfil del usuario');
      throw error;
    }
  };

  const loadUserPermissions = async (userId: string) => {
    try {
      console.log('🔄 Cargando permisos de usuario:', userId);
      
      const { data: permissions, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ Error al cargar permisos:', error);
        throw error;
      }

      console.log('✅ Permisos cargados exitosamente');
      setPermissions(permissions);
    } catch (error) {
      console.error('❌ Error al cargar permisos del usuario:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }
      
      if (data.user) {
        // Cargar perfil de usuario inmediatamente
        await loadUserProfile(data.user.id);
        return { success: true };
      }
      
      return { success: false, error: 'No se recibieron datos del usuario' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado durante el inicio de sesión';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }
      
      if (data.user) {
        // Si el usuario está confirmado, cargar perfil inmediatamente
        if (data.user.email_confirmed_at) {
          await loadUserProfile(data.user.id);
        }
        
        return { success: true, user: data.user };
      }
      
      return { success: false, error: 'No se recibieron datos del usuario' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado durante el registro';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('🔄 Iniciando proceso de logout...');
      setLoading(true);
      
      // Limpiar estado local primero para evitar bucles
      setUser(null);
      setSession(null);
      setProfile(null);
      setPermissions(null);
      setError(null);
      
      // Ejecutar signOut de Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Error durante logout:', error);
        setError(error.message);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Logout completado exitosamente');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado durante el cierre de sesión';
      console.error('❌ Error inesperado en logout:', errorMessage);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
      console.log('🔄 Proceso de logout finalizado');
    }
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