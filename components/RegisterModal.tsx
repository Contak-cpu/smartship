import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: string;
  onSuccess: (username: string, level: number) => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedPlan, 
  onSuccess 
}) => {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Mapeo de planes a niveles - Todos los nuevos registros tendrán nivel 3 (Cliente VIP)
  const getPlanLevel = (plan: string) => {
    // Todos los planes ahora dan acceso completo (nivel 3 - Cliente VIP)
    return 3;
  };

  const validateForm = () => {
    if (!email || !password || !username) {
      setError('Por favor completa todos los campos');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor ingresa un email válido');
      return false;
    }

    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      console.log('📝 [RegisterModal] Registrando usuario:', email);
      
      // Registrar usuario usando el hook useAuth
      const { error: signUpError } = await signUp(email, password, username, selectedPlan);

      if (signUpError) {
        console.error('❌ [RegisterModal] Error en registro:', signUpError);
        
        // Mensaje de error más específico
        let errorMessage = 'Error al crear la cuenta. Verifica que el email no esté en uso.';
        
        if (signUpError.includes('already registered') || signUpError.includes('already exists')) {
          errorMessage = 'Este email ya está registrado. Si es tu cuenta, intenta iniciar sesión en su lugar. Si no, ve a Supabase y elimina el usuario huérfano.';
        }
        
        setError(errorMessage);
      } else {
        console.log('✅ [RegisterModal] Usuario registrado exitosamente');
        
        // Mostrar mensaje de éxito
        setSuccess(true);
        
        // Esperar y redirigir
        setTimeout(() => {
          onSuccess(username, 3); // Todos los nuevos usuarios tienen nivel 3 (Cliente VIP)
          onClose();
        }, 2000);
      }
    } catch (error: any) {
      console.error('❌ [RegisterModal] Error en registro:', error);
      setError(error.message || 'Error al crear la cuenta. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setUsername('');
      setError('');
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black border-2 border-blue-500/30 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scaleIn">
        {/* Efectos de brillo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl" />
        
        {/* Botón de cierre */}
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10 disabled:opacity-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {success ? (
          <div className="animate-scaleIn">
            <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 border-2 border-green-500/60 rounded-2xl p-8">
              {/* Checkmark animado */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/30 rounded-full blur-xl animate-pulse" />
                  <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-full p-4 shadow-xl">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Mensaje de éxito */}
              <h4 className="text-2xl font-bold text-white mb-2 text-center">
                ¡Bienvenido a FACIL.UNO!
              </h4>
              <p className="text-purple-400 text-lg font-semibold mb-4 text-center">
                Plan {selectedPlan} - Cliente VIP - 7 días gratis
              </p>
              <p className="text-gray-300 text-sm mb-6 text-center">
                Tu cuenta ha sido creada exitosamente. Te estamos redirigiendo al dashboard...
              </p>

              {/* Barra de progreso */}
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-400 h-full rounded-full" 
                     style={{ animation: 'progressBar 2s ease-in-out forwards' }} />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Icono de registro */}
            <div className="relative flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
                <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 p-4 rounded-full">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Título */}
            <h3 className="relative text-2xl sm:text-3xl font-bold text-center text-white mb-3">
              ¡Bienvenido a tus primeros 7 días de prueba gratis!
            </h3>
            
            {/* Badge del plan */}
            <div className="flex justify-center mb-6">
              <span className="bg-purple-500/20 text-purple-400 px-4 py-2 rounded-full text-sm font-semibold border border-purple-500/30">
                Plan {selectedPlan} - Cliente VIP - Prueba Gratuita
              </span>
            </div>

            {/* Formulario */}
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="tu_usuario"
                  className="w-full bg-gray-800 border-2 border-blue-500/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                  disabled={isLoading}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full bg-gray-800 border-2 border-blue-500/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-gray-800 border-2 border-blue-500/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                  disabled={isLoading}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  className="w-full bg-gray-800 border-2 border-blue-500/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                  disabled={isLoading}
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 animate-fadeIn">
                  <p className="text-red-400 text-sm font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                </div>
              )}

              {/* Botón de registro */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  isLoading
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-green-500/50'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                    Creando cuenta...
                  </div>
                ) : (
                  '🚀 Crear cuenta y empezar prueba gratis'
                )}
              </button>
            </form>

            {/* Información adicional */}
            <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-400 text-xs text-center">
                Al crear tu cuenta, aceptas nuestros términos de servicio. 
                Tu prueba gratuita de 7 días comenzará inmediatamente.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
