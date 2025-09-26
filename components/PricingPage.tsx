import React from 'react';

interface PricingPageProps {
  onGoToLogin: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onGoToLogin }) => {
  const handlePlanSelection = (planName: string) => {
    const message = `Hola! Me interesa el plan ${planName} de ShipSmart. ¿Podrías darme más información?`;
    const whatsappUrl = `https://wa.me/5493541289228?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header simplificado */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-blue-500 size-6 sm:size-8">
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
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">ShipSmart</h2>
            </div>
            
            {/* Botón Ya tengo un plan */}
            <button
              onClick={onGoToLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-300"
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
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Elige tu plan
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-gray-600 dark:text-gray-400 px-4">
              Ahorra al menos un 10% en todas las etiquetas. Precios simples y transparentes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
            {/* Plan Básico */}
            <div className="flex flex-col bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Básico</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">$29</span>
                <span className="text-sm sm:text-base font-medium text-gray-500 dark:text-gray-400">/mes</span>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Para pequeñas empresas y startups que están despegando.
              </p>
              <button 
                onClick={() => handlePlanSelection('Básico')}
                className="mt-6 sm:mt-8 w-full bg-blue-100 hover:bg-blue-200 text-blue-600 font-bold py-3 px-4 rounded-lg transition-colors text-sm sm:text-base"
              >
                Elegir Básico
              </button>
              <ul className="mt-8 space-y-4 text-sm flex-grow">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Hasta 500 envíos/mes</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Soporte por correo electrónico</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Análisis básicos</span>
                </li>
              </ul>
            </div>

            {/* Plan Pro - Más Popular */}
            <div className="relative flex flex-col bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border-2 border-blue-500 p-6 sm:p-8 md:col-span-2 lg:col-span-1">
              <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                  Más Popular
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Pro</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">$99</span>
                <span className="text-sm sm:text-base font-medium text-gray-500 dark:text-gray-400">/mes</span>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Para empresas en crecimiento que necesitan más potencia y automatización.
              </p>
              <button 
                onClick={() => handlePlanSelection('Pro')}
                className="mt-6 sm:mt-8 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors text-sm sm:text-base"
              >
                Elegir Pro
              </button>
              <ul className="mt-8 space-y-4 text-sm flex-grow">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Hasta 2,000 envíos/mes</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Soporte prioritario por correo electrónico</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Análisis avanzados</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Integraciones personalizadas</span>
                </li>
              </ul>
            </div>

            {/* Plan Empresarial */}
            <div className="flex flex-col bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Empresarial</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">Personalizado</span>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Para operaciones a gran escala con requisitos únicos.
              </p>
              <button 
                onClick={() => handlePlanSelection('Empresarial')}
                className="mt-6 sm:mt-8 w-full bg-blue-100 hover:bg-blue-200 text-blue-600 font-bold py-3 px-4 rounded-lg transition-colors text-sm sm:text-base"
              >
                Contactar a Ventas
              </button>
              <ul className="mt-8 space-y-4 text-sm flex-grow">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Envíos ilimitados</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Soporte dedicado</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Análisis personalizados</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Acceso a API</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Marca blanca</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
