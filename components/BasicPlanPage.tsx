import React from 'react';

interface BasicPlanPageProps {
  onGoBack: () => void;
}

export const BasicPlanPage: React.FC<BasicPlanPageProps> = ({ onGoBack }) => {
  const handleWhatsAppContact = () => {
    const message = `Hola! Me interesa contratar el Plan Básico de ShipSmart por $29/mes. ¿Podrías ayudarme con el proceso de contratación?`;
    const whatsappUrl = `https://wa.me/5493541289228?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header simplificado */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 sm:gap-4 hover:opacity-80 transition-opacity"
            >
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
            </button>
            
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
          <div className="flex flex-col gap-8 sm:gap-12">
            {/* Breadcrumb */}
            <div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                <span className="text-gray-800 dark:text-gray-200">Plan Básico</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Plan Básico
              </h1>
              <p className="mt-4 max-w-2xl text-base sm:text-lg text-gray-600 dark:text-gray-300">
                Para particulares y pequeñas empresas que buscan optimizar sus procesos de envío y ahorrar en costes. Al menos un 10% de ahorro en todas las etiquetas.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contenido principal */}
              <div className="lg:col-span-2 space-y-8 sm:space-y-10">
                {/* Características */}
                <section>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
                    Características
                  </h2>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-4">
                      <svg className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Envíos Ilimitados</h3>
                        <p className="text-gray-600 dark:text-gray-300">Procese tantos envíos como necesite sin ninguna restricción.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <svg className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Generación Automatizada de Etiquetas</h3>
                        <p className="text-gray-600 dark:text-gray-300">Genere automáticamente etiquetas de envío para las principales empresas de transporte.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <svg className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Seguimiento en Tiempo Real</h3>
                        <p className="text-gray-600 dark:text-gray-300">Realice un seguimiento de sus envíos en tiempo real desde el despacho hasta la entrega.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <svg className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Análisis Básico</h3>
                        <p className="text-gray-600 dark:text-gray-300">Acceda a análisis básicos para monitorear el rendimiento de sus envíos.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <svg className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Soporte por Correo Electrónico</h3>
                        <p className="text-gray-600 dark:text-gray-300">Obtenga soporte por correo electrónico para cualquier pregunta o problema.</p>
                      </div>
                    </li>
                  </ul>
                </section>

                {/* Limitaciones */}
                <section>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
                    Limitaciones
                  </h2>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-4">
                      <svg className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Sin Soporte Dedicado</h3>
                        <p className="text-gray-600 dark:text-gray-300">El soporte se proporciona únicamente por correo electrónico, sin un equipo de soporte dedicado.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <svg className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Análisis Limitado</h3>
                        <p className="text-gray-600 dark:text-gray-300">Los análisis se limitan a métricas e informes básicos.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <svg className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Sin Integraciones Personalizadas</h3>
                        <p className="text-gray-600 dark:text-gray-300">Las integraciones personalizadas con otras plataformas no están disponibles.</p>
                      </div>
                    </li>
                  </ul>
                </section>
              </div>

              {/* Sidebar */}
              <aside className="space-y-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Plan Actual</h3>
                  <p className="mt-4 text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                    29 $<span className="text-sm sm:text-base font-medium text-gray-500 dark:text-gray-400">/mes</span>
                  </p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Facturado mensualmente.</p>
                  <button 
                    onClick={handleWhatsAppContact}
                    className="mt-6 w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
                  >
                    Contratar Plan Básico
                  </button>
                  <button 
                    onClick={handleWhatsAppContact}
                    className="mt-2 w-full bg-transparent text-gray-600 dark:text-gray-300 font-bold py-3 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base"
                  >
                    Contactar a Ventas
                  </button>
                </div>

                {/* FAQ */}
                <section>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
                    Preguntas Frecuentes
                  </h2>
                  <div className="space-y-4">
                    <details className="group bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                      <summary className="flex cursor-pointer items-center justify-between font-semibold text-gray-800 dark:text-gray-200 list-none">
                        ¿Qué incluye el plan Básico?
                        <svg className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <p className="mt-2 text-gray-600 dark:text-gray-300">
                        El plan Básico incluye envíos ilimitados, generación automática de etiquetas, seguimiento en tiempo real, análisis básicos y soporte por correo electrónico. Está diseñado para que particulares y pequeñas empresas comiencen a ahorrar en envíos de inmediato.
                      </p>
                    </details>
                    <details className="group bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                      <summary className="flex cursor-pointer items-center justify-between font-semibold text-gray-800 dark:text-gray-200 list-none">
                        ¿Cómo funciona la generación automática de etiquetas?
                        <svg className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <p className="mt-2 text-gray-600 dark:text-gray-300">
                        Nuestro sistema se integra con los principales transportistas. Una vez que ingresa los detalles y el destino de su paquete, obtiene automáticamente las mejores tarifas y genera una etiqueta de envío imprimible para usted.
                      </p>
                    </details>
                    <details className="group bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                      <summary className="flex cursor-pointer items-center justify-between font-semibold text-gray-800 dark:text-gray-200 list-none">
                        ¿Qué tipo de soporte se proporciona?
                        <svg className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <p className="mt-2 text-gray-600 dark:text-gray-300">
                        El plan Básico incluye soporte por correo electrónico. Nuestro equipo está disponible para responder sus preguntas y resolver problemas. Para obtener soporte instantáneo y un administrador de cuenta dedicado, considere nuestro plan Profesional.
                      </p>
                    </details>
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
