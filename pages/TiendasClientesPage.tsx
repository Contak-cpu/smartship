import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { TiendaCliente, TiendaClienteInput } from '../types';
import {
  obtenerTiendasClientes,
  crearTiendaCliente,
  actualizarTiendaCliente,
  eliminarTiendaCliente,
  isProPlusUser,
} from '../services/tiendasClientesService';
import LockedOverlay from '../components/common/LockedOverlay';

const TiendasClientesPage: React.FC = () => {
  const navigate = useNavigate();
  const { username, userId, userLevel } = useAuth();
  const [tiendas, setTiendas] = useState<TiendaCliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTienda, setEditingTienda] = useState<TiendaCliente | null>(null);
  const [formData, setFormData] = useState<TiendaClienteInput>({
    nombre_tienda: '',
    descripcion: '',
    activa: true,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canAccess = isProPlusUser(userLevel, username);

  useEffect(() => {
    if (userId && canAccess) {
      cargarTiendas();
    }
  }, [userId, canAccess]);

  const cargarTiendas = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const data = await obtenerTiendasClientes(userId);
      setTiendas(data);
    } catch (error) {
      console.error('Error cargando tiendas:', error);
      showMessage('error', 'No se pudo cargar las tiendas');
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleOpenModal = (tienda?: TiendaCliente) => {
    if (tienda) {
      setEditingTienda(tienda);
      setFormData({
        nombre_tienda: tienda.nombre_tienda,
        descripcion: tienda.descripcion || '',
        activa: tienda.activa,
      });
    } else {
      setEditingTienda(null);
      setFormData({
        nombre_tienda: '',
        descripcion: '',
        activa: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTienda(null);
    setFormData({
      nombre_tienda: '',
      descripcion: '',
      activa: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !username) {
      showMessage('error', 'Usuario no identificado');
      return;
    }

    if (!formData.nombre_tienda.trim()) {
      showMessage('error', 'El nombre de la tienda es requerido');
      return;
    }

    try {
      if (editingTienda) {
        await actualizarTiendaCliente(editingTienda.id, formData);
        showMessage('success', 'Tienda actualizada correctamente');
      } else {
        await crearTiendaCliente(userId, username, formData);
        showMessage('success', 'Tienda creada correctamente');
      }
      cargarTiendas();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error guardando tienda:', error);
      const errorMessage = error?.message || 'No se pudo guardar la tienda';
      showMessage('error', errorMessage.includes('duplicate') || errorMessage.includes('unique') 
        ? 'Ya existe una tienda con ese nombre' 
        : errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta tienda? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await eliminarTiendaCliente(id);
      showMessage('success', 'Tienda eliminada correctamente');
      cargarTiendas();
    } catch (error) {
      console.error('Error eliminando tienda:', error);
      showMessage('error', 'No se pudo eliminar la tienda');
    }
  };

  const handleToggleActiva = async (tienda: TiendaCliente) => {
    try {
      await actualizarTiendaCliente(tienda.id, {
        ...tienda,
        activa: !tienda.activa,
      });
      showMessage('success', `Tienda ${!tienda.activa ? 'activada' : 'desactivada'} correctamente`);
      cargarTiendas();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      showMessage('error', 'No se pudo actualizar el estado de la tienda');
    }
  };

  if (!canAccess) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <LockedOverlay requiredLevel={4} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="text-purple-500">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                    Tiendas de Clientes
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                    Configura las tiendas de clientes para descontar stock desde PDFs de Andreani
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva Tienda
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

          {/* Lista de tiendas */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-gray-200 dark:border-gray-700/50 overflow-hidden">
              {tiendas.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-gray-500 dark:text-gray-500 mb-4">
                    <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    No hay tiendas configuradas
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mb-4">
                    Crea tu primera tienda de cliente para comenzar
                  </p>
                  <button
                    onClick={() => handleOpenModal()}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Crear Primera Tienda
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">Nombre</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">Descripción</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">Estado</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">Creada</th>
                        <th className="text-right py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tiendas.map((tienda) => (
                        <tr
                          key={tienda.id}
                          className="border-b border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <span className="text-purple-600 dark:text-purple-400 font-bold">{tienda.nombre_tienda}</span>
                          </td>
                          <td className="py-4 px-6 text-gray-900 dark:text-white">
                            {tienda.descripcion || '-'}
                          </td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() => handleToggleActiva(tienda)}
                              className={`inline-block px-3 py-1 rounded-full text-sm font-bold border-2 ${
                                tienda.activa
                                  ? 'bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-300 dark:border-green-500/30'
                                  : 'bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-500/30'
                              }`}
                            >
                              {tienda.activa ? 'Activa' : 'Inactiva'}
                            </button>
                          </td>
                          <td className="py-4 px-6 text-gray-600 dark:text-gray-400 text-sm">
                            {new Date(tienda.created_at).toLocaleDateString('es-ES')}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => navigate(`/tiendas-clientes/${tienda.id}/stock`)}
                                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-purple-600 dark:text-purple-400"
                                title="Ver Stock"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleOpenModal(tienda)}
                                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-blue-600 dark:text-blue-400"
                                title="Editar"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(tienda.id)}
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
                  {editingTienda ? 'Editar Tienda' : 'Nueva Tienda'}
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
                    Nombre de la Tienda *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre_tienda}
                    onChange={(e) => setFormData({ ...formData, nombre_tienda: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                    placeholder="Ej: Tienda Principal"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                    placeholder="Descripción opcional de la tienda"
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="activa"
                    checked={formData.activa}
                    onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="activa" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tienda activa
                  </label>
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
                    className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                  >
                    {editingTienda ? 'Actualizar' : 'Crear'}
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

export default TiendasClientesPage;

