/**
 * Servicio de Trial (7 días gratis)
 * Maneja el sistema de prueba gratuita y vencimiento de registros
 */

import { supabase } from '../lib/supabase';

export interface TrialInfo {
  isActive: boolean;
  daysRemaining: number;
  startDate: string;
  endDate: string;
  hasExpired: boolean;
}

/**
 * Obtiene información del trial del usuario
 */
export async function getTrialInfo(userId: string): Promise<TrialInfo> {
  try {
    // Obtener el perfil del usuario
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('created_at, trial_expires_at')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.error('❌ [TrialService] Error obteniendo perfil:', error);
      return {
        isActive: false,
        daysRemaining: 0,
        startDate: '',
        endDate: '',
        hasExpired: true,
      };
    }

    const startDate = profile.created_at;
    const endDate = profile.trial_expires_at || calculateTrialEndDate(startDate);
    
    // Calcular días restantes
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const hasExpired = diffDays <= 0;
    const isActive = !hasExpired;

    return {
      isActive,
      daysRemaining: Math.max(0, diffDays),
      startDate,
      endDate,
      hasExpired,
    };
  } catch (error) {
    console.error('❌ [TrialService] Error:', error);
    return {
      isActive: false,
      daysRemaining: 0,
      startDate: '',
      endDate: '',
      hasExpired: true,
    };
  }
}

/**
 * Calcula la fecha de vencimiento del trial (7 días desde la creación)
 */
function calculateTrialEndDate(startDate: string): string {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 7); // Agregar 7 días
  return end.toISOString();
}

/**
 * Inicializa el trial para un nuevo usuario
 * Se debe llamar cuando se crea el perfil del usuario
 */
export async function initializeTrial(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const endDate = calculateTrialEndDate(new Date().toISOString());

    const { error } = await supabase
      .from('user_profiles')
      .update({
        trial_expires_at: endDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('❌ [TrialService] Error inicializando trial:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('✅ [TrialService] Trial inicializado hasta:', endDate);
    return { success: true };
  } catch (error: any) {
    console.error('❌ [TrialService] Excepción:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verifica si el usuario tiene trial activo
 */
export async function hasActiveTrial(userId: string): Promise<boolean> {
  try {
    const trialInfo = await getTrialInfo(userId);
    return trialInfo.isActive;
  } catch (error) {
    console.error('❌ [TrialService] Error verificando trial:', error);
    return false;
  }
}

/**
 * Actualiza el nivel del usuario cuando el trial expira
 * Reduce el nivel a 0 (sin acceso) si el trial ha vencido
 */
export async function updateLevelOnTrialExpiration(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const trialInfo = await getTrialInfo(userId);

    // Si el trial expiró y el usuario tiene nivel 3 (VIP), reducirlo a 0
    if (trialInfo.hasExpired) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('nivel')
        .eq('id', userId)
        .single();

      // Solo actualizar si el usuario está en nivel 3 (Cliente VIP)
      if (profile && profile.nivel === 3) {
        const { error } = await supabase
          .from('user_profiles')
          .update({
            nivel: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error('❌ [TrialService] Error actualizando nivel:', error);
          return {
            success: false,
            error: error.message,
          };
        }

        console.log('✅ [TrialService] Trial expirado, nivel reducido a 0');
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('❌ [TrialService] Excepción:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Extiende el trial de un usuario (solo para admin)
 */
export async function extendTrial(userId: string, days: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('trial_expires_at')
      .eq('id', userId)
      .single();

    if (!profile) {
      return {
        success: false,
        error: 'Usuario no encontrado',
      };
    }

    const currentEndDate = new Date(profile.trial_expires_at || Date.now());
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + days);

    const { error } = await supabase
      .from('user_profiles')
      .update({
        trial_expires_at: newEndDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('❌ [TrialService] Error extendiendo trial:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('✅ [TrialService] Trial extendido hasta:', newEndDate);
    return { success: true };
  } catch (error: any) {
    console.error('❌ [TrialService] Excepción:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}


