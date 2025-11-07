import React, { useState, useEffect } from 'react';
import { SucursalSugerencia } from '../types';

interface SugerenciasSucursalModalProps {
  sugerencias: SucursalSugerencia[];
  onCompletar: (sugerenciasActualizadas: SucursalSugerencia[]) => void;
  onCancelar?: () => void;
}

export const SugerenciasSucursalModal: React.FC<SugerenciasSucursalModalProps> = ({
  sugerencias,
  onCompletar,
  onCancelar
}) => {
  const [sugerenciasEstado, setSugerenciasEstado] = useState<SucursalSugerencia[]>(sugerencias);
  const [todasProcesadas, setTodasProcesadas] = useState(false);

  useEffect(() => {
    // Verificar si todas las sugerencias han sido procesadas
    const todasProcesadas = sugerenciasEstado.every(s => 
      s.decision === 'aceptada' || s.decision === 'rechazada'
    );
    setTodasProcesadas(todasProcesadas);
  }, [sugerenciasEstado]);

  const handleAceptar = (index: number) => {
    const nuevasSugerencias = [...sugerenciasEstado];
    nuevasSugerencias[index].decision = 'aceptada';
    setSugerenciasEstado(nuevasSugerencias);
  };

  const handleRechazar = (index: number) => {
    const nuevasSugerencias = [...sugerenciasEstado];
    nuevasSugerencias[index].decision = 'rechazada';
    setSugerenciasEstado(nuevasSugerencias);
  };

  const handleFinalizar = () => {
    if (todasProcesadas) {
      onCompletar(sugerenciasEstado);
    }
  };

  const aceptadas = sugerenciasEstado.filter(s => s.decision === 'aceptada').length;
  const rechazadas = sugerenciasEstado.filter(s => s.decision === 'rechazada').length;
  const pendientes = sugerenciasEstado.filter(s => s.decision === 'pendiente').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4 border-b border-orange-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">💡</div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Sugerencias de Sucursales
                </h2>
                <p className="text-orange-100 text-sm mt-1">
                  {sugerenciasEstado.length} pedido(s) sin coincidencias exactas encontradas
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-gray-700/50 px-6 py-3 border-b border-gray-600">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-300">
                <span className="font-semibold text-yellow-400">{pendientes}</span> Pendientes
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-300">
                <span className="font-semibold text-green-400">{aceptadas}</span> Aceptadas
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-300">
                <span className="font-semibold text-red-400">{rechazadas}</span> Rechazadas
              </span>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {sugerenciasEstado.map((sugerencia, index) => (
              <div
                key={index}
                className={`bg-gray-700/50 rounded-lg p-4 border-2 transition-all ${
                  sugerencia.decision === 'aceptada'
                    ? 'border-green-500 bg-green-900/20'
                    : sugerencia.decision === 'rechazada'
                    ? 'border-red-500 bg-red-900/20'
                    : 'border-yellow-500 bg-yellow-900/10'
                }`}
              >
                {/* Header de la sugerencia */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-bold text-white text-lg">
                        Pedido #{sugerencia.numeroOrden}
                      </span>
                      {sugerencia.decision === 'aceptada' && (
                        <span className="px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded">
                          ✅ ACEPTADA
                        </span>
                      )}
                      {sugerencia.decision === 'rechazada' && (
                        <span className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded">
                          ❌ RECHAZADA
                        </span>
                      )}
                      {sugerencia.decision === 'pendiente' && (
                        <span className="px-2 py-1 bg-yellow-600 text-white text-xs font-semibold rounded">
                          ⏳ PENDIENTE
                        </span>
                      )}
                    </div>
                    {sugerencia.score && (
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-400">Confianza:</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 h-2 bg-gray-600 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                sugerencia.score >= 70
                                  ? 'bg-green-500'
                                  : sugerencia.score >= 50
                                  ? 'bg-yellow-500'
                                  : 'bg-orange-500'
                              }`}
                              style={{ width: `${sugerencia.score}%` }}
                            ></div>
                          </div>
                          <span className="text-white font-semibold">{sugerencia.score}/100</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información del pedido */}
                <div className="bg-gray-800/50 rounded p-3 mb-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Dirección:</span>
                      <span className="text-white ml-2 font-medium">
                        {sugerencia.direccionPedido}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Número:</span>
                      <span className="text-white ml-2 font-medium">{sugerencia.numero}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Localidad:</span>
                      <span className="text-white ml-2 font-medium">
                        {sugerencia.localidad || sugerencia.ciudad}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Provincia:</span>
                      <span className="text-white ml-2 font-medium">{sugerencia.provincia}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Código Postal:</span>
                      <span className="text-white ml-2 font-medium">{sugerencia.codigoPostal}</span>
                    </div>
                  </div>
                </div>

                {/* Sucursal sugerida */}
                <div className="bg-blue-900/20 border border-blue-700 rounded p-3 mb-3">
                  <div className="text-sm">
                    <div className="text-blue-300 font-semibold mb-1">
                      💡 Sucursal Sugerida:
                    </div>
                    <div className="text-white font-medium text-base">
                      {sugerencia.sucursalSugerida.nombre_sucursal}
                    </div>
                    <div className="text-blue-200 text-xs mt-1">
                      {sugerencia.sucursalSugerida.direccion}
                    </div>
                    {sugerencia.razon && (
                      <div className="text-blue-300 text-xs mt-2 italic">
                        Razón: {sugerencia.razon}
                      </div>
                    )}
                  </div>
                </div>

                {/* Botones de acción */}
                {sugerencia.decision === 'pendiente' && (
                  <div className="flex space-x-3 mt-3">
                    <button
                      onClick={() => handleAceptar(index)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>✅</span>
                      <span>Aceptar Sugerencia</span>
                    </button>
                    <button
                      onClick={() => handleRechazar(index)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>❌</span>
                      <span>Rechazar y Excluir</span>
                    </button>
                  </div>
                )}

                {sugerencia.decision === 'aceptada' && (
                  <div className="mt-3 p-2 bg-green-900/30 rounded text-center">
                    <span className="text-green-300 text-sm font-semibold">
                      ✅ Este pedido se incluirá en el archivo final con la sucursal sugerida
                    </span>
                  </div>
                )}

                {sugerencia.decision === 'rechazada' && (
                  <div className="mt-3 p-2 bg-red-900/30 rounded text-center">
                    <span className="text-red-300 text-sm font-semibold">
                      ❌ Este pedido será excluido del archivo final. Debe procesarse manualmente.
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-700/50 px-6 py-4 border-t border-gray-600">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="text-sm text-gray-300">
              {todasProcesadas ? (
                <span className="text-green-400 font-semibold">
                  ✅ Todas las sugerencias han sido procesadas
                </span>
              ) : (
                <span className="text-yellow-400 font-semibold">
                  ⏳ Quedan {pendientes} sugerencia(s) pendiente(s)
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              {onCancelar && (
                <button
                  onClick={onCancelar}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={handleFinalizar}
                disabled={!todasProcesadas}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-900/50 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                Finalizar y Continuar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
