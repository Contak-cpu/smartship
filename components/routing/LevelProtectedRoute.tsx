import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { levelService } from '../../services/levelService';
import LockedOverlay from '../common/LockedOverlay';

interface LevelProtectedRouteProps {
  children: React.ReactNode;
  requiredLevel: number;
  sectionName: string;
}

const LevelProtectedRoute: React.FC<LevelProtectedRouteProps> = ({ children, requiredLevel, sectionName }) => {
  const { isAuthenticated, hasAccess, isLoading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
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

  if (!hasAccess(requiredLevel)) {
    return (
      <div className="relative">
        <div className="blur-md pointer-events-none select-none opacity-40">
          {children}
        </div>
        <LockedOverlay requiredLevel={requiredLevel} sectionName={sectionName} />
      </div>
    );
  }

  return <>{children}</>;
};

export default LevelProtectedRoute;

