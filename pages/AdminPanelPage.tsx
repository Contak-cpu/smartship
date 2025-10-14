import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import UserModal from '../components/admin/UserModal';
import { 
  getAllUsers, 
  updateUserLevel, 
  updateUserProfile, 
  deleteUser,
  resetUserPassword,
  getUserStats,
  UserAdmin 
} from '../services/adminService';

// Niveles disponibles
const NIVELES = [
  { value: 0, label: 'Invitado', color: 'gray' },
  { value: 1, label: 'Starter', color: 'blue' },
  { value: 2, label: 'Básico', color: 'green' },
  { value: 3, label: 'Intermedio', color: 'yellow' },
  { value: 4, label: 'Pro', color: 'purple' },
  { value: 999, label: 'Dios', color: 'red' },
];

const AdminPanelPage = () => {
  const { userLevel, username } = useAuth();
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAdmin | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Verificar que el usuario es nivel Dios
  const isDios = userLevel === 999;

  // Cargar usuarios y estadísticas
  const loadData = async () => {
    try {
      setRefreshing(true);
      const [usersResult, statsResult] = await Promise.all([
        getAllUsers(),
        getUserStats(),
      ]);

      if (usersResult.data) {
        setUsers(usersResult.data);
      }

      if (!statsResult.error) {
        setStats(statsResult);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isDios) {
      loadData();
    }
  }, [isDios]);

  // Filtrar usuarios por término de búsqueda
  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Formatear fecha
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Obtener color del nivel
  const getNivelColor = (nivel: number) => {
    const nivelInfo = NIVELES.find(n => n.value === nivel);
    return nivelInfo?.color || 'gray';
  };

  // Obtener label del nivel
  const getNivelLabel = (nivel: number) => {
    const nivelInfo = NIVELES.find(n => n.value === nivel);
    return nivelInfo?.label || 'Desconocido';
  };

  // Manejar cambio de nivel
  const handleChangeLevel = async (userId: string, newLevel: number) => {
    if (!confirm(`¿Estás seguro de cambiar el nivel del usuario?`)) {
      return;
    }

    const result = await updateUserLevel(userId, newLevel);
    
    if (result.success) {
      alert('Nivel actualizado exitosamente');
      loadData();
    } else {
      alert(`Error al actualizar nivel: ${result.error?.message || 'Desconocido'}`);
    }
  };

  // Manejar reseteo de contraseña
  const handleResetPassword = async (email: string) => {
    if (!confirm(`¿Enviar email de reseteo de contraseña a ${email}?`)) {
      return;
    }

    const result = await resetUserPassword(email);
    
    if (result.success) {
      alert('Email de reseteo enviado exitosamente');
    } else {
      alert(`Error al enviar email: ${result.error?.message || 'Desconocido'}`);
    }
  };

  // Manejar eliminación de usuario
  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`⚠️ ¿ESTÁS SEGURO de eliminar al usuario "${username}"?\n\nEsta acción NO se puede deshacer.`)) {
      return;
    }

    const result = await deleteUser(userId);
    
    if (result.success) {
      alert('Usuario eliminado exitosamente');
      loadData();
    } else {
      alert(`Error al eliminar usuario: ${result.error?.message || 'Desconocido'}`);
    }
  };

  // Si no es usuario Dios, mostrar mensaje de acceso denegado
  if (!isDios) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center border-2 border-red-500">
            <div className="text-red-500 mb-4">
              <svg className="w-20 h-20 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h1>
            <p className="text-gray-400 mb-4">
              Solo usuarios con nivel <span className="text-red-400 font-bold">Dios (999)</span> pueden acceder al panel de administración.
            </p>
            <p className="text-sm text-gray-500">
              Tu nivel actual: <span className="text-blue-400 font-bold">{getNivelLabel(userLevel)} ({userLevel})</span>
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando panel de administración...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-950 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-900/50 to-purple-900/50 rounded-2xl p-6 border-2 border-red-500/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-red-500 p-3 rounded-xl">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Panel de Administración Dios</h1>
                    <p className="text-red-300">Bienvenido, {username}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => loadData()}
                disabled={refreshing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors font-semibold flex items-center gap-2"
              >
                <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Total Usuarios</p>
                    <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                  </div>
                  <div className="bg-blue-500/20 p-3 rounded-lg">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Usuarios Recientes (30d)</p>
                    <p className="text-3xl font-bold text-white">{stats.recentUsers}</p>
                  </div>
                  <div className="bg-green-500/20 p-3 rounded-lg">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Usuarios Dios</p>
                    <p className="text-3xl font-bold text-white">{stats.usersByLevel[999] || 0}</p>
                  </div>
                  <div className="bg-red-500/20 p-3 rounded-lg">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Controles */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1 w-full sm:w-auto">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-3 pl-10 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold flex items-center gap-2 whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear Usuario
              </button>
            </div>
          </div>

          {/* Tabla de usuarios */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Nivel</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Último Acceso</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Creado</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                        No se encontraron usuarios
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-600 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold">
                              {user.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span className="text-white font-medium">{user.username || 'Sin nombre'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-gray-300">{user.email}</span>
                            {user.email_confirmed_at ? (
                              <span className="text-xs text-green-400 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Verificado
                              </span>
                            ) : (
                              <span className="text-xs text-yellow-400">Sin verificar</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={user.nivel}
                            onChange={(e) => handleChangeLevel(user.id, parseInt(e.target.value))}
                            className="bg-gray-700 text-white border border-gray-500 px-3 py-2 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-600 transition-colors cursor-pointer"
                          >
                            {NIVELES.map((nivel) => (
                              <option key={nivel.value} value={nivel.value} className="bg-gray-800 text-white">
                                {nivel.label} ({nivel.value})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          {formatDate(user.last_sign_in_at)}
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleResetPassword(user.email)}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-lg transition-colors"
                              title="Resetear contraseña"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setEditingUser(user)}
                              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                              title="Editar usuario"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                              title="Eliminar usuario"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm">
            <p>Panel de Administración - Solo accesible para usuarios nivel Dios</p>
            <p className="mt-1 text-gray-600">by pictoN</p>
          </div>
        </div>
      </div>

      {/* Modal de crear/editar usuario */}
      {(showCreateModal || editingUser) && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowCreateModal(false);
            setEditingUser(null);
          }}
          onSuccess={() => {
            loadData();
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default AdminPanelPage;

