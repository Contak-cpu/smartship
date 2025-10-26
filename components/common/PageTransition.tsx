import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
  showLoader?: boolean;
  duration?: number;
}

/**
 * Componente que añade una transición suave al cambiar de página
 * Simula una carga breve para mejorar la percepción del usuario
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ 
  children,
  showLoader = true,
  duration = 350 // Duración en ms
}) => {
  const location = useLocation();
  const [showOverlay, setShowOverlay] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Cada vez que cambia la ubicación, activar transición y mostrar overlay
    setIsTransitioning(true);
    
    if (showLoader) {
      setShowOverlay(true);
    }

    const spinnerDuration = duration / 2; // Duración del spinner (600ms)
    const contentDuration = spinnerDuration + 100; // Duración del fade (700ms)

    // Después de la mitad del tiempo, ocultar el overlay
    const overlayTimer = setTimeout(() => {
      setShowOverlay(false);
    }, spinnerDuration);

    // 100ms después de que se oculte el spinner, finalizar la transición del contenido
    const transitionTimer = setTimeout(() => {
      setIsTransitioning(false);
    }, contentDuration);

    return () => {
      clearTimeout(overlayTimer);
      clearTimeout(transitionTimer);
    };
  }, [location.pathname, duration, showLoader]);

  return (
    <div className="relative">
      {/* Overlay de transición - solo por un momento breve */}
      {showOverlay && showLoader && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-40 flex items-center justify-center transition-opacity duration-200">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <svg 
                className="h-8 w-8 animate-spin" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="rgb(59, 130, 246)" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="rgb(59, 130, 246)" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Contenido de la página con fade */}
      <div 
        className={`transition-opacity duration-300 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          transitionDuration: `${duration / 2}ms`
        }}
      >
        {children}
      </div>
    </div>
  );
};

