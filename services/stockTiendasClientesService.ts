import { supabase } from '../lib/supabase';
import { StockTiendaCliente, StockTiendaClienteInput } from '../types';

/**
 * Obtener todo el stock de una tienda de cliente específica
 */
export const obtenerStockTienda = async (tiendaClienteId: string): Promise<StockTiendaCliente[]> => {
  try {
    const { data, error } = await supabase
      .from('stock_tiendas_clientes')
      .select('*')
      .eq('tienda_cliente_id', tiendaClienteId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener stock de tienda:', error);
      // Si el error es que no encuentra la tabla, dar un mensaje más claro
      if (error.message?.includes('Could not find the table') || error.code === '42P01') {
        throw new Error('La tabla de stock de tiendas no está disponible. Por favor, recarga la página completamente (Ctrl+Shift+R o Cmd+Shift+R) para actualizar el esquema.');
      }
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error('Error al obtener stock de tienda:', error);
    throw error;
  }
};

const crearClaveSkuInterna = (sku: string): string => {
  if (!sku) return '';
  return sku
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

export const crearClaveSku = crearClaveSkuInterna;

/**
 * Agregar o actualizar stock de una tienda
 */
export const guardarStockTienda = async (
  userId: string,
  username: string,
  tiendaClienteId: string,
  stockInput: StockTiendaClienteInput
): Promise<StockTiendaCliente> => {
  try {
    const skuSanitizado = stockInput.sku.trim();

    // Verificar si ya existe el SKU para esta tienda
    const { data: existingStockData, error: searchError } = await supabase
      .from('stock_tiendas_clientes')
      .select('*')
      .eq('tienda_cliente_id', tiendaClienteId)
      .eq('sku', skuSanitizado)
      .maybeSingle();

    // Si hay un error que no sea "no encontrado", lanzarlo
    if (searchError && searchError.code !== 'PGRST116') {
      throw searchError;
    }

    const existingStock = existingStockData;

    if (existingStock) {
      // Actualizar existente
      const { data, error } = await supabase
        .from('stock_tiendas_clientes')
        .update({
          nombreproducto: stockInput.nombreproducto || null,
          cantidad: stockInput.cantidad,
          equivalencia: stockInput.equivalencia ?? 1,
          fecha_actualizacion: new Date().toISOString(),
          username, // Actualizar username por si cambió
        })
        .eq('id', existingStock.id)
        .select()
        .single();

      if (error) {
        // Si el error es que no encuentra la tabla, dar un mensaje más claro
        if (error.message?.includes('Could not find the table') || error.code === '42P01') {
          throw new Error('La tabla de stock de tiendas no está disponible. Por favor, recarga la página completamente (Ctrl+Shift+R o Cmd+Shift+R) para actualizar el esquema.');
        }
        throw error;
      }
      return data;
    } else {
      // Crear nuevo
      const { data, error } = await supabase
        .from('stock_tiendas_clientes')
        .insert({
          user_id: userId,
          tienda_cliente_id: tiendaClienteId,
          username,
          sku: skuSanitizado,
          nombreproducto: stockInput.nombreproducto || null,
          cantidad: stockInput.cantidad,
          equivalencia: stockInput.equivalencia ?? 1,
        })
        .select()
        .single();

      if (error) {
        // Si el error es que no encuentra la tabla, dar un mensaje más claro
        if (error.message?.includes('Could not find the table') || error.code === '42P01') {
          throw new Error('La tabla de stock de tiendas no está disponible. Por favor, recarga la página completamente (Ctrl+Shift+R o Cmd+Shift+R) para actualizar el esquema.');
        }
        throw error;
      }
      return data;
    }
  } catch (error: any) {
    console.error('Error al guardar stock de tienda:', error);
    console.error('Detalles del error:', {
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
      userId,
      tiendaClienteId,
      sku: skuSanitizado,
    });
    // Proporcionar un mensaje de error más descriptivo
    let errorMessage = 'Error desconocido al guardar stock';
    if (error?.message) {
      errorMessage = error.message;
    } else if (error?.code === '23505') {
      errorMessage = 'Ya existe un producto con este SKU en esta tienda';
    } else if (error?.code === '23503') {
      errorMessage = 'La tienda seleccionada no existe o no tienes permisos';
    } else if (error?.code === '42501') {
      errorMessage = 'No tienes permisos para realizar esta acción';
    }
    throw new Error(errorMessage);
  }
};

/**
 * Descontar cantidad del stock de una tienda
 */
export const descontarStockTienda = async (
  tiendaClienteId: string,
  sku: string,
  cantidadDescontar: number
): Promise<StockTiendaCliente | null> => {
  try {
    const currentStock = await buscarStockTiendaPorSKU(tiendaClienteId, sku);

    if (!currentStock) {
      console.warn(`No se encontró stock para SKU: ${sku} en la tienda`);
      return null;
    }

    // Calcular nueva cantidad
    const nuevaCantidad = currentStock.cantidad - cantidadDescontar;

    // Actualizar o eliminar según corresponda
    if (nuevaCantidad <= 0) {
      // Si la cantidad llega a 0 o menos, eliminar el registro
      const { error } = await supabase
        .from('stock_tiendas_clientes')
        .delete()
        .eq('id', currentStock.id);

      if (error) throw error;
      return null;
    } else {
      // Actualizar la cantidad
      const { data, error } = await supabase
        .from('stock_tiendas_clientes')
        .update({
          cantidad: nuevaCantidad,
          fecha_actualizacion: new Date().toISOString(),
        })
        .eq('id', currentStock.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error al descontar stock de tienda:', error);
    throw error;
  }
};

/**
 * Eliminar item de stock de una tienda
 */
export const eliminarStockTienda = async (stockId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('stock_tiendas_clientes')
      .delete()
      .eq('id', stockId);

    if (error) throw error;
  } catch (error) {
    console.error('Error al eliminar stock de tienda:', error);
    throw error;
  }
};

/**
 * Buscar stock por SKU en una tienda específica
 */
export const buscarStockTiendaPorSKU = async (
  tiendaClienteId: string,
  sku: string
): Promise<StockTiendaCliente | null> => {
  try {
    const stockActual = await obtenerStockTienda(tiendaClienteId);
    const claveBuscada = crearClaveSkuInterna(sku);
    return stockActual.find(item => crearClaveSkuInterna(item.sku) === claveBuscada) || null;
  } catch (error) {
    console.error('Error al buscar stock de tienda:', error);
    throw error;
  }
};

/**
 * Descontar múltiples SKUs del stock de una tienda
 */
export const descontarStockTiendaMultiple = async (
  tiendaClienteId: string,
  stockDescontar: Array<{ sku: string; cantidad: number }>
): Promise<{ exitosos: number; errores: Array<{ sku: string; motivo: string }> }> => {
  let exitosos = 0;
  const errores: Array<{ sku: string; motivo: string }> = [];

  const { data: stockActual, error: stockError } = await supabase
    .from('stock_tiendas_clientes')
    .select('*')
    .eq('tienda_cliente_id', tiendaClienteId);

  if (stockError) {
    console.error('Error al obtener stock de tienda para descuento:', stockError);
    return { exitosos, errores: [{ sku: 'GLOBAL', motivo: 'No se pudo obtener el stock de la tienda' }] };
  }

  const stockMap = new Map<string, StockTiendaCliente>();
  stockActual?.forEach(item => {
    stockMap.set(crearClaveSkuInterna(item.sku), item);
  });

  for (const item of stockDescontar) {
    try {
      const claveSku = crearClaveSkuInterna(item.sku);
      const registroStock = stockMap.get(claveSku);

      if (!registroStock) {
        errores.push({ sku: item.sku, motivo: 'SKU no encontrado en el stock de la tienda' });
        continue;
      }

      const factorEquivalencia = registroStock.equivalencia ?? 1;
      const totalADescontar = item.cantidad * factorEquivalencia;
      const nuevaCantidad = registroStock.cantidad - totalADescontar;

      if (nuevaCantidad <= 0) {
        const { error: deleteError } = await supabase
          .from('stock_tiendas_clientes')
          .delete()
          .eq('id', registroStock.id);

        if (deleteError) {
          console.error(`Error al eliminar stock para SKU ${item.sku}:`, deleteError);
          errores.push({ sku: item.sku, motivo: 'No se pudo eliminar el registro de stock' });
          continue;
        }

        stockMap.delete(claveSku);
      } else {
        const { data, error: updateError } = await supabase
          .from('stock_tiendas_clientes')
          .update({
            cantidad: nuevaCantidad,
            fecha_actualizacion: new Date().toISOString(),
          })
          .eq('id', registroStock.id)
          .select()
          .single();

        if (updateError) {
          console.error(`Error al actualizar stock para SKU ${item.sku}:`, updateError);
          errores.push({ sku: item.sku, motivo: 'No se pudo actualizar el stock' });
          continue;
        }

        stockMap.set(claveSku, { ...registroStock, ...data });
      }

      exitosos++;
    } catch (error) {
      console.error(`Error al descontar stock para SKU ${item.sku}:`, error);
      errores.push({ sku: item.sku, motivo: 'Error al descontar stock' });
    }
  }

  return { exitosos, errores };
};

