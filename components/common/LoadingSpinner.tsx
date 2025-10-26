import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        {/* Círculo exterior animado */}
        <svg 
          className={`${sizeClasses[size]} animate-spin`} 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        
        {/* Círculo interior para un efecto más elegante */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${sizeClasses[size]} opacity-20`}>
          <div className="w-full h-full bg-current rounded-full animate-ping" />
        </div>
      </div>
      
      {text && (
        <p className="mt-3 text-sm text-gray-400 animate-pulse">{text}</p>
      )}
    </div>
  );
};

// Componente de loading con overlay (para modales y pantallas completas)
interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  opacity?: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isLoading, 
  text = 'Cargando...',
  opacity = 80
}) => {
  if (!isLoading) return null;

  return (
    <div className={`fixed inset-0 bg-gray-950/90 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn`}>
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size="xl" text={text} className="text-blue-500" />
      </div>
    </div>
  );
};

