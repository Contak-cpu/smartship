import React, { useState } from 'react';

interface UserData {
  password: string;
  level: number;
}

interface LoginProps {
  onLogin: (username: string, level: number) => void;
  onGoBack?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onGoBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Usuarios hardcodeados con niveles de acceso
  // Nivel 3: Acceso a todas las secciones (administrador)
  // Nivel 2: Acceso a SmartShip, PDF Generator y Rentabilidad
  // Nivel 1: Solo acceso a Rentabilidad
  // Nivel 0: Invitado - Solo calculadora sin historial
  const validUsers: Record<string, UserData> = {
    'Yael': { password: '123', level: 2 },
    'Erick': { password: '123', level: 3 },
    'Pedro': { password: '123', level: 1 }
  };

  const handleGuestLogin = () => {
    onLogin('Invitado', 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Por favor, completa todos los campos');
      return;
    }

    const user = validUsers[username];
    if (user && user.password === password) {
      onLogin(username, user.level);
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 border border-gray-700/50 animate-fadeIn">
        {/* Botón Volver */}
        {onGoBack && (
          <div className="flex justify-start">
            <button
              onClick={onGoBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver a Precios
            </button>
          </div>
        )}
        
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <svg className="w-16 h-16 text-blue-500 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.5 11.5c0-2.5-1.5-4.5-3.5-5.5-.5-2-2-3.5-4-4-2.5-.5-5 .5-6.5 2.5C4 5 2.5 7 2.5 9.5c0 1.5.5 3 1.5 4 0 .5 0 1 .5 1.5.5 1.5 1.5 2.5 3 3 .5.5 1 .5 1.5.5h.5c.5.5 1 1 1.5 1 1 .5 2 .5 3 0 .5-.5 1-.5 1.5-1h.5c.5 0 1 0 1.5-.5 1.5-.5 2.5-1.5 3-3 .5-.5.5-1 .5-1.5 1-1 1.5-2.5 1.5-4zm-11 5c-.5 0-1-.5-1-1s.5-1 1-1 1 .5 1 1-.5 1-1 1zm5 0c-.5 0-1-.5-1-1s.5-1 1-1 1 .5 1 1-.5 1-1 1z"/>
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">South Wale</h1>
          <p className="text-blue-400 font-medium text-sm sm:text-base">Herramientas para Ecommerce</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Usuario
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              placeholder="Ingresa tu usuario"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-sm sm:text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Iniciar Sesión
          </button>
        </form>

        {/* Separador */}
        <div className="flex items-center gap-4">
          <div className="flex-1 border-t border-gray-700"></div>
          <span className="text-gray-500 text-xs">O</span>
          <div className="flex-1 border-t border-gray-700"></div>
        </div>

        {/* Botón de invitado */}
        <button
          onClick={handleGuestLogin}
          data-guest-login
          className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out flex items-center justify-center text-sm sm:text-base border-2 border-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Ingresar como Invitado
        </button>


        <footer className="text-center mt-8 text-gray-500 text-sm">
          <p>Herramientas profesionales para tu ecommerce.</p>
        </footer>
      </div>
    </div>
  );
};
