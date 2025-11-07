import { SucursalSugerencia, AndreaniSucursalOutput } from '../types';

// Función para escapar valores CSV
const escapeCSVValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Si contiene punto y coma, comillas o saltos de línea, encerrar en comillas y escapar comillas internas
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Función para convertir array a CSV (simplificada)
const unparseCSV = (data: AndreaniSucursalOutput[]): string => {
  if (data.length === 0) return "";
  
  // Crear encabezados
  const headers = Object.keys(data[0]).map(header => {
    return header
      .replace(/ Ej:.*$/, '')
      .replace(/\n.*$/, '')
      .trim();
  });
  
  const csvLines = [headers.map(escapeCSVValue).join(';')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      const originalKey = Object.keys(row).find(key => 
        key.replace(/ Ej:.*$/, '').replace(/\n.*$/, '').trim() === header
      );
      const value = row[originalKey as keyof typeof row] || '';
      return escapeCSVValue(value);
    });
    csvLines.push(values.join(';'));
  });
  
  return csvLines.join('\n');
};

/**
 * Agrega sugerencias aceptadas al CSV de sucursales
 */
export const agregarSugerenciasAceptadasAlCSV = (
  sucursalCSV: string,
  sugerenciasAceptadas: SucursalSugerencia[],
  domicilioCSV?: string
): string => {
  if (sugerenciasAceptadas.length === 0) {
    return sucursalCSV;
  }

  console.log(`🔄 Agregando ${sugerenciasAceptadas.length} sugerencia(s) aceptada(s) al CSV de sucursales...`);

  // Convertir CSV existente a array si no está vacío
  const lineasExistentes = sucursalCSV ? sucursalCSV.split('\n').filter(l => l.trim()) : [];
  
  // Determinar formato de encabezados (hay dos formatos posibles)
  // Formato ventas: "Sucursal * \nEj: 9 DE JULIO" (encabezados con \nEj:)
  // Formato Tiendanube: "Sucursal *" (sin \nEj:)
  let formatoVentas = false;
  
  if (lineasExistentes.length > 0) {
    const primeraLinea = lineasExistentes[0];
    // Si contiene "Ej:" es formato de ventas
    formatoVentas = primeraLinea.includes('Ej:');
  } else if (domicilioCSV) {
    // Si no hay CSV de sucursales, intentar detectar formato desde CSV de domicilios
    const lineasDomicilio = domicilioCSV.split('\n').filter(l => l.trim());
    if (lineasDomicilio.length > 0) {
      const primeraLineaDomicilio = lineasDomicilio[0];
      formatoVentas = primeraLineaDomicilio.includes('Ej:');
    }
  }

  // Crear nuevas filas para sugerencias aceptadas
  const nuevasFilas: AndreaniSucursalOutput[] = [];

  for (const sugerencia of sugerenciasAceptadas) {
    if (!sugerencia.pedidoData) {
      console.warn(`⚠️ Sugerencia ${sugerencia.numeroOrden} no tiene datos del pedido, omitiendo`);
      continue;
    }

    const pedidoData = sugerencia.pedidoData;

    // Determinar el formato correcto según el CSV existente
    if (formatoVentas) {
      // Formato para archivos de ventas
      nuevasFilas.push({
        'Paquete Guardado \nEj: 1': '',
        'Peso (grs)\nEj: ': String(pedidoData.peso || 400),
        'Alto (cm)\nEj: ': String(pedidoData.alto || 10),
        'Ancho (cm)\nEj: ': String(pedidoData.ancho || 10),
        'Profundidad (cm)\nEj: ': String(pedidoData.profundidad || 10),
        'Valor declarado ($ C/IVA) *\nEj: ': String(pedidoData.valorDeclarado || 6000),
        'Numero Interno\nEj: ': sugerencia.numeroOrden,
        'Nombre *\nEj: ': pedidoData.nombre || 'SIN NOMBRE',
        'Apellido *\nEj: ': pedidoData.apellido || 'SIN APELLIDO',
        'DNI *\nEj: ': pedidoData.dni || '00000000',
        'Email *\nEj: ': pedidoData.email || '',
        'Celular código *\nEj: ': pedidoData.celularCodigo || '11',
        'Celular número *\nEj: ': pedidoData.celularNumero || '00000000',
        'Sucursal * \nEj: 9 DE JULIO': sugerencia.sucursalSugerida.nombre_sucursal
      } as any);
    } else {
      // Formato para archivos de Tiendanube
      nuevasFilas.push({
        'Paquete Guardado Ej:': '',
        'Peso (grs)': pedidoData.peso || 400,
        'Alto (cm)': pedidoData.alto || 10,
        'Ancho (cm)': pedidoData.ancho || 10,
        'Profundidad (cm)': pedidoData.profundidad || 10,
        'Valor declarado ($ C/IVA) *': pedidoData.valorDeclarado || 6000,
        'Numero Interno': sugerencia.numeroOrden,
        'Nombre *': pedidoData.nombre || 'SIN NOMBRE',
        'Apellido *': pedidoData.apellido || 'SIN APELLIDO',
        'DNI *': pedidoData.dni || '00000000',
        'Email *': pedidoData.email || '',
        'Celular código *': pedidoData.celularCodigo || '11',
        'Celular número *': pedidoData.celularNumero || '00000000',
        'Sucursal *': sugerencia.sucursalSugerida.nombre_sucursal
      });
    }
  }

  // Convertir nuevas filas a CSV
  const nuevasFilasCSV = unparseCSV(nuevasFilas);

  // Combinar CSV existente con nuevas filas (sin duplicar encabezados)
  if (sucursalCSV && sucursalCSV.trim()) {
    // Si ya hay contenido, agregar solo las nuevas líneas de datos (sin encabezado)
    const lineasNuevas = nuevasFilasCSV.split('\n').filter(l => l.trim());
    if (lineasNuevas.length > 1) {
      // Saltar el encabezado (primera línea) y agregar solo datos
      return sucursalCSV + '\n' + lineasNuevas.slice(1).join('\n');
    }
    return sucursalCSV;
  } else {
    // Si no hay contenido previo, usar el CSV completo de nuevas filas
    return nuevasFilasCSV;
  }
};
