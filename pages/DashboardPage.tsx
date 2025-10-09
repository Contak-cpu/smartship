import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../hooks/useAuth';

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  stats?: string;
  requiredLevel: number;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasAccess } = useAuth();

  const allFeatures: FeatureCard[] = [
    {
      id: 'rentabilidad',
      title: 'Calculadora de Rentabilidad',
      description: 'Analiza la rentabilidad diaria de tu ecommerce. Calcula márgenes, gastos y porcentajes de rentabilidad en tiempo real con soporte para múltiples monedas.',
      path: '/rentabilidad',
      color: 'green',
      stats: 'Análisis Financiero',
      requiredLevel: 0, // Disponible para invitados
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: 'smartship',
      title: 'SmartShip',
      description: 'Procesa y transforma archivos CSV de pedidos de Andreani automáticamente. Separa envíos a domicilio y sucursal con un solo clic.',
      path: '/smartship',
      color: 'green',
      stats: 'Procesador de Pedidos',
      requiredLevel: 2,
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      ),
    },
    {
      id: 'pdf-generator',
      title: 'Generador de PDFs',
      description: 'Crea múltiples documentos PDF de forma masiva a partir de plantillas personalizables. Ideal para etiquetas, facturas y documentos repetitivos.',
      path: '/pdf-generator',
      color: 'blue',
      stats: 'Generación Masiva',
      requiredLevel: 2,
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      id: 'proximamente',
      title: 'Próximamente',
      description: 'Funcionalidades exclusivas en desarrollo para administradores. Panel de analytics, gestión de usuarios, reportes automatizados y más.',
      path: '/proximamente',
      color: 'purple',
      stats: 'Solo Nivel 3',
      requiredLevel: 3,
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  // NO filtrar - mostrar todas pero marcar las bloqueadas
  const features = allFeatures;

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return {
          bg: 'bg-green-600',
          hover: 'hover:bg-green-700',
          text: 'text-green-500',
          border: 'border-green-500',
          shadow: 'hover:shadow-green-500/50',
        };
      case 'blue':
        return {
          bg: 'bg-blue-600',
          hover: 'hover:bg-blue-700',
          text: 'text-blue-500',
          border: 'border-blue-500',
          shadow: 'hover:shadow-blue-500/50',
        };
      case 'purple':
        return {
          bg: 'bg-purple-600',
          hover: 'hover:bg-purple-700',
          text: 'text-purple-500',
          border: 'border-purple-500',
          shadow: 'hover:shadow-purple-500/50',
        };
      default:
        return {
          bg: 'bg-gray-600',
          hover: 'hover:bg-gray-700',
          text: 'text-gray-500',
          border: 'border-gray-500',
          shadow: 'hover:shadow-gray-500/50',
        };
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-900 p-4 sm:p-6 lg:p-8">

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 px-2">Selecciona una herramienta</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {features.map((feature) => {
              const colors = getColorClasses(feature.color);
              const isLocked = !hasAccess(feature.requiredLevel);
              
              return (
                <div
                  key={feature.id}
                  className={`bg-gray-800 rounded-2xl p-6 sm:p-8 border transition-all duration-200 relative ${
                    isLocked 
                      ? 'border-gray-700/50 opacity-75' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {/* Badge de nivel requerido si está bloqueado */}
                  {isLocked && (
                    <div className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/30 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      Nivel {feature.requiredLevel}
                    </div>
                  )}

                  <div className="flex items-start gap-4 mb-4">
                    <div className={`${colors.text} flex-shrink-0 ${isLocked && 'opacity-50'}`}>
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-2xl font-bold mb-2 ${isLocked ? 'text-gray-400' : 'text-white'}`}>
                        {feature.title}
                      </h3>
                      {feature.stats && (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${
                          isLocked 
                            ? 'bg-gray-700 text-gray-500' 
                            : `${colors.bg} text-white`
                        }`}>
                          {feature.stats}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className={`mb-6 leading-relaxed ${isLocked ? 'text-gray-500' : 'text-gray-400'}`}>
                    {feature.description}
                  </p>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(feature.path);
                    }}
                    className={`w-full font-bold py-3 px-6 rounded-lg transition-colors duration-150 flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                      isLocked
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900'
                        : `${colors.bg} ${colors.hover} text-white`
                    }`}
                  >
                    {isLocked ? (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Ver Detalles del Upgrade
                      </>
                    ) : (
                      <>
                        Acceder
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Info adicional */}
          <div className="mt-8 bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-start gap-4">
              <div className="text-green-500 flex-shrink-0">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Información del Sistema</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Este panel de control te permite acceder a todas las herramientas disponibles. 
                  Utiliza el menú lateral para navegar entre las diferentes secciones. 
                  El sistema es completamente modular y escalable, diseñado para crecer con tus necesidades.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-8 text-gray-500 text-xs sm:text-sm max-w-7xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p>Sistema modular de automatización logística</p>
            <p className="mt-1 text-gray-600">
              by <span className="text-green-500 font-semibold">pictoN</span>
            </p>
          </div>
        </footer>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;

