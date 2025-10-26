import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface TrialInfo {
  trial_expires_at: string;
  created_at: string;
}

export const TrialStatus: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Leer directamente de user_metadata (sin consultas a DB)
        const metadata = user.user_metadata || {};
        
        // Verificar estado de pago
        if (metadata.payment_status) {
          setPaymentStatus(metadata.payment_status);
        }
        
        if (metadata.trial_expires_at) {
          setTrialInfo({
            trial_expires_at: metadata.trial_expires_at,
            created_at: user.created_at || new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error obteniendo información del estado:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [user]);

  if (isLoading) {
    return (
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-6 h-6 bg-blue-500/30 rounded-full"></div>
          <div className="h-4 bg-blue-500/30 rounded w-32"></div>
        </div>
      </div>
    );
  }

  // Mostrar estado de pago pendiente si existe
  if (paymentStatus === 'pending') {
    return (
      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm text-yellow-300">
                Pago en proceso de aprobación
              </p>
              <span className="text-xs opacity-75">
                Nivel {userProfile?.nivel || 3}
              </span>
            </div>
            <p className="text-xs text-yellow-400 opacity-75 mt-1">
              Estamos verificando tu pago. Te notificaremos por email cuando se complete la aprobación.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!trialInfo?.trial_expires_at) {
    return null;
  }

  const expiresAt = new Date(trialInfo.trial_expires_at);
  const now = new Date();
  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;
  const isExpiringSoon = daysLeft <= 2 && daysLeft > 0;

  const getStatusColor = () => {
    if (isExpired) return 'red';
    if (isExpiringSoon) return 'yellow';
    return 'green';
  };

  const getStatusIcon = () => {
    if (isExpired) {
      return (
        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (isExpiringSoon) {
      return (
        <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const getStatusMessage = () => {
    if (isExpired) {
      return 'Tu período de prueba ha expirado';
    }
    if (daysLeft === 1) {
      return 'Tu período de prueba expira mañana';
    }
    return `Tu período de prueba expira en ${daysLeft} días`;
  };

  const colorClasses = {
    red: 'bg-red-900/20 border-red-500/30 text-red-300',
    yellow: 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300',
    green: 'bg-green-900/20 border-green-500/30 text-green-300'
  };

  return (
    <div className={`rounded-lg p-4 border ${colorClasses[getStatusColor()]}`}>
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm">
              {getStatusMessage()}
            </p>
            <span className="text-xs opacity-75">
              Nivel {userProfile?.nivel || 3}
            </span>
          </div>
          <p className="text-xs opacity-75 mt-1">
            Expira: {expiresAt.toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
      
      {isExpired && (
        <div className="mt-3 pt-3 border-t border-red-500/20">
          <p className="text-xs text-red-400">
            💡 Contacta al administrador para renovar tu acceso
          </p>
        </div>
      )}
      
      {isExpiringSoon && (
        <div className="mt-3 pt-3 border-t border-yellow-500/20">
          <p className="text-xs text-yellow-400">
            ⚠️ Tu período de prueba está por vencer. Contacta al administrador para más información.
          </p>
        </div>
      )}
      
      {!isExpired && !isExpiringSoon && (
        <div className="mt-3 pt-3 border-t border-green-500/20">
          <p className="text-xs text-green-400">
            🎉 Tienes acceso completo a todas las herramientas durante tu período de prueba.
          </p>
        </div>
      )}
    </div>
  );
};
