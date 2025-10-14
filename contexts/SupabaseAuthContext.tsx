import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  username: string;
  nivel: number;
  email: string;
  created_at: string;
  updated_at: string;
}

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

export const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

interface SupabaseAuthProviderProps {
  children: ReactNode;
}

export const SupabaseAuthProvider: React.FC<SupabaseAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Función para cargar el perfil del usuario desde la tabla user_profiles
  const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      // Timeout de 5 segundos para evitar carga infinita
      const timeoutPromise = new Promise<null>((resolve) => 
        setTimeout(() => {
          console.warn('⚠️ Timeout al cargar perfil de usuario');
          resolve(null);
        }, 5000)
      );

      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const result = await Promise.race([profilePromise, timeoutPromise]);

      if (!result) {
        console.warn('⚠️ No se pudo cargar el perfil (timeout o no existe)');
        return null;
      }

      const { data, error } = result as any;

      if (error) {
        console.error('❌ Error al cargar perfil de usuario:', error.message);
        // Si el perfil no existe, retornar null sin error
        if (error.code === 'PGRST116') {
          console.warn('⚠️ El perfil no existe en la base de datos');
        }
        return null;
      }

      console.log('✅ Perfil de usuario cargado correctamente:', data);
      return data as UserProfile;
    } catch (error) {
      console.error('❌ Error al cargar perfil:', error);
      return null;
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      const profile = await loadUserProfile(user.id);
      setUserProfile(profile);
    }
  };

  useEffect(() => {
    // Obtener sesión inicial
    const initializeAuth = async () => {
      try {
        console.log('🔄 Inicializando autenticación...');
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Cargar perfil del usuario si existe
        if (currentSession?.user) {
          console.log('👤 Usuario autenticado, cargando perfil...');
          const profile = await loadUserProfile(currentSession.user.id);
          setUserProfile(profile);
          
          if (!profile) {
            console.warn('⚠️ No se pudo cargar el perfil. El usuario podrá usar la app con nivel 0.');
          }
        } else {
          console.log('👤 No hay sesión activa');
        }
      } catch (error) {
        console.error('❌ Error al inicializar autenticación:', error);
      } finally {
        console.log('✅ Autenticación inicializada');
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('🔔 Auth event:', event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Cargar perfil del usuario en TODOS los eventos (incluyendo TOKEN_REFRESHED)
        if (currentSession?.user) {
          console.log('👤 Cargando perfil después de evento de auth...', event);
          
          // Solo recargar perfil en estos eventos específicos
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            const profile = await loadUserProfile(currentSession.user.id);
            setUserProfile(profile);
            
            if (!profile) {
              console.warn('⚠️ No se encontró perfil para el usuario');
            } else {
              console.log('✅ Perfil recargado:', profile.nivel);
            }
          }
        } else {
          console.log('👋 Usuario cerró sesión');
          setUserProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    // Verificación periódica del perfil (cada 5 minutos)
    // Esto asegura que el perfil esté siempre sincronizado
    const profileCheckInterval = setInterval(async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession?.user) {
        console.log('🔄 Verificación periódica del perfil...');
        const profile = await loadUserProfile(currentSession.user.id);
        
        // Solo actualizar si el perfil cambió
        setUserProfile(prevProfile => {
          if (!prevProfile || prevProfile.nivel !== profile?.nivel) {
            console.log('✅ Perfil actualizado en verificación periódica');
            return profile;
          }
          return prevProfile;
        });
      }
    }, 5 * 60 * 1000); // Cada 5 minutos

    // Cleanup
    return () => {
      subscription.unsubscribe();
      clearInterval(profileCheckInterval);
    };
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
        },
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <SupabaseAuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        isLoading,
        signUp,
        signIn,
        signOut,
        refreshUserProfile,
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
};

