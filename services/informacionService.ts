// Servicio para gestionar información de pedidos y stock con Supabase
import { supabase } from '../lib/supabase';

export interface PedidoProcesado {
  id?: number;
  user_id: string;
  username?: string; // Opcional, solo para referencia
  numeroPedido: string;
  emailCliente: string;
  nombreCliente?: string;
  apellidoCliente?: string;
  telefono?: string;
  direccion?: string;
  provincia?: string;
  localidad?: string;
  codigoPostal?: string;
  tipoEnvio: 'domicilio' | 'sucursal';
  fechaProcesamiento: string;
  archivoOrigen: string;
}

export interface ProductoPedido {
  id?: number;
  pedido_id: number;
  user_id: string;
  username?: string;
  sku?: string;
  nombreProducto?: string;
  cantidad: number;
  precioUnitario?: number;
}

export interface StockDespachado {
  id?: number;
  user_id: string;
  username?: string;
  sku: string;
  nombreproducto?: string; // Cambiar a minúsculas para coincidir con la BD
  cantidad: number;
  numeropedido?: string; // Cambiar a minúsculas para coincidir con la BD
  fechadespacho: string; // Cambiar a minúsculas para coincidir con la BD
  archivorotulo?: string; // Cambiar a minúsculas para coincidir con la BD
}

export interface EstadisticasUsuario {
  total_pedidos: number;
  clientes_unicos: number;
  pedidos_domicilio: number;
  pedidos_sucursal: number;
  total_productos: number;
  skus_diferentes: number;
  stock_total_despachado: number;
}

/**
 * Verifica si un pedido ya existe en la base de datos
 */
export const verificarPedidoDuplicado = async (
  userId: string,
  numeroPedido: string,
  emailCliente: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('verificar_pedido_duplicado', {
        p_user_id: userId,
        p_numero_pedido: numeroPedido,
        p_email_cliente: emailCliente
      });

    if (error) {
      console.error('Error verificando duplicado:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error en verificarPedidoDuplicado:', error);
    return false;
  }
};

/**
 * Guarda un pedido procesado evitando duplicados
 */
export const guardarPedidoProcesado = async (
  pedido: PedidoProcesado
): Promise<{ success: boolean; pedidoId?: number; isDuplicate?: boolean }> => {
  try {
    // Verificar si ya existe
    const isDuplicate = await verificarPedidoDuplicado(
      pedido.user_id,
      pedido.numeroPedido,
      pedido.emailCliente
    );

    if (isDuplicate) {
      console.log(`Pedido duplicado detectado: ${pedido.numeroPedido} - ${pedido.emailCliente}`);
      return { success: true, isDuplicate: true };
    }

    // Insertar el pedido
    const { data, error } = await supabase
      .from('pedidos_procesados')
      .insert([pedido])
      .select('id')
      .single();

    if (error) {
      console.error('Error guardando pedido:', error);
      return { success: false };
    }

    return { success: true, pedidoId: data.id, isDuplicate: false };
  } catch (error) {
    console.error('Error en guardarPedidoProcesado:', error);
    return { success: false };
  }
};

/**
 * Guarda múltiples pedidos de un archivo CSV
 */
export const guardarPedidosDesdeCSV = async (
  pedidos: PedidoProcesado[]
): Promise<{ 
  success: boolean; 
  guardados: number; 
  duplicados: number;
  errores: number;
}> => {
  let guardados = 0;
  let duplicados = 0;
  let errores = 0;

  for (const pedido of pedidos) {
    const resultado = await guardarPedidoProcesado(pedido);
    
    if (resultado.success) {
      if (resultado.isDuplicate) {
        duplicados++;
      } else {
        guardados++;
      }
    } else {
      errores++;
    }
  }

  return { success: true, guardados, duplicados, errores };
};

/**
 * Guarda productos de un pedido
 */
export const guardarProductosPedido = async (
  productos: ProductoPedido[]
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('productos_pedidos')
      .insert(productos);

    if (error) {
      console.error('Error guardando productos:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error en guardarProductosPedido:', error);
    return false;
  }
};

/**
 * Guarda stock despachado de un rótulo PDF
 */
export const guardarStockDespachado = async (
  stock: StockDespachado[]
): Promise<boolean> => {
  try {
    console.log('🔄 [InformacionService] Guardando stock despachado:', {
      cantidad: stock.length,
      primerItem: stock[0] ? {
        sku: stock[0].sku,
        cantidad: stock[0].cantidad,
        numeropedido: stock[0].numeropedido,
        fechadespacho: stock[0].fechadespacho
      } : null
    });

    const { error } = await supabase
      .from('stock_despachado')
      .insert(stock);

    if (error) {
      console.error('❌ [InformacionService] Error guardando stock despachado:', error);
      console.error('Detalles del error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return false;
    }

    console.log(`✅ [InformacionService] Stock despachado guardado: ${stock.length} items`);
    return true;
  } catch (error) {
    console.error('❌ [InformacionService] Error en guardarStockDespachado:', error);
    return false;
  }
};

/**
 * Obtiene estadísticas completas del usuario
 */
export const obtenerEstadisticasUsuario = async (
  userId: string
): Promise<EstadisticasUsuario | null> => {
  try {
    const { data, error } = await supabase
      .rpc('obtener_estadisticas_usuario', {
        p_user_id: userId
      });

    if (error) {
      console.error('Error obteniendo estadísticas:', error);
      return null;
    }

    return data[0] || null;
  } catch (error) {
    console.error('Error en obtenerEstadisticasUsuario:', error);
    return null;
  }
};

/**
 * Obtiene todos los pedidos del usuario
 */
export const obtenerPedidosUsuario = async (
  userId: string,
  limit: number = 100
): Promise<PedidoProcesado[]> => {
  try {
    const { data, error } = await supabase
      .from('pedidos_procesados')
      .select('*')
      .eq('user_id', userId)
      .order('fechaProcesamiento', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error obteniendo pedidos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error en obtenerPedidosUsuario:', error);
    return [];
  }
};

/**
 * Obtiene stock despachado por SKU
 */
export const obtenerStockPorSKU = async (
  userId: string
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('stock_por_sku')
      .select('*')
      .eq('user_id', userId)
      .order('cantidad_total_despachada', { ascending: false });

    if (error) {
      console.error('Error obteniendo stock por SKU:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error en obtenerStockPorSKU:', error);
    return [];
  }
};

/**
 * Obtiene clientes recurrentes (que han comprado más de una vez)
 */
export const obtenerClientesRecurrentes = async (
  userId: string
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('pedidos_procesados')
      .select('emailCliente, nombreCliente, apellidoCliente')
      .eq('user_id', userId);

    if (error) {
      console.error('Error obteniendo clientes:', error);
      return [];
    }

    // Agrupar por email y contar
    const clientesMap = new Map();
    
    data.forEach(pedido => {
      const email = pedido.emailCliente;
      if (clientesMap.has(email)) {
        clientesMap.get(email).count++;
      } else {
        clientesMap.set(email, {
          email,
          nombre: pedido.nombreCliente,
          apellido: pedido.apellidoCliente,
          count: 1
        });
      }
    });

    // Filtrar solo los que compraron más de una vez
    return Array.from(clientesMap.values())
      .filter(cliente => cliente.count > 1)
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error en obtenerClientesRecurrentes:', error);
    return [];
  }
};

