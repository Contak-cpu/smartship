import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { 
  getUserMetadata, 
  updateUserMetadata, 
  getTrialInfo, 
  hasTrialExpired,
  setUserLevel,
  UserMetadata 
} from '../services/userMetadataService';

interface UserLevel {
  id: string;
  username: string;
  nivel: number;
  email: string;
}

export const useAuth = () => {
  console.log('🔍 [useAuth] Hook inicializado');
  
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserLevel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar perfil del usuario desde metadata
  const loadUserProfile = async (currentUser: any) => {
    try {
      console.log('📥 [useAuth] Cargando metadata para:', currentUser.email);
      
      const metadata: UserMetadata = {
        username: currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || 'Usuario',
        nivel: currentUser.user_metadata?.nivel ?? 0,
        trial_expires_at: currentUser.user_metadata?.trial_expires_at,
        email: currentUser.email,
      };

      const userLevel: UserLevel = {
        id: currentUser.id,
        username: metadata.username,
        nivel: metadata.nivel,
        email: metadata.email || '',
      };
      
      setUserProfile(userLevel);
      console.log('✅ [useAuth] Metadata cargado:', metadata.username, 'Nivel:', metadata.nivel);
    } catch (err) {
      console.error('❌ [useAuth] Excepción cargando metadata:', err);
      setError('Error al cargar los datos del usuario');
    }
  };

  // Verificar y actualizar si el trial expiró
  const checkTrialExpiration = async (currentUser: any) => {
    try {
      const metadata: UserMetadata = {
        username: currentUser.user_metadata?.username || '',
        nivel: currentUser.user_metadata?.nivel ?? 0,
        trial_expires_at: currentUser.user_metadata?.trial_expires_at,
        email: currentUser.email,
      };

      const expired = hasTrialExpired(metadata);

      // Si expiró y tiene nivel 3, reducir a 0
      if (expired && metadata.nivel === 3) {
        console.log('⚠️ [useAuth] Trial expirado, reduciendo nivel a 0');
        await setUserLevel(0);
        // Recargar el usuario para obtener metadata actualizado
        const { data } = await authService.getCurrentUser();
        if (data?.user) {
          await loadUserProfile(data.user);
        }
      }
    } catch (err) {
      console.error('❌ [useAuth] Error verificando trial:', err);
    }
  };

  // Procesar sesión de usuario
  const processSession = async (session: any) => {
    console.log('🔄 [useAuth] processSession:', session ? 'Con sesión' : 'Sin sesión');
    
    if (session?.user) {
      setUser(session.user);
      
      // Cargar metadata del usuario
      await loadUserProfile(session.user);
      
      // Verificar si el trial expiró
      await checkTrialExpiration(session.user);
    } else {
      setUser(null);
      setUserProfile(null);
      console.log('🔄 [useAuth] Usuario deslogueado');
    }
  };

  // Inicialización del hook
  useEffect(() => {
    let mounted = true;

    // Cargar sesión inicial
    const initializeAuth = async () => {
      try {
        console.log('🚀 [useAuth] Inicializando autenticación');
        
        const { session, error: sessionError } = await authService.getCurrentSession();
        
        if (sessionError) {
          console.error('❌ [useAuth] Error obteniendo sesión:', sessionError);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        if (mounted) {
          await processSession(session);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('❌ [useAuth] Excepción inicializando:', err);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Escuchar cambios de autenticación
    const unsubscribe = authService.onAuthStateChange(async (event, session) => {
      console.log('🔄 [useAuth] Auth state change:', event);
      
      if (!mounted) return;

      // El perfil ya se crea en signUp(), no crear aquí para evitar duplicación
      // Solo procesar la sesión existente

      // Procesar la nueva sesión
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await processSession(session);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProfile(null);
        setIsLoading(false);
      }
    });

    // Timeout de seguridad
    const timeoutId = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('⚠️ [useAuth] Timeout de autenticación');
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  // Función de login
  const signIn = async (email: string, password: string): Promise<{ error?: any }> => {
    console.log('🔐 [useAuth] signIn llamado para:', email);
    
    try {
      const result = await authService.signIn(email, password);
      
      if (!result.success) {
        console.error('❌ Login fallido');
        return { error: result.error };
      }

      // La sesión se procesará automáticamente por el listener de auth state change
      console.log('✅ [useAuth] Login exitoso');
      return {};
    } catch (err: any) {
      console.error('❌ [useAuth] Excepción en signIn:', err);
      return { error: err.message };
    }
  };

  // Función de registro
  const signUp = async (email: string, password: string, username: string, plan: string = 'Starter') => {
    console.log('📝 [useAuth] signUp llamado para:', email);
    
    try {
      const result = await authService.signUp(email, password, username, plan);
      
      if (!result.success) {
        console.error('❌ [useAuth] Registro fallido');
        return { error: result.error };
      }

      // El metadata ya se configuró en authService.signUp()
      console.log('✅ [useAuth] Usuario registrado con metadata (nivel 3, trial 7 días)');

      return { error: null };
    } catch (err: any) {
      console.error('❌ [useAuth] Excepción en signUp:', err);
      return { error: err.message };
    }
  };

  // Función de logout
  const signOut = async (): Promise<void> => {
    console.log('🚪 [useAuth] signOut llamado');
    
    try {
      await authService.signOut();
      setUser(null);
      setUserProfile(null);
      console.log('✅ [useAuth] Logout exitoso');
    } catch (err) {
      console.error('❌ [useAuth] Excepción en signOut:', err);
    }
  };

  // Función para actualizar estado local (para compatibilidad con código existente)
  const setUserState = async (username: string, level: number) => {
    // Esta función solo actualiza el estado local, no hace cambios en la base de datos
    if (user) {
      const tempProfile: UserLevel = {
        id: user.id,
        username,
        email: user.email || '',
        nivel: level,
      };
      setUserProfile(tempProfile);
      console.log('✅ [useAuth] Estado de usuario actualizado:', username, 'Nivel:', level);
    }
  };

  // Valores computados
  const username = userProfile?.username || user?.email?.split('@')[0] || 'Usuario';
  const userLevel = userProfile?.nivel || 0;
  const userId = user?.id || '';
  const isAuthenticated = !!user;

  // Función para verificar acceso
  const hasAccess = (requiredLevel: number): boolean => {
    const result = userLevel >= requiredLevel;
    console.log(`🔍 [hasAccess] userLevel: ${userLevel}, requiredLevel: ${requiredLevel}, result: ${result}`);
    return result;
  };

  // Función de compatibilidad para refresh
  const refreshUserProfile = async () => {
    if (user) {
      await loadUserProfile(user);
    }
  };

  // Función para actualizar nivel (para compatibilidad)
  const updateUserLevel = async (newLevel: number) => {
    if (!user) return { error: 'No hay usuario autenticado' };
    
    try {
      // Actualizar en metadata
      const result = await setUserLevel(newLevel);
      
      if (result.success) {
        // Recargar el usuario para obtener metadata actualizado
        const { user: updatedUser } = await authService.getCurrentUser();
        if (updatedUser) {
          await loadUserProfile(updatedUser);
        }
      }
      
      return result;
    } catch (error: any) {
      return { error: error.message || 'No se pudo actualizar el nivel' };
    }
  };

  return {
    // Estado
    user,
    userProfile,
    isAuthenticated,
    isLoading,
    error,
    
    // Información del usuario
    username,
    userLevel,
    userId,
    
    // Funciones de autenticación
    signIn,
    signUp,
    signOut,
    hasAccess,
    
    // Funciones de compatibilidad
    login: signIn,
    logout: signOut,
    setUserState,
    refreshUserProfile,
    updateUserLevel,
  };
};
