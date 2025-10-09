import { useState, useEffect } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  userLevel: number;
  login: (username: string, level: number) => void;
  logout: () => void;
  isLoading: boolean;
  hasAccess: (requiredLevel: number) => boolean;
}

// Función helper para obtener el estado inicial desde localStorage
const getInitialAuthState = () => {
  try {
    const savedUsername = localStorage.getItem('smartship_username');
    const savedLevel = localStorage.getItem('smartship_user_level');
    return {
      isAuthenticated: !!savedUsername,
      username: savedUsername,
      userLevel: savedLevel ? parseInt(savedLevel) : 0,
    };
  } catch {
    return {
      isAuthenticated: false,
      username: null,
      userLevel: 0,
    };
  }
};

export const useAuth = (): AuthState => {
  // Inicializar directamente con el valor de localStorage para evitar parpadeo
  const initialState = getInitialAuthState();
  const [isAuthenticated, setIsAuthenticated] = useState(initialState.isAuthenticated);
  const [username, setUsername] = useState<string | null>(initialState.username);
  const [userLevel, setUserLevel] = useState<number>(initialState.userLevel);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Este useEffect ahora solo sincroniza si hay cambios externos en localStorage
    const handleStorageChange = () => {
      const savedUsername = localStorage.getItem('smartship_username');
      const savedLevel = localStorage.getItem('smartship_user_level');
      
      if (savedUsername && savedUsername !== username) {
        setUsername(savedUsername);
        setUserLevel(savedLevel ? parseInt(savedLevel) : 0);
        setIsAuthenticated(true);
      } else if (!savedUsername && isAuthenticated) {
        setUsername(null);
        setUserLevel(0);
        setIsAuthenticated(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [username, isAuthenticated]);

  const login = (username: string, level: number) => {
    setUsername(username);
    setUserLevel(level);
    setIsAuthenticated(true);
    // Guardar en localStorage para persistir la sesión
    localStorage.setItem('smartship_username', username);
    localStorage.setItem('smartship_user_level', level.toString());
  };

  const logout = () => {
    setUsername(null);
    setUserLevel(0);
    setIsAuthenticated(false);
    // Limpiar localStorage
    localStorage.removeItem('smartship_username');
    localStorage.removeItem('smartship_user_level');
  };

  const hasAccess = (requiredLevel: number): boolean => {
    return userLevel >= requiredLevel;
  };

  return {
    isAuthenticated,
    username,
    userLevel,
    login,
    logout,
    isLoading,
    hasAccess,
  };
};
