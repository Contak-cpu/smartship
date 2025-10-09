import { useState, useEffect } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string) => void;
  logout: () => void;
  isLoading: boolean;
}

// Función helper para obtener el estado inicial desde localStorage
const getInitialAuthState = () => {
  try {
    const savedUsername = localStorage.getItem('smartship_username');
    return {
      isAuthenticated: !!savedUsername,
      username: savedUsername,
    };
  } catch {
    return {
      isAuthenticated: false,
      username: null,
    };
  }
};

export const useAuth = (): AuthState => {
  // Inicializar directamente con el valor de localStorage para evitar parpadeo
  const initialState = getInitialAuthState();
  const [isAuthenticated, setIsAuthenticated] = useState(initialState.isAuthenticated);
  const [username, setUsername] = useState<string | null>(initialState.username);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Este useEffect ahora solo sincroniza si hay cambios externos en localStorage
    const handleStorageChange = () => {
      const savedUsername = localStorage.getItem('smartship_username');
      if (savedUsername && savedUsername !== username) {
        setUsername(savedUsername);
        setIsAuthenticated(true);
      } else if (!savedUsername && isAuthenticated) {
        setUsername(null);
        setIsAuthenticated(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [username, isAuthenticated]);

  const login = (username: string) => {
    setUsername(username);
    setIsAuthenticated(true);
    // Guardar en localStorage para persistir la sesión
    localStorage.setItem('smartship_username', username);
  };

  const logout = () => {
    setUsername(null);
    setIsAuthenticated(false);
    // Limpiar localStorage
    localStorage.removeItem('smartship_username');
  };

  return {
    isAuthenticated,
    username,
    login,
    logout,
    isLoading,
  };
};
