import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import {
  obtenerEstadisticasUsuario,
  obtenerPedidosUsuario,
  obtenerStockPorSKU,
  obtenerClientesRecurrentes,
  EstadisticasUsuario,
  PedidoProcesado
} from '../services/informacionService';

const InformacionPage: React.FC = () => {
  const { username, userId } = useAuth();
  const [estadisticas, setEstadisticas] = useState<EstadisticasUsuario | null>(null);
  const [pedidos, setPedidos] = useState<PedidoProcesado[]>([]);
  const [stockPorSKU, setStockPorSKU] = useState<any[]>([]);
  const [clientesRecurrentes, setClientesRecurrentes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resumen' | 'pedidos' | 'stock' | 'clientes'>('resumen');

  useEffect(() => {
    if (userId) {
      cargarDatos();
    }
  }, [userId]);

  const cargarDatos = async () => {
    if (!userId) {
      console.log('userId no disponible aún');
      return;
    }
    
    setIsLoading(true);
    try {
      const [stats, pedidosData, stockData, clientesData] = await Promise.all([
        obtenerEstadisticasUsuario(userId),
        obtenerPedidosUsuario(userId, 100),
        obtenerStockPorSKU(userId),
        obtenerClientesRecurrentes(userId)
      ]);

      setEstadisticas(stats);
      setPedidos(pedidosData);
      setStockPorSKU(stockData);
      setClientesRecurrentes(clientesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="text-blue-500">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white">
                    Información
                  </h1>
                  <p className="text-gray-400 text-sm sm:text-base">
                    Estadísticas y análisis de tu operación
                  </p>
                </div>
              </div>
              <button
                onClick={cargarDatos}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualizar
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Estadísticas Generales */}
              {estadisticas && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {/* Total Pedidos */}
                  <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-2xl p-6 border border-blue-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-blue-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Total Pedidos</h3>
                    <p className="text-3xl font-bold text-white">{formatNumber(estadisticas.total_pedidos)}</p>
                    <p className="text-xs text-gray-500 mt-2">Pedidos únicos procesados</p>
                  </div>

                  {/* Clientes Únicos */}
                  <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-2xl p-6 border border-green-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-green-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Clientes Únicos</h3>
                    <p className="text-3xl font-bold text-white">{formatNumber(estadisticas.clientes_unicos)}</p>
                    <p className="text-xs text-gray-500 mt-2">Total de clientes diferentes</p>
                  </div>

                  {/* SKUs Diferentes */}
                  <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-2xl p-6 border border-purple-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-purple-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-gray-400 text-sm font-medium mb-1">SKUs Diferentes</h3>
                    <p className="text-3xl font-bold text-white">{formatNumber(estadisticas.skus_diferentes)}</p>
                    <p className="text-xs text-gray-500 mt-2">Productos despachados</p>
                  </div>

                  {/* Stock Despachado */}
                  <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 rounded-2xl p-6 border border-orange-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-orange-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Stock Despachado</h3>
                    <p className="text-3xl font-bold text-white">{formatNumber(estadisticas.stock_total_despachado)}</p>
                    <p className="text-xs text-gray-500 mt-2">Unidades totales</p>
                  </div>
                </div>
              )}

              {/* Distribución Domicilio vs Sucursal */}
              {estadisticas && (estadisticas.pedidos_domicilio > 0 || estadisticas.pedidos_sucursal > 0) && (
                <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 mb-8">
                  <h3 className="text-xl font-bold text-white mb-4">Distribución de Envíos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">A Domicilio</span>
                        <span className="text-blue-400 font-bold">{formatNumber(estadisticas.pedidos_domicilio)}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(estadisticas.pedidos_domicilio / estadisticas.total_pedidos) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {((estadisticas.pedidos_domicilio / estadisticas.total_pedidos) * 100).toFixed(1)}% del total
                      </p>
                    </div>

                    <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">A Sucursal</span>
                        <span className="text-green-400 font-bold">{formatNumber(estadisticas.pedidos_sucursal)}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(estadisticas.pedidos_sucursal / estadisticas.total_pedidos) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {((estadisticas.pedidos_sucursal / estadisticas.total_pedidos) * 100).toFixed(1)}% del total
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
                <div className="flex border-b border-gray-700/50 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('resumen')}
                    className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 whitespace-nowrap ${
                      activeTab === 'resumen'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    📊 Resumen
                  </button>
                  <button
                    onClick={() => setActiveTab('pedidos')}
                    className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 whitespace-nowrap ${
                      activeTab === 'pedidos'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    📦 Pedidos ({pedidos.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('stock')}
                    className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 whitespace-nowrap ${
                      activeTab === 'stock'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    📦 Stock ({stockPorSKU.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('clientes')}
                    className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 whitespace-nowrap ${
                      activeTab === 'clientes'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    👥 Clientes ({clientesRecurrentes.length})
                  </button>
                </div>

                <div className="p-6">
                  {/* Tab: Resumen */}
                  {activeTab === 'resumen' && (
                    <div className="space-y-6">
                      <div className="text-center py-12">
                        <div className="text-blue-500 mb-4">
                          <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                          Sistema de Información Activo
                        </h3>
                        <p className="text-gray-400 text-lg mb-6">
                          Tus datos están siendo rastreados y analizados automáticamente
                        </p>
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 max-w-2xl mx-auto text-left">
                          <h4 className="text-white font-bold mb-3">📋 ¿Cómo funciona?</h4>
                          <ul className="text-gray-300 space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400">1.</span>
                              <span>Cada vez que procesas un archivo en SmartShip, los pedidos se registran automáticamente</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400">2.</span>
                              <span>El sistema detecta duplicados por número de pedido y email del cliente</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400">3.</span>
                              <span>Cuando generas rótulos PDF con SKU, el stock despachado se registra</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400">4.</span>
                              <span>Puedes ver estadísticas y análisis en tiempo real aquí</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab: Pedidos */}
                  {activeTab === 'pedidos' && (
                    <div className="space-y-4">
                      {pedidos.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-gray-500 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-400 mb-2">
                            No hay pedidos registrados
                          </h3>
                          <p className="text-gray-500 text-sm">
                            Los pedidos procesados en SmartShip aparecerán aquí
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-400 text-sm mb-4">
                            Mostrando los últimos {pedidos.length} pedidos
                          </p>
                          {pedidos.map((pedido) => (
                            <div
                              key={pedido.id}
                              className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-blue-500/50 transition-all"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-blue-400 font-bold">#{pedido.numeroPedido}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                      pedido.tipoEnvio === 'domicilio'
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    }`}>
                                      {pedido.tipoEnvio === 'domicilio' ? '🏠 Domicilio' : '🏢 Sucursal'}
                                    </span>
                                  </div>
                                  <p className="text-white font-medium">{pedido.nombreCliente} {pedido.apellidoCliente}</p>
                                  <p className="text-gray-400 text-sm">{pedido.emailCliente}</p>
                                  {pedido.direccion && (
                                    <p className="text-gray-500 text-xs mt-1">{pedido.direccion}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-gray-400 text-sm">{pedido.fechaProcesamiento}</p>
                                  <p className="text-gray-500 text-xs mt-1">{pedido.archivoOrigen}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}

                  {/* Tab: Stock */}
                  {activeTab === 'stock' && (
                    <div className="space-y-4">
                      {stockPorSKU.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-gray-500 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-400 mb-2">
                            No hay stock registrado
                          </h3>
                          <p className="text-gray-500 text-sm">
                            El stock despachado de los rótulos PDF aparecerá aquí
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-400 text-sm mb-4">
                            Stock despachado por SKU
                          </p>
                          {stockPorSKU.map((item, index) => (
                            <div
                              key={index}
                              className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-purple-500/50 transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-purple-400 font-bold">{item.sku}</span>
                                    <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-xs font-bold border border-purple-500/30">
                                      {formatNumber(item.cantidad_total_despachada)} unidades
                                    </span>
                                  </div>
                                  <p className="text-white">{item.nombreProducto || 'Sin nombre'}</p>
                                  <p className="text-gray-500 text-xs mt-1">
                                    {item.pedidos_con_este_sku} pedido(s) • Último: {item.ultimo_despacho}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}

                  {/* Tab: Clientes */}
                  {activeTab === 'clientes' && (
                    <div className="space-y-4">
                      {clientesRecurrentes.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-gray-500 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-400 mb-2">
                            No hay clientes recurrentes
                          </h3>
                          <p className="text-gray-500 text-sm">
                            Los clientes que compraron más de una vez aparecerán aquí
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-400 text-sm mb-4">
                            Clientes que compraron más de una vez ({clientesRecurrentes.length})
                          </p>
                          {clientesRecurrentes.map((cliente, index) => (
                            <div
                              key={index}
                              className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-green-500/50 transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-white font-medium">{cliente.nombre} {cliente.apellido}</p>
                                  <p className="text-gray-400 text-sm">{cliente.email}</p>
                                </div>
                                <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg border border-green-500/30">
                                  <p className="text-2xl font-bold">{cliente.count}</p>
                                  <p className="text-xs">compras</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InformacionPage;

