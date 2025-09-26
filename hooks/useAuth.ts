import { useState, useEffect } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string) => void;
  logout: () => void;
}

export const useAuth = (): AuthState => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si hay una sesión guardada en localStorage
    const savedUsername = localStorage.getItem('smartship_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setIsAuthenticated(true);
    }
  }, []);

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
    logout
  };
};
