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
}

/**
 * Obtiene todos los usuarios del sistema (solo nivel Dios)
 */
export const getAllUsers = async (): Promise<{ data: UserAdmin[] | null; error: any }> => {
  try {
    const { data, error } = await supabase.rpc('get_all_users_admin');
    
    if (error) {
      console.error('Error al obtener usuarios:', error);
      return { data: null, error };
    }

    return { data: data as UserAdmin[], error: null };
  } catch (error) {
    console.error('Error en getAllUsers:', error);
    return { data: null, error };
  }
};

/**
 * Actualiza el nivel de un usuario (solo nivel Dios)
 * Actualiza directamente en user_metadata de auth.users usando Admin API
 */
export const updateUserLevel = async (
  userId: string,
  newLevel: number
): Promise<{ success: boolean; error: any }> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      // Si no hay service_role_key, intentar usar la función RPC (si existe)
      const { data, error } = await supabase.rpc('update_user_level', {
        p_user_id: userId,
        p_new_level: newLevel,
      });

      if (error) {
        console.error('Error al actualizar nivel:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
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
 * Actualiza directamente en user_metadata de auth.users
 */
export const updateUserProfile = async (
  userId: string,
  updates: UpdateUserData
): Promise<{ success: boolean; error: any }> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return { 
        success: false, 
        error: { message: 'VITE_SUPABASE_SERVICE_ROLE_KEY no está configurada. Necesaria para actualizar metadata.' } 
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
    // Crear el usuario en auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          username: userData.username,
        },
        // NOTA: emailRedirectTo se usa para confirmar el email automáticamente
        // En producción, deberías tener un endpoint que confirme el email
        emailRedirectTo: undefined,
      },
    });

    if (authError || !authData.user) {
      console.error('Error al crear usuario en auth:', authError);
      return { success: false, error: authError };
    }

    // El perfil se crea automáticamente por el trigger handle_new_user()
    // Pero necesitamos actualizar el nivel
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ nivel: userData.nivel })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('Error al actualizar nivel del nuevo usuario:', updateError);
      return { success: false, error: updateError };
    }

    return { success: true, userId: authData.user.id, error: null };
  } catch (error) {
    console.error('Error en createUser:', error);
    return { success: false, error };
  }
};

/**
 * Elimina un usuario (solo nivel Dios)
 * NOTA: Esto solo elimina el perfil. Para eliminar completamente el usuario
 * de auth.users, necesitarías usar la Admin API de Supabase
 */
export const deleteUser = async (
  userId: string
): Promise<{ success: boolean; error: any }> => {
  try {
    // Eliminar perfil (esto también eliminará el usuario de auth por CASCADE)
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error al eliminar usuario:', error);
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
  error: any;
}> => {
  try {
    const { data: users, error } = await getAllUsers();

    if (error || !users) {
      return { totalUsers: 0, usersByLevel: {}, recentUsers: 0, error };
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

    return { totalUsers, usersByLevel, recentUsers, error: null };
  } catch (error) {
    console.error('Error en getUserStats:', error);
    return { totalUsers: 0, usersByLevel: {}, recentUsers: 0, error };
  }
};


