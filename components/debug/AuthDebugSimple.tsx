import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const AuthDebugSimple: React.FC = () => {
  const { signOut, isAuthenticated, userProfile, userLevel, username, user, isLoading } = useAuth();

  return (
    <div className="p-4 bg-gray-800 border border-gray-600 rounded">
      <h3 className="text-white font-bold mb-2">🔍 Debug Auth</h3>
      <div className="text-sm text-gray-300 space-y-1">
        <p><strong>Loading:</strong> {isLoading ? 'Sí' : 'No'}</p>
        <p><strong>Autenticado:</strong> {isAuthenticated ? 'Sí' : 'No'}</p>
        <p><strong>Email:</strong> {user?.email || 'No user'}</p>
        <p><strong>Username:</strong> {username}</p>
        <p><strong>Nivel:</strong> {userLevel}</p>
        
        {user && (
          <div className="mt-2 p-2 bg-gray-700 rounded">
            <p className="font-bold text-green-400">Metadata:</p>
            <p><strong>Username:</strong> {user.user_metadata?.username || 'No username'}</p>
            <p><strong>Nivel:</strong> {user.user_metadata?.nivel || 'No nivel'}</p>
          </div>
        )}
        
        <div className="mt-3 space-x-2">
          <button
            onClick={async () => {
              await signOut();
              window.location.reload();
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
          >
            Cerrar Sesión
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
          >
            Recargar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthDebugSimple;