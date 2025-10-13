import React, { useState } from 'react';

interface PricingPageProps {
  onGoToLogin: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onGoToLogin }) => {
  const [showModal, setShowModal] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');

  const handlePlanSelection = (planName: string) => {
    setSelectedPlan(planName);
    setShowModal(true);
    setInvitationCode('');
    setError('');
  };

  const handleGuestAccess = () => {
    // Acceso como invitado - redirigir al login o dashboard
    onGoToLogin();
  };

  const validateCode = () => {
    if (invitationCode === '2310') {
      // Código válido - redirigir a WhatsApp
      const message = `Hola! He validado mi código de acceso y me interesa el plan ${selectedPlan} de FACIL UNO. ¿Podrías darme más información?`;
      const whatsappUrl = `https://wa.me/5493541289228?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      setShowModal(false);
      setInvitationCode('');
      setError('');
    } else {
      setError('Código de invitación incorrecto');
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setInvitationCode(value);
    setError('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-green-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 sm:gap-4 hover:opacity-80 transition-opacity"
            >
              <div className="text-green-600 size-6 sm:size-8">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_6_535)">
                    <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
                  </g>
                  <defs>
                    <clipPath id="clip0_6_535">
                      <rect fill="white" height="48" width="48"></rect>
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">FACIL UNO</h2>
            </button>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Botón Ingresar como invitado */}
              <button
                onClick={handleGuestAccess}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-300"
              >
                <span className="hidden sm:inline">Ingresar como invitado</span>
                <span className="sm:hidden">Invitado</span>
              </button>
              
              {/* Botón Ya tengo un plan */}
              <button
                onClick={onGoToLogin}
                className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-300"
              >
                <span className="hidden sm:inline">Ya tengo un plan</span>
                <span className="sm:hidden">Login</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-grow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-24">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Elige tu plan
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-gray-600 dark:text-gray-400 px-4">
              Herramientas profesionales para optimizar tu negocio. Precios simples y transparentes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
            {/* Plan Starter - Nivel 1 */}
            <div className="flex flex-col bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border border-green-200 dark:border-gray-700 p-6 sm:p-8 hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Starter</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">$1</span>
                <span className="text-sm sm:text-base font-medium text-gray-500 dark:text-gray-400">/mes</span>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Ideal para empezar a optimizar tus procesos básicos.
              </p>
              <button 
                onClick={() => handlePlanSelection('Starter')}
                className="mt-6 sm:mt-8 w-full bg-green-100 hover:bg-green-200 text-green-700 font-bold py-3 px-4 rounded-lg transition-colors text-sm sm:text-base"
              >
                Seleccionar Plan
              </button>
              <ul className="mt-8 space-y-4 text-sm flex-grow">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Calculadora de Rentabilidad</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Calculadora Breakeven & ROAS</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Soporte por email</span>
                </li>
              </ul>
            </div>

            {/* Plan Basic - Nivel 2 - Más Popular */}
            <div className="relative flex flex-col bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border-2 border-green-600 p-6 sm:p-8 md:col-span-2 lg:col-span-1 hover:shadow-2xl transition-shadow duration-300">
              <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                  Más Popular
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Basic</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">$49</span>
                <span className="text-sm sm:text-base font-medium text-gray-500 dark:text-gray-400">/mes</span>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Para negocios que necesitan automatización inteligente.
              </p>
              <button 
                onClick={() => handlePlanSelection('Basic')}
                className="mt-6 sm:mt-8 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-sm sm:text-base"
              >
                Seleccionar Plan
              </button>
              <ul className="mt-8 space-y-4 text-sm flex-grow">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300 font-semibold">Todo del Starter</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Transformador SmartShip</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Atención por WhatsApp</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Soporte prioritario</span>
                </li>
              </ul>
            </div>

            {/* Plan Pro - Nivel 3 */}
            <div className="flex flex-col bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border border-green-200 dark:border-gray-700 p-6 sm:p-8 hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Pro</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">$99</span>
                <span className="text-sm sm:text-base font-medium text-gray-500 dark:text-gray-400">/mes</span>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Máximo nivel de funcionalidad y soporte dedicado.
              </p>
              <button 
                onClick={() => handlePlanSelection('Pro')}
                className="mt-6 sm:mt-8 w-full bg-green-100 hover:bg-green-200 text-green-700 font-bold py-3 px-4 rounded-lg transition-colors text-sm sm:text-base"
              >
                Seleccionar Plan
              </button>
              <ul className="mt-8 space-y-4 text-sm flex-grow">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300 font-semibold">Todo del Basic</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Integrar SKU en Rótulos Andreani</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Funciones administrativas</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Acceso anticipado a nuevas funciones</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Soporte dedicado 24/7</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Acceso Exclusivo */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative animate-fade-in">
            {/* Botón cerrar */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icono de candado */}
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>

            {/* Título */}
            <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
              Acceso Exclusivo
            </h3>
            
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              Has seleccionado el plan <span className="font-semibold text-green-600 dark:text-green-400">{selectedPlan}</span>
            </p>

            {/* Campo de código */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Código de invitación (4 dígitos)
              </label>
              <input
                type="text"
                value={invitationCode}
                onChange={handleCodeChange}
                placeholder="0000"
                maxLength={4}
                className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              />
              {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center animate-shake">
                  {error}
                </p>
              )}
            </div>

            {/* Botones */}
            <div className="flex flex-col gap-3">
              <button
                onClick={validateCode}
                disabled={invitationCode.length !== 4}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300"
              >
                Validar código
              </button>
              
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg transition-colors duration-300"
              >
                Cancelar
              </button>
            </div>

            {/* Nota adicional */}
            <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
              ¿No tienes un código? Contacta con nuestro equipo de ventas
            </p>
          </div>
        </div>
      )}

      {/* Estilos para animaciones */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
