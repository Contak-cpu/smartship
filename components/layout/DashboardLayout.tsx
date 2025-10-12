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
      requiredLevel: 0, // Accesible para todos incluidos invitados
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'breakeven-roas',
      label: 'Breakeven & ROAS',
      path: '/breakeven-roas',
      description: 'Calcula tu Breakeven y ROAS',
      requiredLevel: 1, // Plan Starter
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'rentabilidad',
      label: 'Rentabilidad',
      path: '/rentabilidad',
      description: 'Calculadora de Rentabilidad',
      requiredLevel: 0, // Nivel 0 y superiores (incluye invitados)
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
      label: 'SKU en Rótulos',
      path: '/pdf-generator',
      description: 'Integrar SKU en Rótulos Andreani',
      requiredLevel: 3, // Nivel 3 (Admin)
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'historial',
      label: 'Historial',
      path: '/historial',
      description: 'Historial de Archivos Procesados',
      requiredLevel: 2, // Nivel 2 (Basic)
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
          fixed md:sticky top-0 left-0 h-screen border-r border-gray-700 
          transition-all duration-300 z-30 flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isSidebarOpen ? 'w-72' : 'md:w-20'}
        `}
        style={{ backgroundColor: '#202020' }}
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
              <svg className="w-20 h-20 flex-shrink-0 text-blue-500 drop-shadow-lg transition-transform duration-300 hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.5 11.5c0-2.5-1.5-4.5-3.5-5.5-.5-2-2-3.5-4-4-2.5-.5-5 .5-6.5 2.5C4 5 2.5 7 2.5 9.5c0 1.5.5 3 1.5 4 0 .5 0 1 .5 1.5.5 1.5 1.5 2.5 3 3 .5.5 1 .5 1.5.5h.5c.5.5 1 1 1.5 1 1 .5 2 .5 3 0 .5-.5 1-.5 1.5-1h.5c.5 0 1 0 1.5-.5 1.5-.5 2.5-1.5 3-3 .5-.5.5-1 .5-1.5 1-1 1.5-2.5 1.5-4zm-11 5c-.5 0-1-.5-1-1s.5-1 1-1 1 .5 1 1-.5 1-1 1zm5 0c-.5 0-1-.5-1-1s.5-1 1-1 1 .5 1 1-.5 1-1 1z"/>
              </svg>
              <div className="text-left">
                <h2 className="text-xl font-bold text-white">South Wale</h2>
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
              <svg className="w-20 h-20 text-blue-500 drop-shadow-lg transition-transform duration-300 hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.5 11.5c0-2.5-1.5-4.5-3.5-5.5-.5-2-2-3.5-4-4-2.5-.5-5 .5-6.5 2.5C4 5 2.5 7 2.5 9.5c0 1.5.5 3 1.5 4 0 .5 0 1 .5 1.5.5 1.5 1.5 2.5 3 3 .5.5 1 .5 1.5.5h.5c.5.5 1 1 1.5 1 1 .5 2 .5 3 0 .5-.5 1-.5 1.5-1h.5c.5 0 1 0 1.5-.5 1.5-.5 2.5-1.5 3-3 .5-.5.5-1 .5-1.5 1-1 1.5-2.5 1.5-4zm-11 5c-.5 0-1-.5-1-1s.5-1 1-1 1 .5 1 1-.5 1-1 1zm5 0c-.5 0-1-.5-1-1s.5-1 1-1 1 .5 1 1-.5 1-1 1z"/>
              </svg>
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
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/30">
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
                  group/menuitem w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/50'
                      : isLocked
                      ? 'text-gray-500 hover:bg-gray-700/50 hover:text-gray-400 border border-gray-700/50'
                      : 'text-gray-400 hover:bg-gray-700/80 hover:text-white hover:shadow-lg'
                  }
                  ${!isSidebarOpen && 'justify-center'}
                  active:scale-95
                  ${isLocked && 'relative'}
                `}
                title={!isSidebarOpen ? (isLocked ? `${item.label} - Requiere Nivel ${item.requiredLevel}` : item.label) : undefined}
              >
                <div className="flex-shrink-0 relative transition-transform duration-300 group-hover/menuitem:scale-110">
                  {item.icon}
                  {isLocked && (
                    <svg 
                      className="w-3.5 h-3.5 text-yellow-400 absolute -top-1 -right-1 animate-pulse" 
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
                      <p className="font-semibold truncate">{item.label}</p>
                      {isLocked && (
                        <span className="text-xs bg-gradient-to-r from-yellow-500/30 to-yellow-600/30 text-yellow-400 px-2 py-1 rounded-full border border-yellow-500/40 flex-shrink-0 shadow-sm">
                          Nivel {item.requiredLevel}
                        </span>
                      )}
                      {!isLocked && userLevel === 0 && item.id === 'rentabilidad' && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full border border-yellow-500/30 flex-shrink-0">
                          Limitado
                        </span>
                      )}
                    </div>
                    <p className={`text-xs opacity-80 truncate mt-0.5 ${isLocked && 'line-through'}`}>
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
          className="fixed bottom-6 left-6 md:hidden bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg z-10 transition-colors"
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

