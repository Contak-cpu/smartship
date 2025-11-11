import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { getLevelName } from '../../services/levelService';

interface PlanStatusHeaderProps {
  userPaidStatus: boolean;
  paymentStatus: string | null;
  userLevel: number;
  username: string | null;
}

export const PlanStatusHeader: React.FC<PlanStatusHeaderProps> = ({
  userPaidStatus,
  paymentStatus,
  userLevel,
  username,
}) => {
  const { user, isPaid } = useAuth();
  const [paidUntil, setPaidUntil] = useState<string | null>(null);
  const [trialExpiresAt, setTrialExpiresAt] = useState<string | null>(null);
  const [isEmpresaPlan, setIsEmpresaPlan] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const metadata = user.user_metadata || {};
        
        if (metadata.paid_until) {
          setPaidUntil(metadata.paid_until);
        }
        
        if (metadata.trial_expires_at) {
          setTrialExpiresAt(metadata.trial_expires_at);
        }
        
        if (metadata.pagos_empresa === true) {
          setIsEmpresaPlan(true);
        }
      } catch (error) {
        console.error('Error obteniendo información del plan:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [user]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="animate-pulse flex items-center gap-3">
            <div className="w-6 h-6 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-64"></div>
          </div>
        </div>
      </div>
    );
  }

  // Calcular días restantes
  let daysRemaining: number | null = null;
  let isExpiringSoon = false;
  let isExpired = false;
  let expirationDate: Date | null = null;

  if (userPaidStatus && paidUntil) {
    expirationDate = new Date(paidUntil);
    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    isExpired = daysRemaining <= 0;
    isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
  } else if (!userPaidStatus && trialExpiresAt) {
    expirationDate = new Date(trialExpiresAt);
    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    isExpired = daysRemaining <= 0;
    isExpiringSoon = daysRemaining <= 2 && daysRemaining > 0;
  }

  const getStatusColor = () => {
    if (isExpired) return 'red';
    if (isExpiringSoon) return 'yellow';
    if (userPaidStatus) return 'green';
    return 'blue';
  };

  const statusColor = getStatusColor();

  const statusConfig = {
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      icon: 'text-red-600 dark:text-red-400',
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: 'text-yellow-600 dark:text-yellow-400',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      icon: 'text-green-600 dark:text-green-400',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      icon: 'text-blue-600 dark:text-blue-400',
    },
  };

  const config = statusConfig[statusColor];

  return (
    <div className={`${config.bg} border-b-2 ${config.border} shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Información del plan */}
          <div className="flex items-center gap-4 flex-1">
            <div className={`${config.icon} flex-shrink-0`}>
              {isExpired ? (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : isExpiringSoon ? (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              ) : userPaidStatus ? (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className={`text-lg font-bold ${config.text}`}>
                  {userPaidStatus 
                    ? (isEmpresaPlan ? 'Plan Empresa' : 'Plan Activo')
                    : userLevel === 0 
                    ? 'Plan Expirado'
                    : 'Período de Prueba'}
                </h3>
                {isEmpresaPlan && (
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs font-bold rounded-full border border-purple-300 dark:border-purple-700">
                    EMPRESA
                  </span>
                )}
                <span className={`px-3 py-1 ${config.bg} ${config.text} text-xs font-semibold rounded-full border ${config.border}`}>
                  {getLevelName(userLevel)} {userLevel === 999 ? '👑' : ''}
                </span>
              </div>
              <p className={`text-sm mt-1 ${config.text} opacity-90`}>
                {isExpired && expirationDate
                  ? `Expiró el ${expirationDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`
                  : isExpiringSoon && daysRemaining !== null
                  ? `Expira en ${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}`
                  : expirationDate && daysRemaining !== null
                  ? `Activo hasta el ${expirationDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`
                  : userPaidStatus
                  ? 'Acceso completo a todas las funcionalidades'
                  : 'Tienes acceso completo durante tu período de prueba'}
              </p>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="flex items-center gap-3">
            {(isExpired || isExpiringSoon) && (
              <button
                onClick={() => window.location.href = '/precios'}
                className={`px-4 py-2 ${config.bg} ${config.text} font-semibold rounded-lg border-2 ${config.border} hover:opacity-80 transition-opacity text-sm`}
              >
                Renovar Plan
              </button>
            )}
            {paymentStatus === 'pending' && (
              <div className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 font-semibold rounded-lg border-2 border-yellow-300 dark:border-yellow-700 text-sm">
                Pago en proceso
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

