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

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    if (score >= 30) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    if (score >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-gray-700/50">
        {/* Header moderno */}
        <div className="bg-gray-700 px-6 py-5 border-b border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 p-3 rounded-xl">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  Sugerencias de Sucursales
                </h2>
                <p className="text-gray-300 text-sm mt-1 font-medium">
                  {sugerenciasEstado.length} pedido(s) requieren tu revisión
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar mejorado */}
        <div className="bg-gray-800/80 backdrop-blur-sm px-6 py-4 border-b border-gray-700/50">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center space-x-3 bg-yellow-500/10 px-4 py-2 rounded-lg border border-yellow-500/30">
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-gray-200">
                <span className="font-bold text-yellow-400 text-lg">{pendientes}</span>
                <span className="text-gray-400 ml-1">Pendientes</span>
              </span>
            </div>
            <div className="flex items-center space-x-3 bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/30">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-gray-200">
                <span className="font-bold text-green-400 text-lg">{aceptadas}</span>
                <span className="text-gray-400 ml-1">Aceptadas</span>
              </span>
            </div>
            <div className="flex items-center space-x-3 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/30">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span className="text-gray-200">
                <span className="font-bold text-red-400 text-lg">{rechazadas}</span>
                <span className="text-gray-400 ml-1">Rechazadas</span>
              </span>
            </div>
          </div>
        </div>

        {/* Content - Scrollable con mejor diseño */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-900/50 to-gray-800/50">
          <div className="space-y-5">
            {sugerenciasEstado.map((sugerencia, index) => (
              <div
                key={index}
                className={`bg-gradient-to-br ${
                  sugerencia.decision === 'aceptada'
                    ? 'from-green-900/30 to-green-800/20 border-green-500/50'
                    : sugerencia.decision === 'rechazada'
                    ? 'from-red-900/30 to-red-800/20 border-red-500/50'
                    : 'from-gray-700/50 to-gray-800/30 border-yellow-500/50'
                } rounded-xl p-5 border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.01]`}
              >
                {/* Header de la sugerencia mejorado */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="bg-indigo-500/20 px-3 py-1 rounded-lg border border-indigo-500/30">
                        <span className="font-bold text-white text-lg">
                          Pedido {sugerencia.numeroOrden}
                        </span>
                      </div>
                      {sugerencia.decision === 'aceptada' && (
                        <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs font-bold rounded-lg border border-green-500/50 flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>ACEPTADA</span>
                        </span>
                      )}
                      {sugerencia.decision === 'rechazada' && (
                        <span className="px-3 py-1 bg-red-500/20 text-red-300 text-xs font-bold rounded-lg border border-red-500/50 flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span>RECHAZADA</span>
                        </span>
                      )}
                      {sugerencia.decision === 'pendiente' && (
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-bold rounded-lg border border-yellow-500/50 flex items-center space-x-1 animate-pulse">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span>PENDIENTE</span>
                        </span>
                      )}
                    </div>
                    {sugerencia.score && (
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-400 text-sm font-medium">Nivel de confianza:</span>
                        <div className="flex items-center space-x-2 flex-1 max-w-xs">
                          <div className="flex-1 h-2.5 bg-gray-700 rounded-full overflow-hidden shadow-inner">
                            <div
                              className={`h-full ${getScoreBgColor(sugerencia.score)} transition-all duration-500`}
                              style={{ width: `${sugerencia.score}%` }}
                            ></div>
                          </div>
                          <span className={`font-bold text-sm ${getScoreColor(sugerencia.score)} min-w-[3rem] text-right`}>
                            {sugerencia.score}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información del pedido con mejor diseño */}
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 mb-4 border border-gray-700/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <span className="text-gray-400 text-xs uppercase tracking-wide">Dirección</span>
                        <p className="text-white font-medium mt-0.5">{sugerencia.direccionPedido}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <div>
                        <span className="text-gray-400 text-xs uppercase tracking-wide">Número</span>
                        <p className="text-white font-medium mt-0.5">{sugerencia.numero || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <div>
                        <span className="text-gray-400 text-xs uppercase tracking-wide">Localidad</span>
                        <p className="text-white font-medium mt-0.5">{sugerencia.localidad || sugerencia.ciudad || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <span className="text-gray-400 text-xs uppercase tracking-wide">Provincia</span>
                        <p className="text-white font-medium mt-0.5">{sugerencia.provincia}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <span className="text-gray-400 text-xs uppercase tracking-wide">Código Postal</span>
                        <p className="text-white font-medium mt-0.5">{sugerencia.codigoPostal || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sucursal sugerida con mejor diseño */}
                <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/50 rounded-lg p-4 mb-4 backdrop-blur-sm">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                      <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-blue-300 font-semibold mb-2 text-sm uppercase tracking-wide">
                        Sucursal Sugerida
                      </div>
                      <div className="text-white font-bold text-lg mb-1">
                        {sugerencia.sucursalSugerida.nombre_sucursal}
                      </div>
                      <div className="text-blue-200 text-sm mt-1">
                        {sugerencia.sucursalSugerida.direccion}
                      </div>
                      {sugerencia.razon && (
                        <div className="mt-3 pt-3 border-t border-blue-500/30">
                          <div className="text-blue-300 text-xs font-medium">
                            💡 {sugerencia.razon}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botones de acción mejorados */}
                {sugerencia.decision === 'pendiente' && (
                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={() => handleAceptar(index)}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Aceptar Sugerencia</span>
                    </button>
                    <button
                      onClick={() => handleRechazar(index)}
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>Rechazar y Excluir</span>
                    </button>
                  </div>
                )}

                {sugerencia.decision === 'aceptada' && (
                  <div className="mt-4 p-4 bg-green-900/40 rounded-xl text-center border border-green-500/50">
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-green-300 text-sm font-bold">
                        Este pedido se incluirá en el archivo final con la sucursal sugerida
                      </span>
                    </div>
                  </div>
                )}

                {sugerencia.decision === 'rechazada' && (
                  <div className="mt-4 p-4 bg-red-900/40 rounded-xl text-center border border-red-500/50">
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5 text-red-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-red-300 text-sm font-bold">
                        Este pedido será excluido del archivo final. Debe procesarse manualmente.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer mejorado */}
        <div className="bg-gray-800/90 backdrop-blur-sm px-6 py-5 border-t border-gray-700/50">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="text-sm">
              {todasProcesadas ? (
                <div className="flex items-center space-x-2 text-green-400 font-bold">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Todas las sugerencias han sido procesadas</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-yellow-400 font-bold">
                  <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>Quedan {pendientes} sugerencia(s) pendiente(s)</span>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              {onCancelar && (
                <button
                  onClick={onCancelar}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={handleFinalizar}
                disabled={!todasProcesadas}
                className="px-8 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none flex items-center space-x-2"
              >
                <span>Finalizar y Continuar</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
