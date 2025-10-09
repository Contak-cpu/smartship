import { RouteObject } from 'react-router-dom';
import ProtectedRoute from '../components/routing/ProtectedRoute';
import PublicRoute from '../components/routing/PublicRoute';
import HomePage from '../pages/HomePage';
import PDFGeneratorPage from '../pages/PDFGeneratorPage';
import LandingPage from '../pages/LandingPage';

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
        <HomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/pdf-generator',
    element: (
      <ProtectedRoute>
        <PDFGeneratorPage />
      </ProtectedRoute>
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

