// Utilidades para gestionar el historial de archivos procesados

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
}

export interface HistorialSKU {
  id: string;
  fecha: string;
  hora: string;
  nombreArchivo: string;
  cantidadRegistros: number;
  pdfData: string; // Base64 del PDF
}

/**
 * Guarda un archivo procesado de SmartShip en el historial
 * @param nombreArchivo Nombre del archivo CSV original
 * @param datosDomicilio Array de datos procesados para domicilio
 * @param datosSucursal Array de datos procesados para sucursal
 */
export const guardarEnHistorialSmartShip = (
  nombreArchivo: string,
  datosDomicilio: any[],
  datosSucursal: any[]
): void => {
  try {
    const now = new Date();
    const nuevoItem: HistorialSmartShip = {
      id: `smartship_${now.getTime()}`,
      fecha: now.toLocaleDateString('es-AR'),
      hora: now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      nombreArchivo,
      totalRegistros: datosDomicilio.length + datosSucursal.length,
      domicilio: {
        cantidad: datosDomicilio.length,
        datos: datosDomicilio,
      },
      sucursal: {
        cantidad: datosSucursal.length,
        datos: datosSucursal,
      },
    };

    // Obtener historial existente
    const historialStr = localStorage.getItem('historial_smartship');
    const historial: HistorialSmartShip[] = historialStr ? JSON.parse(historialStr) : [];

    // Agregar nuevo item al inicio
    historial.unshift(nuevoItem);

    // Limitar a 50 items máximo
    const historialLimitado = historial.slice(0, 50);

    // Guardar en localStorage
    localStorage.setItem('historial_smartship', JSON.stringify(historialLimitado));

    console.log('Archivo guardado en historial SmartShip:', nombreArchivo);
  } catch (error) {
    console.error('Error al guardar en historial SmartShip:', error);
  }
};

/**
 * Guarda un PDF procesado con SKU en el historial
 * @param nombreArchivo Nombre del archivo original
 * @param cantidadRegistros Cantidad de registros procesados
 * @param pdfBase64 PDF codificado en base64
 */
export const guardarEnHistorialSKU = (
  nombreArchivo: string,
  cantidadRegistros: number,
  pdfBase64: string
): void => {
  try {
    const now = new Date();
    const nuevoItem: HistorialSKU = {
      id: `sku_${now.getTime()}`,
      fecha: now.toLocaleDateString('es-AR'),
      hora: now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      nombreArchivo,
      cantidadRegistros,
      pdfData: pdfBase64,
    };

    // Obtener historial existente
    const historialStr = localStorage.getItem('historial_sku');
    const historial: HistorialSKU[] = historialStr ? JSON.parse(historialStr) : [];

    // Agregar nuevo item al inicio
    historial.unshift(nuevoItem);

    // Limitar a 20 items máximo (PDFs ocupan más espacio)
    const historialLimitado = historial.slice(0, 20);

    // Guardar en localStorage
    localStorage.setItem('historial_sku', JSON.stringify(historialLimitado));

    console.log('PDF guardado en historial SKU:', nombreArchivo);
  } catch (error) {
    console.error('Error al guardar en historial SKU:', error);
    // Si el localStorage está lleno, intentar limpiar items antiguos
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      try {
        const historialStr = localStorage.getItem('historial_sku');
        const historial: HistorialSKU[] = historialStr ? JSON.parse(historialStr) : [];
        // Reducir a 10 items
        const historialReducido = historial.slice(0, 10);
        localStorage.setItem('historial_sku', JSON.stringify(historialReducido));
        
        // Intentar guardar nuevamente
        historial.unshift(nuevoItem);
        localStorage.setItem('historial_sku', JSON.stringify(historialReducido.slice(0, 10)));
        
        console.warn('Historial SKU reducido debido a límite de almacenamiento');
      } catch (retryError) {
        console.error('No se pudo guardar el PDF en historial:', retryError);
      }
    }
  }
};

/**
 * Obtiene el historial de SmartShip
 * @returns Array de items del historial
 */
export const obtenerHistorialSmartShip = (): HistorialSmartShip[] => {
  try {
    const historialStr = localStorage.getItem('historial_smartship');
    return historialStr ? JSON.parse(historialStr) : [];
  } catch (error) {
    console.error('Error al obtener historial SmartShip:', error);
    return [];
  }
};

/**
 * Obtiene el historial de SKU en Rótulos
 * @returns Array de items del historial
 */
export const obtenerHistorialSKU = (): HistorialSKU[] => {
  try {
    const historialStr = localStorage.getItem('historial_sku');
    return historialStr ? JSON.parse(historialStr) : [];
  } catch (error) {
    console.error('Error al obtener historial SKU:', error);
    return [];
  }
};

