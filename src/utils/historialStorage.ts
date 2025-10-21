// Utilidades para gestionar el historial de archivos procesados con Supabase
import { supabase } from '../../lib/supabase';

export interface HistorialSmartShip {
  id: string;
  fecha: string;
  hora: string;
  nombreArchivo: string;
  totalRegistros: number;
  domicilio: {
    cantidad: number;
    datos: any[];
  };
  sucursal: {
    cantidad: number;
    datos: any[];
  };
  username?: string;
  created_at?: string;
}

export interface HistorialSKU {
  id: string;
  fecha: string;
  hora: string;
  nombreArchivo: string;
  cantidadRegistros: number;
  pdfData: string; // Base64 del PDF
  username?: string;
  created_at?: string;
}

/**
 * Guarda un archivo procesado de SmartShip en el historial usando Supabase
 * @param nombreArchivo Nombre del archivo CSV original
 * @param datosDomicilio Array de datos procesados para domicilio
 * @param datosSucursal Array de datos procesados para sucursal
 * @param username Nombre del usuario
 */
export const guardarEnHistorialSmartShip = async (
  nombreArchivo: string,
  datosDomicilio: any[],
  datosSucursal: any[],
  username: string,
  userId?: string
): Promise<void> => {
  try {
    const now = new Date();
    const nuevoItem = {
      nombrearchivo: nombreArchivo, // Usar nombre en minúsculas para coincidir con la BD
      totalregistros: datosDomicilio.length + datosSucursal.length, // Usar nombre en minúsculas
      domiciliodata: JSON.stringify({
        cantidad: datosDomicilio.length,
        datos: datosDomicilio,
      }),
      sucursaldata: JSON.stringify({
        cantidad: datosSucursal.length,
        datos: datosSucursal,
      }),
      username,
      fecha: now.toLocaleDateString('es-AR'),
      hora: now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      user_id: userId, // Agregar user_id para las políticas RLS
    };

    console.log('🔄 [HistorialStorage] Intentando guardar en Supabase:', {
      nombreArchivo,
      totalRegistros: nuevoItem.totalregistros,
      domicilio: datosDomicilio.length,
      sucursal: datosSucursal.length,
      username,
      userId
    });

    const { error } = await supabase
      .from('historial_smartship')
      .insert([nuevoItem]);

    if (error) {
      console.error('❌ [HistorialStorage] Error al guardar en Supabase:', error);
      // Fallback a localStorage si falla Supabase
      const storageKey = `historial_smartship_${username}`;
      const historialStr = localStorage.getItem(storageKey);
      const historial = historialStr ? JSON.parse(historialStr) : [];
      historial.unshift({ id: `smartship_${now.getTime()}`, ...nuevoItem });
      localStorage.setItem(storageKey, JSON.stringify(historial.slice(0, 50)));
      console.log('✅ [HistorialStorage] Guardado en localStorage como fallback');
    } else {
      console.log('✅ [HistorialStorage] Archivo guardado en Supabase para', username, ':', nombreArchivo);
    }
  } catch (error) {
    console.error('❌ [HistorialStorage] Error al guardar en historial SmartShip:', error);
  }
};

/**
 * Guarda un PDF procesado con SKU en el historial usando Supabase
 * @param nombreArchivo Nombre del archivo original
 * @param cantidadRegistros Cantidad de registros procesados
 * @param pdfBase64 PDF codificado en base64
 * @param username Nombre del usuario
 */
export const guardarEnHistorialSKU = async (
  nombreArchivo: string,
  cantidadRegistros: number,
  pdfBase64: string,
  username: string,
  userId?: string
): Promise<void> => {
  try {
    const now = new Date();
    const nuevoItem = {
      nombrearchivo: nombreArchivo, // Usar nombre en minúsculas para coincidir con la BD
      cantidadregistros: cantidadRegistros, // Usar nombre en minúsculas
      pdfdata: pdfBase64, // Usar nombre en minúsculas
      username,
      fecha: now.toLocaleDateString('es-AR'),
      hora: now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      user_id: userId, // Agregar user_id para las políticas RLS
    };

    console.log('🔄 [HistorialStorage] Intentando guardar PDF en Supabase:', {
      nombreArchivo,
      cantidadRegistros,
      username,
      userId
    });

    const { error } = await supabase
      .from('historial_sku')
      .insert([nuevoItem]);

    if (error) {
      console.error('❌ [HistorialStorage] Error al guardar PDF en Supabase:', error);
      // Fallback a localStorage si falla Supabase
      const storageKey = `historial_sku_${username}`;
      const historialStr = localStorage.getItem(storageKey);
      const historial = historialStr ? JSON.parse(historialStr) : [];
      historial.unshift({ id: `sku_${now.getTime()}`, ...nuevoItem });
      localStorage.setItem(storageKey, JSON.stringify(historial.slice(0, 20)));
      console.log('✅ [HistorialStorage] PDF guardado en localStorage como fallback');
    } else {
      console.log('✅ [HistorialStorage] PDF guardado en Supabase para', username, ':', nombreArchivo);
    }
  } catch (error) {
    console.error('❌ [HistorialStorage] Error al guardar en historial SKU:', error);
  }
};

/**
 * Obtiene el historial de SmartShip para un usuario específico desde Supabase
 * @param username Nombre del usuario
 * @returns Array de items del historial
 */
export const obtenerHistorialSmartShip = async (username: string): Promise<HistorialSmartShip[]> => {
  try {
    const { data, error } = await supabase
      .from('historial_smartship')
      .select('*')
      .eq('username', username)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error al obtener historial desde Supabase:', error);
      // Fallback a localStorage
      const storageKey = `historial_smartship_${username}`;
      const historialStr = localStorage.getItem(storageKey);
      return historialStr ? JSON.parse(historialStr) : [];
    }

    // Transformar datos de Supabase al formato esperado
    return (data || []).map(item => ({
      id: item.id.toString(),
      fecha: item.fecha,
      hora: item.hora,
      nombreArchivo: item.nombrearchivo, // Mapear desde minúsculas a camelCase
      totalRegistros: item.totalregistros, // Mapear desde minúsculas a camelCase
      domicilio: JSON.parse(item.domiciliodata), // Mapear desde minúsculas a camelCase
      sucursal: JSON.parse(item.sucursaldata), // Mapear desde minúsculas a camelCase
    }));
  } catch (error) {
    console.error('Error al obtener historial SmartShip:', error);
    return [];
  }
};

/**
 * Obtiene el historial de SKU en Rótulos para un usuario específico desde Supabase
 * @param username Nombre del usuario
 * @returns Array de items del historial
 */
export const obtenerHistorialSKU = async (username: string): Promise<HistorialSKU[]> => {
  try {
    const { data, error } = await supabase
      .from('historial_sku')
      .select('*')
      .eq('username', username)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error al obtener historial SKU desde Supabase:', error);
      // Fallback a localStorage
      const storageKey = `historial_sku_${username}`;
      const historialStr = localStorage.getItem(storageKey);
      return historialStr ? JSON.parse(historialStr) : [];
    }

    // Transformar datos de Supabase al formato esperado
    return (data || []).map(item => ({
      id: item.id.toString(),
      fecha: item.fecha,
      hora: item.hora,
      nombreArchivo: item.nombrearchivo, // Mapear desde minúsculas a camelCase
      cantidadRegistros: item.cantidadregistros, // Mapear desde minúsculas a camelCase
      pdfData: item.pdfdata, // Mapear desde minúsculas a camelCase
    }));
  } catch (error) {
    console.error('Error al obtener historial SKU:', error);
    return [];
  }
};

