import { RouteObject } from 'react-router-dom';
import ProtectedRoute from '../components/routing/ProtectedRoute';
import LevelProtectedRoute from '../components/routing/LevelProtectedRoute';
import PublicRoute from '../components/routing/PublicRoute';
import HomePage from '../pages/HomePage';
import PDFGeneratorPage from '../pages/PDFGeneratorPage';
import LandingPage from '../pages/LandingPage';
import DashboardPage from '../pages/DashboardPage';
import RentabilidadPage from '../pages/RentabilidadPage';
import BreakevenROASPage from '../pages/BreakevenROASPage';
import HistorialPage from '../pages/HistorialPage';
import InformacionPage from '../pages/InformacionPage';
import AdminPanelPage from '../pages/AdminPanelPage';

// Configuración centralizada de rutas
// Para agregar nuevas rutas, simplemente añade un nuevo objeto a este array
export const routes: RouteObject[] = [
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LandingPage />
      </PublicRoute>
    ),
  },
  {
    path: '/',
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
  {
    path: '/breakeven-roas',
    element: (
      <LevelProtectedRoute requiredLevel={1} sectionName="Calcula tu Breakeven y ROAS">
        <BreakevenROASPage />
      </LevelProtectedRoute>
    ),
  },
  {
    path: '/historial',
    element: (
      <LevelProtectedRoute requiredLevel={2} sectionName="Historial de Archivos">
        <HistorialPage />
      </LevelProtectedRoute>
    ),
  },
  {
    path: '/informacion',
    element: (
      <LevelProtectedRoute requiredLevel={2} sectionName="Información y Estadísticas">
        <InformacionPage />
      </LevelProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <LevelProtectedRoute requiredLevel={999} sectionName="Panel de Administración Dios">
        <AdminPanelPage />
      </LevelProtectedRoute>
    ),
  },
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
    element: (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <p className="text-gray-400 mb-6">Página no encontrada</p>
          <a
            href="/"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors inline-block"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    ),
  },
];

