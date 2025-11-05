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
  const { username, userLevel, logout } = useAuth();
  
  // Verificar si el usuario es Dios
  const isDios = userLevel === 999;

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
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      path: '/correo-argentino',
      label: 'Correo Argentino',
      icon: (
        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      path: '/pdf-generator',
      label: 'SKU en Rótulos',
      icon: (
        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    // TEMPORALMENTE OCULTO - Breakeven & ROAS
    // {
    //   path: '/breakeven-roas',
    //   label: 'Breakeven & ROAS',
    //   icon: (
    //     <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    //     </svg>
    //   ),
    //   color: 'bg-blue-600 hover:bg-blue-700',
    // },
    {
      path: '/historial',
      label: 'Historial',
      icon: (
        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-blue-600 hover:bg-blue-700',
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
      <span className="text-gray-400 text-xs sm:text-sm flex items-center gap-2">
        Bienvenido, <span className="text-blue-400 font-semibold">{username}</span>
        {isDios && (
          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30 font-bold">
            DIOS
          </span>
        )}
        {!isDios && userLevel > 0 && (
          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30 font-semibold">
            Nivel {userLevel}
          </span>
        )}
      </span>
      
      {/* Panel Admin - Solo para usuarios Dios */}
      {isDios && location.pathname !== '/admin' && (
        <button
          onClick={() => {
            console.log('🔄 [Navigation] Navegando a admin');
            navigate('/admin');
          }}
          className="bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 flex items-center shadow-lg border border-red-500/50"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Panel Admin
        </button>
      )}
      
      {/* Renderizar enlaces de navegación dinámicamente */}
      {navLinks.map((link) => {
        // No mostrar el botón de la página actual
        if (location.pathname === link.path) return null;
        
        return (
          <button
            key={link.path}
            onClick={() => {
              console.log('🔄 [Navigation] Navegando a:', link.path);
              navigate(link.path);
            }}
            className={`${link.color || 'bg-gray-600 hover:bg-gray-700'} text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-300 flex items-center`}
          >
            {link.icon}
            {link.label}
          </button>
        );
      })}
      
      <button
        onClick={() => {
          console.log('🔄 [Navigation] Cerrando sesión');
          logout();
        }}
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

