import { supabase } from '../lib/supabase';
import { getAllUsers } from './adminService';

/**
 * Tipos de actividades que se pueden registrar
 */
export type ActivityType = 
  | 'archivo_procesado' 
  | 'pedido_procesado' 
  | 'sku_rotulo_agregado';

/**
 * Interfaz para un log de actividad
 */
export interface UserActivityLog {
  id?: number;
  user_id: string;
  username: string;
  activity_type: ActivityType;
  metadata?: Record<string, any>;
  cantidad: number;
  archivo_nombre?: string;
  created_at?: string;
  bloqueado?: boolean;
}

/**
 * Interfaz para estadísticas de usuario
 */
export interface UserStats {
  user_id: string;
  username: string;
  total_archivos_procesados: number;
  total_pedidos_procesados: number;
  total_sku_rotulos: number;
  ultima_actividad?: string;
}

/**
 * Registra una actividad de usuario
 */
export const registrarActividad = async (
  userId: string,
  username: string,
  activityType: ActivityType,
  cantidad: number = 1,
  archivoNombre?: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const log: UserActivityLog = {
      user_id: userId,
      username,
      activity_type: activityType,
      cantidad,
      archivo_nombre: archivoNombre,
      metadata: metadata || {},
    };

    const { error } = await supabase
      .from('user_activity_logs')
      .insert([log]);

    if (error) {
      console.error('Error registrando actividad:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Actividad registrada: ${activityType} para ${username}`);
    return { success: true };
  } catch (error: any) {
    console.error('Excepción registrando actividad:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene las estadísticas de un usuario específico
 */
export const obtenerEstadisticasUsuario = async (
  userId: string
): Promise<{ stats: UserStats | null; error?: string }> => {
  try {
    // Obtener username del usuario
    const { data: userData, error: userError } = await supabase
      .from('user_activity_logs')
      .select('username')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      // PGRST116 es "no rows returned", que es aceptable si el usuario no tiene logs aún
      console.error('Error obteniendo username:', userError);
    }

    const username = userData?.username || 'Usuario';

    // Obtener estadísticas agregadas (solo no bloqueados)
    const { data: statsData, error: statsError } = await supabase
      .from('user_activity_logs')
      .select('activity_type, cantidad, created_at, bloqueado')
      .eq('user_id', userId)
      .eq('bloqueado', false);

    if (statsError) {
      console.error('Error obteniendo estadísticas:', statsError);
      return { stats: null, error: statsError.message };
    }

    // Calcular estadísticas (solo logs no bloqueados)
    let totalArchivos = 0;
    let totalPedidos = 0;
    let totalSkuRotulos = 0;
    let ultimaActividad: string | undefined;

    if (statsData && statsData.length > 0) {
      // Filtrar solo logs no bloqueados
      const logsActivos = statsData.filter(s => !s.bloqueado);
      
      // Encontrar la última actividad
      const fechas = logsActivos
        .map(s => s.created_at)
        .filter(Boolean)
        .sort()
        .reverse();
      ultimaActividad = fechas[0];

      // Sumar por tipo de actividad
      logsActivos.forEach(stat => {
        switch (stat.activity_type) {
          case 'archivo_procesado':
            totalArchivos += stat.cantidad || 1;
            break;
          case 'pedido_procesado':
            totalPedidos += stat.cantidad || 1;
            break;
          case 'sku_rotulo_agregado':
            totalSkuRotulos += stat.cantidad || 1;
            break;
        }
      });
    }

    const stats: UserStats = {
      user_id: userId,
      username,
      total_archivos_procesados: totalArchivos,
      total_pedidos_procesados: totalPedidos,
      total_sku_rotulos: totalSkuRotulos,
      ultima_actividad: ultimaActividad,
    };

    return { stats };
  } catch (error: any) {
    console.error('Excepción obteniendo estadísticas:', error);
    return { stats: null, error: error.message };
  }
};

/**
 * Obtiene todas las estadísticas de todos los usuarios (solo para administradores)
 */
export const obtenerEstadisticasTodosUsuarios = async (): Promise<{
  stats: UserStats[];
  error?: string;
}> => {
  try {
    // Obtener todos los logs agrupados por usuario (solo no bloqueados)
    const { data: logsData, error: logsError } = await supabase
      .from('user_activity_logs')
      .select('user_id, username, activity_type, cantidad, created_at, bloqueado')
      .eq('bloqueado', false)
      .order('created_at', { ascending: false });

    if (logsError) {
      console.error('Error obteniendo logs:', logsError);
      return { stats: [], error: logsError.message };
    }

    // Agrupar por usuario
    const usuariosMap = new Map<string, UserStats>();

    if (logsData) {
      logsData.forEach(log => {
        // Solo procesar logs no bloqueados
        if (log.bloqueado) return;
        
        const userId = log.user_id;
        
        if (!usuariosMap.has(userId)) {
          usuariosMap.set(userId, {
            user_id: userId,
            username: log.username,
            total_archivos_procesados: 0,
            total_pedidos_procesados: 0,
            total_sku_rotulos: 0,
          });
        }

        const stats = usuariosMap.get(userId)!;
        let ultimaActividad = stats.ultima_actividad || '';

        // Actualizar última actividad
        if (log.created_at && (!ultimaActividad || log.created_at > ultimaActividad)) {
          ultimaActividad = log.created_at;
        }

        // Sumar por tipo
        switch (log.activity_type) {
          case 'archivo_procesado':
            stats.total_archivos_procesados += log.cantidad || 1;
            break;
          case 'pedido_procesado':
            // Sumar la cantidad de pedidos procesados
            const cantidadPedidos = log.cantidad || 1;
            stats.total_pedidos_procesados += cantidadPedidos;
            console.log(`📊 Sumando ${cantidadPedidos} pedidos procesados para usuario ${log.username} (total acumulado: ${stats.total_pedidos_procesados})`);
            break;
          case 'sku_rotulo_agregado':
            stats.total_sku_rotulos += log.cantidad || 1;
            break;
        }

        stats.ultima_actividad = ultimaActividad;
      });
    }

    const stats = Array.from(usuariosMap.values());
    
    // Ordenar por última actividad (más reciente primero)
    stats.sort((a, b) => {
      if (!a.ultima_actividad) return 1;
      if (!b.ultima_actividad) return -1;
      return b.ultima_actividad.localeCompare(a.ultima_actividad);
    });

    return { stats };
  } catch (error: any) {
    console.error('Excepción obteniendo estadísticas de todos los usuarios:', error);
    return { stats: [], error: error.message };
  }
};

/**
 * Obtiene el historial de actividades de un usuario (o todos si no se especifica userId)
 */
export const obtenerHistorialActividades = async (
  userId?: string,
  limit: number = 100,
  incluirBloqueados: boolean = false
): Promise<{ logs: UserActivityLog[]; error?: string }> => {
  try {
    let query = supabase
      .from('user_activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (!incluirBloqueados) {
      query = query.eq('bloqueado', false);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Error obteniendo historial:', error);
      return { logs: [], error: error.message };
    }

    return { logs: data || [] };
  } catch (error: any) {
    console.error('Excepción obteniendo historial:', error);
    return { logs: [], error: error.message };
  }
};

/**
 * Obtiene el total de usuarios activos en el sistema
 */
export const obtenerTotalUsuariosActivos = async (): Promise<{
  total: number;
  error?: string;
}> => {
  try {
    // Usar la función de adminService para obtener todos los usuarios
    const result = await getAllUsers();
    
    if (result.error) {
      console.error('Error obteniendo usuarios activos:', result.error);
      return { total: 0, error: result.error.message || 'Error al obtener usuarios' };
    }

    // Contar usuarios activos (excluir usuarios eliminados o sin email confirmado si es necesario)
    const usuariosActivos = result.data?.filter(user => {
      // Considerar activos a usuarios con email confirmado o que tengan un perfil
      return user.email_confirmed_at !== null || user.id;
    }) || [];

    return { total: usuariosActivos.length };
  } catch (error: any) {
    console.error('Excepción obteniendo total de usuarios activos:', error);
    return { total: 0, error: error.message };
  }
};

/**
 * Elimina un log de actividad (solo para administradores)
 */
export const eliminarLog = async (
  logId: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🗑️ Intentando eliminar log ID:', logId);
    
    const { data, error } = await supabase
      .from('user_activity_logs')
      .delete()
      .eq('id', logId)
      .select();

    if (error) {
      console.error('❌ Error eliminando log:', error);
      console.error('Detalles del error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return { success: false, error: error.message || 'Error desconocido al eliminar log' };
    }

    console.log('✅ Log eliminado correctamente:', data);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Excepción eliminando log:', error);
    return { success: false, error: error.message || 'Error desconocido' };
  }
};

/**
 * Bloquea o desbloquea un log de actividad (solo para administradores)
 */
export const bloquearLog = async (
  logId: number,
  bloquear: boolean
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`🔒 Intentando ${bloquear ? 'bloquear' : 'desbloquear'} log ID:`, logId);
    
    const { data, error } = await supabase
      .from('user_activity_logs')
      .update({ bloqueado: bloquear })
      .eq('id', logId)
      .select();

    if (error) {
      console.error(`❌ Error ${bloquear ? 'bloqueando' : 'desbloqueando'} log:`, error);
      console.error('Detalles del error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return { success: false, error: error.message || `Error desconocido al ${bloquear ? 'bloquear' : 'desbloquear'} log` };
    }

    console.log(`✅ Log ${bloquear ? 'bloqueado' : 'desbloqueado'} correctamente:`, data);
    return { success: true };
  } catch (error: any) {
    console.error(`❌ Excepción ${bloquear ? 'bloqueando' : 'desbloqueando'} log:`, error);
    return { success: false, error: error.message || 'Error desconocido' };
  }
};

