import { supabase } from '../lib/supabase';
import { Stock, StockInput } from '../types';

/**
 * Obtener todo el stock del usuario actual
 */
export const obtenerStock = async (userId: string): Promise<Stock[]> => {
  try {
    const { data, error } = await supabase
      .from('stock')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener stock:', error);
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
 * Agregar o actualizar stock
 */
export const guardarStock = async (userId: string, username: string, stockInput: StockInput): Promise<Stock> => {
  try {
    const skuSanitizado = stockInput.sku.trim();

    // Verificar si ya existe el SKU para este usuario
    const { data: existingStock } = await supabase
      .from('stock')
      .select('*')
      .eq('user_id', userId)
      .eq('sku', skuSanitizado)
      .single();

    if (existingStock) {
      // Actualizar existente
      const { data, error } = await supabase
        .from('stock')
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

      if (error) throw error;
      return data;
    } else {
      // Crear nuevo
      const { data, error } = await supabase
        .from('stock')
        .insert({
          user_id: userId,
          username,
          sku: skuSanitizado,
          nombreproducto: stockInput.nombreproducto || null,
          cantidad: stockInput.cantidad,
          equivalencia: stockInput.equivalencia ?? 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error al guardar stock:', error);
    throw error;
  }
};

/**
 * Descontar cantidad del stock
 */
export const descontarStock = async (
  userId: string,
  sku: string,
  cantidadDescontar: number
): Promise<Stock | null> => {
  try {
    const currentStock = await buscarStockPorSKU(userId, sku);

    if (!currentStock) {
      console.warn(`No se encontró stock para SKU: ${sku}`);
      return null;
    }

    // Calcular nueva cantidad
    const nuevaCantidad = currentStock.cantidad - cantidadDescontar;

    // Actualizar o eliminar según corresponda
    if (nuevaCantidad <= 0) {
      // Si la cantidad llega a 0 o menos, eliminar el registro
      const { error } = await supabase
        .from('stock')
        .delete()
        .eq('id', currentStock.id);

      if (error) throw error;
      return null;
    } else {
      // Actualizar la cantidad
      const { data, error } = await supabase
        .from('stock')
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
    console.error('Error al descontar stock:', error);
    throw error;
  }
};

/**
 * Eliminar item de stock
 */
export const eliminarStock = async (stockId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('stock')
      .delete()
      .eq('id', stockId);

    if (error) throw error;
  } catch (error) {
    console.error('Error al eliminar stock:', error);
    throw error;
  }
};

/**
 * Buscar stock por SKU
 */
export const buscarStockPorSKU = async (userId: string, sku: string): Promise<Stock | null> => {
  try {
    const stockActual = await obtenerStock(userId);
    const claveBuscada = crearClaveSkuInterna(sku);
    return stockActual.find(item => crearClaveSkuInterna(item.sku) === claveBuscada) || null;
  } catch (error) {
    console.error('Error al buscar stock:', error);
    throw error;
  }
};

/**
 * Descontar múltiples SKUs
 */
export const descontarStockMultiple = async (
  userId: string,
  stockDescontar: Array<{ sku: string; cantidad: number }>
): Promise<{ exitosos: number; errores: Array<{ sku: string; motivo: string }> }> => {
  let exitosos = 0;
  const errores: Array<{ sku: string; motivo: string }> = [];

  const { data: stockActual, error: stockError } = await supabase
    .from('stock')
    .select('*')
    .eq('user_id', userId);

  if (stockError) {
    console.error('Error al obtener stock para descuento:', stockError);
    return { exitosos, errores: [{ sku: 'GLOBAL', motivo: 'No se pudo obtener el stock del usuario' }] };
  }

  const stockMap = new Map<string, Stock>();
  stockActual?.forEach(item => {
    stockMap.set(crearClaveSkuInterna(item.sku), item);
  });

  for (const item of stockDescontar) {
    try {
      const claveSku = crearClaveSkuInterna(item.sku);
      const registroStock = stockMap.get(claveSku);

      if (!registroStock) {
        errores.push({ sku: item.sku, motivo: 'SKU no encontrado en tu stock' });
        continue;
      }

      const factorEquivalencia = registroStock.equivalencia ?? 1;
      const totalADescontar = item.cantidad * factorEquivalencia;
      const nuevaCantidad = registroStock.cantidad - totalADescontar;

      if (nuevaCantidad <= 0) {
        const { error: deleteError } = await supabase
          .from('stock')
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
          .from('stock')
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


