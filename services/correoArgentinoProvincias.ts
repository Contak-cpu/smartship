// Mapeo de provincias argentinas a códigos de Correo Argentino
// Basado en la tabla de referencia proporcionada

export const PROVINCIAS_CORREO_ARGENTINO: Record<string, string> = {
  // Mapeo normalizado (sin acentos, mayúsculas)
  'SALTA': 'A',
  'BUENOS AIRES': 'B',
  'CAPITAL FEDERAL': 'C',
  'SAN LUIS': 'D',
  'ENTRE RIOS': 'E',
  'ENTRE RÍOS': 'E',
  'ENTRE ROS': 'E', // Variante con carácter mal codificado
  'ENTRE RIOS': 'E', // Otra variante
  'LA RIOJA': 'F',
  'SANTIAGO DEL ESTERO': 'G',
  'CHACO': 'H',
  'SAN JUAN': 'J',
  'CATAMARCA': 'K',
  'LA PAMPA': 'L',
  'MENDOZA': 'M',
  'MISIONES': 'N',
  'FORMOSA': 'P',
  'NEUQUEN': 'Q',
  'NEUQUÉN': 'Q',
  'NEUQUN': 'Q', // Variante con carácter mal codificado
  'NEUQUN': 'Q', // Otra variante
  'RIO NEGRO': 'R',
  'RÍO NEGRO': 'R',
  'RO NEGRO': 'R', // Variante con carácter mal codificado
  'RI NEGRO': 'R', // Otra variante
  'SANTA FE': 'S',
  'TUCUMAN': 'T',
  'TUCUMÁN': 'T',
  'TUCUMN': 'T', // Variante con carácter mal codificado
  'TUCUMN': 'T', // Otra variante
  'CHUBUT': 'U',
  'TIERRA DEL FUEGO': 'V',
  'CORRIENTES': 'W',
  'CORDOBA': 'X',
  'CÓRDOBA': 'X',
  'CRDOBA': 'X', // Variante con carácter mal codificado
  'CRDOBA': 'X', // Otra variante
  'JUJUY': 'Y',
  'SANTA CRUZ': 'Z',
  // Variantes comunes
  'GRAN BUENOS AIRES': 'B',
  'CIUDAD AUTÓNOMA DE BUENOS AIRES': 'C',
  'CABA': 'C',
};

/**
 * Función para limpiar caracteres mal codificados antes de buscar provincia
 */
const limpiarCaracteresMalCodificados = (texto: string): string => {
  if (!texto) return texto;
  
  // Carácter de reemplazo Unicode (U+FFFD)
  const charReemplazo = '\uFFFD';
  
  return texto
    // Corregir caracteres de reemplazo Unicode comunes en provincias argentinas
    .replace(/Entre Ros/gi, 'Entre Ríos')
    .replace(new RegExp(`Entre R[${charReemplazo}]os`, 'gi'), 'Entre Ríos')
    .replace(/Crdoba/gi, 'Córdoba')
    .replace(new RegExp(`C[${charReemplazo}]rdoba`, 'gi'), 'Córdoba')
    .replace(/Neuqun/gi, 'Neuquén')
    .replace(new RegExp(`Neuqu[${charReemplazo}]n`, 'gi'), 'Neuquén')
    .replace(/Tucumn/gi, 'Tucumán')
    .replace(new RegExp(`Tucum[${charReemplazo}]n`, 'gi'), 'Tucumán')
    .replace(/Ro Negro/gi, 'Río Negro')
    .replace(new RegExp(`R[${charReemplazo}]o Negro`, 'gi'), 'Río Negro')
    // Patrones más genéricos
    .replace(new RegExp(`([Ee]ntre R)[${charReemplazo}]([Oo]s)`, 'g'), '$1í$2')
    .replace(new RegExp(`([Cc])[${charReemplazo}]([Rr]doba)`, 'g'), '$1ó$2')
    .replace(new RegExp(`([Nn]euqu)[${charReemplazo}]([Nn])`, 'g'), '$1é$2')
    .replace(new RegExp(`([Tt]ucum)[${charReemplazo}]([Nn])`, 'g'), '$1á$2')
    .replace(new RegExp(`([Rr])[${charReemplazo}]([Oo] Negro)`, 'g'), '$1í$2');
};

/**
 * Obtiene el código de provincia para Correo Argentino
 * @param provinciaNombre Nombre de la provincia (con o sin acentos, puede tener caracteres mal codificados)
 * @returns Código de una letra (A-Z) o undefined si no se encuentra
 */
export const getCodigoProvinciaCorreoArgentino = (provinciaNombre: string): string | undefined => {
  if (!provinciaNombre) return undefined;
  
  // PRIMERO: Limpiar caracteres mal codificados
  let provinciaLimpia = limpiarCaracteresMalCodificados(provinciaNombre);
  
  // Normalizar el nombre: convertir a mayúsculas
  const nombreNormalizado = provinciaLimpia
    .toUpperCase()
    .trim();
  
  // Buscar coincidencia exacta (primero con el texto limpio)
  if (PROVINCIAS_CORREO_ARGENTINO[nombreNormalizado]) {
    return PROVINCIAS_CORREO_ARGENTINO[nombreNormalizado];
  }
  
  // Buscar también con el texto original (por si tiene variantes de caracteres mal codificados)
  const nombreOriginalMayus = provinciaNombre.toUpperCase().trim();
  if (PROVINCIAS_CORREO_ARGENTINO[nombreOriginalMayus]) {
    return PROVINCIAS_CORREO_ARGENTINO[nombreOriginalMayus];
  }
  
  // Normalizar quitando acentos para búsqueda flexible
  const nombreSinAcentos = nombreNormalizado
    .replace(/[ÁÀÄÂ]/g, 'A')
    .replace(/[ÉÈËÊ]/g, 'E')
    .replace(/[ÍÌÏÎ]/g, 'I')
    .replace(/[ÓÒÖÔ]/g, 'O')
    .replace(/[ÚÙÜÛ]/g, 'U')
    .replace(/[Ñ]/g, 'N');
  
  // Buscar coincidencia exacta sin acentos
  if (PROVINCIAS_CORREO_ARGENTINO[nombreSinAcentos]) {
    return PROVINCIAS_CORREO_ARGENTINO[nombreSinAcentos];
  }
  
  // Buscar coincidencia parcial (por si viene "PROVINCIA DE BUENOS AIRES" o similar)
  const charReemplazo = '\uFFFD';
  for (const [provincia, codigo] of Object.entries(PROVINCIAS_CORREO_ARGENTINO)) {
    // Normalizar la provincia del mapeo para comparar
    const provinciaNormalizada = provincia
      .toUpperCase()
      .replace(/[ÁÀÄÂ]/g, 'A')
      .replace(/[ÉÈËÊ]/g, 'E')
      .replace(/[ÍÌÏÎ]/g, 'I')
      .replace(/[ÓÒÖÔ]/g, 'O')
      .replace(/[ÚÙÜÛ]/g, 'U')
      .replace(/[Ñ]/g, 'N')
      .replace(new RegExp(`[${charReemplazo}]`, 'g'), ''); // Quitar caracteres mal codificados del mapeo también
    
    if (nombreSinAcentos.includes(provinciaNormalizada) || provinciaNormalizada.includes(nombreSinAcentos)) {
      return codigo;
    }
  }
  
  return undefined;
};

