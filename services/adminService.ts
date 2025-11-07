/**
 * Servicio de Administración - Solo para usuarios nivel Dios (999)
 * Permite gestionar usuarios: crear, editar, eliminar, actualizar niveles
 */

import { supabase } from '../lib/supabase';

export interface UserAdmin {
  id: string;
  email: string;
  username: string;
  nivel: number;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  created_at: string;
  updated_at: string;
  is_paid: boolean | null;
  payment_status: string | null;
  paid_until: string | null;
  trial_expires_at: string | null;
  is_expired?: boolean;
  pagos_empresa?: boolean | null;
  plan?: string | null;
}

export interface CreateUserData {
  email: string;
  password: string;
  username: string;
  nivel: number;
}

export interface UpdateUserData {
  username?: string;
  nivel?: number;
  is_paid?: boolean;
  paid_until?: string | null;
  pagos_empresa?: boolean;
  trial_expires_at?: string | null;
  payment_status?: string | null;
}

/**
 * Obtiene todos los usuarios del sistema (solo nivel Dios)
 * Usa la función RPC get_all_users_admin que lee desde auth.users.raw_user_meta_data
 */
export const getAllUsers = async (): Promise<{ data: UserAdmin[] | null; error: any }> => {
  try {
    const { data, error } = await supabase.rpc('get_all_users_admin');
    
    if (error) {
      console.error('Error al obtener usuarios:', error);
      return { data: null, error };
    }

    // La función RPC ya devuelve los datos en el formato correcto
    return { data: data as UserAdmin[], error: null };
  } catch (error) {
    console.error('Error en getAllUsers:', error);
    return { data: null, error };
  }
};

/**
 * Actualiza el nivel de un usuario (solo nivel Dios)
 * Usa la función RPC update_user_level que actualiza directamente raw_user_meta_data
 */
export const updateUserLevel = async (
  userId: string,
  newLevel: number
): Promise<{ success: boolean; error: any }> => {
  try {
    // Primero intentar usar la función RPC (más confiable)
    const { error: rpcError } = await supabase.rpc('update_user_level', {
      p_user_id: userId,
      p_new_level: newLevel,
    });

    if (!rpcError) {
      return { success: true, error: null };
    }

    // Si falla la RPC, intentar con Admin API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      console.error('Error al actualizar nivel (RPC falló y no hay service_role_key):', rpcError);
      return { success: false, error: rpcError };
    }

    // Usar Admin API para actualizar metadata
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error };
    }

    const userData = await response.json();
    const currentMetadata = userData.user?.user_metadata || {};

    // Actualizar solo el nivel
    const newMetadata = {
      ...currentMetadata,
      nivel: newLevel,
    };

    const updateResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({
        user_metadata: newMetadata,
      }),
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error en updateUserLevel:', error);
    return { success: false, error };
  }
};

/**
 * Actualiza el perfil de un usuario (solo nivel Dios)
 * Usa la función RPC update_user_metadata que no requiere service_role_key
 */
export const updateUserProfile = async (
  userId: string,
  updates: UpdateUserData
): Promise<{ success: boolean; error: any }> => {
  try {
    // Primero intentar usar la función RPC (no requiere service_role_key)
    const { error: rpcError } = await supabase.rpc('update_user_metadata', {
      p_user_id: userId,
      p_username: updates.username || null,
      p_nivel: updates.nivel !== undefined ? updates.nivel : null,
      p_is_paid: updates.is_paid !== undefined ? updates.is_paid : null,
      p_paid_until: updates.paid_until !== undefined ? (updates.paid_until || '') : null,
      p_pagos_empresa: updates.pagos_empresa !== undefined ? updates.pagos_empresa : null,
      p_trial_expires_at: updates.trial_expires_at !== undefined ? (updates.trial_expires_at || '') : null,
      p_payment_status: updates.payment_status !== undefined ? (updates.payment_status || '') : null,
    });

    if (!rpcError) {
      return { success: true, error: null };
    }

    // Si falla la RPC, intentar con Admin API (requiere service_role_key)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      console.error('Error al actualizar perfil (RPC falló y no hay service_role_key):', rpcError);
      return { 
        success: false, 
        error: rpcError || { message: 'No se puede actualizar el perfil. La función RPC falló y no hay service_role_key configurada.' } 
      };
    }

    // Obtener metadata actual del usuario
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error };
    }

    const userData = await response.json();
    const currentMetadata = userData.user?.user_metadata || {};

    // Combinar metadata existente con las actualizaciones
    const newMetadata = {
      ...currentMetadata,
      ...(updates.username && { username: updates.username }),
      ...(updates.nivel !== undefined && { nivel: updates.nivel }),
      ...(updates.is_paid !== undefined && { is_paid: updates.is_paid }),
      ...(updates.paid_until !== undefined && { paid_until: updates.paid_until }),
      ...(updates.pagos_empresa !== undefined && { pagos_empresa: updates.pagos_empresa }),
      ...(updates.trial_expires_at !== undefined && { trial_expires_at: updates.trial_expires_at }),
      ...(updates.payment_status !== undefined && { payment_status: updates.payment_status }),
    };

    // Actualizar metadata
    const updateResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({
        user_metadata: newMetadata,
      }),
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error en updateUserProfile:', error);
    return { success: false, error };
  }
};

/**
 * Crea un nuevo usuario con autoconfirmación de email
 * NOTA: Requiere service_role_key para bypass de confirmación de email
 * Esta función debe ser implementada en el backend o usar Supabase Admin API
 */
export const createUser = async (
  userData: CreateUserData
): Promise<{ success: boolean; userId?: string; error: any }> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      // Si no hay service_role_key, usar el método normal de signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
            nivel: userData.nivel,
          },
        },
      });

      if (authError || !authData.user) {
        console.error('Error al crear usuario en auth:', authError);
        return { success: false, error: authError };
      }

      return { success: true, userId: authData.user.id, error: null };
    }

    // Usar Admin API para crear usuario con metadata completa
    const trialExpiresAt = new Date();
    trialExpiresAt.setDate(trialExpiresAt.getDate() + 7); // 7 días de trial

    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirmar email
        user_metadata: {
          username: userData.username,
          nivel: userData.nivel,
          trial_expires_at: trialExpiresAt.toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error al crear usuario con Admin API:', error);
      return { success: false, error };
    }

    const result = await response.json();
    return { success: true, userId: result.id, error: null };
  } catch (error) {
    console.error('Error en createUser:', error);
    return { success: false, error };
  }
};

/**
 * Elimina un usuario (solo nivel Dios)
 * Usa la función RPC delete_user_admin que no requiere service_role_key
 */
export const deleteUser = async (
  userId: string
): Promise<{ success: boolean; error: any }> => {
  try {
    // Primero intentar usar la función RPC (no requiere service_role_key)
    const { error: rpcError } = await supabase.rpc('delete_user_admin', {
      p_user_id: userId,
    });

    if (!rpcError) {
      return { success: true, error: null };
    }

    // Si falla la RPC, intentar con Admin API (requiere service_role_key)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      console.error('Error al eliminar usuario (RPC falló y no hay service_role_key):', rpcError);
      return { 
        success: false, 
        error: rpcError || { message: 'No se puede eliminar el usuario. La función RPC falló y no hay service_role_key configurada.' } 
      };
    }

    // Usar Admin API para eliminar el usuario completamente
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error al eliminar usuario con Admin API:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error en deleteUser:', error);
    return { success: false, error };
  }
};

/**
 * Resetea la contraseña de un usuario (solo nivel Dios)
 */
export const resetUserPassword = async (
  email: string
): Promise<{ success: boolean; error: any }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('Error al resetear contraseña:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error en resetUserPassword:', error);
    return { success: false, error };
  }
};

/**
 * Actualiza la contraseña de un usuario directamente (solo nivel Dios)
 * NOTA: Esta función requiere que configures VITE_SUPABASE_SERVICE_ROLE_KEY en tu archivo .env.local
 * IMPORTANTE: La service_role_key NUNCA debe exponerse en el frontend en producción.
 * Para producción, deberías crear una Edge Function de Supabase que maneje esto de forma segura.
 */
export const updateUserPassword = async (
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error: any }> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    // Verificar que el usuario actual es nivel Dios
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: { message: 'No estás autenticado' } };
    }

    // Verificar nivel desde metadata (fuente de verdad)
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser || (currentUser.user_metadata?.nivel ?? 0) !== 999) {
      return { success: false, error: { message: 'No tienes permisos para realizar esta acción' } };
    }

    // La API Admin de Supabase requiere service_role_key
    // Si no está disponible, usar el método de resetPasswordForEmail que envía un email
    if (!serviceRoleKey) {
      console.warn('⚠️ VITE_SUPABASE_SERVICE_ROLE_KEY no está configurada. No se puede actualizar la contraseña directamente.');
      return { 
        success: false, 
        error: { 
          message: 'No se puede actualizar la contraseña directamente sin service_role_key. Por favor, configura VITE_SUPABASE_SERVICE_ROLE_KEY en tu archivo .env.local o usa el SQL directo en Supabase.' 
        } 
      };
    }

    // Usar la API REST de Supabase Auth Admin con service_role_key
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({
        password: newPassword,
      }),
    });

    // Verificar si la respuesta tiene contenido antes de parsear JSON
    const contentType = response.headers.get('content-type');
    let result: any = null;
    let responseText = '';

    // Leer el contenido de la respuesta
    try {
      responseText = await response.text();
    } catch (e) {
      console.error('Error al leer respuesta:', e);
      // Si la respuesta está vacía pero el status es OK, considerarlo éxito
      if (response.ok) {
        return { success: true, error: null };
      }
      return { 
        success: false, 
        error: { message: 'Error al leer la respuesta del servidor' } 
      };
    }

    // Intentar parsear JSON solo si hay contenido y es JSON
    if (responseText) {
      if (contentType && contentType.includes('application/json')) {
        try {
          result = JSON.parse(responseText);
        } catch (e) {
          console.error('Error al parsear JSON:', e, 'Respuesta:', responseText);
          // Si no se puede parsear pero el status es OK, considerar éxito
          if (response.ok) {
            return { success: true, error: null };
          }
          return { 
            success: false, 
            error: { message: responseText || 'Error al procesar la respuesta del servidor' } 
          };
        }
      }
    }

    // Verificar el status de la respuesta
    if (!response.ok) {
      return { 
        success: false, 
        error: result || { message: responseText || `Error ${response.status}: ${response.statusText}` } 
      };
    }

    // Si la respuesta está vacía pero el status es OK, considerar éxito
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error en updateUserPassword:', error);
    return { 
      success: false, 
      error: { message: error.message || 'Error desconocido al actualizar contraseña' } 
    };
  }
};

/**
 * Obtiene estadísticas de usuarios (solo nivel Dios)
 */
export const getUserStats = async (): Promise<{
  totalUsers: number;
  usersByLevel: { [key: number]: number };
  recentUsers: number;
  paidUsers: number;
  expiredUsers: number;
  activeUsers: number;
  trialUsers: number;
  error: any;
}> => {
  try {
    const { data: users, error } = await getAllUsers();

    if (error || !users) {
      return { 
        totalUsers: 0, 
        usersByLevel: {}, 
        recentUsers: 0, 
        paidUsers: 0,
        expiredUsers: 0,
        activeUsers: 0,
        trialUsers: 0,
        error 
      };
    }

    const totalUsers = users.length;
    
    // Contar usuarios por nivel
    const usersByLevel: { [key: number]: number } = {};
    users.forEach(user => {
      usersByLevel[user.nivel] = (usersByLevel[user.nivel] || 0) + 1;
    });

    // Contar usuarios recientes (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = users.filter(user => 
      new Date(user.created_at) > thirtyDaysAgo
    ).length;

    // Contar usuarios pagos
    const paidUsers = users.filter(user => user.is_paid === true).length;

    // Contar usuarios expirados
    const expiredUsers = users.filter(user => {
      if (user.is_expired) return true;
      const now = new Date();
      if (user.paid_until) {
        return new Date(user.paid_until) < now;
      }
      if (user.trial_expires_at && !user.is_paid) {
        return new Date(user.trial_expires_at) < now && user.nivel > 0;
      }
      return false;
    }).length;

    // Contar usuarios activos (no expirados)
    const activeUsers = totalUsers - expiredUsers;

    // Contar usuarios en trial
    const trialUsers = users.filter(user => {
      if (user.is_paid) return false;
      if (user.trial_expires_at) {
        const now = new Date();
        return new Date(user.trial_expires_at) >= now;
      }
      return false;
    }).length;

    return { 
      totalUsers, 
      usersByLevel, 
      recentUsers, 
      paidUsers,
      expiredUsers,
      activeUsers,
      trialUsers,
      error: null 
    };
  } catch (error) {
    console.error('Error en getUserStats:', error);
    return { 
      totalUsers: 0, 
      usersByLevel: {}, 
      recentUsers: 0, 
      paidUsers: 0,
      expiredUsers: 0,
      activeUsers: 0,
      trialUsers: 0,
      error 
    };
  }
};

/**
 * Reduce el nivel a 0 para usuarios expirados automáticamente
 */
export const expireUsersAutomatically = async (): Promise<{
  success: boolean;
  expiredCount: number;
  error: any;
}> => {
  try {
    const { data: users, error } = await getAllUsers();

    if (error || !users) {
      return { success: false, expiredCount: 0, error };
    }

    const now = new Date();
    let expiredCount = 0;
    const expiredUsers: string[] = [];

    // Identificar usuarios expirados que aún tienen nivel > 0
    users.forEach(user => {
      if (user.nivel === 0 || user.nivel === 999) return; // No tocar invitados ni dioses

      let isExpired = false;

      // Verificar si el pago expiró
      if (user.paid_until) {
        isExpired = new Date(user.paid_until) < now;
      } 
      // Verificar si el trial expiró y no está pagado
      else if (user.trial_expires_at && !user.is_paid) {
        isExpired = new Date(user.trial_expires_at) < now;
      }

      if (isExpired) {
        expiredUsers.push(user.id);
      }
    });

    // Reducir nivel a 0 para usuarios expirados
    for (const userId of expiredUsers) {
      const result = await updateUserLevel(userId, 0);
      if (result.success) {
        expiredCount++;
      }
    }

    return { success: true, expiredCount, error: null };
  } catch (error) {
    console.error('Error en expireUsersAutomatically:', error);
    return { success: false, expiredCount: 0, error };
  }
};


