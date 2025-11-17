import { supabase } from '../lib/supabase';
import { TiendaCliente, TiendaClienteInput } from '../types';

/**
 * Verifica si un usuario tiene acceso Pro+ (nivel 4) o es un usuario específico permitido
 */
export function isProPlusUser(userLevel: number, username: string): boolean {
  // Usuarios Pro+ tienen nivel 4
  if (userLevel >= 4) {
    return true;
  }
  
  // Usuarios específicos permitidos (como "yael")
  const allowedUsers = ['yael', 'yaelamallo02'];
  return allowedUsers.includes(username.toLowerCase());
}

/**
 * Obtener todas las tiendas de clientes del usuario actual
 */
export const obtenerTiendasClientes = async (userId: string): Promise<TiendaCliente[]> => {
  try {
    const { data, error } = await supabase
      .from('tiendas_clientes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener tiendas de clientes:', error);
    throw error;
  }
};

/**
 * Obtener tiendas activas del usuario
 */
export const obtenerTiendasActivas = async (userId: string): Promise<TiendaCliente[]> => {
  try {
    const { data, error } = await supabase
      .from('tiendas_clientes')
      .select('*')
      .eq('user_id', userId)
      .eq('activa', true)
      .order('nombre_tienda', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener tiendas activas:', error);
    throw error;
  }
};

/**
 * Crear una nueva tienda de cliente
 */
export const crearTiendaCliente = async (
  userId: string,
  username: string,
  tiendaInput: TiendaClienteInput
): Promise<TiendaCliente> => {
  try {
    const { data, error } = await supabase
      .from('tiendas_clientes')
      .insert({
        user_id: userId,
        username,
        nombre_tienda: tiendaInput.nombre_tienda.trim(),
        descripcion: tiendaInput.descripcion?.trim() || null,
        activa: tiendaInput.activa ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al crear tienda de cliente:', error);
    throw error;
  }
};

/**
 * Actualizar una tienda de cliente
 */
export const actualizarTiendaCliente = async (
  tiendaId: string,
  tiendaInput: TiendaClienteInput
): Promise<TiendaCliente> => {
  try {
    const { data, error } = await supabase
      .from('tiendas_clientes')
      .update({
        nombre_tienda: tiendaInput.nombre_tienda.trim(),
        descripcion: tiendaInput.descripcion?.trim() || null,
        activa: tiendaInput.activa ?? true,
      })
      .eq('id', tiendaId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al actualizar tienda de cliente:', error);
    throw error;
  }
};

/**
 * Eliminar una tienda de cliente
 */
export const eliminarTiendaCliente = async (tiendaId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tiendas_clientes')
      .delete()
      .eq('id', tiendaId);

    if (error) throw error;
  } catch (error) {
    console.error('Error al eliminar tienda de cliente:', error);
    throw error;
  }
};

/**
 * Obtener una tienda por ID
 */
export const obtenerTiendaPorId = async (tiendaId: string): Promise<TiendaCliente | null> => {
  try {
    const { data, error } = await supabase
      .from('tiendas_clientes')
      .select('*')
      .eq('id', tiendaId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No encontrado
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error al obtener tienda por ID:', error);
    throw error;
  }
};

