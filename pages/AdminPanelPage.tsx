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
  expireUsersAutomatically,
  UserAdmin 
} from '../services/adminService';
import { getLevelFromPlan } from '../services/authService';

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
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [updatingEmpresaPlan, setUpdatingEmpresaPlan] = useState<string | null>(null);
  const [editingCantidadTiendas, setEditingCantidadTiendas] = useState<string | null>(null);
  const [cantidadTiendas, setCantidadTiendas] = useState<string>('');

  // Verificar que el usuario es nivel Dios
  const isDios = userLevel === 999;

  // Cargar usuarios y estadísticas
  const loadData = async () => {
    try {
      setRefreshing(true);
      
      // Primero expirar usuarios automáticamente
      await expireUsersAutomatically();
      
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

  // Verificar si un usuario está expirado
  const isUserExpired = (user: UserAdmin): boolean => {
    if (user.is_expired) return true;
    const now = new Date();
    if (user.paid_until) {
      return new Date(user.paid_until) < now;
    }
    if (user.trial_expires_at && !user.is_paid) {
      return new Date(user.trial_expires_at) < now && user.nivel > 0;
    }
    return false;
  };

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
    const result = await updateUserLevel(userId, newLevel);
    
    if (result.success) {
      // Recargar datos para reflejar el cambio
      await loadData();
    } else {
      alert(`Error al actualizar nivel: ${result.error?.message || 'Desconocido'}`);
    }
  };

  // Manejar cambio de estado de pago
  const handleChangePaymentStatus = async (userId: string, isPaid: boolean, date?: string) => {
    const currentUser = users.find(u => u.id === userId);
    const updates: any = {
      is_paid: isPaid,
    };

    // Actualizar payment_status según el estado de pago
    if (isPaid) {
      updates.payment_status = 'approved';
      
      // Si se marca como pagado, asignar el nivel según el plan guardado
      if (currentUser?.plan) {
        const nivelFromPlan = getLevelFromPlan(currentUser.plan);
        if (nivelFromPlan > 0) {
          updates.nivel = nivelFromPlan;
          console.log(`✅ Asignando nivel ${nivelFromPlan} según plan ${currentUser.plan}`);
        }
      }
      
      // Si se marca como pagado, establecer trial de 7 días
      const trialExpiresAt = new Date();
      trialExpiresAt.setDate(trialExpiresAt.getDate() + 7);
      updates.trial_expires_at = trialExpiresAt.toISOString();
    } else {
      // Si se desmarca como pagado, limpiar el estado de pago y volver a nivel 0
      updates.payment_status = null;
      updates.nivel = 0;
      updates.trial_expires_at = null;
    }

    // Si se marca como pagado y hay fecha, agregarla
    if (isPaid && date) {
      updates.paid_until = new Date(date).toISOString();
    } else if (!isPaid) {
      // Si se desmarca como pagado, limpiar la fecha
      updates.paid_until = null;
    } else if (isPaid && !date) {
      // Si se marca como pagado pero no hay fecha, mantener la fecha existente si existe
      if (currentUser?.paid_until) {
        updates.paid_until = currentUser.paid_until;
      }
    }

    const result = await updateUserProfile(userId, updates);
    
    if (result.success) {
      setEditingPayment(null);
      setPaymentDate('');
      await loadData();
    } else {
      alert(`Error al actualizar estado de pago: ${result.error?.message || 'Desconocido'}`);
    }
  };

  // Manejar cambio de fecha de vencimiento
  const handleChangePaymentDate = async (userId: string, date: string) => {
    const updates = {
      paid_until: date ? new Date(date).toISOString() : null,
    };

    const result = await updateUserProfile(userId, updates);
    
    if (result.success) {
      await loadData();
    } else {
      alert(`Error al actualizar fecha de vencimiento: ${result.error?.message || 'Desconocido'}`);
    }
  };

  // Manejar cambio de Plan Empresa
  const handleChangeEmpresaPlan = async (userId: string, isEmpresa: boolean) => {
    console.log('🔄 Cambiando Plan Empresa:', { userId, isEmpresa });
    setUpdatingEmpresaPlan(userId);
    
    try {
      const updates: any = {
        pagos_empresa: isEmpresa,
      };
      
      // Si se desactiva el Plan Empresa, limpiar cantidad_tiendas
      if (!isEmpresa) {
        updates.cantidad_tiendas = null;
      }

      console.log('📝 Actualizando perfil con:', updates);
      const result = await updateUserProfile(userId, updates);
      
      console.log('✅ Resultado de actualización:', result);
      
      if (result.success) {
        // Actualizar el estado local inmediatamente para feedback visual
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, pagos_empresa: isEmpresa, cantidad_tiendas: isEmpresa ? user.cantidad_tiendas : null }
              : user
          )
        );
        
        console.log('✅ Plan Empresa actualizado exitosamente');
        
        // Recargar datos para asegurar sincronización
        await loadData();
      } else {
        console.error('❌ Error al actualizar Plan Empresa:', result.error);
        alert(`Error al actualizar Plan Empresa: ${result.error?.message || 'Desconocido'}`);
        // Revertir el cambio en caso de error
        await loadData();
      }
    } catch (error: any) {
      console.error('❌ Excepción al actualizar Plan Empresa:', error);
      alert(`Error al actualizar Plan Empresa: ${error.message || 'Desconocido'}`);
      // Revertir el cambio en caso de error
      await loadData();
    } finally {
      setUpdatingEmpresaPlan(null);
    }
  };

  // Manejar cambio de cantidad de tiendas
  const handleChangeCantidadTiendas = async (userId: string, cantidad: number | null) => {
    const updates = {
      cantidad_tiendas: cantidad,
    };

    const result = await updateUserProfile(userId, updates);
    
    if (result.success) {
      setEditingCantidadTiendas(null);
      setCantidadTiendas('');
      await loadData();
    } else {
      alert(`Error al actualizar cantidad de tiendas: ${result.error?.message || 'Desconocido'}`);
    }
  };

  // Finalizar trial de un usuario
  const handleEndTrial = async (userId: string, username: string) => {
    if (!confirm(`¿Finalizar el periodo de prueba de "${username}"?\n\nEl usuario verá que su prueba finalizó al ingresar a su perfil.`)) {
      return;
    }

    // Establecer trial_expires_at a una fecha pasada
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // Ayer

    const updates = {
      trial_expires_at: pastDate.toISOString(),
    };

    const result = await updateUserProfile(userId, updates);
    
    if (result.success) {
      alert('Periodo de prueba finalizado exitosamente');
      await loadData();
    } else {
      alert(`Error al finalizar trial: ${result.error?.message || 'Desconocido'}`);
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
      <div className="min-h-screen bg-gray-950 p-2 sm:p-4 md:p-6 w-full">
        <div className="w-full space-y-4 sm:space-y-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Total Usuarios</p>
                    <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                    <p className="text-xs text-gray-500 mt-1">Activos: {stats.activeUsers}</p>
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
                    <p className="text-gray-400 text-sm mb-1">Usuarios Pagos</p>
                    <p className="text-3xl font-bold text-green-400">{stats.paidUsers}</p>
                    <p className="text-xs text-gray-500 mt-1">Con suscripción activa</p>
                  </div>
                  <div className="bg-green-500/20 p-3 rounded-lg">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Usuarios Expirados</p>
                    <p className="text-3xl font-bold text-red-400">{stats.expiredUsers}</p>
                    <p className="text-xs text-gray-500 mt-1">Nivel reducido a 0</p>
                  </div>
                  <div className="bg-red-500/20 p-3 rounded-lg">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">En Trial</p>
                    <p className="text-3xl font-bold text-yellow-400">{stats.trialUsers}</p>
                    <p className="text-xs text-gray-500 mt-1">Usuarios nuevos</p>
                  </div>
                  <div className="bg-yellow-500/20 p-3 rounded-lg">
                    <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider whitespace-nowrap">Usuario</th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider whitespace-nowrap">Email</th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider whitespace-nowrap">Nivel</th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider whitespace-nowrap">Estado Pago</th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider whitespace-nowrap">Vence</th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider whitespace-nowrap">Fecha de Creación</th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider whitespace-nowrap sticky right-0 bg-gray-700 z-10">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 sm:px-6 py-8 text-center text-gray-400">
                        No se encontraron usuarios
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const expired = isUserExpired(user);
                      return (
                      <tr 
                        key={user.id} 
                        className={`hover:bg-gray-700/50 transition-colors ${
                          expired ? 'opacity-50 bg-gray-900/30' : ''
                        }`}
                      >
                        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-600 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold">
                              {user.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span className="text-white font-medium">{user.username || 'Sin nombre'}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
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
                        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <select
                            value={user.nivel}
                            onChange={(e) => handleChangeLevel(user.id, parseInt(e.target.value))}
                            className="bg-gray-700 text-white border border-gray-500 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-600 transition-colors cursor-pointer w-full min-w-[120px]"
                          >
                            {NIVELES.map((nivel) => (
                              <option key={nivel.value} value={nivel.value} className="bg-gray-800 text-white">
                                {nivel.label} ({nivel.value})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-2 min-w-[140px]">
                            {/* Selector de estado de pago */}
                            <select
                              value={user.is_paid ? 'paid' : 'unpaid'}
                              onChange={(e) => {
                                const isPaid = e.target.value === 'paid';
                                if (isPaid && !user.paid_until) {
                                  // Si se marca como pagado y no hay fecha, activar edición de fecha
                                  setEditingPayment(user.id);
                                  setPaymentDate('');
                                } else {
                                  handleChangePaymentStatus(user.id, isPaid);
                                }
                              }}
                              className="bg-gray-700 text-white border border-gray-500 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 hover:bg-gray-600 transition-colors cursor-pointer w-full"
                            >
                              <option value="unpaid" className="bg-gray-800 text-white">
                                Sin pagar
                              </option>
                              <option value="paid" className="bg-gray-800 text-white">
                                Pagado
                              </option>
                            </select>

                            {/* Campo de fecha solo cuando se está editando el estado de pago */}
                            {editingPayment === user.id && (
                              <div className="flex flex-col gap-1">
                                <input
                                  type="date"
                                  value={paymentDate}
                                  onChange={(e) => setPaymentDate(e.target.value)}
                                  className="bg-gray-700 text-white border border-gray-500 px-2 py-1 rounded text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                                  placeholder="Fecha de vencimiento"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      if (paymentDate) {
                                        handleChangePaymentStatus(user.id, true, paymentDate);
                                      } else {
                                        // Si no hay fecha pero se confirma, marcar como pagado sin fecha
                                        handleChangePaymentStatus(user.id, true);
                                      }
                                    }}
                                    className="text-xs text-green-400 hover:text-green-300 font-semibold"
                                  >
                                    ✓ Guardar
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingPayment(null);
                                      setPaymentDate('');
                                      // Revertir el selector a "Sin pagar"
                                      handleChangePaymentStatus(user.id, false);
                                    }}
                                    className="text-xs text-red-400 hover:text-red-300"
                                  >
                                    ✕ Cancelar
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Select Plan Empresa */}
                            <div className="flex flex-col gap-2 min-w-[140px]">
                              <select
                                value={user.pagos_empresa === true ? 'empresa' : 'normal'}
                                onChange={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const isEmpresa = e.target.value === 'empresa';
                                  console.log('📋 Select cambiado:', { userId: user.id, value: e.target.value, isEmpresa });
                                  handleChangeEmpresaPlan(user.id, isEmpresa);
                                }}
                                disabled={updatingEmpresaPlan === user.id}
                                className="bg-gray-700 text-white border border-gray-500 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 hover:bg-gray-600 transition-colors cursor-pointer w-full disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <option value="normal" className="bg-gray-800 text-white">
                                  Plan Normal
                                </option>
                                <option value="empresa" className="bg-gray-800 text-white">
                                  Plan Empresa
                                </option>
                              </select>
                              {updatingEmpresaPlan === user.id && (
                                <span className="text-xs text-purple-400">Guardando...</span>
                              )}
                              {user.pagos_empresa === true && (
                                <>
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                    </svg>
                                    Multi-tienda
                                  </span>
                                  {/* Campo para cantidad de tiendas */}
                                  {editingCantidadTiendas === user.id ? (
                                    <div className="flex flex-col gap-1">
                                      <input
                                        type="number"
                                        min="1"
                                        value={cantidadTiendas}
                                        onChange={(e) => setCantidadTiendas(e.target.value)}
                                        placeholder="Cantidad"
                                        className="bg-gray-700 text-white border border-gray-500 px-2 py-1 rounded text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => {
                                            const cantidad = cantidadTiendas ? parseInt(cantidadTiendas) : null;
                                            if (cantidad && cantidad > 0) {
                                              handleChangeCantidadTiendas(user.id, cantidad);
                                            } else {
                                              handleChangeCantidadTiendas(user.id, null);
                                            }
                                          }}
                                          className="text-xs text-green-400 hover:text-green-300 font-semibold"
                                        >
                                          ✓ Guardar
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingCantidadTiendas(null);
                                            setCantidadTiendas('');
                                          }}
                                          className="text-xs text-red-400 hover:text-red-300"
                                        >
                                          ✕ Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-400">
                                        Tiendas: {user.cantidad_tiendas || 'Sin límite'}
                                      </span>
                                      <button
                                        onClick={() => {
                                          setEditingCantidadTiendas(user.id);
                                          setCantidadTiendas(user.cantidad_tiendas?.toString() || '');
                                        }}
                                        className="text-xs text-purple-400 hover:text-purple-300"
                                        title="Editar cantidad de tiendas"
                                      >
                                        ✏️
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            {user.payment_status && (
                              <span className="text-xs text-gray-400">
                                {user.payment_status === 'approved' ? '✅ Aprobado' : 
                                 user.payment_status === 'pending' ? '⏳ Pendiente' : 
                                 user.payment_status === 'rejected' ? '❌ Rechazado' : 
                                 user.payment_status}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-2 min-w-[150px]">
                            {user.paid_until ? (
                              <>
                                <span className="text-gray-300 text-sm">
                                  {formatDate(user.paid_until)}
                                </span>
                                {new Date(user.paid_until) < new Date() ? (
                                  <span className="text-xs text-red-400">Expirado</span>
                                ) : (
                                  <span className="text-xs text-green-400">
                                    {Math.ceil((new Date(user.paid_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días restantes
                                  </span>
                                )}
                              </>
                            ) : user.trial_expires_at ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-300 text-sm">
                                    Trial: {formatDate(user.trial_expires_at)}
                                  </span>
                                  {new Date(user.trial_expires_at) >= new Date() && (
                                    <button
                                      onClick={() => handleEndTrial(user.id, user.username)}
                                      className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors"
                                      title="Finalizar periodo de prueba"
                                    >
                                      Finalizar
                                    </button>
                                  )}
                                </div>
                                {new Date(user.trial_expires_at) < new Date() ? (
                                  <span className="text-xs text-red-400">Trial expirado</span>
                                ) : (
                                  <span className="text-xs text-blue-400">
                                    {Math.ceil((new Date(user.trial_expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días restantes
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-500 text-sm">Sin fecha</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-gray-300 text-xs sm:text-sm whitespace-nowrap">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-2 sm:px-3 md:px-4 py-3 sm:py-4 sticky right-0 bg-gray-800 z-10 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <button
                              onClick={() => handleResetPassword(user.email)}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0"
                              title="Resetear contraseña"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setEditingUser(user)}
                              className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0"
                              title="Editar usuario"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              className="bg-red-600 hover:bg-red-700 text-white p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0"
                              title="Eliminar usuario"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })
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

