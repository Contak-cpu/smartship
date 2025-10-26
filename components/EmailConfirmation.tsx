import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface EmailConfirmationProps {
  email: string;
  onConfirmed: () => void;
  onCancel: () => void;
}

export const EmailConfirmation: React.FC<EmailConfirmationProps> = ({ 
  email, 
  onConfirmed, 
  onCancel 
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Verificar si el email ya está confirmado
  const checkEmailConfirmation = async () => {
    setIsChecking(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (user && user.email_confirmed_at) {
        // Email confirmado, crear perfil si no existe
        await createUserProfile(user);
        onConfirmed();
        return;
      }
    } catch (error) {
      console.error('Error verificando confirmación:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Crear perfil de usuario
  const createUserProfile = async (user: any) => {
    try {
      const metadata = user.user_metadata || {};
      const username = metadata.username || user.email?.split('@')[0] || 'Usuario';
      const plan = metadata.plan || 'Starter';
      
      // FORZAR nivel 3 SIEMPRE
      const nivel = 3;
      console.log('📝 [EmailConfirmation] Forzando nivel 3');
      
      // Verificar si el perfil ya existe
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      // Solo crear perfil si no existe
      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            username,
            email: user.email || '',
            nivel: 3, // HARDCODED - Siempre 3
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (profileError) {
          console.error('❌ Error creando perfil:', profileError);
        } else {
          console.log('✅ Perfil creado para:', username, 'Plan:', plan, 'Nivel:', nivel);
        }
      }
    } catch (error) {
      console.error('❌ Error en creación de perfil:', error);
    }
  };

  // Reenviar email de confirmación
  const resendConfirmation = async () => {
    if (resendCooldown > 0) return;
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });
      
      if (error) {
        console.error('Error reenviando confirmación:', error);
      } else {
        setResendCooldown(60); // 60 segundos de cooldown
      }
    } catch (error) {
      console.error('Error reenviando confirmación:', error);
    }
  };

  // Countdown para reenvío
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black border-2 border-blue-500/30 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scaleIn">
        {/* Efectos de brillo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl" />
        
        {/* Botón de cierre */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icono de email */}
        <div className="relative flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 p-4 rounded-full">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Título */}
        <h3 className="relative text-2xl sm:text-3xl font-bold text-center text-white mb-3">
          Confirma tu email
        </h3>
        
        {/* Mensaje */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
          <p className="text-blue-400 text-sm text-center mb-2">
            📧 <strong>Revisa tu bandeja de entrada</strong>
          </p>
          <p className="text-gray-300 text-xs text-center mb-3">
            Te hemos enviado un enlace de confirmación a <strong>{email}</strong>
          </p>
          <p className="text-gray-300 text-xs text-center">
            Haz clic en el enlace para activar tu cuenta y comenzar tu prueba gratuita de 7 días.
          </p>
        </div>

        {/* Botones */}
        <div className="space-y-3">
          <button
            onClick={checkEmailConfirmation}
            disabled={isChecking}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 ${
              isChecking
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-green-500/50'
            }`}
          >
            {isChecking ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                Verificando...
              </div>
            ) : (
              '✅ Ya confirmé mi email'
            )}
          </button>

          <button
            onClick={resendConfirmation}
            disabled={resendCooldown > 0}
            className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-all duration-300 ${
              resendCooldown > 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {resendCooldown > 0 
              ? `Reenviar en ${resendCooldown}s` 
              : '📤 Reenviar email'
            }
          </button>

          <button
            onClick={onCancel}
            className="w-full py-2 px-4 rounded-lg font-medium text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
        </div>

        {/* Información adicional */}
        <div className="mt-6 bg-gray-800/20 border border-gray-500/30 rounded-lg p-3">
          <p className="text-gray-400 text-xs text-center">
            💡 <strong>Tip:</strong> Revisa también tu carpeta de spam si no encuentras el email.
          </p>
        </div>
      </div>
    </div>
  );
};

