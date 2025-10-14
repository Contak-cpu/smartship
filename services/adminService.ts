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
 */
export const updateUserLevel = async (
  userId: string,
  newLevel: number
): Promise<{ success: boolean; error: any }> => {
  try {
    const { data, error } = await supabase.rpc('update_user_level', {
      p_user_id: userId,
      p_new_level: newLevel,
    });

    if (error) {
      console.error('Error al actualizar nivel:', error);
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
 */
export const updateUserProfile = async (
  userId: string,
  updates: UpdateUserData
): Promise<{ success: boolean; error: any }> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error al actualizar perfil:', error);
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


