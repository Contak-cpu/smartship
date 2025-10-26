import React, { useState } from 'react';
import { RegisterModal } from './RegisterModal';

interface PricingPageProps {
  onGoToLogin: () => void;
  onShowBasicPlan: () => void;
  onShowIntermediatePlan: () => void;
  onShowProPlan: () => void;
  onRegisterSuccess?: (username: string, level: number) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onGoToLogin, onShowBasicPlan, onShowIntermediatePlan, onShowProPlan, onRegisterSuccess }) => {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
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

  const handleRegisterSuccess = (username: string, level: number) => {
    if (onRegisterSuccess) {
      onRegisterSuccess(username, level);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header simplificado */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
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
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-300 flex-shrink-0"
            >
              <span className="hidden sm:inline">Ingresar como invitado</span>
              <span className="sm:hidden">Invitado</span>
            </button>
            
            {/* Botón Ya tengo un plan */}
            <button
              onClick={onGoToLogin}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-300 flex-shrink-0"
            >
              <span className="hidden sm:inline">Ya tengo un plan</span>
              <span className="sm:hidden">Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-grow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-24">
          <div className="text-center mb-8 sm:mb-12">
            {/* Logo arriba del título */}
            <div className="flex justify-center -mt-16 sm:-mt-20 lg:-mt-24 mb-0">
              <img 
                src="/facil-uno.png" 
                alt="FACIL.UNO Logo" 
                className="w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 drop-shadow-lg"
              />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white -mt-12">
              Elige tu plan
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-gray-600 dark:text-gray-400 px-4">
              Ahorra al menos un 10% en todas las etiquetas. Precios simples y transparentes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
            {/* Plan Starter - Nivel 1 */}
            <div className="relative flex flex-col bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border-2 border-blue-500 p-6 sm:p-8">
              <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                  Nivel 1
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Starter</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">$1</span>
                <span className="text-sm sm:text-base font-medium text-gray-500 dark:text-gray-400">/mes</span>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Ideal para emprendedores que necesitan controlar la rentabilidad.
              </p>
              <button 
                onClick={() => handleAccessClick('Starter')}
                className="mt-6 sm:mt-8 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors text-sm sm:text-base"
              >
                Acceder Gratis
              </button>
              <ul className="mt-8 space-y-4 text-sm flex-grow">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Calculadora de Rentabilidad</span>
                </li>
                {/* TEMPORALMENTE OCULTO - Calculadora Breakeven & ROAS */}
                {/* <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Calculadora Breakeven & ROAS</span>
                </li> */}
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Soporte por email</span>
                </li>
              </ul>
            </div>

            {/* Plan Basic (Nivel 2) - Más Popular */}
            <div className="relative flex flex-col bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border-2 border-blue-500 p-6 sm:p-8 md:col-span-2 lg:col-span-1">
              <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                  Más Popular
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Basic</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">$49</span>
                <span className="text-sm sm:text-base font-medium text-gray-500 dark:text-gray-400">/mes</span>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Para empresas en crecimiento que necesitan automatización completa.
              </p>
              <button 
                onClick={() => handleAccessClick('Basic')}
                className="mt-6 sm:mt-8 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors text-sm sm:text-base"
              >
                Acceder Gratis
              </button>
              <ul className="mt-8 space-y-4 text-sm flex-grow">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Todo del plan Starter</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Transformador SmartShip</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Atención por Whatsapp</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Soporte prioritario</span>
                </li>
              </ul>
            </div>

            {/* Plan Pro (Nivel 3) */}
            <div className="relative flex flex-col bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border-2 border-blue-500 p-6 sm:p-8">
              <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                  Nivel 3
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Pro</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">$99</span>
                <span className="text-sm sm:text-base font-medium text-gray-500 dark:text-gray-400">/mes</span>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Acceso completo para administradores y funciones exclusivas.
              </p>
              <button 
                onClick={() => handleAccessClick('Pro')}
                className="mt-6 sm:mt-8 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors text-sm sm:text-base"
              >
                Acceder Gratis
              </button>
              <ul className="mt-8 space-y-4 text-sm flex-grow">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Todo del plan Basic</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Integrar SKU en Rótulos Andreani</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Funciones administrativas</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Acceso anticipado a nuevas funciones</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Soporte dedicado 24/7</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Footer con enlaces adicionales */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            ¿Ya tienes una cuenta?
          </p>
          <button
            onClick={onGoToLogin}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline transition-colors"
          >
            Iniciar sesión aquí
          </button>
        </div>
      </main>

      {/* Modal de Registro */}
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        selectedPlan={selectedPlan}
        onSuccess={handleRegisterSuccess}
      />
    </div>
  );
};
