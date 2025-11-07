import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: string;
  planPrice: number;
  onSuccess: (username: string, level: number) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedPlan, 
  planPrice,
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
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const validateForm = () => {
    if (!email || !password || !username) {
      setError('Por favor completa todos los campos');
      return false;
    }

    if (!paymentConfirmed) {
      setError('Debes confirmar que realizaste el pago');
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
      console.log('📝 [PaymentModal] Registrando usuario con pago pendiente:', email);
      
      // Registrar usuario con pago pendiente
      const { error: signUpError } = await signUp(email, password, username, selectedPlan, 'pending');

      if (signUpError) {
        console.error('❌ [PaymentModal] Error en registro:', signUpError);
        
        let errorMessage = 'Error al crear la cuenta. Verifica que el email no esté en uso.';
        
        if (signUpError.includes('already registered') || signUpError.includes('already exists')) {
          errorMessage = 'Este email ya está registrado. Si es tu cuenta, intenta iniciar sesión en su lugar.';
        }
        
        setError(errorMessage);
      } else {
        console.log('✅ [PaymentModal] Usuario registrado exitosamente con pago pendiente');
        
        setSuccess(true);
        
        setTimeout(() => {
          // Pasar nivel 0 ya que el usuario está pendiente de pago
          onSuccess(username, 0);
          onClose();
        }, 3000);
      }
    } catch (error: any) {
      console.error('❌ [PaymentModal] Error en registro:', error);
      setError(error.message || 'Error al crear la cuenta. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading && !success) {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setUsername('');
      setError('');
      setPaymentConfirmed(false);
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
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black border-2 border-green-500/30 rounded-2xl shadow-2xl max-w-4xl w-full p-8 animate-scaleIn overflow-y-auto max-h-[90vh]">
        {/* Efectos de brillo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-green-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl" />
        
        {/* Botón de cierre */}
        <button
          onClick={handleClose}
          disabled={isLoading || success}
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
                ¡Registro completado!
              </h4>
              <p className="text-yellow-400 text-lg font-semibold mb-4 text-center">
                Plan {selectedPlan} - Pago en proceso de aprobación
              </p>
              <p className="text-gray-300 text-sm mb-6 text-center">
                Tu cuenta ha sido creada. Estaremos revisando tu pago y te notificaremos por email. Acceso temporal activado...
              </p>

              {/* Barra de progreso */}
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-400 h-full rounded-full" 
                     style={{ animation: 'progressBar 3s ease-in-out forwards' }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Columna izquierda - QR */}
            <div>
              <h3 className="text-2xl font-bold text-center text-white mb-4">
                Realiza el pago
              </h3>
              
              {/* QR Code */}
              <div className="flex justify-center mb-6">
                <div className="bg-white p-4 rounded-xl shadow-2xl">
                  <img 
                    src="/binance-qr.png" 
                    alt="Binance QR Code" 
                    className="w-64 h-64"
                  />
                </div>
              </div>

              {/* Información del plan */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
                <p className="text-center text-green-400 font-semibold">
                  Plan {selectedPlan}
                </p>
                <p className="text-center text-3xl font-bold text-white">
                  ${planPrice} <span className="text-lg text-gray-400">USD/mes</span>
                </p>
              </div>

              {/* Instrucciones */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-blue-400 font-semibold mb-3 flex items-center gap-2 text-sm">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Pasos a seguir
                </h4>
                <ol className="text-gray-300 text-xs space-y-2 list-decimal list-inside">
                  <li>Escanea el código QR con Binance</li>
                  <li>Realiza el pago de ${planPrice} USD</li>
                  <li>Completa tus datos a la derecha</li>
                  <li>Confirma que realizaste el pago</li>
                </ol>
              </div>
            </div>

            {/* Columna derecha - Formulario */}
            <div>
              <h3 className="text-2xl font-bold text-center text-white mb-4">
                Completa tu registro
              </h3>

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
                    className="w-full bg-gray-800 border-2 border-green-500/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
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
                    className="w-full bg-gray-800 border-2 border-green-500/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
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
                    className="w-full bg-gray-800 border-2 border-green-500/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
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
                    className="w-full bg-gray-800 border-2 border-green-500/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
                    disabled={isLoading}
                  />
                </div>

                {/* Checkbox de confirmación de pago */}
                <div className="flex items-center gap-3 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <input
                    type="checkbox"
                    id="paymentConfirmed"
                    checked={paymentConfirmed}
                    onChange={(e) => setPaymentConfirmed(e.target.checked)}
                    className="w-5 h-5 text-green-600 bg-gray-800 border-gray-600 rounded focus:ring-green-500"
                    disabled={isLoading}
                  />
                  <label htmlFor="paymentConfirmed" className="text-gray-300 text-sm">
                    Confirmo que he realizado el pago a través de Binance
                  </label>
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
                    '✅ Confirmar pago y crear cuenta'
                  )}
                </button>
              </form>

              {/* Información adicional */}
              <div className="mt-6 bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-400 text-xs text-center">
                  Tu pago será verificado y tu acceso completo será activado en las próximas 24 horas.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
