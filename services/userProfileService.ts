/**
 * Servicio de Perfiles de Usuario
 * Maneja la creación, actualización y obtención de perfiles de usuario
 */

import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  nivel: number;
  created_at?: string;
  updated_at?: string;
  trial_expires_at?: string;
}

export interface CreateProfileData {
  userId: string;
  username: string;
  email: string;
  nivel?: number;
}

/**
 * Crea un nuevo perfil de usuario
 */
export async function createUserProfile(
  data: CreateProfileData
): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  try {
    console.log('👤 [UserProfileService] Creando perfil para:', data.username);
    console.log('📊 [UserProfileService] Datos recibidos:', { username: data.username, email: data.email, nivel: data.nivel });

    // FORZAR nivel 3 SIEMPRE
    const nivel = 3;
    console.log('📝 [UserProfileService] Forzando nivel a 3 (ignorando data.nivel)');

    // Intentar verificar si el perfil ya existe (silenciosamente)
    let existingProfile = null;
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', data.userId)
        .maybeSingle();
      
      existingProfile = profile;
    } catch (err) {
      // Ignorar errores de verificación
      console.log('⚠️ No se pudo verificar perfil existente, procediendo con creación');
    }

    if (existingProfile) {
      console.log('ℹ️ [UserProfileService] Perfil ya existe, actualizando nivel a 3');
      // Actualizar el nivel a 3 si ya existe
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ nivel: 3 })
        .eq('id', data.userId);
      
      if (updateError) {
        console.error('❌ Error actualizando nivel:', updateError);
      }
      
      // Obtener el perfil completo
      const { data: fullProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.userId)
        .single();
      
      return {
        success: true,
        profile: fullProfile as UserProfile,
      };
    }

    // Determinar el username final
    let finalUsername = data.username;
    
    try {
      // Intentar verificar username (silenciosamente)
      const { data: usernameExists } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', data.username)
        .maybeSingle();
      
      if (usernameExists) {
        console.log('⚠️ [UserProfileService] Username ya existe, usando alternativo');
        const emailUsername = data.email.split('@')[0];
        finalUsername = `${emailUsername}_${Date.now()}`;
      }
    } catch (err) {
      // Ignorar errores, usar username original
      console.log('⚠️ No se pudo verificar username, usando original');
    }

    // Crear nuevo perfil - FORZAR nivel 3 (hardcoded)
    console.log('📝 [UserProfileService] Creando perfil con nivel 3 (hardcoded)');
    
    const insertData = {
      id: data.userId,
      username: finalUsername,
      email: data.email,
      nivel: 3, // HARDCODED - Siempre 3
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      trial_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
    };
    
    console.log('📝 [UserProfileService] INSERT data:', JSON.stringify(insertData, null, 2));
    
    // INSERT EXPLÍCITO con nivel 3 hardcoded
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ [UserProfileService] Error creando perfil:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('✅ [UserProfileService] Perfil creado:', finalUsername);
    
    return {
      success: true,
      profile,
    };
  } catch (error: any) {
    console.error('❌ [UserProfileService] Excepción:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Obtiene el perfil de un usuario
 */
export async function getUserProfile(userId: string): Promise<{ profile: UserProfile | null; error?: any }> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ [UserProfileService] Error obteniendo perfil:', error);
      return {
        profile: null,
        error,
      };
    }

    return {
      profile: data as UserProfile,
    };
  } catch (error) {
    console.error('❌ [UserProfileService] Excepción:', error);
    return {
      profile: null,
      error,
    };
  }
}

/**
 * Actualiza el perfil de un usuario
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('❌ [UserProfileService] Error actualizando perfil:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('✅ [UserProfileService] Perfil actualizado');
    return { success: true };
  } catch (error: any) {
    console.error('❌ [UserProfileService] Excepción:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Elimina el perfil de un usuario
 */
export async function deleteUserProfile(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('❌ [UserProfileService] Error eliminando perfil:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('✅ [UserProfileService] Perfil eliminado');
    return { success: true };
  } catch (error: any) {
    console.error('❌ [UserProfileService] Excepción:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Obtiene el nivel de un usuario
 */
export async function getUserLevel(userId: string): Promise<number> {
  try {
    const { profile } = await getUserProfile(userId);
    return profile?.nivel ?? 0;
  } catch (error) {
    console.error('❌ [UserProfileService] Error obteniendo nivel:', error);
    return 0;
  }
}

/**
 * Actualiza el nivel de un usuario
 */
export async function setUserLevel(userId: string, nivel: number): Promise<{ success: boolean; error?: string }> {
  return updateUserProfile(userId, { nivel });
}

