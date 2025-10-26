import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const EmailConfirmationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      if (!token || !type) {
        setStatus('error');
        setMessage('Enlace de confirmación inválido');
        return;
      }

      try {
        // Verificar el token de confirmación
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as any
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          // Obtener el perfil del usuario
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError) {
            console.error('Error obteniendo perfil:', profileError);
          }

          // Hacer login automático
          const username = profileData?.username || data.user.email?.split('@')[0] || 'Usuario';
          const level = profileData?.nivel || 1;

          login(username, level);
          
          setStatus('success');
          setMessage('¡Email confirmado exitosamente! Te estamos redirigiendo al dashboard...');

          // Redirigir al dashboard después de 2 segundos
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
        }
      } catch (error: any) {
        console.error('Error confirmando email:', error);
        setStatus('error');
        setMessage('Error al confirmar el email. El enlace puede haber expirado o ya haber sido usado.');
      }
    };

    handleEmailConfirmation();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="/facil-uno.png" 
              alt="FACIL.UNO Logo" 
              className="w-24 h-24"
            />
          </div>

          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Confirmando tu email...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Por favor espera mientras verificamos tu cuenta.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                ¡Email confirmado!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {message}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Error de confirmación
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {message}
              </p>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Volver al inicio
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
