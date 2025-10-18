import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { levelService, UserLevel } from '../services/levelService';

interface UserProfile {
  id: string;
  username: string;
  nivel: number;
  email: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserLevel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let authCheckComplete = false;

    // Función para procesar la sesión
    const processSession = async (session: any) => {
      if (!mounted) return;
      
      console.log('🔄 [useAuth] Procesando sesión:', session ? 'Sesión válida' : 'Sin sesión');
      
      if (session?.user) {
        setUser(session.user);
        
        // Obtener el nivel del usuario desde la tabla user_profiles
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) {
            console.error('❌ Error obteniendo perfil:', profileError);
            // Fallback a metadata si no se encuentra en user_profiles
            const metadata = session.user.user_metadata || {};
            const profile: UserLevel = {
              id: session.user.id,
              username: metadata.username || session.user.email?.split('@')[0] || 'Usuario',
              nivel: parseInt(metadata.nivel) || 0,
              email: session.user.email || ''
            };
            setUserProfile(profile);
            console.log('⚠️ Usando perfil fallback:', session.user.email, 'Nivel:', profile.nivel);
          } else {
            // Usar datos de user_profiles
            const profile: UserLevel = {
              id: profileData.id,
              username: profileData.username,
              nivel: profileData.nivel,
              email: profileData.email || session.user.email || ''
            };
            setUserProfile(profile);
            console.log('✅ Sesión procesada:', session.user.email, 'Nivel:', profile.nivel);
          }
        } catch (error) {
          console.error('❌ Error procesando perfil:', error);
          // Fallback a metadata
          const metadata = session.user.user_metadata || {};
          const profile: UserLevel = {
            id: session.user.id,
            username: metadata.username || session.user.email?.split('@')[0] || 'Usuario',
            nivel: parseInt(metadata.nivel) || 0,
            email: session.user.email || ''
          };
          setUserProfile(profile);
          console.log('⚠️ Usando perfil fallback por error:', session.user.email, 'Nivel:', profile.nivel);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        levelService.clearState();
        console.log('❌ No hay sesión activa');
      }
      
      authCheckComplete = true;
      setIsLoading(false);
    };

    // Obtener sesión inicial con retry
    const getInitialSession = async (retryCount = 0) => {
      try {
        console.log(`🔄 [useAuth] Obteniendo sesión inicial (intento ${retryCount + 1})`);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error obteniendo sesión:', error);
          // Si es un error de red, reintentar una vez
          if (retryCount < 1 && error.message?.includes('network')) {
            setTimeout(() => getInitialSession(retryCount + 1), 1000);
            return;
          }
          authCheckComplete = true;
          setIsLoading(false);
          return;
        }
        
        await processSession(session);
      } catch (error) {
        console.error('❌ Error:', error);
        // Si es un error de red, reintentar una vez
        if (retryCount < 1 && error.message?.includes('network')) {
          setTimeout(() => getInitialSession(retryCount + 1), 1000);
          return;
        }
        authCheckComplete = true;
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Timeout de seguridad más largo: si después de 5 segundos sigue en loading, forzar a false
    const timeoutId = setTimeout(() => {
      if (mounted && !authCheckComplete) {
        console.warn('⚠️ Timeout de autenticación - forzando isLoading a false');
        setIsLoading(false);
      }
    }, 5000);

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change:', event, session ? 'Con sesión' : 'Sin sesión');
      
      if (!mounted) return;
      
      // Solo procesar si no estamos en el estado inicial
      if (authCheckComplete) {
        processSession(session);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // Valores computados simples
  const username = userProfile?.username || user?.email?.split('@')[0] || 'Usuario';
  const userLevel = userProfile?.nivel || 0;
  const userId = user?.id || '';
  

  const hasAccess = (requiredLevel: number): boolean => {
    const result = userLevel >= requiredLevel;
    console.log(`🔍 [hasAccess] userLevel: ${userLevel}, requiredLevel: ${requiredLevel}, result: ${result}`);
    return result;
  };

  const login = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    return { error };
  };

  const refreshUserProfile = async () => {
    if (user) {
      const userLevel = await levelService.getUserLevel(user.id);
      if (userLevel) {
        setUserProfile(userLevel);
      }
    }
  };

  const updateUserLevel = async (newLevel: number) => {
    if (!user) return { error: 'No hay usuario autenticado' };
    
    const result = await levelService.updateUserLevel(user.id, newLevel);
    if (!result.error) {
      await refreshUserProfile();
    }
    
    return result;
  };

  return {
    username,
    userLevel,
    userId,
    hasAccess,
    login,
    logout,
    isAuthenticated: !!user,
    isProfileLoaded: !!userProfile,
    user,
    session: null,
    userProfile,
    isLoading,
    signIn,
    signOut,
    signUp,
    refreshUserProfile,
    updateUserLevel,
  };
};