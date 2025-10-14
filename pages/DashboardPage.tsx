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
  const { hasAccess, username, userLevel } = useAuth();

  const allFeatures: FeatureCard[] = [
    {
      id: 'rentabilidad',
      title: 'Calculadora de Rentabilidad',
      description: 'Analiza la rentabilidad diaria de tu ecommerce. Calcula márgenes, gastos y porcentajes de rentabilidad en tiempo real con soporte para múltiples monedas.',
      path: '/rentabilidad',
      color: 'blue',
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
      id: 'breakeven-roas',
      title: 'Calcula tu Breakeven y ROAS',
      description: 'Determina tu punto de equilibrio y ROAS objetivo. Calcula el CPA máximo, comisiones, costos totales y el retorno de inversión necesario en publicidad.',
      path: '/breakeven-roas',
      color: 'blue',
      stats: 'Análisis de Inversión',
      requiredLevel: 1, // Plan Starter
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      id: 'smartship',
      title: 'SmartShip',
      description: 'Procesa y transforma archivos CSV de pedidos de Andreani automáticamente. Separa envíos a domicilio y sucursal con un solo clic.',
      path: '/smartship',
      color: 'blue',
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
      title: 'Integrar SKU en Rótulos Andreani',
      description: 'Integra automáticamente los SKUs de tus productos en los rótulos de envío de Andreani. Genera PDFs personalizados con códigos SKU para identificación rápida.',
      path: '/pdf-generator',
      color: 'blue',
      stats: 'Nivel Admin',
      requiredLevel: 3,
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
      id: 'historial',
      title: 'Historial de Archivos',
      description: 'Accede a todos tus archivos procesados (SmartShip y SKU en Rótulos) sin necesidad de volver a cargarlos. Descarga archivos previos en cualquier momento.',
      path: '/historial',
      color: 'blue',
      stats: 'Gestión de Archivos',
      requiredLevel: 2,
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
    {
      id: 'informacion',
      title: 'Información y Estadísticas',
      description: 'Panel de control completo con estadísticas de pedidos, clientes recurrentes, stock despachado y análisis de tu operación. Control automático de duplicados y seguimiento de inventario.',
      path: '/informacion',
      color: 'blue',
      stats: 'Análisis Inteligente',
      requiredLevel: 2,
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  ];

  // NO filtrar - mostrar todas pero marcar las bloqueadas
  const features = allFeatures;

  const getColorClasses = (color: string) => {
    // Paleta simplificada - solo azul como color principal
    return {
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      text: 'text-blue-500',
      border: 'border-blue-500',
      shadow: 'hover:shadow-blue-500/50',
    };
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-950 p-4 sm:p-6 lg:p-8">

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 px-2">
            Buenos días <span className="text-blue-400">{username}</span>, ¿en qué vas a trabajar hoy?
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {features.map((feature) => {
              const colors = getColorClasses(feature.color);
              const isLocked = !hasAccess(feature.requiredLevel);
              
              return (
                <div
                  key={feature.id}
                  className={`group bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 sm:p-10 border transition-all duration-300 relative ${
                    isLocked 
                      ? 'border-gray-700/50 opacity-75' 
                      : 'border-gray-700/50 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 hover:bg-gray-800'
                  }`}
                >
                  {/* Badge de nivel requerido si está bloqueado */}
                  {isLocked && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500/30 to-yellow-600/30 text-yellow-400 px-3 py-1.5 rounded-full text-xs font-bold border border-yellow-500/40 flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      Nivel {feature.requiredLevel}
                    </div>
                  )}

                  <div className="flex items-start gap-5 mb-6">
                    <div className={`${colors.text} flex-shrink-0 ${isLocked && 'opacity-50'} transition-transform duration-300 group-hover:scale-110`}>
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-2xl sm:text-3xl font-bold mb-3 ${isLocked ? 'text-gray-400' : 'text-white'}`}>
                        {feature.title}
                      </h3>
                      {feature.stats && (
                        <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold mb-3 ${
                          isLocked 
                            ? 'bg-gray-700 text-gray-500' 
                            : `${colors.bg} text-white shadow-lg`
                        }`}>
                          {feature.stats}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className={`mb-8 leading-relaxed text-base ${isLocked ? 'text-gray-500' : 'text-gray-300'}`}>
                    {feature.description}
                  </p>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(feature.path);
                    }}
                    className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                      isLocked
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 hover:shadow-yellow-500/50 text-gray-900'
                        : `${colors.bg} ${colors.hover} text-white hover:shadow-2xl hover:shadow-blue-500/20`
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
          <div className="mt-10 bg-gradient-to-br from-gray-800/80 to-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 shadow-xl">
            <div className="flex items-start gap-5">
              <div className="text-blue-500 flex-shrink-0">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                  Bienvenido a FACIL.UNO
                  <span className="text-2xl">🚀</span>
                </h3>
                <p className="text-gray-300 text-base leading-relaxed mb-4">
                  Tu suite completa de herramientas profesionales para optimizar y escalar tu ecommerce. 
                  Desde análisis financiero hasta automatización de envíos, todo en un solo lugar.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-blue-400 font-bold">Tu Nivel</p>
                    <p className="text-white text-lg font-bold">{userLevel === 3 ? 'Pro' : userLevel === 2 ? 'Basic' : userLevel === 1 ? 'Starter' : 'Invitado'}</p>
                  </div>
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-blue-400 font-bold">Herramientas</p>
                    <p className="text-white text-lg font-bold">{features.filter(f => hasAccess(f.requiredLevel)).length}/{features.length}</p>
                  </div>
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 col-span-2 sm:col-span-1">
                    <p className="text-blue-400 font-bold">Estado</p>
                    <p className="text-white text-lg font-bold">Activo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;

