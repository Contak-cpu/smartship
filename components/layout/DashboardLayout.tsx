import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { levelService, LEVEL_CONFIG, getLevelName, getLevelColor } from '../../services/levelService';
import { ThemeToggle } from '../common/ThemeToggle';
import { useTheme } from '../../contexts/ThemeContext';

interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  description: string;
  requiredLevel: number; // -1 indica que requiere pago, no nivel
}

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

// Función para obtener el ícono de cada sección
const getIconForSection = (sectionKey: string) => {
  const icons: Record<string, React.ReactNode> = {
    'rentabilidad': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'breakeven-roas': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    'smartship': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
    'pdf-generator': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    'historial': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'informacion': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    'admin': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    'cupones': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4m-6 4h6a2 2 0 002-2v-3a2 2 0 00-2-2h-6v7m-6 0h6a2 2 0 002-2V9a2 2 0 00-2-2H6a2 2 0 00-2 2v9a2 2 0 002 2z" />
      </svg>
    )
  };
  
  return icons[sectionKey] || (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { username, userLevel, logout, hasAccess, isPaid } = useAuth();
  const [userPaidStatus, setUserPaidStatus] = React.useState<boolean | null>(null);
  const { theme } = useTheme();

  // Verificar si el usuario pagó al cargar
  React.useEffect(() => {
    const checkPaidStatus = async () => {
      try {
        const paid = await isPaid();
        setUserPaidStatus(paid);
      } catch (error) {
        console.error('Error verificando estado de pago:', error);
        setUserPaidStatus(false);
      }
    };
    
    checkPaidStatus();
  }, [isPaid]);

  const handleLogout = async () => {
    try {
      console.log('🔄 [DashboardLayout] Iniciando proceso de logout...');
      await logout();
      console.log('✅ [DashboardLayout] Logout completado, navegando a login...');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('❌ [DashboardLayout] Error en logout:', error);
      // Forzar navegación incluso si hay error
      navigate('/login', { replace: true });
    }
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
    // Panel Admin - Solo para nivel Dios (999)
    ...(userLevel === 999 ? [
      {
        id: 'logs',
        label: '📊 Logs',
        path: '/logs',
        description: 'Logs de Actividad de Usuarios',
        requiredLevel: 999,
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
      {
        id: 'admin',
        label: '👑 Panel Admin',
        path: '/admin',
        description: 'Administración del Sistema',
        requiredLevel: 999,
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
      }
    ] : []),
    // TEMPORALMENTE OCULTO - Breakeven & ROAS
    // {
    //   id: 'breakeven-roas',
    //   label: 'Breakeven & ROAS',
    //   path: '/breakeven-roas',
    //   description: 'Calcula tu Breakeven y ROAS',
    //   requiredLevel: 1, // Plan Starter
    //   icon: (
    //     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    //     </svg>
    //   ),
    // },
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
      id: 'correo-argentino',
      label: 'Correo Argentino',
      path: '/correo-argentino',
      description: 'Transformador de Pedidos Correo Argentino',
      requiredLevel: 2, // Nivel 2 y superiores
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
    {
      id: 'stock',
      label: 'Gestión de Stock',
      path: '/stock',
      description: 'Controla tu inventario y equivalencias por SKU',
      requiredLevel: 4, // Plan Pro+
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      id: 'cupones',
      label: 'Cupones',
      path: '/cupones',
      description: 'Descuentos para Andreani',
      requiredLevel: -1, // -1 indica que requiere pago, no nivel
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4m-6 4h6a2 2 0 002-2v-3a2 2 0 00-2-2h-6v7m-6 0h6a2 2 0 002-2V9a2 2 0 00-2-2H6a2 2 0 00-2 2v9a2 2 0 002 2z" />
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
    navigate(path, { replace: false });
    // En móvil, cerrar el sidebar después de navegar
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-300">
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
          fixed md:sticky top-0 left-0 h-screen border-r border-gray-300 dark:border-gray-700
          transition-all duration-300 z-30 flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isSidebarOpen ? 'w-96' : 'md:w-20'}
          bg-white dark:bg-gray-800
        `}
      >
        {/* Header del Sidebar */}
        <div className="p-6 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
          {isSidebarOpen && (
            <button
              onClick={() => {
                console.log('🔄 [DashboardLayout] Navegando a / desde sidebar');
                handleNavigation('/');
              }}
              className="flex items-center gap-4 hover:opacity-80 transition-opacity w-full"
            >
              <img 
                src="/facil-uno.png" 
                alt="FACIL.UNO Logo" 
                className="w-32 h-32 flex-shrink-0 drop-shadow-lg transition-transform duration-300 hover:scale-110"
              />
              <div className="text-left flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">FACIL.UNO</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Panel de Control</p>
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
              <img 
                src="/facil-uno.png" 
                alt="FACIL.UNO Logo" 
                className="w-24 h-24 drop-shadow-lg transition-transform duration-300 hover:scale-110"
              />
            </button>
          )}
          <button
            onClick={() => {
              console.log('🔄 [DashboardLayout] Botón toggle sidebar clickeado');
              toggleSidebar();
            }}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
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

        {/* Usuario con logout y tema integrados */}
        <div className="p-4 border-b border-gray-300 dark:border-gray-700">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 dark:bg-blue-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                {username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{username}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Nivel {userLevel} {getLevelName(userLevel)} {userLevel === 999 ? '👑' : ''}
                </p>
              </div>
              {/* Botón de logout compacto */}
              <button
                onClick={() => {
                  console.log('🔄 [DashboardLayout] Botón logout clickeado');
                  handleLogout();
                }}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 flex-shrink-0"
                title="Cerrar Sesión"
              >
                <svg
                  className="w-5 h-5"
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
              </button>
              {/* Selector de tema compacto */}
              <div className="flex-shrink-0">
                <ThemeToggle size="default" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 dark:bg-blue-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                {username?.charAt(0).toUpperCase()}
              </div>
              {/* Botón de logout compacto */}
              <button
                onClick={() => {
                  console.log('🔄 [DashboardLayout] Botón logout clickeado');
                  handleLogout();
                }}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                title="Cerrar Sesión"
              >
                <svg
                  className="w-5 h-5"
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
              </button>
              {/* Selector de tema compacto */}
              <div className="flex-shrink-0">
                <ThemeToggle size="compact" />
              </div>
            </div>
          )}
        </div>

        {/* Menú de navegación */}
        <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            // Si requiredLevel es -1, verificar pago en lugar de nivel
            let isLocked = false;
            if (item.requiredLevel === -1) {
              isLocked = userPaidStatus !== true;
            } else {
              isLocked = !hasAccess(item.requiredLevel);
            }
            
            return (
              <button
                key={item.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNavigation(item.path);
                }}
                className={`
                  group/menuitem w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-300
                  ${
                    isActive && item.id === 'admin'
                      ? 'bg-red-600 dark:bg-red-700 text-white shadow-lg'
                      : isActive
                      ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-lg'
                      : isLocked
                      ? 'text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-600 dark:hover:text-gray-400 border border-gray-300 dark:border-gray-700'
                      : item.id === 'admin'
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 hover:shadow-lg border border-red-300 dark:border-red-700/30'
                      : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/80 hover:text-gray-900 dark:hover:text-white hover:shadow-lg'
                  }
                  ${!isSidebarOpen && 'justify-center'}
                  active:scale-95
                  ${isLocked && 'relative'}
                `}
                title={!isSidebarOpen ? (isLocked ? `${item.label} - ${item.requiredLevel === -1 ? 'Requiere Pago' : `Requiere Nivel ${item.requiredLevel}`}` : item.label) : undefined}
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
                        <span className="text-xs bg-yellow-500/20 dark:bg-yellow-600/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-full border border-yellow-500/40 dark:border-yellow-500/40 flex-shrink-0 shadow-sm">
                          {item.requiredLevel === -1 ? 'Requiere Pago' : `Nivel ${item.requiredLevel}`}
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

      </aside>

      {/* Botón flotante para abrir sidebar en móvil */}
      {!isSidebarOpen && (
        <button
          onClick={() => {
            console.log('🔄 [DashboardLayout] Abriendo sidebar móvil');
            setIsSidebarOpen(true);
          }}
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
      <main className="flex-1 overflow-auto w-full min-w-0">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;

