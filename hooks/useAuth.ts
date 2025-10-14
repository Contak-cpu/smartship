import { useContext } from 'react';
import { SupabaseAuthContext } from '../contexts/SupabaseAuthContext';

/**
 * Hook principal de autenticación - Usa Supabase Auth
 * Mantiene compatibilidad con la API anterior para no romper componentes existentes
 */
export const useAuth = () => {
  const context = useContext(SupabaseAuthContext);
  
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un SupabaseAuthProvider');
  }

  const { user, session, userProfile, isLoading, signIn, signOut, signUp, refreshUserProfile } = context;

  // Mapear a la estructura esperada por los componentes existentes
  // Ahora usamos userProfile que viene de la base de datos
  const username = userProfile?.username || user?.email?.split('@')[0] || 'Usuario';
  const userLevel = userProfile?.nivel ?? 0;
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
    // API compatible con la anterior
    username,
    userLevel,
    userId,
    hasAccess,
    login,
    logout,
    isAuthenticated: !!user,
    
    // API de Supabase (para funcionalidades avanzadas)
    user,
    session,
    userProfile,
    isLoading,
    signIn,
    signOut,
    signUp,
    refreshUserProfile,
  };
};
