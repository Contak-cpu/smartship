import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LockedOverlay from '../common/LockedOverlay';

interface LevelProtectedRouteProps {
  children: React.ReactNode;
  requiredLevel: number;
  sectionName: string;
}

const LevelProtectedRoute: React.FC<LevelProtectedRouteProps> = ({ children, requiredLevel, sectionName }) => {
  const { isAuthenticated, hasAccess } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAccess(requiredLevel)) {
    // Mostrar el overlay de contenido bloqueado con el contenido difuminado de fondo
    return (
      <div className="relative">
        {/* Contenido difuminado de fondo */}
        <div className="blur-md pointer-events-none select-none opacity-40">
          {children}
        </div>
        {/* Overlay de candado */}
        <LockedOverlay requiredLevel={requiredLevel} sectionName={sectionName} />
      </div>
    );
  }

  return <>{children}</>;
};

export default LevelProtectedRoute;

