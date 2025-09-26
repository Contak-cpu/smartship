import React from 'react';

interface ProPlanPageProps {
  onGoBack: () => void;
}

export const ProPlanPage: React.FC<ProPlanPageProps> = ({ onGoBack }) => {
  const handleWhatsAppContact = () => {
    const message = `Hola! Me interesa contratar el Plan Pro de ShipSmart por $99/mes. ¿Podrías ayudarme con el proceso de contratación?`;
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
            
            {/* Botón Volver */}
            <button
              onClick={onGoBack}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-300"
            >
              Volver
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-grow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="space-y-8 sm:space-y-12">
            {/* Header del plan */}
            <div className="text-center">
              <p className="text-sm sm:text-base font-semibold text-blue-500 uppercase tracking-wider">Plan Pro</p>
              <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Todas las funciones que necesitas y más.
              </h1>
              <p className="mt-4 sm:mt-5 max-w-2xl mx-auto text-base sm:text-xl text-gray-500 dark:text-gray-400">
                Desbloquea potentes herramientas para optimizar tus envíos, ahorrar dinero y escalar tu negocio sin esfuerzo.
              </p>
            </div>

            {/* Contenido principal */}
            <div className="bg-white dark:bg-gray-800/50 p-6 sm:p-8 rounded-xl shadow-lg border border-blue-500/10">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6">¿Qué incluye?</h2>
              <div className="space-y-8">
                {/* Características principales */}
                <div>
                  <h3 className="text-lg font-semibold text-blue-500 mb-4">Características principales</h3>
                  <div className="grid md:grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-4 text-gray-600 dark:text-gray-300">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">Etiquetas ilimitadas</p>
                        <p className="text-sm">Genera tantas etiquetas de envío como necesites sin restricciones.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">Análisis avanzado</p>
                        <p className="text-sm">Obtén información más detallada sobre el rendimiento y los costes de tus envíos.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">Soporte prioritario</p>
                        <p className="text-sm">Recibe tiempos de respuesta más rápidos de nuestro equipo de soporte dedicado.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">Integración multi-transportista</p>
                        <p className="text-sm">Conéctate sin problemas con múltiples transportistas para optimizar tu estrategia.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">Informes personalizados</p>
                        <p className="text-sm">Crea informes personalizados adaptados a las necesidades específicas de tu negocio.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">Gestor de cuenta dedicado</p>
                        <p className="text-sm">Obtén asistencia y orientación personalizadas de un experto dedicado.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Limitaciones */}
                <div className="border-t border-blue-500/20 dark:border-blue-500/30 pt-8">
                  <h3 className="text-lg font-semibold text-blue-500 mb-4">Limitaciones</h3>
                  <div className="grid md:grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-4 text-gray-600 dark:text-gray-300">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-yellow-500 dark:text-yellow-400 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">Máximo 10 usuarios</p>
                        <p className="text-sm">El plan Pro admite un máximo de 10 usuarios por cuenta.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-yellow-500 dark:text-yellow-400 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">Llamadas a la API limitadas</p>
                        <p className="text-sm">Las llamadas a la API se miden para garantizar un rendimiento óptimo para todos los usuarios.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div>
              <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Preguntas frecuentes
              </h2>
              <div className="space-y-4">
                <details className="group bg-white dark:bg-gray-800/50 p-4 sm:p-6 rounded-lg border border-blue-500/10">
                  <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-900 dark:text-white">
                    ¿Cuál es la diferencia entre los planes Básico y Pro?
                    <svg className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-4 text-gray-600 dark:text-gray-300">
                    El plan Pro ofrece etiquetas ilimitadas, análisis avanzado, soporte prioritario, integración multi-transportista, informes personalizados y un gestor de cuenta dedicado. El plan Básico es ideal para empezar, pero tiene limitaciones en el volumen de etiquetas y en las funciones avanzadas, lo que convierte al plan Pro en la mejor opción para empresas en crecimiento.
                  </p>
                </details>
                <details className="group bg-white dark:bg-gray-800/50 p-4 sm:p-6 rounded-lg border border-blue-500/10">
                  <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-900 dark:text-white">
                    ¿Puedo cambiar mi plan en cualquier momento?
                    <svg className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-4 text-gray-600 dark:text-gray-300">
                    Sí, puedes cambiar fácilmente de plan desde la configuración de tu cuenta. Las actualizaciones se aplican inmediatamente, mientras que los cambios a un plan inferior se aplican al final de tu ciclo de facturación actual.
                  </p>
                </details>
                <details className="group bg-white dark:bg-gray-800/50 p-4 sm:p-6 rounded-lg border border-blue-500/10">
                  <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-900 dark:text-white">
                    ¿Hay una prueba gratuita disponible para el plan Pro?
                    <svg className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-4 text-gray-600 dark:text-gray-300">
                    Ofrecemos una prueba gratuita de 14 días para el plan Pro. Esto te permite experimentar todas las funciones avanzadas y ver el valor por ti mismo antes de comprometerte. No se requiere tarjeta de crédito para iniciar tu prueba.
                  </p>
                </details>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-6">
              <button 
                onClick={onGoBack}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver a Precios
              </button>
              <button 
                onClick={handleWhatsAppContact}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-lg bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors text-sm sm:text-base"
              >
                Contratar Plan Pro
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
