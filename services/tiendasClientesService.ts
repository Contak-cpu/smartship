import { supabase } from '../lib/supabase';
import { TiendaCliente, TiendaClienteInput, TiendaCompartida, CompartirTiendaInput } from '../types';

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
 * Obtener todas las tiendas de clientes del usuario actual (propias y compartidas)
 */
export const obtenerTiendasClientes = async (userId: string): Promise<TiendaCliente[]> => {
  try {
    // Obtener tiendas propias
    const { data: tiendasPropias, error: errorPropias } = await supabase
      .from('tiendas_clientes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (errorPropias) throw errorPropias;

    // Obtener tiendas compartidas con el usuario
    const { data: tiendasCompartidas, error: errorCompartidas } = await supabase
      .from('tiendas_clientes_compartidas')
      .select(`
        tienda_cliente_id,
        puede_editar,
        usuario_propietario_id,
        tiendas_clientes (*)
      `)
      .eq('usuario_compartido_id', userId);

    if (errorCompartidas) throw errorCompartidas;

    // Procesar tiendas propias
    const tiendas: TiendaCliente[] = (tiendasPropias || []).map(tienda => ({
      ...tienda,
      es_compartida: false,
      puede_editar: true, // El propietario siempre puede editar
    }));

    // Procesar tiendas compartidas
    if (tiendasCompartidas) {
      for (const compartida of tiendasCompartidas) {
        if (compartida.tiendas_clientes) {
          const tienda = compartida.tiendas_clientes as any;
          tiendas.push({
            ...tienda,
            es_compartida: true,
            puede_editar: compartida.puede_editar || false,
            usuario_propietario_id: compartida.usuario_propietario_id,
          });
        }
      }
    }

    return tiendas;
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
 * Obtener una tienda por ID (incluye verificación de acceso compartido)
 */
export const obtenerTiendaPorId = async (tiendaId: string, userId: string): Promise<TiendaCliente | null> => {
  try {
    // Primero intentar obtener como tienda propia
    const { data: tiendaPropia, error: errorPropia } = await supabase
      .from('tiendas_clientes')
      .select('*')
      .eq('id', tiendaId)
      .eq('user_id', userId)
      .maybeSingle();

    if (errorPropia && errorPropia.code !== 'PGRST116') {
      throw errorPropia;
    }

    if (tiendaPropia) {
      return {
        ...tiendaPropia,
        es_compartida: false,
        puede_editar: true,
      };
    }

    // Si no es propia, verificar si está compartida
    const { data: compartida, error: errorCompartida } = await supabase
      .from('tiendas_clientes_compartidas')
      .select(`
        puede_editar,
        usuario_propietario_id,
        tiendas_clientes (*)
      `)
      .eq('tienda_cliente_id', tiendaId)
      .eq('usuario_compartido_id', userId)
      .maybeSingle();

    if (errorCompartida && errorCompartida.code !== 'PGRST116') {
      throw errorCompartida;
    }

    if (compartida && compartida.tiendas_clientes) {
      const tienda = compartida.tiendas_clientes as any;
      return {
        ...tienda,
        es_compartida: true,
        puede_editar: compartida.puede_editar || false,
        usuario_propietario_id: compartida.usuario_propietario_id,
      };
    }

    return null;
  } catch (error) {
    console.error('Error al obtener tienda por ID:', error);
    throw error;
  }
};

/**
 * Buscar usuario por email para compartir tiendas
 */
export const buscarUsuarioPorEmail = async (email: string): Promise<{ id: string; email: string; username: string } | null> => {
  try {
    const { data, error } = await supabase.rpc('buscar_usuario_por_email', {
      p_email: email.trim().toLowerCase(),
    });

    if (error) {
      console.error('Error al buscar usuario:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data[0];
  } catch (error) {
    console.error('Error al buscar usuario por email:', error);
    return null;
  }
};

/**
 * Compartir una tienda con otro usuario (por email)
 */
export const compartirTiendaPorEmail = async (
  tiendaId: string,
  userId: string,
  emailUsuarioCompartido: string,
  puedeEditar: boolean = false
): Promise<TiendaCompartida> => {
  try {
    // Verificar que el usuario es el propietario de la tienda
    const { data: tienda, error: errorTienda } = await supabase
      .from('tiendas_clientes')
      .select('user_id')
      .eq('id', tiendaId)
      .eq('user_id', userId)
      .single();

    if (errorTienda || !tienda) {
      throw new Error('No tienes permisos para compartir esta tienda');
    }

    // Buscar el usuario por email
    const usuarioCompartido = await buscarUsuarioPorEmail(emailUsuarioCompartido);
    
    if (!usuarioCompartido) {
      throw new Error('No se encontró un usuario con ese email');
    }

    // Verificar que no se está compartiendo consigo mismo
    if (userId === usuarioCompartido.id) {
      throw new Error('No puedes compartir una tienda contigo mismo');
    }

    // Compartir la tienda
    const { data, error } = await supabase
      .from('tiendas_clientes_compartidas')
      .insert({
        tienda_cliente_id: tiendaId,
        usuario_propietario_id: userId,
        usuario_compartido_id: usuarioCompartido.id,
        puede_editar: puedeEditar,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Esta tienda ya está compartida con este usuario');
      }
      throw error;
    }

    return {
      ...data,
      usuario_compartido_email: usuarioCompartido.email,
      usuario_compartido_username: usuarioCompartido.username,
    };
  } catch (error: any) {
    console.error('Error al compartir tienda:', error);
    throw error;
  }
};

/**
 * Compartir una tienda con otro usuario (por ID de usuario)
 */
export const compartirTienda = async (
  tiendaId: string,
  userId: string,
  compartirInput: CompartirTiendaInput
): Promise<TiendaCompartida> => {
  try {
    // Verificar que el usuario es el propietario de la tienda
    const { data: tienda, error: errorTienda } = await supabase
      .from('tiendas_clientes')
      .select('user_id')
      .eq('id', tiendaId)
      .eq('user_id', userId)
      .single();

    if (errorTienda || !tienda) {
      throw new Error('No tienes permisos para compartir esta tienda');
    }

    // Verificar que no se está compartiendo consigo mismo
    if (userId === compartirInput.usuario_compartido_id) {
      throw new Error('No puedes compartir una tienda contigo mismo');
    }

    // Compartir la tienda
    const { data, error } = await supabase
      .from('tiendas_clientes_compartidas')
      .insert({
        tienda_cliente_id: tiendaId,
        usuario_propietario_id: userId,
        usuario_compartido_id: compartirInput.usuario_compartido_id,
        puede_editar: compartirInput.puede_editar || false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Esta tienda ya está compartida con este usuario');
      }
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Error al compartir tienda:', error);
    throw error;
  }
};

/**
 * Obtener usuarios con los que está compartida una tienda
 */
export const obtenerUsuariosCompartidos = async (
  tiendaId: string,
  userId: string
): Promise<TiendaCompartida[]> => {
  try {
    // Verificar que el usuario es el propietario
    const { data: tienda, error: errorTienda } = await supabase
      .from('tiendas_clientes')
      .select('user_id')
      .eq('id', tiendaId)
      .eq('user_id', userId)
      .single();

    if (errorTienda || !tienda) {
      throw new Error('No tienes permisos para ver esta información');
    }

    // Obtener usuarios compartidos
    const { data, error } = await supabase
      .from('tiendas_clientes_compartidas')
      .select('*')
      .eq('tienda_cliente_id', tiendaId)
      .eq('usuario_propietario_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Obtener información de los usuarios compartidos usando la función RPC
    const usuariosCompartidos: TiendaCompartida[] = [];
    for (const compartida of data || []) {
      try {
        // Obtener información del usuario compartido por ID
        const { data: usuarioData, error: usuarioError } = await supabase.rpc('obtener_usuario_por_id', {
          p_user_id: compartida.usuario_compartido_id,
        });
        
        if (!usuarioError && usuarioData && usuarioData.length > 0) {
          const usuario = usuarioData[0];
          usuariosCompartidos.push({
            ...compartida,
            usuario_compartido_email: usuario.email,
            usuario_compartido_username: usuario.username,
          });
        } else {
          // Si no se puede obtener, agregar sin información adicional
          usuariosCompartidos.push(compartida);
        }
      } catch (err) {
        // Si hay error, agregar sin información adicional
        usuariosCompartidos.push(compartida);
      }
    }

    return usuariosCompartidos;
  } catch (error) {
    console.error('Error al obtener usuarios compartidos:', error);
    throw error;
  }
};

/**
 * Actualizar permisos de una tienda compartida
 */
export const actualizarPermisosCompartida = async (
  compartidaId: string,
  userId: string,
  puede_editar: boolean
): Promise<TiendaCompartida> => {
  try {
    // Verificar que el usuario es el propietario
    const { data: compartida, error: errorCompartida } = await supabase
      .from('tiendas_clientes_compartidas')
      .select('usuario_propietario_id')
      .eq('id', compartidaId)
      .eq('usuario_propietario_id', userId)
      .single();

    if (errorCompartida || !compartida) {
      throw new Error('No tienes permisos para actualizar esta configuración');
    }

    // Actualizar permisos
    const { data, error } = await supabase
      .from('tiendas_clientes_compartidas')
      .update({ puede_editar })
      .eq('id', compartidaId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error al actualizar permisos compartida:', error);
    throw error;
  }
};

/**
 * Dejar de compartir una tienda con un usuario
 */
export const dejarDeCompartirTienda = async (
  compartidaId: string,
  userId: string
): Promise<void> => {
  try {
    // Verificar que el usuario es el propietario
    const { data: compartida, error: errorCompartida } = await supabase
      .from('tiendas_clientes_compartidas')
      .select('usuario_propietario_id')
      .eq('id', compartidaId)
      .eq('usuario_propietario_id', userId)
      .single();

    if (errorCompartida || !compartida) {
      throw new Error('No tienes permisos para realizar esta acción');
    }

    // Eliminar el acceso compartido
    const { error } = await supabase
      .from('tiendas_clientes_compartidas')
      .delete()
      .eq('id', compartidaId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error al dejar de compartir tienda:', error);
    throw error;
  }
};

/**
 * Buscar usuarios por email o username para compartir tiendas
 */
export const buscarUsuariosParaCompartir = async (busqueda: string): Promise<any[]> => {
  try {
    // Nota: Esta función requiere acceso a auth.users, que puede requerir funciones específicas
    // Por ahora, retornamos un array vacío y la búsqueda se hará desde el frontend
    // usando el email directamente del usuario que quiere compartir
    return [];
  } catch (error) {
    console.error('Error al buscar usuarios:', error);
    throw error;
  }
};

