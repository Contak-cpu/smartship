import { RouteObject, useNavigate } from 'react-router-dom';
import ProtectedRoute from '../components/routing/ProtectedRoute';
import LevelProtectedRoute from '../components/routing/LevelProtectedRoute';
import PaidProtectedRoute from '../components/routing/PaidProtectedRoute';
import PublicRoute from '../components/routing/PublicRoute';
import SmartRedirect from '../components/routing/SmartRedirect';
import HomePage from '../pages/HomePage';
import PDFGeneratorPage from '../pages/PDFGeneratorPage';
import LandingPage from '../pages/LandingPage';
import DashboardPage from '../pages/DashboardPage';
import RentabilidadPage from '../pages/RentabilidadPage';
import BreakevenROASPage from '../pages/BreakevenROASPage';
import HistorialPage from '../pages/HistorialPage';
import InformacionPage from '../pages/InformacionPage';
import AdminPanelPage from '../pages/AdminPanelPage';
import EmailConfirmationPage from '../pages/EmailConfirmationPage';
import CuponesPage from '../pages/CuponesPage';
import StockPage from '../pages/StockPage';
import { Login } from '../components/Login';
import { PricingPage } from '../components/PricingPage';

// Componente para página 404 con navegación correcta
const NotFoundPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-gray-400 mb-6">Página no encontrada</p>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors inline-block mr-3"
          >
            Volver a Precios
          </button>
          <button
            onClick={() => navigate('/precios')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors inline-block"
          >
            Ver planes y precios
          </button>
        </div>
      </div>
    </div>
  );
};

// Configuración centralizada de rutas
// Para agregar nuevas rutas, simplemente añade un nuevo objeto a este array
export const routes: RouteObject[] = [
  {
    path: '/landing',
    element: <LandingPage />,
  },
  {
    path: '/precios',
    element: (
      <PublicRoute>
        <PricingPage 
          onGoToLogin={() => window.location.href = '/login'}
          onShowBasicPlan={() => {}}
          onShowIntermediatePlan={() => {}}
          onShowProPlan={() => {}}
        />
      </PublicRoute>
    ),
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login onGoBack={() => window.location.href = '/precios'} />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <SmartRedirect 
        onGoToLogin={() => window.location.href = '/login'}
        onShowBasicPlan={() => {}}
        onShowIntermediatePlan={() => {}}
        onShowProPlan={() => {}}
      />
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/smartship',
    element: (
      <LevelProtectedRoute requiredLevel={2} sectionName="SmartShip - Transformador de Pedidos">
        <HomePage />
      </LevelProtectedRoute>
    ),
  },
  {
    path: '/pdf-generator',
    element: (
      <LevelProtectedRoute requiredLevel={3} sectionName="Integrar SKU en Rótulos Andreani">
        <PDFGeneratorPage />
      </LevelProtectedRoute>
    ),
  },
  {
    path: '/rentabilidad',
    element: (
      <LevelProtectedRoute requiredLevel={0} sectionName="Calculadora de Rentabilidad">
        <RentabilidadPage />
      </LevelProtectedRoute>
    ),
  },
  // TEMPORALMENTE OCULTO - Breakeven & ROAS
  // {
  //   path: '/breakeven-roas',
  //   element: (
  //     <LevelProtectedRoute requiredLevel={1} sectionName="Calcula tu Breakeven y ROAS">
  //       <BreakevenROASPage />
  //     </LevelProtectedRoute>
  //   ),
  // },
  {
    path: '/historial',
    element: (
      <LevelProtectedRoute requiredLevel={2} sectionName="Historial de Archivos">
        <HistorialPage />
      </LevelProtectedRoute>
    ),
  },
  {
    path: '/cupones',
    element: (
      <PaidProtectedRoute sectionName="Cupones de Descuento">
        <CuponesPage />
      </PaidProtectedRoute>
    ),
  },
  {
    path: '/stock',
    element: (
      <LevelProtectedRoute requiredLevel={3} sectionName="Gestión de Stock">
        <StockPage />
      </LevelProtectedRoute>
    ),
  },
  // TEMPORALMENTE OCULTO - Información y Estadísticas
  // {
  //   path: '/informacion',
  //   element: (
  //     <LevelProtectedRoute requiredLevel={2} sectionName="Información y Estadísticas">
  //       <InformacionPage />
  //     </LevelProtectedRoute>
  //   ),
  // },
  // TEMPORALMENTE OCULTO - Panel de administración
  // {
  //   path: '/admin',
  //   element: (
  //     <LevelProtectedRoute requiredLevel={999} sectionName="Panel de Administración Dios">
  //       <AdminPanelPage />
  //     </LevelProtectedRoute>
  //   ),
  // },
  // AGREGAR NUEVAS RUTAS AQUÍ
  // Ejemplo de cómo agregar una nueva ruta protegida:
  // {
  //   path: '/nueva-funcionalidad',
  //   element: (
  //     <ProtectedRoute>
  //       <NuevaFuncionalidadPage />
  //     </ProtectedRoute>
  //   ),
  // },
  
  // Ruta 404 - debe estar al final
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

