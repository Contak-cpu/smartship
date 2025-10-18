import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

const AuthDebugSimpleFixed: React.FC = () => {
  const { signOut, isAuthenticated, userProfile, userLevel, username, user, isLoading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    // Solo obtener información una vez al montar
    const getDebugInfo = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        const supabaseAuth = localStorage.getItem('sb-rycifekzklqsnuczawub-auth-token');
        
        setDebugInfo({
          session: session ? {
            hasSession: true,
            userId: session.user?.id,
            email: session.user?.email,
            expiresAt: session.expires_at
          } : { hasSession: false },
          error,
          localStorage: {
            hasAuthToken: !!supabaseAuth,
            authToken: supabaseAuth ? JSON.parse(supabaseAuth) : null
          }
        });
      } catch (err) {
        setDebugInfo({
          session: { hasSession: false },
          error: err,
          localStorage: { hasAuthToken: false, authToken: null }
        });
      }
    };

    getDebugInfo();
  }, []);

  const clearStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <div className="p-4 bg-gray-800 border border-gray-600 rounded max-w-4xl mx-auto">
      <h3 className="text-white font-bold mb-4 text-lg">🔍 Debug Simple de Autenticación</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estado del Hook */}
        <div className="bg-gray-700 p-3 rounded">
          <h4 className="text-green-400 font-bold mb-2">Estado del Hook useAuth</h4>
          <div className="text-sm text-gray-300 space-y-1">
            <p><strong>Loading:</strong> <span className={isLoading ? 'text-yellow-400' : 'text-green-400'}>{isLoading ? 'Sí' : 'No'}</span></p>
            <p><strong>Autenticado:</strong> <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>{isAuthenticated ? 'Sí' : 'No'}</span></p>
            <p><strong>Email:</strong> {user?.email || 'No user'}</p>
            <p><strong>Username:</strong> {username}</p>
            <p><strong>Nivel:</strong> <span className="text-blue-400">{userLevel}</span></p>
          </div>
        </div>

        {/* Información de Sesión */}
        <div className="bg-gray-700 p-3 rounded">
          <h4 className="text-blue-400 font-bold mb-2">Información de Sesión</h4>
          <div className="text-sm text-gray-300 space-y-1">
            <p><strong>Tiene Sesión:</strong> <span className={debugInfo?.session?.hasSession ? 'text-green-400' : 'text-red-400'}>{debugInfo?.session?.hasSession ? 'Sí' : 'No'}</span></p>
            <p><strong>User ID:</strong> {debugInfo?.session?.userId || 'N/A'}</p>
            <p><strong>Expires At:</strong> {debugInfo?.session?.expiresAt ? new Date(debugInfo.session.expiresAt * 1000).toLocaleString() : 'N/A'}</p>
            <p><strong>Error:</strong> <span className={debugInfo?.error ? 'text-red-400' : 'text-green-400'}>{debugInfo?.error ? debugInfo.error.message : 'Ninguno'}</span></p>
          </div>
        </div>

        {/* Metadata del Usuario */}
        {user && (
          <div className="bg-gray-700 p-3 rounded">
            <h4 className="text-purple-400 font-bold mb-2">Metadata del Usuario</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <p><strong>Username:</strong> {user.user_metadata?.username || 'No username'}</p>
              <p><strong>Nivel:</strong> <span className="text-blue-400">{user.user_metadata?.nivel || 'No nivel'}</span></p>
            </div>
          </div>
        )}

        {/* LocalStorage */}
        <div className="bg-gray-700 p-3 rounded">
          <h4 className="text-orange-400 font-bold mb-2">LocalStorage</h4>
          <div className="text-sm text-gray-300 space-y-1">
            <p><strong>Auth Token:</strong> <span className={debugInfo?.localStorage?.hasAuthToken ? 'text-green-400' : 'text-red-400'}>{debugInfo?.localStorage?.hasAuthToken ? 'Presente' : 'Ausente'}</span></p>
            {debugInfo?.localStorage?.authToken && (
              <div>
                <p><strong>Access Token:</strong> {debugInfo.localStorage.authToken.access_token ? 'Presente' : 'Ausente'}</p>
                <p><strong>Refresh Token:</strong> {debugInfo.localStorage.authToken.refresh_token ? 'Presente' : 'Ausente'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={async () => {
            await signOut();
            window.location.reload();
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
        >
          Cerrar Sesión
        </button>
        
        <button
          onClick={clearStorage}
          className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded text-sm"
        >
          Limpiar Storage
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
        >
          Recargar Página
        </button>

        <button
          onClick={() => {
            console.log('🔍 [DEBUG] Estado completo:', {
              hook: { isAuthenticated, isLoading, user, userProfile },
              debugInfo
            });
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
        >
          Log Estado Completo
        </button>
      </div>

      {/* Logs en tiempo real */}
      <div className="mt-4 bg-gray-900 p-3 rounded">
        <h4 className="text-yellow-400 font-bold mb-2">Logs en Tiempo Real</h4>
        <p className="text-xs text-gray-400">
          Abre la consola del navegador (F12) para ver los logs detallados de autenticación.
        </p>
      </div>
    </div>
  );
};

export default AuthDebugSimple;


