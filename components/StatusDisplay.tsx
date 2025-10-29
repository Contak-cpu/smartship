
import React from 'react';
import { ProcessStatus, ProcessingInfo } from '../types';

interface StatusDisplayProps {
  status: ProcessStatus;
  error: string | null;
  processingInfo?: ProcessingInfo;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, error, processingInfo }) => {
  const getStatusContent = () => {
    switch (status) {
      case ProcessStatus.IDLE:
        return { text: 'Listo para procesar.', color: 'text-gray-400', icon: ' M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' };
      case ProcessStatus.PROCESSING:
        return { text: 'Procesando archivo...', color: 'text-blue-400', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' };
      case ProcessStatus.SUCCESS:
        return { text: 'Su archivo se encuentra listo para subir a Andreani', color: 'text-green-400', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' };
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
          
          {processingInfo && (
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-600">
              <h4 className="text-green-400 font-semibold text-sm mb-2">📊 Resumen de Procesamiento</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-700/50 p-2 rounded">
                  <div className="text-gray-400">Filas con datos en archivo:</div>
                  <div className="text-white font-semibold">{processingInfo.totalRowsWithData || processingInfo.totalOrders}</div>
                </div>
                <div className="bg-blue-700/20 p-2 rounded border border-blue-600/30">
                  <div className="text-blue-400">Ventas reales procesadas:</div>
                  <div className="text-blue-300 font-semibold">{processingInfo.actualSalesProcessed || (processingInfo.domiciliosProcessed + processingInfo.sucursalesProcessed)}</div>
                </div>
                <div className="bg-green-700/20 p-2 rounded border border-green-600/30">
                  <div className="text-green-400">Envíos generados a domicilio:</div>
                  <div className="text-green-300 font-semibold">{processingInfo.shipmentsToDomicilio || processingInfo.domiciliosProcessed}</div>
                </div>
                <div className="bg-teal-700/20 p-2 rounded border border-teal-600/30">
                  <div className="text-teal-400">Envíos generados a sucursal:</div>
                  <div className="text-teal-300 font-semibold">{processingInfo.shipmentsToSucursal || processingInfo.sucursalesProcessed}</div>
                </div>
              </div>
              {processingInfo.hasShopifySucursalWarnings && processingInfo.shopifySucursalOrders && processingInfo.shopifySucursalOrders > 0 && (
                <div className="mt-2 p-3 bg-orange-900/30 border-2 border-orange-500/50 rounded-lg text-orange-200 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-orange-400 font-bold text-base">⚠️</span>
                    <div>
                      <strong className="block mb-1">Advertencia importante - Pedidos a Sucursal detectados</strong>
                      <p className="mb-2">
                        Se detectaron <strong>{processingInfo.shopifySucursalOrders}</strong> pedido(s) a sucursal de Shopify. 
                        En Shopify, los clientes ingresan su dirección personal aunque elijan retiro en sucursal.
                      </p>
                      <p className="font-semibold text-orange-300">
                        ⚠️ Por favor, REVISA los pedidos a sucursal antes de enviar. 
                        Las sucursales asignadas pueden estar a 50km o más de la dirección del cliente.
                      </p>
                      <p className="mt-1 text-orange-200/80">
                        La asignación de sucursal se basó en el código postal. Verifica manualmente cada caso.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {processingInfo.noProcessed > 0 && (
                <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-600/30 rounded text-yellow-300 text-xs">
                  {processingInfo.noProcessedReason?.includes('Medio de envío no reconocido') ? (
                    <>
                      ⚠️ {processingInfo.noProcessed} registros no procesados: {processingInfo.noProcessedReason}. Verifica los medios de envío en el archivo original.
                    </>
                  ) : (
                    <>
                      ✅ {processingInfo.noProcessedReason}. Esto es normal cuando un cliente tiene múltiples productos.
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
