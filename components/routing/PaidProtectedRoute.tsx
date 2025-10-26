import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface PaidProtectedRouteProps {
  children: React.ReactNode;
  sectionName: string;
}

const PaidProtectedRoute: React.FC<PaidProtectedRouteProps> = ({ children, sectionName }) => {
  const { isAuthenticated, isPaid, isLoading } = useAuth();
  const [hasPaid, setHasPaid] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkPaidStatus = async () => {
      if (!isAuthenticated) {
        setChecking(false);
        return;
      }
      
      try {
        const paid = await isPaid();
        setHasPaid(paid);
      } catch (error) {
        console.error('Error verificando estado de pago:', error);
        setHasPaid(false);
      } finally {
        setChecking(false);
      }
    };

    checkPaidStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Mostrar loading mientras se verifica la autenticación y el estado de pago
  if (isLoading || checking) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (hasPaid === false) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 shadow-xl">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full p-4">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4m-6 4h6a2 2 0 002-2v-3a2 2 0 00-2-2h-6v7m-6 0h6a2 2 0 002-2V9a2 2 0 00-2-2H6a2 2 0 00-2 2v9a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Acceso Restringido
            </h2>
            <p className="text-gray-400 text-lg mb-6">
              Esta sección <span className="text-yellow-400 font-semibold">{sectionName}</span> está 
              disponible únicamente para usuarios que han realizado el pago de su plan.
            </p>
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-blue-400 mb-3">
                💳 Actualiza tu Plan para Acceder
              </h3>
              <p className="text-gray-300 text-base leading-relaxed">
                Los cupones de descuento están disponibles solo para usuarios con planes activos. 
                Si completaste tu trial de 7 días, necesitas suscribirte a un plan para continuar 
                accediendo a todas las funcionalidades premium.
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/precios'}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 inline-flex items-center gap-3 shadow-lg hover:shadow-xl hover:shadow-blue-500/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Ver Planes y Precios
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PaidProtectedRoute;

