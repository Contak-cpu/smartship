import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  description: string;
  requiredLevel: number;
}

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { username, userLevel, logout, hasAccess } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const allMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Inicio',
      path: '/',
      description: 'Panel de Control',
      requiredLevel: 1,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'rentabilidad',
      label: 'Rentabilidad',
      path: '/rentabilidad',
      description: 'Calculadora de Rentabilidad',
      requiredLevel: 1, // Nivel 1 y superiores
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'smartship',
      label: 'SmartShip',
      path: '/smartship',
      description: 'Transformador de Pedidos Andreani',
      requiredLevel: 2, // Nivel 2 y superiores
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      ),
    },
    {
      id: 'pdf-generator',
      label: 'Generar PDFs',
      path: '/pdf-generator',
      description: 'Generador de PDFs Masivo',
      requiredLevel: 2, // Nivel 2 y superiores
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'proximamente',
      label: 'Próximamente',
      path: '/proximamente',
      description: 'Funciones Exclusivas Admin',
      requiredLevel: 3, // Solo nivel 3
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  // NO filtrar - mostrar todas las opciones
  const menuItems = allMenuItems;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNavigation = (path: string) => {
    // Navegación inmediata
    navigate(path, { replace: false });
    // En móvil, cerrar el sidebar después de navegar
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Overlay para móvil */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 h-screen bg-gray-800 border-r border-gray-700 
          transition-all duration-300 z-30 flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isSidebarOpen ? 'w-72' : 'md:w-20'}
        `}
      >
        {/* Header del Sidebar */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          {isSidebarOpen && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNavigation('/');
              }}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="text-green-500 w-10 h-10 flex-shrink-0">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_6_535)">
                    <path
                      clipRule="evenodd"
                      d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z"
                      fill="currentColor"
                      fillRule="evenodd"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_6_535">
                      <rect fill="white" height="48" width="48" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-white">Kore Ops</h2>
                <p className="text-xs text-gray-400">Panel de Control</p>
              </div>
            </button>
          )}
          {!isSidebarOpen && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNavigation('/');
              }}
              className="hover:opacity-80 transition-opacity"
              title="Ir al inicio"
            >
              <div className="text-green-500 w-10 h-10">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_6_535)">
                    <path
                      clipRule="evenodd"
                      d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z"
                      fill="currentColor"
                      fillRule="evenodd"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_6_535">
                      <rect fill="white" height="48" width="48" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
            </button>
          )}
          <button
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isSidebarOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Usuario */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
              {username?.charAt(0).toUpperCase()}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{username}</p>
                <p className="text-xs text-gray-400">
                  Nivel {userLevel} {userLevel === 3 ? '(Admin)' : userLevel === 2 ? '(Avanzado)' : '(Básico)'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Menú de navegación */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isLocked = !hasAccess(item.requiredLevel);
            
            return (
              <button
                key={item.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNavigation(item.path);
                }}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg transition-colors duration-150
                  ${
                    isActive
                      ? 'bg-green-600 text-white shadow-lg shadow-green-600/50'
                      : isLocked
                      ? 'text-gray-500 hover:bg-gray-700/50 hover:text-gray-400 border border-gray-700'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }
                  ${!isSidebarOpen && 'justify-center'}
                  active:scale-95
                  ${isLocked && 'relative'}
                `}
                title={!isSidebarOpen ? item.label : undefined}
              >
                <div className="flex-shrink-0 relative">
                  {item.icon}
                  {isLocked && (
                    <svg 
                      className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  )}
                </div>
                {isSidebarOpen && (
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{item.label}</p>
                      {isLocked && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-500/30 flex-shrink-0">
                          Nivel {item.requiredLevel}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs opacity-80 truncate ${isLocked && 'line-through'}`}>
                      {item.description}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer con botón de logout */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 p-3 rounded-lg 
              bg-red-600 hover:bg-red-700 text-white 
              transition-colors duration-200
              ${!isSidebarOpen && 'justify-center'}
            `}
            title={!isSidebarOpen ? 'Cerrar Sesión' : undefined}
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            {isSidebarOpen && <span className="font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Botón flotante para abrir sidebar en móvil */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed bottom-6 left-6 md:hidden bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg z-10 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;

