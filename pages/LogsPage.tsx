import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import {
  obtenerEstadisticasTodosUsuarios,
  obtenerEstadisticasUsuario,
  obtenerHistorialActividades,
  obtenerTotalUsuariosActivos,
  eliminarLog,
  bloquearLog,
  UserStats,
  UserActivityLog,
} from '../services/logsService';

const LogsPage: React.FC = () => {
  const { userLevel, userId, username } = useAuth();
  const [stats, setStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userHistorial, setUserHistorial] = useState<UserActivityLog[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [totalUsuariosActivos, setTotalUsuariosActivos] = useState<number>(0);
  const [totalPedidosUnicos, setTotalPedidosUnicos] = useState<number>(0);
  const [logAEliminar, setLogAEliminar] = useState<number | null>(null);
  const [logABloquear, setLogABloquear] = useState<{ id: number; bloquear: boolean } | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [bloqueando, setBloqueando] = useState(false);

  // Verificar si el usuario es administrador (solo nivel 999 - Dios)
  const isAdmin = userLevel === 999;

  // Cargar estadísticas (solo para administradores)
  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isAdmin) {
        setError('No tienes permisos para acceder a esta página');
        return;
      }

      // Solo administradores pueden ver todas las estadísticas
      const [statsResult, usuariosResult, logsResult] = await Promise.all([
        obtenerEstadisticasTodosUsuarios(),
        obtenerTotalUsuariosActivos(),
        obtenerHistorialActividades(undefined, 10000, false), // Obtener todos los logs no bloqueados
      ]);

      if (statsResult.error) {
        setError(statsResult.error);
      } else {
        setStats(statsResult.stats);
      }

      if (usuariosResult.error) {
        console.error('Error obteniendo total de usuarios:', usuariosResult.error);
      } else {
        setTotalUsuariosActivos(usuariosResult.total);
      }

      // Calcular total de pedidos únicos desde los logs de archivo_procesado
      if (logsResult.logs && !logsResult.error) {
        let total = 0;
        logsResult.logs.forEach((log) => {
          if (log.activity_type === 'archivo_procesado' && log.metadata) {
            const domicilios = log.metadata.total_registros_domicilio || 0;
            const sucursales = log.metadata.total_registros_sucursal || 0;
            total += domicilios + sucursales;
          }
        });
        setTotalPedidosUnicos(total);
      }
    } catch (err: any) {
      console.error('Error cargando estadísticas:', err);
      setError(err.message || 'Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  // Cargar historial de un usuario específico (o todos si no se especifica)
  const loadUserHistorial = async (userIdToLoad?: string) => {
    try {
      setLoadingHistorial(true);
      const result = await obtenerHistorialActividades(userIdToLoad, 200, true); // Incluir bloqueados para verlos
      if (result.error) {
        console.error('Error cargando historial:', result.error);
      } else {
        setUserHistorial(result.logs);
      }
    } catch (err: any) {
      console.error('Error cargando historial:', err);
    } finally {
      setLoadingHistorial(false);
    }
  };

  // Cargar todos los logs (para vista de administrador)
  const loadTodosLosLogs = async () => {
    try {
      setLoadingHistorial(true);
      const result = await obtenerHistorialActividades(undefined, 500, true); // Todos los logs, incluyendo bloqueados
      if (result.error) {
        console.error('Error cargando todos los logs:', result.error);
      } else {
        setUserHistorial(result.logs);
      }
    } catch (err: any) {
      console.error('Error cargando todos los logs:', err);
    } finally {
      setLoadingHistorial(false);
    }
  };

  // Abrir modal de confirmación para eliminar
  const abrirModalEliminar = (logId: number) => {
    setLogAEliminar(logId);
  };

  // Confirmar eliminación
  const confirmarEliminar = async () => {
    if (!logAEliminar) return;

    try {
      setEliminando(true);
      const resultado = await eliminarLog(logAEliminar);
      if (resultado.success) {
        // Recargar historial
        if (selectedUser) {
          if (selectedUser === 'all') {
            await loadTodosLosLogs();
          } else {
            await loadUserHistorial(selectedUser);
          }
        }
        // Recargar estadísticas
        await loadStats();
        setLogAEliminar(null);
      } else {
        alert(`Error al eliminar log: ${resultado.error}`);
      }
    } catch (error: any) {
      console.error('Error eliminando log:', error);
      alert(`Error al eliminar log: ${error.message}`);
    } finally {
      setEliminando(false);
    }
  };

  // Abrir modal de confirmación para bloquear/desbloquear
  const abrirModalBloquear = (logId: number, bloquear: boolean) => {
    setLogABloquear({ id: logId, bloquear });
  };

  // Confirmar bloqueo/desbloqueo
  const confirmarBloquear = async () => {
    if (!logABloquear) return;

    try {
      setBloqueando(true);
      const resultado = await bloquearLog(logABloquear.id, logABloquear.bloquear);
      if (resultado.success) {
        // Recargar historial
        if (selectedUser) {
          if (selectedUser === 'all') {
            await loadTodosLosLogs();
          } else {
            await loadUserHistorial(selectedUser);
          }
        }
        // Recargar estadísticas
        await loadStats();
        setLogABloquear(null);
      } else {
        alert(`Error al ${logABloquear.bloquear ? 'bloquear' : 'desbloquear'} log: ${resultado.error}`);
      }
    } catch (error: any) {
      console.error(`Error ${logABloquear.bloquear ? 'bloqueando' : 'desbloqueando'} log:`, error);
      alert(`Error al ${logABloquear.bloquear ? 'bloquear' : 'desbloquear'} log: ${error.message}`);
    } finally {
      setBloqueando(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin]);

  // Filtrar estadísticas por término de búsqueda
  const filteredStats = stats.filter((stat) =>
    stat.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Formatear fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-AR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Formatear tipo de actividad
  const formatActivityType = (type: string, metadata?: any) => {
    const seccion = metadata?.seccion || '';
    let seccionLabel = '';
    if (seccion === 'smartship') {
      seccionLabel = ' (SmartShip)';
    } else if (seccion === 'pdf_generator') {
      seccionLabel = ' (PDF Generator)';
    }
    
    const types: Record<string, string> = {
      archivo_procesado: `Archivo Procesado${seccionLabel}`,
      pedido_procesado: `Pedido Procesado${seccionLabel}`,
      sku_rotulo_agregado: `SKU en Rótulo${seccionLabel}`,
    };
    return types[type] || type;
  };

  // Refrescar datos
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    if (selectedUser) {
      await loadUserHistorial(selectedUser);
    }
    setRefreshing(false);
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
            <p className="text-red-400">
              Esta página es solo para administradores. No tienes permisos para acceder.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                📊 Logs de Actividad - Administración
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Estadísticas de uso de todos los usuarios del sistema
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg
                className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>

          {/* Búsqueda */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar por nombre de usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <>
            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Usuarios Activos
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {totalUsuariosActivos}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {filteredStats.length} con actividad registrada
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Total Archivos
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {filteredStats.reduce(
                        (sum, s) => sum + s.total_archivos_procesados,
                        0
                      )}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Total Pedidos
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {totalPedidosUnicos}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-purple-600 dark:text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Total SKU en Rótulos
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {filteredStats.reduce(
                        (sum, s) => sum + s.total_sku_rotulos,
                        0
                      )}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-orange-600 dark:text-orange-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs para cambiar entre vista de resumen y vista de procesos */}
            <div className="mb-4">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setUserHistorial([]);
                    }}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      !selectedUser
                        ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    Resumen por Usuario
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser('all');
                      loadTodosLosLogs();
                    }}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      selectedUser === 'all'
                        ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    Todos los Procesos
                  </button>
                </nav>
              </div>
            </div>

            {/* Vista de resumen por usuario */}
            {!selectedUser && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Archivos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Pedidos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          SKU en Rótulos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Última Actividad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredStats.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                          >
                            No hay estadísticas disponibles
                          </td>
                        </tr>
                      ) : (
                        filteredStats.map((stat) => (
                          <tr
                            key={stat.user_id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {stat.username}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {stat.user_id.substring(0, 8)}...
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {stat.total_archivos_procesados}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {stat.total_pedidos_procesados}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {stat.total_sku_rotulos}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {formatDate(stat.ultima_actividad)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setSelectedUser(stat.user_id);
                                  loadUserHistorial(stat.user_id);
                                }}
                                className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 text-sm font-medium"
                              >
                                Ver Procesos
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Vista de todos los procesos individuales */}
            {selectedUser && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedUser === 'all' 
                      ? 'Todos los Procesos Individuales' 
                      : `Procesos de ${stats.find(s => s.user_id === selectedUser)?.username || 'Usuario'}`}
                  </h2>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setUserHistorial([]);
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  {loadingHistorial ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                    </div>
                  ) : userHistorial.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No hay procesos registrados
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Fecha/Hora
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Usuario
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Archivo
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Detalles
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {userHistorial.map((log) => (
                          <tr
                            key={log.id}
                            className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                              log.bloqueado ? 'opacity-50 bg-gray-100 dark:bg-gray-900' : ''
                            }`}
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {formatDate(log.created_at)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {log.username}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-block px-2 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded">
                                {formatActivityType(log.activity_type, log.metadata)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                              {log.archivo_nombre || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {log.activity_type === 'archivo_procesado' && (
                                <>
                                  {log.metadata?.total_registros_domicilio !== undefined && log.metadata?.total_registros_sucursal !== undefined && (
                                    <div className="font-semibold text-orange-600 dark:text-orange-400">
                                      Pedidos únicos: <strong>{log.metadata.total_registros_domicilio + log.metadata.total_registros_sucursal}</strong>
                                    </div>
                                  )}
                                  {log.metadata?.seccion && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Sección: {log.metadata.seccion === 'smartship' ? 'SmartShip' : 'PDF Generator'}
                                    </div>
                                  )}
                                </>
                              )}
                              {log.activity_type === 'pedido_procesado' && (
                                <>
                                  <div>Procesados: <strong>{log.cantidad}</strong></div>
                                  {log.metadata?.pedidos_unicos && (
                                    <div className="text-xs text-gray-500">Únicos: {log.metadata.pedidos_unicos}</div>
                                  )}
                                </>
                              )}
                              {log.activity_type === 'sku_rotulo_agregado' && (
                                <div>SKU únicos: <strong>{log.cantidad}</strong></div>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {log.bloqueado ? (
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
                                  Bloqueado
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                                  Activo
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => abrirModalBloquear(log.id!, !log.bloqueado)}
                                  className={`text-xs px-2 py-1 rounded transition-colors ${
                                    log.bloqueado
                                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                                      : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800'
                                  }`}
                                  title={log.bloqueado ? 'Desbloquear' : 'Bloquear'}
                                >
                                  {log.bloqueado ? 'Desbloquear' : 'Bloquear'}
                                </button>
                                <button
                                  onClick={() => abrirModalEliminar(log.id!)}
                                  className="text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                                  title="Eliminar"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

          </>
        )}

        {/* Modal de confirmación para eliminar */}
        {logAEliminar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                ¿Eliminar log?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Esta acción no se puede deshacer. El log será eliminado permanentemente.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setLogAEliminar(null)}
                  disabled={eliminando}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEliminar}
                  disabled={eliminando}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {eliminando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación para bloquear/desbloquear */}
        {logABloquear && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {logABloquear.bloquear ? '¿Bloquear log?' : '¿Desbloquear log?'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {logABloquear.bloquear
                  ? 'El log será bloqueado y no se contará en las estadísticas. Puedes desbloquearlo más tarde.'
                  : 'El log será desbloqueado y volverá a contarse en las estadísticas.'}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setLogABloquear(null)}
                  disabled={bloqueando}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarBloquear}
                  disabled={bloqueando}
                  className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                    logABloquear.bloquear
                      ? 'bg-yellow-600 hover:bg-yellow-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {bloqueando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      {logABloquear.bloquear ? 'Bloqueando...' : 'Desbloqueando...'}
                    </>
                  ) : (
                    logABloquear.bloquear ? 'Bloquear' : 'Desbloquear'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LogsPage;

