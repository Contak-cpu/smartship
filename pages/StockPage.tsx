import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { Stock, StockInput } from '../types';
import {
  obtenerStock,
  guardarStock,
  eliminarStock,
} from '../services/stockService';

const StockPage: React.FC = () => {
  const { username, userId } = useAuth();
  const [stock, setStock] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [formData, setFormData] = useState<StockInput>({
    sku: '',
    nombreproducto: '',
    cantidad: 0,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (userId) {
      cargarStock();
    }
  }, [userId]);

  const cargarStock = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const data = await obtenerStock(userId);
      setStock(data);
    } catch (error) {
      console.error('Error cargando stock:', error);
      showMessage('error', 'No se pudo cargar el stock');
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleOpenModal = (item?: Stock) => {
    if (item) {
      setEditingStock(item);
      setFormData({
        sku: item.sku,
        nombreproducto: item.nombreproducto || '',
        cantidad: item.cantidad,
      });
    } else {
      setEditingStock(null);
      setFormData({
        sku: '',
        nombreproducto: '',
        cantidad: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStock(null);
    setFormData({
      sku: '',
      nombreproducto: '',
      cantidad: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !username) {
      showMessage('error', 'Usuario no identificado');
      return;
    }

    if (!formData.sku || formData.cantidad < 0) {
      showMessage('error', 'Completa todos los campos requeridos');
      return;
    }

    try {
      await guardarStock(userId, username, formData);
      showMessage('success', editingStock ? 'Stock actualizado' : 'Producto agregado al stock');
      cargarStock();
      handleCloseModal();
    } catch (error) {
      console.error('Error guardando stock:', error);
      showMessage('error', 'No se pudo guardar el stock');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto del stock?')) {
      return;
    }

    try {
      await eliminarStock(id);
      showMessage('success', 'Producto eliminado del stock');
      cargarStock();
    } catch (error) {
      console.error('Error eliminando stock:', error);
      showMessage('error', 'No se pudo eliminar el producto');
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  const stockTotal = stock.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="text-orange-500">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                    Gestión de Stock
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                    Administra tu inventario
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar Producto
              </button>
            </div>
          </div>

          {/* Mensaje de estado */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg border-2 ${
              message.type === 'success' ? 'bg-green-50 dark:bg-green-900/50 border-green-300 dark:border-green-500' : 'bg-red-50 dark:bg-red-900/50 border-red-300 dark:border-red-500'
            }`}>
              <p className={`font-medium ${
                message.type === 'success' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              }`}>
                {message.text}
              </p>
            </div>
          )}

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/50 dark:to-orange-800/30 rounded-2xl p-6 border-2 border-orange-200 dark:border-orange-500/30">
              <div className="flex items-center justify-between mb-4">
                <div className="text-orange-500 dark:text-orange-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Total SKUs</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatNumber(stock.length)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Productos únicos</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-800/30 rounded-2xl p-6 border-2 border-green-200 dark:border-green-500/30">
              <div className="flex items-center justify-between mb-4">
                <div className="text-green-500 dark:text-green-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Stock Total</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatNumber(stockTotal)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Unidades en inventario</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/30 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-500/30">
              <div className="flex items-center justify-between mb-4">
                <div className="text-blue-500 dark:text-blue-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Promedio</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stock.length > 0 ? formatNumber(Math.round(stockTotal / stock.length)) : 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Unidades por SKU</p>
            </div>
          </div>

          {/* Lista de stock */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-gray-200 dark:border-gray-700/50 overflow-hidden">
              {stock.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-gray-500 dark:text-gray-500 mb-4">
                    <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    No hay productos en stock
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mb-4">
                    Comienza agregando productos a tu inventario
                  </p>
                  <button
                    onClick={() => handleOpenModal()}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar Primer Producto
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">SKU</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">Producto</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">Cantidad</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">Última Actualización</th>
                        <th className="text-right py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stock.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <span className="text-orange-600 dark:text-orange-400 font-bold">{item.sku}</span>
                          </td>
                          <td className="py-4 px-6 text-gray-900 dark:text-white">
                            {item.nombreproducto || '-'}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border-2 ${
                              item.cantidad > 10
                                ? 'bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-300 dark:border-green-500/30'
                                : item.cantidad > 5
                                ? 'bg-yellow-50 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-500/30'
                                : 'bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30'
                            }`}>
                              {formatNumber(item.cantidad)} unidades
                            </span>
                          </td>
                          <td className="py-4 px-6 text-gray-600 dark:text-gray-400 text-sm">
                            {new Date(item.fecha_actualizacion).toLocaleDateString('es-ES')}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenModal(item)}
                                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-blue-600 dark:text-blue-400"
                                title="Editar"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-red-600 dark:text-red-400"
                                title="Eliminar"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de agregar/editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full border-2 border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingStock ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SKU *
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                    placeholder="Ej: SKU-001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre del Producto
                  </label>
                  <input
                    type="text"
                    value={formData.nombreproducto}
                    onChange={(e) => setFormData({ ...formData, nombreproducto: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                    placeholder="Nombre descriptivo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium"
                  >
                    {editingStock ? 'Actualizar' : 'Agregar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StockPage;


