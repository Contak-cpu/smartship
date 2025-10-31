import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

export const PaidPlanStatus: React.FC = () => {
  const { user, isPaid } = useAuth();
  const [paidStatus, setPaidStatus] = useState<boolean>(false);
  const [paidUntil, setPaidUntil] = useState<string | null>(null);
  const [isEmpresaPlan, setIsEmpresaPlan] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Verificar si el usuario está pagado
        const paid = await isPaid();
        setPaidStatus(paid);
        
        // Obtener usuario actualizado para tener los metadatos más recientes
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error obteniendo usuario:', error);
        }
        
        // Leer metadata directamente del usuario actualizado o del user actual
        const metadata = currentUser?.user_metadata || user.user_metadata || {};
        
        if (metadata.paid_until) {
          setPaidUntil(metadata.paid_until);
        } else {
          setPaidUntil(null);
        }
        
        if (metadata.pagos_empresa === true) {
          setIsEmpresaPlan(true);
        } else {
          setIsEmpresaPlan(false);
        }
      } catch (error) {
        console.error('Error obteniendo información del plan:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [user, isPaid]);

  if (isLoading) {
    return (
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-6 h-6 bg-purple-500/30 rounded-full"></div>
          <div className="h-4 bg-purple-500/30 rounded w-32"></div>
        </div>
      </div>
    );
  }

  // Solo mostrar si el usuario está pagado
  if (!paidStatus) {
    return null;
  }

  // Calcular días restantes si hay fecha de finalización
  let daysRemaining: number | null = null;
  let isExpiringSoon = false;
  let isExpired = false;

  if (paidUntil) {
    const expiresAt = new Date(paidUntil);
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    isExpired = daysRemaining <= 0;
    isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
  }

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

  const colorClasses = {
    red: 'bg-red-900/20 border-red-500/30 text-red-300',
    yellow: 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300',
    green: 'bg-green-900/20 border-green-500/30 text-green-300'
  };

  const statusColor = paidUntil ? getStatusColor() : 'green';

  return (
    <div className={`rounded-lg p-4 border ${colorClasses[statusColor as keyof typeof colorClasses]}`}>
      <div className="flex items-start gap-3">
        {paidUntil && getStatusIcon()}
        {!paidUntil && (
          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        )}
        <div className="flex-1">
          {/* Badge de Plan Empresa */}
          {isEmpresaPlan && (
            <div className="mb-3 inline-flex items-center gap-2 bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/40 rounded-full px-4 py-2 shadow-lg backdrop-blur-sm">
              <svg className="w-4 h-4 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="font-bold text-sm text-purple-200">Plan Empresa</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              {paidUntil && (
                <p className="text-xs opacity-75">
                  {isExpired 
                    ? `Plan expirado el ${new Date(paidUntil).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`
                    : isExpiringSoon && daysRemaining !== null
                    ? `Plan expira en ${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}`
                    : daysRemaining !== null
                    ? `Plan activo hasta el ${new Date(paidUntil).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`
                    : 'Plan activo'
                  }
                </p>
              )}
              {!paidUntil && (
                <p className="text-xs opacity-75">
                  Plan activo sin fecha de expiración
                </p>
              )}
            </div>
          </div>
          
          {/* Mensaje especial para Plan Empresa */}
          {isEmpresaPlan && (
            <div className="mt-3 pt-3 border-t border-purple-500/20">
              <p className="text-xs text-purple-200 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Puede manejar todas las tiendas desde un solo panel
              </p>
            </div>
          )}
          
          {paidUntil && isExpired && (
            <div className="mt-3 pt-3 border-t border-red-500/20">
              <p className="text-xs text-red-400">
                ⚠️ Tu plan ha expirado. Contacta al administrador para renovar.
              </p>
            </div>
          )}
          
          {paidUntil && isExpiringSoon && !isExpired && (
            <div className="mt-3 pt-3 border-t border-yellow-500/20">
              <p className="text-xs text-yellow-400">
                ⚠️ Tu plan está por vencer pronto. Contacta al administrador para renovar.
              </p>
            </div>
          )}
          
          {paidUntil && !isExpired && !isExpiringSoon && (
            <div className="mt-3 pt-3 border-t border-green-500/20">
              <p className="text-xs text-green-400">
                ✅ Disfruta de acceso completo a todas las funcionalidades.
              </p>
            </div>
          )}
          
          {!paidUntil && !isEmpresaPlan && (
            <div className="mt-3 pt-3 border-t border-green-500/20">
              <p className="text-xs text-green-400">
                ✅ Disfruta de acceso completo a todas las funcionalidades.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

