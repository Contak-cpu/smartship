// Datos de sucursales de Correo Argentino con códigos de 3 letras
// Extraídos de codigos_sucursales_y_provincias_MiCorreo (1).xlsx - Envio sucursal.csv

export interface CorreoArgentinoSucursal {
  codigo: string; // Código de 3 letras (ej: QSP, QZB, RBA)
  calle: string;
  numero: string;
  localidad: string;
  provincia: string;
}

// Función para normalizar texto para búsqueda - debe funcionar con y sin tildes
const normalizarTexto = (texto: string): string => {
  if (!texto) return '';
  
  let normalizado = texto.trim();
  
  // Primero corregir caracteres mal codificados comunes (UTF-8 mal interpretado)
  normalizado = normalizado
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã/g, 'Á')
    .replace(/Ã‰/g, 'É')
    .replace(/Ã/g, 'Í')
    .replace(/Ã"/g, 'Ó')
    .replace(/Ãš/g, 'Ú')
    .replace(/Ã'/g, 'Ñ');
  
  // Convertir a mayúsculas
  normalizado = normalizado.toUpperCase();
  
  // Normalizar TODOS los acentos y caracteres especiales a su versión sin acento
  normalizado = normalizado
    .replace(/[ÁÀÄÂÃ]/g, 'A')
    .replace(/[ÉÈËÊ]/g, 'E')
    .replace(/[ÍÌÏÎ]/g, 'I')
    .replace(/[ÓÒÖÔÕ]/g, 'O')
    .replace(/[ÚÙÜÛ]/g, 'U')
    .replace(/[Ñ]/g, 'N')
    .replace(/[Ç]/g, 'C');
  
  return normalizado;
};

// Función para normalizar nombres de provincias (mapear variantes comunes y normalizar texto)
const normalizarProvincia = (provincia: string): string => {
  if (!provincia) return '';
  
  // Primero normalizar el texto (quitar acentos, etc.)
  let provinciaNormalizada = normalizarTexto(provincia);
  
  // Mapear variantes comunes de provincias (después de normalizar)
  const mapeoProvincias: Record<string, string> = {
    'GRAN BUENOS AIRES': 'BUENOS AIRES',
    'CAPITAL FEDERAL': 'BUENOS AIRES',
    'CABA': 'BUENOS AIRES',
    'CIUDAD AUTONOMA BUENOS AIRES': 'BUENOS AIRES',
    'CIUDAD AUTONOMA DE BUENOS AIRES': 'BUENOS AIRES',
  };
  
  // Si hay un mapeo específico, usarlo, sino devolver el normalizado
  return mapeoProvincias[provinciaNormalizada] || provinciaNormalizada;
};

// Función para cargar y parsear el CSV de sucursales de Correo Argentino
export const loadCorreoArgentinoSucursales = async (): Promise<CorreoArgentinoSucursal[]> => {
  try {
    // Cargar el archivo CSV
    const response = await fetch('/codigos_sucursales_correo_argentino.csv');
    if (!response.ok) {
      throw new Error(`Error al cargar archivo de sucursales: ${response.statusText}`);
    }
    const csvText = await response.text();
    
    // Parsear CSV manualmente (formato simple con comas como separadores)
    const lines = csvText.split('\n').filter(line => line.trim());
    const sucursales: CorreoArgentinoSucursal[] = [];
    
    // Saltar la primera línea (encabezados)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parsear línea CSV (manejar comas dentro de campos si están entre comillas)
      const parts: string[] = [];
      let currentPart = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(currentPart.trim());
          currentPart = '';
        } else {
          currentPart += char;
        }
      }
      parts.push(currentPart.trim()); // Agregar última parte
      
      if (parts.length >= 5) {
        const codigo = parts[0].trim();
        const calle = parts[1].trim();
        const numero = parts[2].trim();
        const localidad = parts[3].trim();
        const provincia = parts[4].trim();
        
        if (codigo && localidad && provincia) {
          sucursales.push({
            codigo,
            calle,
            numero,
            localidad,
            provincia,
          });
        }
      }
    }
    
    console.log(`✅ Cargadas ${sucursales.length} sucursales de Correo Argentino`);
    return sucursales;
  } catch (error) {
    console.error('Error cargando sucursales de Correo Argentino:', error);
    // Retornar array vacío si falla la carga
    return [];
  }
};

// Función para buscar código de sucursal por localidad y provincia
export const findCodigoSucursalCorreoArgentino = (
  localidad: string,
  provincia: string,
  codigoPostal?: string,
  direccion?: string,
  sucursales: CorreoArgentinoSucursal[] = []
): string => {
  if (!sucursales || sucursales.length === 0) {
    console.warn('No hay sucursales cargadas para buscar');
    return '';
  }
  
  const localidadNormalizada = normalizarTexto(localidad);
  let provinciaNormalizada = normalizarProvincia(provincia);
  const direccionNormalizada = direccion ? normalizarTexto(direccion) : '';
  
  console.log(`🔍 Buscando sucursal:`);
  console.log(`   Input - localidad="${localidad}", provincia="${provincia}"`);
  console.log(`   Normalizado - localidad="${localidadNormalizada}", provincia="${provinciaNormalizada}"`);
  
  // BÚSQUEDA ESPECÍFICA PARA CÓRDOBA CAPITAL (caso especial)
  // Detectar Córdoba de múltiples formas posibles
  const esCordobaLocalidad = localidadNormalizada === 'CORDOBA' || 
                             localidadNormalizada.includes('CORDOBA') ||
                             localidad.toLowerCase().includes('cordoba') ||
                             localidad.toLowerCase().includes('córdoba');
  
  const esCordobaProvincia = provinciaNormalizada === 'CORDOBA' || 
                             provinciaNormalizada.includes('CORDOBA') ||
                             provincia.toLowerCase().includes('cordoba') ||
                             provincia.toLowerCase().includes('córdoba');
  
  // Si tanto localidad como provincia son Córdoba (en cualquier formato), usar XFZ
  if ((esCordobaLocalidad && esCordobaProvincia) || 
      (localidadNormalizada === 'CORDOBA' && provinciaNormalizada === 'CORDOBA')) {
    console.log(`✅ ✅ ✅ Caso Córdoba Capital detectado -> usando código XFZ`);
    console.log(`   Razón: localidad "${localidad}" (${localidadNormalizada}) y provincia "${provincia}" (${provinciaNormalizada})`);
    return 'XFZ';
  }
  
  // Primera búsqueda: coincidencia exacta por localidad y provincia
  let matches = sucursales.filter(suc => {
    const sucLocalidadNormalizada = normalizarTexto(suc.localidad);
    const sucProvinciaNormalizada = normalizarTexto(suc.provincia);
    
    const coincide = sucLocalidadNormalizada === localidadNormalizada && 
                     sucProvinciaNormalizada === provinciaNormalizada;
    
    if (coincide) {
      console.log(`✅ Coincidencia exacta encontrada: ${suc.codigo} - ${suc.localidad}, ${suc.provincia}`);
    }
    
    return coincide;
  });
  
  // Si no hay coincidencias exactas, intentar coincidencia parcial de localidad (Lanus vs Lanus Este/Oeste)
  // SOLO si la localidad del pedido es una sola palabra (para evitar falsos positivos)
  if (matches.length === 0 && localidadNormalizada.split(' ').length === 1) {
    matches = sucursales.filter(suc => {
      const sucLocalidadNormalizada = normalizarTexto(suc.localidad);
      const sucProvinciaNormalizada = normalizarTexto(suc.provincia);
      
      // Verificar si la localidad de la sucursal contiene la localidad del pedido o viceversa
      // Ej: "LANUS ESTE" contiene "LANUS" o "LANUS" es parte de "LANUS ESTE"
      const localidadCoincide = sucLocalidadNormalizada.includes(localidadNormalizada) || 
                                localidadNormalizada.includes(sucLocalidadNormalizada.split(' ')[0]);
      
      return localidadCoincide && sucProvinciaNormalizada === provinciaNormalizada;
    });
    
    if (matches.length > 0) {
      console.log(`✅ Coincidencias parciales encontradas: ${matches.length}`);
    }
  }
  
  if (matches.length > 0) {
    // Si hay múltiples matches, intentar elegir por dirección
    if (matches.length > 1 && direccionNormalizada) {
      const matchesConDireccion = matches.filter(suc => {
        const sucCalleNormalizada = normalizarTexto(suc.calle);
        // Verificar si la dirección contiene parte de la calle de la sucursal o viceversa
        return direccionNormalizada.includes(sucCalleNormalizada) || 
               sucCalleNormalizada.includes(direccionNormalizada);
      });
      
      if (matchesConDireccion.length > 0) {
        console.log(`✅ Código sucursal encontrado por localidad/provincia/dirección: ${matchesConDireccion[0].codigo}`);
        return matchesConDireccion[0].codigo;
      }
    }
    
    console.log(`✅ Código sucursal encontrado por localidad/provincia: ${matches[0].codigo}`);
    return matches[0].codigo;
  }
  
  // Segunda búsqueda: coincidencia parcial más flexible por localidad (por palabra base)
  if (matches.length === 0) {
    matches = sucursales.filter(suc => {
      const sucLocalidadNormalizada = normalizarTexto(suc.localidad);
      const sucProvinciaNormalizada = normalizarTexto(suc.provincia);
      
      // Extraer palabra base de la localidad (primera palabra)
      const palabrasLocalidadPedido = localidadNormalizada.split(' ');
      const palabraBasePedido = palabrasLocalidadPedido[0];
      const palabrasLocalidadSucursal = sucLocalidadNormalizada.split(' ');
      const palabraBaseSucursal = palabrasLocalidadSucursal[0];
      
      // Verificar si las palabras base coinciden
      const palabrasBaseCoinciden = palabraBasePedido === palabraBaseSucursal && palabraBasePedido.length > 3; // Solo si la palabra base tiene más de 3 caracteres para evitar falsos positivos
      
      return palabrasBaseCoinciden && sucProvinciaNormalizada === provinciaNormalizada;
    });
    
    console.log(`📊 Coincidencias por palabra base encontradas: ${matches.length}`);
    
    if (matches.length > 0) {
      console.log(`✅ Código sucursal encontrado por coincidencia parcial: ${matches[0].codigo}`);
      return matches[0].codigo;
    }
  }
  
  // Tercera búsqueda: solo por provincia (último recurso)
  if (matches.length === 0) {
    matches = sucursales.filter(suc => {
      const sucProvinciaNormalizada = normalizarTexto(suc.provincia);
      return sucProvinciaNormalizada === provinciaNormalizada;
    });
    
    if (matches.length > 0) {
      console.log(`⚠️ Código sucursal encontrado solo por provincia (puede no ser exacto): ${matches[0].codigo}`);
      return matches[0].codigo;
    }
  }
  
  console.warn(`❌ No se encontró código de sucursal para: ${localidad}, ${provincia}`);
  return '';
};

