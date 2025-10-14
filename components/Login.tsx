import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onGoBack?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onGoBack }) => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Por favor, completa todos los campos');
      setIsLoading(false);
      return;
    }

    try {
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        setError('Email o contraseña incorrectos');
        console.error('Error de autenticación:', signInError);
      } else {
        // Redireccionar al dashboard
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('Error en login:', err);
      setError('Error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
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
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">FACIL.UNO</h1>
          <p className="text-blue-400 font-medium text-sm sm:text-base">Herramientas para Ecommerce</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              placeholder="tu@email.com"
              autoComplete="email"
              disabled={isLoading}
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
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-sm sm:text-base"
          >
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
          </button>
        </form>

        {/* Info de acceso temporal (eliminar en producción) */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-xs text-gray-400">
          <p className="text-center">
            💡 <span className="text-blue-400 font-medium">Para testing:</span> Crea tu cuenta en Supabase Dashboard
          </p>
        </div>


        <footer className="text-center mt-8 text-gray-500 text-sm">
          <p>Herramientas profesionales para tu ecommerce.</p>
        </footer>
      </div>
    </div>
  );
};
