import DashboardLayout from '../components/layout/DashboardLayout';

const ProximamentePage = () => {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl mx-auto bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
          {/* Header */}
          <header className="text-center mb-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="text-purple-500 size-12">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white">
                Próximamente
              </h1>
            </div>
            <p className="text-purple-400 font-medium text-sm sm:text-base">
              Nuevas funcionalidades en desarrollo
            </p>
          </header>

          {/* Badge de nivel */}
          <div className="flex justify-center">
            <div className="bg-yellow-500/20 text-yellow-500 px-6 py-2 rounded-full text-sm font-bold border-2 border-yellow-500/50 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Solo para Nivel 3 - Administradores
            </div>
          </div>

          {/* Contenido principal */}
          <div className="bg-gradient-to-br from-purple-900/30 to-gray-700/30 rounded-2xl p-8 border-2 border-purple-500/30">
            <div className="text-center space-y-6">
              {/* Icono de construcción */}
              <div className="flex justify-center">
                <div className="bg-purple-600/20 p-6 rounded-full">
                  <svg className="w-20 h-20 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Estamos trabajando en algo increíble
                </h2>
                <p className="text-gray-300 leading-relaxed max-w-2xl mx-auto">
                  Esta sección exclusiva para administradores estará disponible próximamente. 
                  Estamos desarrollando funcionalidades avanzadas que revolucionarán la forma 
                  en que gestionas tu negocio.
                </p>
              </div>

              {/* Características próximas */}
              <div className="bg-gray-800/50 rounded-lg p-6 max-w-2xl mx-auto">
                <h3 className="text-xl font-bold text-purple-400 mb-4">
                  🚀 ¿Qué viene?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-white font-medium">Panel de Analytics</p>
                      <p className="text-xs text-gray-400">Métricas avanzadas en tiempo real</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-white font-medium">Gestión de Usuarios</p>
                      <p className="text-xs text-gray-400">Administra permisos y roles</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-white font-medium">Reportes Automatizados</p>
                      <p className="text-xs text-gray-400">Informes personalizables</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-white font-medium">Integraciones API</p>
                      <p className="text-xs text-gray-400">Conexión con otras plataformas</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline estimado */}
              <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/30">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-purple-300 text-sm">
                    <span className="font-bold">Disponible pronto</span> - Mantente atento a las actualizaciones
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="pt-4">
                <p className="text-gray-400 text-sm">
                  ¿Tienes ideas para nuevas funcionalidades?
                </p>
                <button className="mt-3 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                  Enviar Sugerencia
                </button>
              </div>
            </div>
          </div>

          <footer className="text-center mt-6 text-gray-500 text-xs sm:text-sm">
            <p>Sección exclusiva para administradores</p>
            <p className="mt-1 text-gray-600">by pictoN</p>
          </footer>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProximamentePage;

