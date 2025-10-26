import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface RegisterProps {
  onGoBack?: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onGoBack }) => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Validaciones
    if (!email || !password || !confirmPassword || !username) {
      setError('Por favor, completa todos los campos');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    if (username.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await signUp(email, password, username);
      
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Este email ya está registrado. Intenta iniciar sesión.');
        } else if (signUpError.message.includes('Invalid email')) {
          setError('El formato del email no es válido');
        } else {
          setError('Error al crear la cuenta: ' + signUpError.message);
        }
        console.error('Error de registro:', signUpError);
      } else {
        setSuccess('¡Cuenta creada exitosamente! Redirigiendo al dashboard...');
        console.log('✅ Registro exitoso, redirigiendo al dashboard...');
        
        // Esperar un momento y redirigir
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);
      }
    } catch (err) {
      console.error('Error en registro:', err);
      setError('Error al crear la cuenta. Intenta nuevamente.');
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
              Volver
            </button>
          </div>
        )}
        
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <img 
              src="/facil-uno.png" 
              alt="FACIL.UNO Logo" 
              className="w-80 h-80 drop-shadow-lg"
            />
          </div>
          <p className="text-blue-400 font-medium text-sm sm:text-base">Herramientas para Ecommerce</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">Crea tu cuenta y obtén 7 días de acceso completo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Nombre de Usuario
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              placeholder="Tu nombre de usuario"
              autoComplete="username"
              disabled={isLoading}
            />
          </div>

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
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-900/50 border border-green-500 text-green-300 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Información del trial */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-xs text-gray-300">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-400 font-medium">Período de Prueba Gratuito</span>
            </div>
            <ul className="text-xs space-y-1 ml-6">
              <li>• 7 días de acceso completo a todas las herramientas</li>
              <li>• Nivel 3 automático (acceso a todas las funciones)</li>
              <li>• Sin confirmación de email requerida</li>
              <li>• Acceso inmediato después del registro</li>
            </ul>
          </div>

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
                Creando cuenta...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Crear Cuenta Gratis
              </>
            )}
          </button>
        </form>

        {/* Enlace para iniciar sesión */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={onGoBack}
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium underline"
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>

        <footer className="text-center mt-8 text-gray-500 text-sm">
          <p>Herramientas profesionales para tu ecommerce.</p>
        </footer>
      </div>
    </div>
  );
};