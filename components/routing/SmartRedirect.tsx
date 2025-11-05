import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import HeroLandingPage from '../../pages/HeroLandingPage';

interface SmartRedirectProps {
  onGoToLogin: () => void;
  onShowBasicPlan: () => void;
  onShowIntermediatePlan: () => void;
  onShowProPlan: () => void;
}

const SmartRedirect: React.FC<SmartRedirectProps> = ({ 
  onGoToLogin, 
  onShowBasicPlan, 
  onShowIntermediatePlan, 
  onShowProPlan 
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si está autenticado, redirigir al dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si no está autenticado, mostrar la landing page
  return <HeroLandingPage />;
};

export default SmartRedirect;
