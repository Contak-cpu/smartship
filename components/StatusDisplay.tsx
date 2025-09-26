
import React from 'react';
import { ProcessStatus } from '../types';

interface StatusDisplayProps {
  status: ProcessStatus;
  error: string | null;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, error }) => {
  const getStatusContent = () => {
    switch (status) {
      case ProcessStatus.IDLE:
        return { text: 'Listo para procesar.', color: 'text-gray-400', icon: ' M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' };
      case ProcessStatus.PROCESSING:
        return { text: 'Procesando archivo...', color: 'text-blue-400', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' };
      case ProcessStatus.SUCCESS:
        return { text: '¡Procesamiento completado con éxito!', color: 'text-green-400', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' };
      case ProcessStatus.ERROR:
        return { text: `Error: ${error || 'Ocurrió un problema.'}`, color: 'text-red-400', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' };
      default:
        return { text: 'Estado desconocido.', color: 'text-gray-500', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' };
    }
  };

  const { text, color, icon } = getStatusContent();
  
  if (status === ProcessStatus.IDLE) return null;

  return (
    <div className={`p-3 sm:p-4 rounded-lg bg-gray-700/50 transition-all duration-300`}>
      <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
        <p className={`font-medium ${color} text-sm sm:text-base`}>{text}</p>
      </div>
      {status === ProcessStatus.SUCCESS && (
        <p className="text-center text-gray-300 text-xs sm:text-sm font-medium">
          ¡Ahora solo tienes que copiar los datos de cada hoja en la plantilla de Andreani Original!
        </p>
      )}
    </div>
  );
};
