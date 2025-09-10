import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AuthUser, LoginForm, RegisterForm } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (credentials: LoginForm) => Promise<{ error: any }>;
  signUp: (credentials: RegisterForm) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  forceSignOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener usuario actual al cargar
    const getInitialUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || '',
            role: data.user.user_metadata?.role || 'musician',
          });
        }
      } catch (error) {
        console.error('Error getting initial user:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialUser();

    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || '',
            role: session.user.user_metadata?.role || 'musician',
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (credentials: LoginForm) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (credentials: RegisterForm) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            name: credentials.name,
            role: credentials.role,
          }
        }
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const forceSignOut = async () => {
    try {
      // Cerrar sesión en Supabase
      await supabase.auth.signOut();
      
      // Limpiar estado local
      setUser(null);
      
      // Limpiar almacenamiento del navegador
      localStorage.clear();
      sessionStorage.clear();
      
      // Limpiar cookies de Supabase
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Recargar la página para limpiar cualquier estado residual
      window.location.reload();
    } catch (error) {
      console.error('Error in force sign out:', error);
      // Aún así limpiar y recargar en caso de error
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    forceSignOut,
  };
};

export { AuthContext };