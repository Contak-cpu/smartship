import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface FeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  stats?: string;
  requiredLevel: number;
  isLocked: boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'default' | 'compact';
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  path,
  stats,
  isLocked,
  variant = 'default',
  requiredLevel,
  size = 'default',
}) => {
  const navigate = useNavigate();

  const variantStyles = {
    default: {
      icon: 'text-blue-500 dark:text-blue-400',
      badge: 'bg-blue-500 dark:bg-blue-600 text-white',
      button: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white',
      border: 'border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500',
      card: 'bg-white dark:bg-gray-800',
    },
    primary: {
      icon: 'text-blue-500 dark:text-blue-400',
      badge: 'bg-blue-500 dark:bg-blue-600 text-white',
      button: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white',
      border: 'border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500',
      card: 'bg-white dark:bg-gray-800',
    },
    success: {
      icon: 'text-green-500 dark:text-green-400',
      badge: 'bg-green-500 dark:bg-green-600 text-white',
      button: 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white',
      border: 'border-gray-300 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500',
      card: 'bg-white dark:bg-gray-800',
    },
    warning: {
      icon: 'text-orange-500 dark:text-orange-400',
      badge: 'bg-orange-500 dark:bg-orange-600 text-white',
      button: 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white',
      border: 'border-gray-300 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500',
      card: 'bg-white dark:bg-gray-800',
    },
    danger: {
      icon: 'text-red-500 dark:text-red-400',
      badge: 'bg-red-500 dark:bg-red-600 text-white',
      button: 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white',
      border: 'border-gray-300 dark:border-gray-700 hover:border-red-500 dark:hover:border-red-500',
      card: 'bg-white dark:bg-gray-800',
    },
  };

  const styles = variantStyles[variant];

  const handleClick = () => {
    if (!isLocked) {
      navigate(path);
    }
  };

  return (
    <div
      className={`
        group relative rounded-2xl border-2 transition-all duration-300
        ${styles.card}
        ${styles.border}
        ${isLocked ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer hover:shadow-xl hover:-translate-y-1'}
        ${size === 'compact' ? 'p-6' : 'p-8 sm:p-10'}
      `}
      onClick={handleClick}
    >
      {/* Badge de nivel requerido si está bloqueado */}
      {isLocked && (
        <div className="absolute top-4 right-4 bg-yellow-500 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 px-3 py-1.5 rounded-full text-xs font-bold border-2 border-yellow-600 dark:border-yellow-700 flex items-center gap-1.5 shadow-lg">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          {requiredLevel === -1 ? 'Requiere Pago' : `Nivel ${requiredLevel}`}
        </div>
      )}

      <div className={`flex items-start gap-5 ${size === 'compact' ? 'mb-4' : 'mb-6'}`}>
        <div className={`${styles.icon} flex-shrink-0 transition-transform duration-300 ${isLocked ? 'opacity-50' : 'group-hover:scale-110'}`}>
          <div className={size === 'compact' ? '[&>svg]:w-10 [&>svg]:h-10' : '[&>svg]:w-12 [&>svg]:h-12'}>
            {icon}
          </div>
        </div>
        <div className="flex-1">
          <h3 className={`font-bold mb-3 ${isLocked ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'} ${size === 'compact' ? 'text-xl' : 'text-2xl sm:text-3xl'}`}>
            {title}
          </h3>
          {stats && (
            <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold mb-3 ${styles.badge}`}>
              {stats}
            </span>
          )}
        </div>
      </div>

      <p className={`leading-relaxed ${isLocked ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'} ${size === 'compact' ? 'mb-6 text-sm' : 'mb-8 text-base'}`}>
        {description}
      </p>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        className={`
          w-full font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg active:scale-95
          ${size === 'compact' ? 'py-3 px-4 text-sm' : 'py-4 px-6'}
          ${isLocked
            ? 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-yellow-900 dark:text-yellow-100'
            : `${styles.button}`
          }
        `}
      >
        {isLocked ? (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            {requiredLevel === -1 ? 'Ver Planes' : 'Ver Detalles del Upgrade'}
          </>
        ) : (
          <>
            Acceder
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
};

