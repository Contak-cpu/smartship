import React, { useState } from 'react';
import { RegisterModal } from './RegisterModal';
import { PaymentModal } from './PaymentModal';
import { WhatsAppFloatButton } from './common/WhatsAppFloatButton';

interface PricingPageProps {
  onGoToLogin: () => void;
  onShowBasicPlan: () => void;
  onShowIntermediatePlan: () => void;
  onShowProPlan: () => void;
  onRegisterSuccess?: (username: string, level: number) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onGoToLogin, onShowBasicPlan, onShowIntermediatePlan, onShowProPlan, onRegisterSuccess }) => {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');

  const handlePlanSelection = (planName: string) => {
    const message = `Hola! Me interesa el plan ${planName} de FACIL.UNO. ¿Podrías darme más información?`;
    const whatsappUrl = `https://wa.me/5493541289228?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleAccessClick = (planName: string) => {
    setSelectedPlan(planName);
    setShowRegisterModal(true);
  };

  const handlePaymentClick = (planName: string) => {
    setSelectedPlan(planName);
    setShowPaymentModal(true);
  };

  const getPlanPrice = (planName: string): number => {
    switch(planName) {
      case 'Starter': return 1;
      case 'Basic': return 49;
      case 'Pro': return 99;
      default: return 49;
    }
  };

  const handleRegisterSuccess = (username: string, level: number) => {
    if (onRegisterSuccess) {
      onRegisterSuccess(username, level);
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#b5b5b5' }}>
      {/* Header simplificado */}
      <header className="border-b border-gray-400 flex-shrink-0" style={{ backgroundColor: '#b5b5b5' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Botón Invitado */}
            <button
              onClick={() => {
                onGoToLogin();
                // Simular login como invitado
                setTimeout(() => {
                  const loginButton = document.querySelector('[data-guest-login]') as HTMLButtonElement;
                  if (loginButton) loginButton.click();
                }, 100);
              }}
              className="bg-gray-700 hover:bg-gray-800 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-300 flex-shrink-0"
            >
              <span className="hidden sm:inline">Ingresar como invitado</span>
              <span className="sm:hidden">Invitado</span>
            </button>
            
            {/* Botón Ya tengo un plan */}
            <button
              onClick={onGoToLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-300 flex-shrink-0"
            >
              <span className="hidden sm:inline">Ya tengo un plan</span>
              <span className="sm:hidden">Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-grow overflow-y-auto flex flex-col">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex-grow flex flex-col min-h-0 space-y-3">
          <div className="text-center mb-1 flex-shrink-0">
            {/* Logo arriba del título */}
            <div className="flex justify-center items-center mb-0.5" style={{ height: 'auto', minHeight: '0' }}>
              <img 
                src="/facil-uno.png?v=2" 
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
            <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold tracking-tight text-gray-900">
              Elige tu plan
            </h1>
            <p className="mt-0.5 max-w-2xl mx-auto text-xs text-gray-700 px-4">
              Ahorra al menos un 10% en todas las etiquetas. Precios simples y transparentes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 max-w-5xl mx-auto flex-grow min-h-0">
            {/* Plan Starter - OCULTO */}
            {/* <div className="relative flex flex-col bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border-2 border-blue-500 p-6 sm:p-8 hidden">
            </div> */}

            {/* Plan Basic (Nivel 2) - Más Popular */}
            <div className="relative flex flex-col h-full rounded-xl shadow-lg border-2 border-blue-400 p-6 sm:p-8" style={{ backgroundColor: '#3f3f3f' }}>
              <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                  Más Popular
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white">Basic</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">$49</span>
                <span className="text-sm sm:text-base font-medium text-gray-300">/mes</span>
              </div>
              <p className="mt-4 text-sm text-gray-300">
                Para empresas en crecimiento que necesitan automatización completa.
              </p>
              <ul className="mt-8 space-y-4 text-sm flex-grow">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-200">Todo del plan Starter</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-200">Transformador SmartShip</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-200">Atención por Whatsapp</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-200">Soporte prioritario</span>
                </li>
              </ul>
              <div className="mt-6 sm:mt-8 mt-auto">
                <button 
                  onClick={() => handlePaymentClick('Basic')}
                  className="w-full text-white font-bold py-3 px-4 rounded-lg transition-colors text-sm sm:text-base hover:opacity-90"
                  style={{ backgroundColor: '#1e40af' }}
                >
                  Suscribirme
                </button>
              </div>
            </div>

            {/* Plan Pro (Nivel 3) */}
            <div className="relative flex flex-col h-full rounded-xl shadow-lg border-2 border-blue-400 p-6 sm:p-8" style={{ backgroundColor: '#3f3f3f' }}>
              <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                  Nivel 3
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white">Pro</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">$99</span>
                <span className="text-sm sm:text-base font-medium text-gray-300">/mes</span>
              </div>
              <p className="mt-4 text-sm text-gray-300">
                Acceso completo para administradores y funciones exclusivas.
              </p>
              <ul className="mt-8 space-y-4 text-sm flex-grow">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-200">Todo del plan Basic</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-200">Integrar SKU en Rótulos Andreani</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-200">Funciones administrativas</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-200">Acceso anticipado a nuevas funciones</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-200">Soporte dedicado 24/7</span>
                </li>
              </ul>
              <div className="mt-6 sm:mt-8 mt-auto">
                <button 
                  onClick={() => handlePaymentClick('Pro')}
                  className="w-full text-white font-bold py-3 px-4 rounded-lg transition-colors text-sm sm:text-base hover:opacity-90"
                  style={{ backgroundColor: '#1e40af' }}
                >
                  Suscribirme
                </button>
              </div>
            </div>
          </div>
          
          {/* Footer con enlaces adicionales */}
          <div className="text-center pt-2 border-t border-gray-400 flex-shrink-0 pb-4">
            <p className="text-gray-700 text-xs mb-1">
              ¿Ya tienes una cuenta?
            </p>
            <button
              onClick={onGoToLogin}
              className="text-blue-600 hover:text-blue-700 font-medium underline transition-colors text-xs"
            >
              Iniciar sesión aquí
            </button>
          </div>
        </div>
      </main>

      {/* Modal de Registro */}
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        selectedPlan={selectedPlan}
        onSuccess={handleRegisterSuccess}
      />

      {/* Modal de Pago */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        selectedPlan={selectedPlan}
        planPrice={getPlanPrice(selectedPlan)}
        onSuccess={handleRegisterSuccess}
      />

      {/* Botón flotante de WhatsApp */}
      <WhatsAppFloatButton 
        phoneNumber="+5493625499796"
        message="Hola! Me gustaría obtener más información sobre los planes de FACIL.UNO."
      />
    </div>
  );
};
