import React from 'react';

interface IntermediatePlanPageProps {
  onGoBack: () => void;
}

export const IntermediatePlanPage: React.FC<IntermediatePlanPageProps> = ({ onGoBack }) => {
  const handleWhatsAppContact = () => {
    const message = `Hola! Me interesa contratar el Plan Basic de Kore Ops por $49/mes. ¿Podrías ayudarme con el proceso de contratación?`;
    const whatsappUrl = `https://wa.me/5493541289228?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700" style={{ backgroundColor: '#202020' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 sm:gap-4 hover:opacity-80 transition-opacity"
            >
              <img 
                src="/ko.png" 
                alt="Kore Ops Logo" 
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
              />
              <h2 className="text-base sm:text-lg font-bold text-white">Kore Ops</h2>
            </button>
            
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
              <p className="text-sm sm:text-base font-semibold text-blue-500 uppercase tracking-wider">Plan Basic - Nivel 2</p>
              <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Automatización completa para tu negocio
              </h1>
              <p className="mt-4 sm:mt-5 max-w-2xl mx-auto text-base sm:text-xl text-gray-500 dark:text-gray-400">
                Accede a las herramientas de transformación de pedidos y generación de PDFs además del análisis de rentabilidad.
              </p>
            </div>

            {/* Contenido principal */}
            <div className="bg-white dark:bg-gray-800/50 p-6 sm:p-8 rounded-xl shadow-lg border border-blue-500/10">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6">¿Qué incluye el Plan Basic?</h2>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">Calculadora de Rentabilidad</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Análisis financiero completo de tu ecommerce</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">SmartShip</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Transformador automático de pedidos Andreani</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">Generador de PDFs</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Creación masiva de documentos personalizados</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">Soporte Prioritario</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Respuesta rápida a tus consultas</p>
                    </div>
                  </div>
                </div>
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
                Contratar Plan Basic
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

