import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onGoBack?: () => void;
  onLogin?: (username: string, level: number) => void;
}

export const Login: React.FC<LoginProps> = ({ onGoBack, onLogin }) => {
  console.log('🔍 [Login] Componente renderizado');
  const { signIn, userProfile } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🔍 [Login] handleSubmit llamado');
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Por favor, completa todos los campos');
      setIsLoading(false);
      return;
    }

    try {
      // Delay mínimo para mejorar la percepción del usuario (simula procesamiento)
      const [result] = await Promise.all([
        signIn(email, password),
        new Promise(resolve => setTimeout(resolve, 800)) // Delay mínimo de 800ms
      ]);
      
      console.log('🔍 [Login] Iniciando login para:', email);
      
      if (result.error) {
        console.error('❌ [Login] Error de autenticación:', result.error);
        setError('Email o contraseña incorrectos');
        setIsLoading(false);
      } else {
        console.log('✅ [Login] Login exitoso');
        
        // Mensaje de éxito visual
        console.log('🔍 [Login] Estado actualizado');
        if (onLogin && userProfile) {
          console.log('✅ [Login] Llamando onLogin con:', userProfile.username, userProfile.nivel);
          // Pequeño delay para mostrar el éxito antes de redirigir
          setTimeout(() => {
            onLogin(userProfile.username, userProfile.nivel);
          }, 500);
        } else {
          console.log('⚠️ [Login] Redirigiendo a dashboard');
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 500);
        }
      }
    } catch (err) {
      console.error('❌ [Login] Error en login:', err);
      setError('Error al iniciar sesión. Intenta nuevamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#b5b5b5' }}>
      <div className="w-full max-w-md mx-auto rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 border-2 border-blue-400 animate-fadeIn" style={{ backgroundColor: '#3f3f3f' }}>
        {/* Botón Volver */}
        {onGoBack && (
          <div className="flex justify-start">
            <button
              onClick={onGoBack}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"
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
            <img 
              src="/facil-uno.png" 
              alt="FACIL.UNO Logo" 
              className="drop-shadow-lg"
              style={{ 
                width: '200px', 
                height: 'auto', 
                maxWidth: '100%',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>
          <p className="text-gray-300 text-xs sm:text-sm mt-2">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
              style={{ backgroundColor: '#2a2a2a', border: '1px solid #4a4a4a' }}
              placeholder="tu@email.com"
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
              style={{ backgroundColor: '#2a2a2a', border: '1px solid #4a4a4a' }}
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 disabled:transform-none flex items-center justify-center text-sm sm:text-base relative overflow-hidden hover:opacity-90"
            style={{ backgroundColor: isLoading ? '#4a4a4a' : '#1e40af' }}
          >
            {isLoading && (
              <div className="absolute inset-0 animate-pulse" style={{ backgroundColor: '#4a4a4a' }} />
            )}
            <span className="relative flex items-center">
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Iniciar Sesión
                </>
              )}
            </span>
          </button>
        </form>

        {/* Botón para ver precios */}
        <div className="text-center">
          <button
            onClick={onGoBack}
            className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium underline"
          >
            Ver planes y precios
          </button>
        </div>

        <footer className="text-center mt-8 text-gray-300 text-sm">
          <p>Herramientas profesionales para tu ecommerce.</p>
        </footer>
      </div>
    </div>
  );
};
