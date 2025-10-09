import React from 'react';

interface BasicPlanPageProps {
  onGoBack: () => void;
}

export const BasicPlanPage: React.FC<BasicPlanPageProps> = ({ onGoBack }) => {
  const handleWhatsAppContact = () => {
    const message = `Hola! Me interesa contratar el Plan Básico de Kore Ops por $1/mes. ¿Podrías ayudarme con el proceso de contratación?`;
    const whatsappUrl = `https://wa.me/5493541289228?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header simplificado */}
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
                <span className="text-gray-800 dark:text-gray-200">Plan Básico - Nivel 1</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Plan Básico - $1/mes
              </h1>
              <p className="mt-4 max-w-2xl text-base sm:text-lg text-gray-600 dark:text-gray-300">
                Perfecto para emprendedores que necesitan controlar su rentabilidad diaria. Acceso exclusivo a la Calculadora de Rentabilidad.
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
                      <svg className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Calculadora de Rentabilidad</h3>
                        <p className="text-gray-600 dark:text-gray-300">Analiza tu margen de ganancia diario con soporte para múltiples monedas (ARS/USDT).</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <svg className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Análisis Financiero</h3>
                        <p className="text-gray-600 dark:text-gray-300">Controla tus gastos, ingresos y rentabilidad en tiempo real.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <svg className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Soporte por Email</h3>
                        <p className="text-gray-600 dark:text-gray-300">Atención personalizada para resolver tus dudas.</p>
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
                    $1<span className="text-sm sm:text-base font-medium text-gray-500 dark:text-gray-400">/mes</span>
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
                        ¿Qué incluye el plan Básico por $1/mes?
                        <svg className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <p className="mt-2 text-gray-600 dark:text-gray-300">
                        El plan Básico te da acceso exclusivo a la Calculadora de Rentabilidad, permitiéndote analizar tus márgenes de ganancia, gastos en publicidad (Meta, TikTok, Google ADS) y rentabilidad diaria en tiempo real con soporte para ARS y USDT.
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
