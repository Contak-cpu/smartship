import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { levelService, LEVEL_CONFIG, getLevelName, getLevelColor } from '../services/levelService';
import { TrialStatus } from '../components/common/TrialStatus';
import { PaymentRequest } from '../components/common/PaymentRequest';
import { PaidPlanStatus } from '../components/common/PaidPlanStatus';
import { FeatureCard } from '../components/common/FeatureCard';
import { PlanStatusHeader } from '../components/common/PlanStatusHeader';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  stats?: string;
  requiredLevel: number;
  variant: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  category?: 'primary' | 'secondary' | 'tools';
}

// Función para obtener el ícono de cada feature
const getIconForFeature = (featureKey: string) => {
  const icons: Record<string, React.ReactNode> = {
    'smartship': (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
    'pdf-generator': (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    'correo-argentino': (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    'rentabilidad': (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'historial': (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'stock': (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    'cupones': (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4m-6 4h6a2 2 0 002-2v-3a2 2 0 00-2-2h-6v7m-6 0h6a2 2 0 002-2V9a2 2 0 00-2-2H6a2 2 0 00-2 2v9a2 2 0 002 2z" />
      </svg>
    ),
    'admin': (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  };
  
  return icons[featureKey] || (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
};

const DashboardPage: React.FC = () => {
  const { username, userLevel, hasAccess, isPaid, user } = useAuth();
  const [userPaidStatus, setUserPaidStatus] = React.useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = React.useState<string | null>(null);

  React.useEffect(() => {
    const checkPaidStatus = async () => {
      try {
        const paid = await isPaid();
        setUserPaidStatus(paid);
        const paymentStatusValue = user?.user_metadata?.payment_status;
        if (paymentStatusValue) {
          setPaymentStatus(paymentStatusValue);
        }
      } catch (error) {
        console.error('Error verificando estado de pago:', error);
        setUserPaidStatus(false);
      }
    };
    checkPaidStatus();
  }, [isPaid, user]);

  // Reorganizar: SmartShip y SKU primero (las más usadas)
  const allFeatures: Feature[] = [
    ...(userLevel === 999 ? [{
      id: 'admin',
      title: 'Panel de Administración',
      description: 'Control total del sistema. Gestiona usuarios, asigna niveles y visualiza estadísticas globales.',
      path: '/admin',
      stats: '👑 Nivel Dios',
      requiredLevel: 999,
      variant: 'danger' as const,
      category: 'primary' as const,
      icon: getIconForFeature('admin'),
    }] : []),
    {
      id: 'smartship',
      title: 'SmartShip',
      description: 'Procesa y transforma archivos CSV de pedidos de Andreani automáticamente. Separa envíos a domicilio y sucursal con un solo clic.',
      path: '/smartship',
      stats: 'Procesador de Pedidos',
      requiredLevel: 2,
      variant: 'primary' as const,
      category: 'primary' as const,
      icon: getIconForFeature('smartship'),
    },
    {
      id: 'pdf-generator',
      title: 'SKU en Rótulos',
      description: 'Integra automáticamente los SKUs de tus productos en los rótulos de envío de Andreani. Genera PDFs personalizados con códigos SKU.',
      path: '/pdf-generator',
      stats: 'Nivel Admin',
      requiredLevel: 3,
      variant: 'primary' as const,
      category: 'primary' as const,
      icon: getIconForFeature('pdf-generator'),
    },
    {
      id: 'correo-argentino',
      title: 'Correo Argentino',
      description: 'Procesa y transforma archivos CSV de pedidos para Correo Argentino automáticamente. Genera archivos de carga masiva en formato CP.',
      path: '/correo-argentino',
      stats: 'Procesador de Pedidos',
      requiredLevel: 2,
      variant: 'primary' as const,
      category: 'secondary' as const,
      icon: getIconForFeature('correo-argentino'),
    },
    {
      id: 'historial',
      title: 'Historial de Archivos',
      description: 'Accede a todos tus archivos procesados sin necesidad de volver a cargarlos. Descarga archivos previos en cualquier momento.',
      path: '/historial',
      stats: 'Gestión de Archivos',
      requiredLevel: 2,
      variant: 'default' as const,
      category: 'tools' as const,
      icon: getIconForFeature('historial'),
    },
    {
      id: 'stock',
      title: 'Gestión de Stock',
      description: 'Carga tu inventario base, define equivalencias por SKU y descontá automáticamente cada vez que generás rótulos.',
      path: '/stock',
      stats: 'Plan Pro+',
      requiredLevel: 4,
      variant: 'warning' as const,
      category: 'tools' as const,
      icon: getIconForFeature('stock'),
    },
    {
      id: 'cupones',
      title: 'Cupones de Descuento',
      description: 'Obtén descuentos exclusivos para Andreani. Copia tus códigos activos y utilízalos al cargar tus rótulos para obtener desde un 20% hasta un 40% de descuento.',
      path: '/cupones',
      stats: 'Promociones Exclusivas',
      requiredLevel: -1,
      variant: 'success' as const,
      category: 'tools' as const,
      icon: getIconForFeature('cupones'),
    },
    {
      id: 'rentabilidad',
      title: 'Calculadora de Rentabilidad',
      description: 'Analiza la rentabilidad diaria de tu ecommerce. Calcula márgenes, gastos y porcentajes de rentabilidad en tiempo real con soporte para múltiples monedas.',
      path: '/rentabilidad',
      stats: 'Análisis Financiero',
      requiredLevel: 0,
      variant: 'default' as const,
      category: 'tools' as const,
      icon: getIconForFeature('rentabilidad'),
    },
  ];

  const primaryFeatures = allFeatures.filter(f => f.category === 'primary');
  const secondaryFeatures = allFeatures.filter(f => f.category === 'secondary');
  const toolFeatures = allFeatures.filter(f => f.category === 'tools');

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        {/* Header con información del plan - NUEVO CONCEPTO */}
        <PlanStatusHeader 
          userPaidStatus={userPaidStatus}
          paymentStatus={paymentStatus}
          userLevel={userLevel}
          username={username}
        />

        {/* Contenido principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Saludo personalizado */}
          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-3">
              Bienvenido de vuelta, <span className="text-blue-600 dark:text-blue-400">{username}</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Selecciona una herramienta para comenzar
            </p>
          </div>

          {/* Sección Principal - Herramientas más usadas */}
          {primaryFeatures.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-12 bg-blue-600 dark:bg-blue-500 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Herramientas Principales</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {primaryFeatures.map((feature) => {
                  let isLocked = false;
                  if (feature.requiredLevel === -1) {
                    isLocked = userPaidStatus !== true;
                  } else {
                    isLocked = !hasAccess(feature.requiredLevel);
                  }
                  
                  return (
                    <FeatureCard
                      key={feature.id}
                      id={feature.id}
                      title={feature.title}
                      description={feature.description}
                      icon={feature.icon}
                      path={feature.path}
                      stats={feature.stats}
                      requiredLevel={feature.requiredLevel}
                      isLocked={isLocked}
                      variant={feature.variant}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Sección Secundaria */}
          {secondaryFeatures.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-12 bg-purple-600 dark:bg-purple-500 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Procesadores Adicionales</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {secondaryFeatures.map((feature) => {
                  let isLocked = false;
                  if (feature.requiredLevel === -1) {
                    isLocked = userPaidStatus !== true;
                  } else {
                    isLocked = !hasAccess(feature.requiredLevel);
                  }
                  
                  return (
                    <FeatureCard
                      key={feature.id}
                      id={feature.id}
                      title={feature.title}
                      description={feature.description}
                      icon={feature.icon}
                      path={feature.path}
                      stats={feature.stats}
                      requiredLevel={feature.requiredLevel}
                      isLocked={isLocked}
                      variant={feature.variant}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Sección de Herramientas */}
          {toolFeatures.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-12 bg-green-600 dark:bg-green-500 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Más Herramientas</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {toolFeatures.map((feature) => {
                  let isLocked = false;
                  if (feature.requiredLevel === -1) {
                    isLocked = userPaidStatus !== true;
                  } else {
                    isLocked = !hasAccess(feature.requiredLevel);
                  }
                  
                  return (
                    <FeatureCard
                      key={feature.id}
                      id={feature.id}
                      title={feature.title}
                      description={feature.description}
                      icon={feature.icon}
                      path={feature.path}
                      stats={feature.stats}
                      requiredLevel={feature.requiredLevel}
                      isLocked={isLocked}
                      variant={feature.variant}
                      size="compact"
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Mensaje de plan expirado si el nivel es 0 */}
          {userLevel === 0 && (
            <div className="mt-12 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-500/50 rounded-2xl p-8 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="bg-red-500/20 dark:bg-red-500/30 p-4 rounded-full">
                    <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Tu plan expiró
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
                    Tu suscripción ha vencido. Para continuar usando todas las funcionalidades, necesitas renovar tu plan.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        const paymentSection = document.getElementById('payment-section');
                        if (paymentSection) {
                          paymentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      ¿Querés realizar el pago?
                    </button>
                    <button
                      onClick={() => window.location.href = '/precios'}
                      className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      Ver planes disponibles
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Request Section */}
          <div id="payment-section" className="mt-12">
            {!userPaidStatus && (
              <>
                {userLevel !== 0 && paymentStatus !== 'pending' && (
                  <PaymentRequest currentPlan="Trial" onPaymentRequested={(plan) => console.log('Solicitud de pago:', plan)} />
                )}
                {userLevel === 0 && paymentStatus !== 'pending' && (
                  <PaymentRequest currentPlan="Expirado" onPaymentRequested={(plan) => console.log('Solicitud de pago:', plan)} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
