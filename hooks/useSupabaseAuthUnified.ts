import { useSupabaseAuth } from './useSupabaseAuth';

/**
 * Hook unificado que usa Supabase Auth y mantiene compatibilidad con la API anterior
 */
export const useAuth = () => {
  const { user, session, isLoading, signIn, signOut } = useSupabaseAuth();

  // Mapear el user de Supabase a la estructura anterior
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Usuario';
  const userLevel = user?.user_metadata?.nivel || 0;
  const userId = user?.id || '';

  const hasAccess = (requiredLevel: number): boolean => {
    return userLevel >= requiredLevel;
  };

  const login = async (usernameOrEmail: string, password: string): Promise<void> => {
    const { error } = await signIn(usernameOrEmail, password);
    if (error) {
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    await signOut();
  };

  return {
    // Compatibilidad con API anterior
    username,
    userLevel,
    userId,
    hasAccess,
    login,
    logout,
    isAuthenticated: !!user,
    
    // API de Supabase
    user,
    session,
    isLoading,
    signIn,
    signOut,
  };
};

