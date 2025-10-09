import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface NavigationLink {
  path: string;
  label: string;
  icon: React.ReactNode;
  color?: string;
}

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { username, logout } = useAuth();

  // Configuración de enlaces de navegación - fácil de extender
  const navLinks: NavigationLink[] = [
    {
      path: '/',
      label: 'SmartShip',
      icon: (
        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      color: 'bg-indigo-600 hover:bg-indigo-700',
    },
    {
      path: '/pdf-generator',
      label: 'Generar PDFs',
      icon: (
        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'bg-green-600 hover:bg-green-700',
    },
    // AGREGAR NUEVOS ENLACES AQUÍ
    // Ejemplo:
    // {
    //   path: '/nueva-seccion',
    //   label: 'Nueva Sección',
    //   icon: <svg>...</svg>,
    //   color: 'bg-purple-600 hover:bg-purple-700',
    // },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
      <span className="text-gray-400 text-xs sm:text-sm">
        Bienvenido, <span className="text-indigo-400 font-semibold">{username}</span>
      </span>
      
      {/* Renderizar enlaces de navegación dinámicamente */}
      {navLinks.map((link) => {
        // No mostrar el botón de la página actual
        if (location.pathname === link.path) return null;
        
        return (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className={`${link.color || 'bg-gray-600 hover:bg-gray-700'} text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-300 flex items-center`}
          >
            {link.icon}
            {link.label}
          </button>
        );
      })}
      
      <button
        onClick={logout}
        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-300 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Salir
      </button>
    </div>
  );
};

export default Navigation;

