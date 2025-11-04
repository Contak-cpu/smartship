
import React from 'react';
import { ProcessStatus, ProcessingInfo } from '../types';

interface StatusDisplayProps {
  status: ProcessStatus;
  error: string | null;
  processingInfo?: ProcessingInfo;
  successMessage?: string; // Mensaje personalizado para cuando el procesamiento es exitoso
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, error, processingInfo, successMessage }) => {
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
        <div className="text-center">
          <p className="text-gray-300 text-xs sm:text-sm font-medium mb-3">
            {successMessage || '¡Ahora solo tienes que copiar los datos de cada hoja en la plantilla de Andreani Original!'}
          </p>
          
          {processingInfo && (
            <>
              {/* Debug logs */}
              {console.log('🔍 DEBUG StatusDisplay - processingInfo:', processingInfo)}
              {console.log('🔍 DEBUG - erroresSucursal:', processingInfo.erroresSucursal)}
              {console.log('🔍 DEBUG - erroresSucursal length:', processingInfo.erroresSucursal?.length)}
              {console.log('🔍 DEBUG - tasaEfectividad:', processingInfo.tasaEfectividad)}
              
              <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-600">
              <h4 className="text-green-400 font-semibold text-sm mb-2">📊 Resumen de Procesamiento</h4>
              
              {/* Mostrar tasa de efectividad si existe */}
              {processingInfo.tasaEfectividad !== undefined && (
                <div className="mb-2 p-2 rounded bg-blue-900/20 border border-blue-600/30">
                  <div className="text-blue-400 text-xs">Tasa de Efectividad</div>
                  <div className="text-blue-300 font-bold text-lg">{processingInfo.tasaEfectividad}%</div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-700/50 p-2 rounded">
                  <div className="text-gray-400">Total procesados:</div>
                  <div className="text-white font-semibold">{processingInfo.totalOrders}</div>
                </div>
                <div className="bg-green-700/20 p-2 rounded border border-green-600/30">
                  <div className="text-green-400">Domicilios:</div>
                  <div className="text-green-300 font-semibold">{processingInfo.domiciliosProcessed}</div>
                </div>
                <div className="bg-teal-700/20 p-2 rounded border border-teal-600/30">
                  <div className="text-teal-400">Sucursales:</div>
                  <div className="text-teal-300 font-semibold">{processingInfo.sucursalesProcessed}</div>
                </div>
                <div className="bg-red-700/20 p-2 rounded border border-red-600/30">
                  <div className="text-red-400">Líneas omitidas:</div>
                  <div className="text-red-300 font-semibold">{processingInfo.noProcessed}</div>
                </div>
              </div>
              
              {/* Mostrar errores de sucursal si existen */}
              {processingInfo.erroresSucursal && processingInfo.erroresSucursal.length > 0 && (
                <div className="mt-2 p-2 rounded bg-orange-900/20 border border-orange-600/30 text-xs">
                  <div className="text-orange-300 font-semibold mb-1">
                    ⚠️ Pedidos con error de sucursal ({processingInfo.erroresSucursal.length})
                  </div>
                  <div className="text-orange-300 text-xs space-y-1">
                    {processingInfo.erroresSucursal.map((error, idx) => (
                      <div key={idx}>• {error}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Avisos Shopify: pedidos descartados y emails autocompletados */}
              {processingInfo.droppedOrders && processingInfo.droppedOrders.length > 0 && (
                <div className="mt-2 p-2 rounded bg-yellow-900/20 border border-yellow-600/30 text-xs">
                  <div className="text-yellow-300 font-semibold mb-1">⚠️ Pedidos descartados (Provincia/Localidad/CP no encontrados)</div>
                  <div className="text-yellow-300 text-xs space-y-1">
                    {processingInfo.droppedOrders.map((msg: string, idx: number) => (
                      <div key={idx}>• {msg}</div>
                    ))}
                  </div>
                </div>
              )}

              {processingInfo.autofilledEmails && processingInfo.autofilledEmails.length > 0 && (
                <div className="mt-2 p-2 rounded bg-blue-900/20 border border-blue-600/30 text-xs">
                  <div className="text-blue-300 font-semibold mb-1">ℹ️ Emails autocompletados</div>
                  <div className="text-blue-300 text-xs space-y-1">
                    {processingInfo.autofilledEmails.map((orderName: string, idx: number) => (
                      <div key={idx}>• {orderName} → ejemplo@gmail.com</div>
                    ))}
                  </div>
                </div>
              )}
              
              {processingInfo.noProcessed > 0 && (
                <div className={`mt-2 p-2 rounded text-xs ${
                  processingInfo.noProcessedReason?.includes('líneas duplicadas') || 
                  processingInfo.noProcessedReason?.includes('producto adicional')
                    ? 'bg-green-900/20 border border-green-600/30 text-green-300'
                    : 'bg-yellow-900/20 border border-yellow-600/30 text-yellow-300'
                }`}>
                  {processingInfo.noProcessedReason ? (
                    <>{processingInfo.noProcessedReason}</>
                  ) : (
                    <>⚠️ {processingInfo.noProcessed} pedidos no se procesaron. Verifica los medios de envío en el archivo original.</>
                  )}
                </div>
              )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
