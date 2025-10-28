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

/**
 * Agregar o actualizar stock
 */
export const guardarStock = async (userId: string, username: string, stockInput: StockInput): Promise<Stock> => {
  try {
    // Verificar si ya existe el SKU para este usuario
    const { data: existingStock } = await supabase
      .from('stock')
      .select('*')
      .eq('user_id', userId)
      .eq('sku', stockInput.sku)
      .single();

    if (existingStock) {
      // Actualizar existente
      const { data, error } = await supabase
        .from('stock')
        .update({
          nombreproducto: stockInput.nombreproducto || null,
          cantidad: stockInput.cantidad,
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
          sku: stockInput.sku,
          nombreproducto: stockInput.nombreproducto || null,
          cantidad: stockInput.cantidad,
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
    // Obtener el stock actual
    const { data: currentStock, error: fetchError } = await supabase
      .from('stock')
      .select('*')
      .eq('user_id', userId)
      .eq('sku', sku)
      .single();

    if (fetchError) {
      console.error('Error al obtener stock:', fetchError);
      return null;
    }

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
 * Descontar múltiples SKUs
 */
export const descontarStockMultiple = async (
  userId: string,
  stockDescontar: Array<{ sku: string; cantidad: number }>
): Promise<number> => {
  let exitosos = 0;
  
  for (const item of stockDescontar) {
    try {
      await descontarStock(userId, item.sku, item.cantidad);
      exitosos++;
    } catch (error) {
      console.error(`Error al descontar stock para SKU ${item.sku}:`, error);
    }
  }
  
  return exitosos;
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
    const { data, error } = await supabase
      .from('stock')
      .select('*')
      .eq('user_id', userId)
      .eq('sku', sku)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No encontrado
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error al buscar stock:', error);
    throw error;
  }
};


