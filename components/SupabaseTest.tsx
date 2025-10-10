import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Componente de prueba para verificar la conexión con Supabase
 * Este componente puede ser removido después de confirmar que la integración funciona
 */
export const SupabaseTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Intentar obtener la sesión actual
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setConnectionStatus('error');
          setErrorMessage(error.message);
        } else {
          setConnectionStatus('connected');
        }
      } catch (error) {
        setConnectionStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Error desconocido');
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <h3 className="text-xl font-bold text-white mb-4">
        🔌 Estado de Conexión con Supabase
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-gray-400">Estado:</span>
          {connectionStatus === 'checking' && (
            <span className="text-yellow-400 flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Verificando...
            </span>
          )}
          {connectionStatus === 'connected' && (
            <span className="text-green-400 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Conectado
            </span>
          )}
          {connectionStatus === 'error' && (
            <span className="text-red-400 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Error
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-gray-400">URL:</span>
          <code className="text-green-400 text-sm bg-gray-900 px-2 py-1 rounded">
            {import.meta.env.VITE_SUPABASE_URL || 'No configurada'}
          </code>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-gray-400">Anon Key:</span>
          <code className="text-green-400 text-sm bg-gray-900 px-2 py-1 rounded">
            {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Configurada' : '✗ No configurada'}
          </code>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-500 rounded-lg">
            <p className="text-red-300 text-sm">
              <strong>Error:</strong> {errorMessage}
            </p>
          </div>
        )}

        {connectionStatus === 'connected' && (
          <div className="mt-4 p-3 bg-green-900/30 border border-green-500 rounded-lg">
            <p className="text-green-300 text-sm">
              ✅ <strong>Supabase está configurado correctamente</strong>
              <br />
              Puedes comenzar a usar las funcionalidades de autenticación y base de datos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

