import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

const AuthStateMonitor: React.FC = () => {
  const { user, userProfile, isLoading, isAuthenticated } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const getSessionInfo = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        setSessionInfo({ session, error });
        
        // Información adicional de debugging
        const debugData = {
          localStorage: {
            supabaseAuthToken: localStorage.getItem('sb-rycifekzklqsnuczawub-auth-token'),
            supabaseAuthRefreshToken: localStorage.getItem('sb-rycifekzklqsnuczawub-auth-refresh-token'),
          },
          sessionValid: !!session?.user,
          sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000) : null,
          currentTime: new Date(),
          userAgent: navigator.userAgent,
        };
        
        setDebugInfo(debugData);
      } catch (err) {
        console.error('Error obteniendo información de sesión:', err);
      }
    };

    getSessionInfo();
    
    // Actualizar cada 5 segundos
    const interval = setInterval(getSessionInfo, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-md text-xs text-white z-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-blue-400">🔍 Auth Debug Monitor</h3>
        <button
          onClick={() => {
            localStorage.removeItem('sb-rycifekzklqsnuczawub-auth-token');
            localStorage.removeItem('sb-rycifekzklqsnuczawub-auth-refresh-token');
            window.location.reload();
          }}
          className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
        >
          Clear Storage
        </button>
      </div>
      
      <div className="space-y-2">
        <div>
          <span className="text-gray-400">Estado:</span>
          <span className={`ml-2 px-2 py-1 rounded text-xs ${
            isLoading ? 'bg-yellow-600' : 
            isAuthenticated ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {isLoading ? 'Cargando...' : isAuthenticated ? 'Autenticado' : 'No autenticado'}
          </span>
        </div>
        
        {user && (
          <div>
            <span className="text-gray-400">Usuario:</span>
            <span className="ml-2 text-white">{user.email}</span>
          </div>
        )}
        
        {userProfile && (
          <div>
            <span className="text-gray-400">Nivel:</span>
            <span className="ml-2 text-white">{userProfile.nivel}</span>
          </div>
        )}
        
        {sessionInfo?.session && (
          <div>
            <span className="text-gray-400">Sesión válida:</span>
            <span className="ml-2 text-green-400">Sí</span>
          </div>
        )}
        
        {debugInfo.sessionExpiry && (
          <div>
            <span className="text-gray-400">Expira:</span>
            <span className="ml-2 text-white">
              {debugInfo.sessionExpiry.toLocaleTimeString()}
            </span>
          </div>
        )}
        
        {sessionInfo?.error && (
          <div>
            <span className="text-gray-400">Error:</span>
            <span className="ml-2 text-red-400">{sessionInfo.error.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthStateMonitor;