/**
 * Servicio de Metadatos de Usuario
 * Maneja el nivel y trial directamente desde user_metadata de Supabase Auth
 * Esto evita problemas de RLS y sincronización
 */

import { supabase } from '../lib/supabase';

export interface UserMetadata {
  username: string;
  nivel: number;
  trial_expires_at?: string;
  email?: string;
  is_paid?: boolean;
  payment_status?: 'pending' | 'approved' | 'rejected';
  paid_until?: string; // Fecha de finalización del plan pagado
  pagos_empresa?: boolean; // Indica si tiene Plan Empresa
  cantidad_tiendas?: number; // Número de tiendas que puede manejar (solo para Plan Empresa)
}

/**
 * Obtiene los metadatos del usuario actual
 */
export async function getUserMetadata(): Promise<{ metadata: UserMetadata | null; error?: any }> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { metadata: null, error };
    }

    const metadata: UserMetadata = {
      username: user.user_metadata?.username || user.email?.split('@')[0] || 'Usuario',
      nivel: user.user_metadata?.nivel ?? 0,
      trial_expires_at: user.user_metadata?.trial_expires_at,
      email: user.email,
      is_paid: user.user_metadata?.is_paid,
      payment_status: user.user_metadata?.payment_status,
      paid_until: user.user_metadata?.paid_until,
      pagos_empresa: user.user_metadata?.pagos_empresa,
    };

    return { metadata, error: null };
  } catch (error) {
    console.error('❌ [UserMetadataService] Error obteniendo metadata:', error);
    return { metadata: null, error };
  }
}

/**
 * Actualiza los metadatos del usuario
 */
export async function updateUserMetadata(
  updates: Partial<UserMetadata>
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📝 [UserMetadataService] Actualizando metadata:', updates);

    const { data: { user }, error: getUserError } = await supabase.auth.getUser();

    if (getUserError || !user) {
      console.error('❌ [UserMetadataService] No hay usuario autenticado');
      return {
        success: false,
        error: 'No hay usuario autenticado',
      };
    }

    // Combinar metadata existente con las actualizaciones
    const currentMetadata = user.user_metadata || {};
    const newMetadata = {
      ...currentMetadata,
      ...updates,
    };

    const { error } = await supabase.auth.updateUser({
      data: newMetadata,
    });

    if (error) {
      console.error('❌ [UserMetadataService] Error actualizando metadata:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('✅ [UserMetadataService] Metadata actualizada exitosamente');
    return { success: true };
  } catch (error: any) {
    console.error('❌ [UserMetadataService] Excepción:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Obtiene el nivel del usuario actual
 */
export async function getUserLevel(): Promise<number> {
  try {
    const { metadata } = await getUserMetadata();
    return metadata?.nivel ?? 0;
  } catch (error) {
    console.error('❌ [UserMetadataService] Error obteniendo nivel:', error);
    return 0;
  }
}

/**
 * Actualiza el nivel del usuario
 */
export async function setUserLevel(nivel: number): Promise<{ success: boolean; error?: string }> {
  return updateUserMetadata({ nivel });
}

/**
 * Inicializa los metadatos para un nuevo usuario
 * Se debe llamar inmediatamente después del registro
 */
export async function initializeUserMetadata(
  username: string,
  nivel: number = 3
): Promise<{ success: boolean; error?: string }> {
  try {
    const trialExpiresAt = new Date();
    trialExpiresAt.setDate(trialExpiresAt.getDate() + 7); // 7 días

    return await updateUserMetadata({
      username,
      nivel,
      trial_expires_at: trialExpiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('❌ [UserMetadataService] Error inicializando metadata:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verifica si el trial del usuario ha expirado
 */
export function hasTrialExpired(metadata: UserMetadata | null): boolean {
  if (!metadata?.trial_expires_at) return false;

  const now = new Date();
  const expiresAt = new Date(metadata.trial_expires_at);
  return now > expiresAt;
}

/**
 * Obtiene información del trial
 */
export function getTrialInfo(metadata: UserMetadata | null): {
  isActive: boolean;
  daysRemaining: number;
  hasExpired: boolean;
} {
  if (!metadata?.trial_expires_at) {
    return {
      isActive: false,
      daysRemaining: 0,
      hasExpired: true,
    };
  }

  const now = new Date();
  const expiresAt = new Date(metadata.trial_expires_at);
  const diffTime = expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const hasExpired = diffDays <= 0;

  return {
    isActive: !hasExpired,
    daysRemaining: Math.max(0, diffDays),
    hasExpired,
  };
}

/**
 * Reduce el nivel a 0 si el trial expiró
 */
export async function checkAndUpdateExpiredTrial(): Promise<void> {
  try {
    const { metadata } = await getUserMetadata();
    
    if (!metadata) return;

    const expired = hasTrialExpired(metadata);

    // Si expiró y tiene nivel 3, reducir a 0
    if (expired && metadata.nivel === 3) {
      console.log('⚠️ [UserMetadataService] Trial expirado, reduciendo nivel a 0');
      await setUserLevel(0);
    }
  } catch (error) {
    console.error('❌ [UserMetadataService] Error verificando trial:', error);
  }
}

/**
 * Verifica si un usuario ha pagado (no está en trial)
 * Un usuario ha pagado si:
 * - Tiene el campo is_paid explícitamente en true
 * - O tiene trial_expires_at, el trial expiró Y sigue con nivel > 0 (probablemente pagó)
 * - NOTA: Los admins deben marcar manualmente si un usuario pagó usando is_paid = true
 */
export function isPaidUser(metadata: UserMetadata | null): boolean {
  if (!metadata) return false;
  
  // Si tiene el campo is_paid explícitamente marcado como true, es pagado
  if (metadata.is_paid === true) {
    return true;
  }
  
  // Si is_paid es false explícitamente, el usuario NO pagó
  if (metadata.is_paid === false) {
    return false;
  }
  
  // Si is_paid es null/undefined, verificar si tiene trial activo
  if (!metadata.trial_expires_at) {
    // Usuario antiguo o sin trial configurado - NO pagó
    return false;
  }
  
  // Si tiene trial_expires_at pero ya expiró y sigue con nivel > 0, asumimos que pagó
  const expired = hasTrialExpired(metadata);
  return expired && metadata.nivel > 0;
}

