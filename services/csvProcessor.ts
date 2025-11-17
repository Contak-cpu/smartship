import { 
  TiendanubeOrder, 
  AndreaniSucursalInfo,
  AndreaniDomicilioOutput,
  AndreaniSucursalOutput,
  SucursalSugerencia,
  ProcessingInfo
} from '../types';
import { getDomiciliosMapping } from './domiciliosData';
import { getSucursalesData } from './sucursalesData';

// PapaParse is loaded from a CDN and available as a global variable.
declare const Papa: any;

// Función para corregir solo problemas básicos de codificación UTF-8
export const fixEncoding = (text: string): string => {
  if (!text) return '';
  
  let cleanText = text;
  
  // Solo corregir caracteres mal codificados básicos (UTF-8 mal interpretado)
  // PERO NO tocar los nombres que ya están normalizados
  cleanText = cleanText
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
    .replace(/Ã'/g, 'Ñ')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã¼/g, 'ü')
    .replace(/Ã¶/g, 'ö');
  
  return cleanText;
};

// Función más suave para limpiar archivos de referencia (sucursales, códigos postales)
export const fixEncodingSoft = (text: string): string => {
  if (!text) return '';
  
  let cleanText = text;
  
  // Solo corregir caracteres mal codificados básicos (UTF-8 mal interpretado)
  cleanText = cleanText
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
    .replace(/Ã'/g, 'Ñ')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã¼/g, 'ü')
    .replace(/Ã¶/g, 'ö');
  
  return cleanText;
};

// Función para limpiar campos de Piso y Departamento, eliminando caracteres inválidos
// Solo permite letras (a-z, A-Z, incluyendo acentos), números (0-9) y espacios
export const limpiarPisoDepto = (text: string): string => {
  if (!text) return '';
  
  // Normalizar acentos primero
  let cleanText = text
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ÁÀÄÂ]/g, 'A')
    .replace(/[ÉÈËÊ]/g, 'E')
    .replace(/[ÍÌÏÎ]/g, 'I')
    .replace(/[ÓÒÖÔ]/g, 'O')
    .replace(/[ÚÙÜÛ]/g, 'U')
    .replace(/[Ñ]/g, 'N')
    .replace(/[ç]/g, 'c')
    .replace(/[Ç]/g, 'C');
  
  // Eliminar todos los caracteres que NO sean letras, números o espacios
  // Esto elimina: . , * - _ / \ ( ) [ ] { } : ; " ' ! ? @ # $ % ^ & + = | ~ ` y cualquier otro carácter especial
  cleanText = cleanText.replace(/[^a-zA-Z0-9\s]/g, '');
  
  // Limpiar espacios múltiples y espacios al inicio/final
  cleanText = cleanText.replace(/\s+/g, ' ').trim();
  
  return cleanText;
};

// Función para corregir CSVs con encabezados multilínea
const fixMultilineHeaderCSV = (csvText: string): string => {
  console.log('Aplicando corrección para CSV con encabezados multilínea...');

  // Dividir el texto en líneas
  const lines = csvText.split(/\r?\n/);
  console.log('Total de líneas originales:', lines.length);

  // Buscar la línea que contiene los encabezados de columnas
  let headerStartIndex = -1;
  console.log('Buscando línea de encabezados...');
  for (let i = 0; i < lines.length; i++) {
    console.log(`Línea ${i}:`, lines[i].substring(0, 100) + (lines[i].length > 100 ? '...' : ''));
    if (lines[i].includes('Paquete Guardado')) {
      headerStartIndex = i;
      console.log(`¡ENCONTRADO! Línea ${i} contiene "Paquete Guardado" - INICIO DEL ENCABEZADO`);
      break;
    }
  }

  if (headerStartIndex === -1) {
    console.log('❌ ERROR: No se encontró el inicio del encabezado, usando texto original');
    console.log('Líneas revisadas:', lines.length);
    console.log('Primeras 5 líneas:');
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      console.log(`  Línea ${i}: "${lines[i]}"`);
    }
    return csvText;
  }

  console.log('Inicio del encabezado encontrado en línea:', headerStartIndex);

  // Crear el encabezado completo concatenando todas las líneas hasta encontrar los datos
  let headerLine = '';
  let dataStartIndex = headerStartIndex;

  // Concatenar líneas hasta encontrar la primera línea de datos (que contiene números)
  for (let i = headerStartIndex; i < lines.length; i++) {
    const line = lines[i];
    
    // Si la siguiente línea contiene datos (números), hemos terminado con el encabezado
    if (i + 1 < lines.length && lines[i + 1].match(/^\d+[,;]/)) {
      dataStartIndex = i + 1;
      console.log(`Final del encabezado encontrado en línea ${i}, datos empiezan en línea ${dataStartIndex}`);
      break;
    }
    
    // Si la línea actual contiene "Observaciones" y "Ej:", también es el final del encabezado
    if (line.includes('Observaciones') && line.includes('Ej:')) {
      dataStartIndex = i + 1;
      console.log(`Final del encabezado encontrado en línea ${i} (Observaciones), datos empiezan en línea ${dataStartIndex}`);
      break;
    }
    
    // Si la línea actual es solo "Ej: " (línea vacía después de observaciones), también es el final
    if (line.trim() === 'Ej: ' || line.trim() === 'Ej:') {
      dataStartIndex = i + 1;
      console.log(`Final del encabezado encontrado en línea ${i} (línea vacía Ej:), datos empiezan en línea ${dataStartIndex}`);
      break;
    }
    
    // Agregar la línea al encabezado
    if (headerLine.length > 0) {
      // Si ya hay contenido, agregar un espacio antes de la nueva línea
      headerLine += ' ' + line;
    } else {
      headerLine += line;
    }
  }

  console.log('Encabezado reconstruido:', headerLine.substring(0, 200) + '...');
  console.log('Inicio de datos en línea:', dataStartIndex);

  // Crear el CSV corregido
  let correctedCSV = headerLine + '\n';

  // Agregar todas las líneas de datos
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      correctedCSV += line + '\n';
    }
  }

  console.log('CSV corregido creado, tamaño:', correctedCSV.length, 'caracteres');
  console.log('Primeras líneas del CSV corregido:');
  const correctedLines = correctedCSV.split('\n').slice(0, 3);
  correctedLines.forEach((line, index) => {
    console.log(`Línea ${index + 1}:`, line.substring(0, 100) + (line.length > 100 ? '...' : ''));
  });

  return correctedCSV;
};

// Función para parsear CSV con formato especial de Andreani
const parseAndreaniCSV = (csvText: string): any[] => {
  console.log('Parseando CSV con formato especial de Andreani...');
  
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  console.log('Total de líneas:', lines.length);
  
  if (lines.length < 3) {
    console.log('CSV muy corto, no hay datos suficientes');
    return [];
  }
  
  // Buscar la línea que contiene los encabezados de columnas
  let headerLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Paquete Guardado') && lines[i].includes('Ej: 1')) {
      headerLineIndex = i;
      break;
    }
  }
  
  if (headerLineIndex === -1) {
    console.log('No se encontró la línea de encabezados, buscando alternativas...');
    // Buscar alternativas
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Paquete Guardado') || lines[i].includes('Peso (grs)')) {
        console.log('Encontrada línea alternativa en índice:', i, 'Contenido:', lines[i].substring(0, 100));
        headerLineIndex = i;
        break;
      }
    }
  }
  
  if (headerLineIndex === -1) {
    console.log('No se encontró ninguna línea de encabezados');
    console.log('Primeras 5 líneas del CSV:');
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      console.log(`Línea ${i}:`, lines[i].substring(0, 100));
    }
    return [];
  }
  
  // Reconstruir la línea de encabezados completa
  let headerLine = '';
  let currentIndex = headerLineIndex;
  
  while (currentIndex < lines.length) {
    const currentLine = lines[currentIndex];
    headerLine += currentLine;
    
    if (currentLine.includes('Observaciones') && currentLine.includes('Ej:')) {
      break;
    }
    currentIndex++;
  }
  
  console.log('Línea de encabezados reconstruida:', headerLine.substring(0, 200) + '...');
  
  // Parsear los encabezados manualmente
  const headers = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < headerLine.length; i++) {
    const char = headerLine[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ';' && !inQuotes) {
      headers.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  headers.push(current.trim().replace(/^"|"$/g, ''));
  
  console.log('Encabezados parseados:', headers);
  console.log('Número de encabezados:', headers.length);
  
  // Parsear las filas de datos (después de la línea de encabezados)
  const data = [];
  for (let i = currentIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith(';')) continue;
    
    const row = {};
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ';' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    
    // Crear objeto con los valores
    for (let k = 0; k < Math.min(headers.length, values.length); k++) {
      row[headers[k]] = values[k];
    }
    
    data.push(row);
  }
  
  console.log('Datos parseados:', data.length, 'filas');
  if (data.length > 0) {
    console.log('Primera fila de datos:', data[0]);
    console.log('Claves de la primera fila:', Object.keys(data[0]));
  }
  
  return data;
};

const parseCSV = <T,>(csvText: string): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    console.log('Iniciando parsing del CSV de entrada...');
    console.log('Tamaño del CSV de entrada:', csvText.length, 'caracteres');
    console.log('Primeras 200 caracteres del CSV:', csvText.substring(0, 200));
    
    // Remover BOM si existe y corregir solo problemas básicos de codificación UTF-8
    let cleanText = csvText.replace(/^\uFEFF/, '');
    cleanText = fixEncoding(cleanText);
    console.log('CSV después de corrección de codificación, primeras 200 caracteres:', cleanText.substring(0, 200));
    
    // Verificar si el CSV tiene saltos de línea
    const hasLineBreaks = cleanText.includes('\n') || cleanText.includes('\r');
    console.log('¿Tiene saltos de línea?', hasLineBreaks);
    
    // NUEVA LÓGICA: Detectar si es un CSV con encabezados multilínea
    const isMultilineHeaderCSV = cleanText.includes('"Paquete Guardado') && 
                                 cleanText.includes('Ej: 1"') &&
                                 cleanText.includes('"Peso (grs)');
    
    if (isMultilineHeaderCSV) {
      console.log('CSV con encabezados multilínea detectado. Aplicando corrección especial...');
      cleanText = fixMultilineHeaderCSV(cleanText);
    } else if (!hasLineBreaks) {
      console.log('CSV sin saltos de línea detectado. Intentando corregir formato...');
      // Si no hay saltos de línea, intentar detectar patrones de fin de fila
      // Buscar patrones como ";Número de orden" que indican nueva fila
      const orderPattern = /;(\d{4,})\s*;?/g;
      let match;
      let lastIndex = 0;
      let correctedText = '';
      
      while ((match = orderPattern.exec(cleanText)) !== null) {
        if (match.index > lastIndex) {
          // Agregar salto de línea antes del número de orden (excepto el primero)
          if (lastIndex > 0) {
            correctedText += '\n';
          }
          correctedText += cleanText.substring(lastIndex, match.index);
          lastIndex = match.index;
        }
      }
      
      // Agregar el resto del texto
      if (lastIndex < cleanText.length) {
        if (lastIndex > 0) {
          correctedText += '\n';
        }
        correctedText += cleanText.substring(lastIndex);
      }
      
      if (correctedText) {
        cleanText = correctedText;
        console.log('CSV corregido con saltos de línea automáticos');
      }
    }
    
    Papa.parse(cleanText, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';', // Usar punto y coma como separador
      quoteChar: '"', // Especificar comillas como delimitador de texto
      escapeChar: '"', // Especificar carácter de escape
      complete: (results: { data: T[]; errors: any[] }) => {
        if (results.errors.length > 0) {
          console.error("CSV Parsing Errors:", results.errors);
          // No rechazar inmediatamente, algunos errores pueden ser menores
          console.warn("Continuando con parsing a pesar de errores menores");
        }
        console.log('Total de filas parseadas:', results.data.length);
        console.log('Parsed CSV data sample:', results.data[0]);
        console.log('Available columns:', Object.keys(results.data[0] || {}));
        
        if (results.data.length === 0) {
          console.error('No se encontraron datos en el CSV. Verificando formato...');
          // Intentar parsing sin header para debug
          Papa.parse(cleanText, {
            header: false,
            skipEmptyLines: true,
            delimiter: ';',
            quoteChar: '"',
            complete: (debugResults: { data: any[]; errors: any[] }) => {
              console.log('Debug - Total de filas sin header:', debugResults.data.length);
              console.log('Debug - Primera fila:', debugResults.data[0]);
              console.log('Debug - Segunda fila:', debugResults.data[1]);
            }
          });
        }
        
        resolve(results.data);
      },
      error: (error: Error) => {
        console.error('Error parsing CSV:', error);
        reject(error);
      },
    });
  });
};

// Función para escapar valores CSV correctamente
const escapeCSVValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  
  const str = String(value);
  
  // Si contiene comillas, punto y coma, o saltos de línea, necesita estar entre comillas
  if (str.includes('"') || str.includes(';') || str.includes('\n') || str.includes('\r')) {
    // Escapar comillas duplicándolas (estándar CSV)
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
};

const unparseCSV = (data: (AndreaniDomicilioOutput | AndreaniSucursalOutput)[]): string => {
  if (data.length === 0) return "";
  
  // Crear encabezados limpios sin "Ej:" y otros textos innecesarios
  const headers = Object.keys(data[0]).map(header => {
    // Limpiar encabezados para que sean más simples
    return header
      .replace(/ Ej:.*$/, '') // Quitar "Ej: ..."
      .replace(/\n.*$/, '') // Quitar saltos de línea y texto después
      .trim();
  });
  
  // Crear el CSV manualmente para tener control total, escapando correctamente
  const csvLines = [headers.map(escapeCSVValue).join(';')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      // Encontrar el valor correspondiente en el objeto original
      const originalKey = Object.keys(row).find(key => 
        key.replace(/ Ej:.*$/, '').replace(/\n.*$/, '').trim() === header
      );
      const value = row[originalKey as keyof typeof row] || '';
      // Escapar el valor correctamente
      return escapeCSVValue(value);
    });
    csvLines.push(values.join(';'));
  });
  
  return csvLines.join('\n');
};

// Función para combinar domicilios y sucursales en un solo CSV
export const combineCSVs = (domicilioCSV: string, sucursalCSV: string): string => {
  let combinedContent = '';
  
  // Agregar encabezado para identificar el tipo de registro
  combinedContent += 'TIPO_REGISTRO;';
  
  // Si hay domicilios, agregar su contenido
  if (domicilioCSV.trim()) {
    const domicilioLines = domicilioCSV.split('\n');
    domicilioLines.forEach((line, index) => {
      if (line.trim()) {
        combinedContent += `DOMICILIO;${line}\n`;
      }
    });
  }
  
  // Si hay sucursales, agregar su contenido
  if (sucursalCSV.trim()) {
    const sucursalLines = sucursalCSV.split('\n');
    sucursalLines.forEach((line, index) => {
      if (line.trim()) {
        combinedContent += `SUCURSAL;${line}\n`;
      }
    });
  }
  
  // Asegurar que termine con salto de línea para que la fila posterior quede vacía
  return combinedContent;
};

const fetchSucursales = async (): Promise<AndreaniSucursalInfo[]> => {
  try {
    console.log('=== INICIANDO CARGA DE SUCURSALES (DATOS EMBEBIDOS) ===');
    
    // Usar datos embebidos en lugar de archivo externo
    const sucursales = getSucursalesData();
    
    console.log('✅ Sucursales cargadas exitosamente:', sucursales.length);
    console.log('Primera sucursal:', sucursales[0]);
    console.log('=== FIN CARGA DE SUCURSALES ===');
    
    return sucursales;
  } catch (error) {
    console.error("Failed to load embedded sucursales data:", error);
    throw new Error("No se pudo cargar los datos de sucursales embebidos.");
  }
};

// Función para cargar el mapeo de códigos postales desde datos embebidos
const fetchCodigosPostales = async (): Promise<Map<string, string>> => {
  try {
    console.log('=== INICIANDO CARGA DE CÓDIGOS POSTALES (DATOS EMBEBIDOS) ===');
    
    // Usar datos embebidos en lugar de archivo externo
    const codigosPostales = getDomiciliosMapping();
    
    console.log('✅ Códigos postales cargados exitosamente:', codigosPostales.size);
    console.log('Ejemplo de mapeo:', Array.from(codigosPostales.entries()).slice(0, 5));
    
    // Verificar específicamente algunos códigos que sabemos que existen
    console.log('Verificando códigos específicos:');
    console.log('5000:', codigosPostales.get('5000'));
    console.log('3265:', codigosPostales.get('3265'));
    console.log('9000:', codigosPostales.get('9000'));
    console.log('1657:', codigosPostales.get('1657'));
    
    return codigosPostales;
  } catch (error) {
    console.error("Failed to load embedded domicilios data:", error);
    throw new Error("No se pudo cargar los datos de códigos postales embebidos.");
  }
};

// Función para encontrar una columna con o sin acentos
const findColumn = (order: any, possibleNames: string[]): string | undefined => {
  // Primero buscar coincidencias exactas
  for (const name of possibleNames) {
    if (order[name] !== undefined) {
      const value = order[name];
      console.log(`Checking column "${name}":`, value);
      if (value && value.toString().trim() !== '') {
        return name;
      }
    }
  }
  
  // Si no encuentra coincidencias exactas, buscar en todas las claves del objeto
  const orderKeys = Object.keys(order);
  for (const possibleName of possibleNames) {
    for (const key of orderKeys) {
      if (key.toLowerCase().includes(possibleName.toLowerCase().replace(/[^\w\s]/g, ''))) {
        const value = order[key];
        console.log(`Found similar column "${key}" for "${possibleName}":`, value);
        if (value && value.toString().trim() !== '') {
          return key;
        }
      }
    }
  }
  
  return undefined;
};

// Mapeo de localidades específicas a barrios de Capital Federal
const mapeoLocalidades = {
  'villa del parque': 'villa del parque',
  'agronomia': 'villa del parque',
  'monte castro': 'villa del parque', 
  'paternal': 'villa del parque',
  'villa santa rita': 'villa del parque',
  'villa real': 'villa del parque',
  'villa general mitre': 'villa del parque',
  'villa devoto': 'villa devoto',
  'villa ballester': 'general san martin',
  'general san martin': 'general san martin',
  'ciudad evita': 'la matanza',
  'la matanza': 'la matanza',
  'virrey del pino': 'la matanza'
};

// Función para normalizar nombres y apellidos (remover acentos y caracteres especiales)
const normalizarNombre = (nombre: string): string => {
  if (!nombre) return '';
  
  return nombre
    // Normalizar acentos minúsculas
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    // Normalizar acentos mayúsculas
    .replace(/[ÁÀÄÂ]/g, 'A')
    .replace(/[ÉÈËÊ]/g, 'E')
    .replace(/[ÍÌÏÎ]/g, 'I')
    .replace(/[ÓÒÖÔ]/g, 'O')
    .replace(/[ÚÙÜÛ]/g, 'U')
    .replace(/[Ñ]/g, 'N')
    // Otros caracteres especiales
    .replace(/[ç]/g, 'c')
    .replace(/[Ç]/g, 'C')
    // Manejar apóstrofes y caracteres especiales
    .replace(/['']/g, '') // Remover apóstrofes curvos y rectos
    .replace(/[""]/g, '"') // Normalizar comillas
    .replace(/[–—]/g, '-') // Normalizar guiones
    // Remover caracteres de reemplazo inválidos que aparecen en el CSV
    .replace(/[]/g, '') // Carácter de reemplazo Unicode
    .replace(/[^\x00-\x7F]/g, (char) => {
      // Mapeo específico para caracteres problemáticos
      const charCode = char.charCodeAt(0);
      switch (charCode) {
        case 225: return 'a'; // á
        case 233: return 'e'; // é
        case 237: return 'i'; // í
        case 243: return 'o'; // ó
        case 250: return 'u'; // ú
        case 241: return 'n'; // ñ
        case 193: return 'A'; // Á
        case 201: return 'E'; // É
        case 205: return 'I'; // Í
        case 211: return 'O'; // Ó
        case 218: return 'U'; // Ú
        case 209: return 'N'; // Ñ
        case 8217: return ''; // ' (apóstrofe curvo derecho)
        case 8216: return ''; // ' (apóstrofe curvo izquierdo)
        case 8218: return ''; // ‚ (comilla simple baja)
        case 8219: return ''; // ' (comilla simple alta)
        case 8220: return '"'; // " (comilla doble izquierda)
        case 8221: return '"'; // " (comilla doble derecha)
        case 8211: return '-'; // – (guión en)
        case 8212: return '-'; // — (guión em)
        case 8230: return '...'; // … (puntos suspensivos)
        default: return ''; // Remover otros caracteres no ASCII
      }
    })
    .trim();
};

// Función para normalizar direcciones (remover acentos, caracteres especiales, etc.)
const normalizarDireccion = (direccion: string): string => {
  return direccion
    .toLowerCase()
    .replace(/[áéíóúñ]/g, (match) => {
      const map: { [key: string]: string } = { 
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ñ': 'n',
        'Á': 'a', 'É': 'e', 'Í': 'i', 'Ó': 'o', 'Ú': 'u', 'Ñ': 'n'
      };
      return map[match] || match;
    })
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Función para normalizar números de calles (manejar variaciones como "RN40" vs "Ruta 40")
const normalizarNumeroCalle = (calle: string): string => {
  return calle
    .toLowerCase()
    .replace(/\bruta\s+nacional\s+(\d+)/g, 'rn$1')
    .replace(/\bruta\s+(\d+)/g, 'rn$1')
    .replace(/\brn\s*(\d+)/g, 'rn$1')
    .replace(/\bavenida\s+/g, 'av ')
    .replace(/\bav\.\s*/g, 'av ')
    .replace(/\bdoctor\s+/g, 'dr ')
    .replace(/\bdr\.\s*/g, 'dr ')
    .replace(/\bgeneral\s+/g, 'gral ')
    .replace(/\bgral\.\s*/g, 'gral ')
    .replace(/\bprofesor\s+/g, 'prof ')
    .replace(/\bprof\.\s*/g, 'prof ')
    .replace(/\bingeniero\s+/g, 'ing ')
    .replace(/\bing\.\s*/g, 'ing ')
    .replace(/\bcalle\s+/g, '')
    .replace(/\bcalle\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Función para calcular distancia de Levenshtein (búsqueda difusa)
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[len2][len1];
};

// Función para calcular similitud entre dos strings (0-1, donde 1 es idéntico)
const calcularSimilitud = (str1: string, str2: string): number => {
  const distancia = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : 1 - (distancia / maxLength);
};

// Función para encontrar la sucursal correcta basándose en la dirección
const findSucursalByAddress = (direccionPedido: string, sucursales: AndreaniSucursalInfo[], codigoPostal?: string, provincia?: string): string => {
  const direccionNormalizada = direccionPedido.toLowerCase().trim();
  console.log('=== DEBUG SUCURSAL ===');
  console.log('Buscando sucursal para dirección:', direccionNormalizada);
  console.log('Total sucursales disponibles:', sucursales.length);
  console.log('Código postal del pedido:', codigoPostal);
  
  // Extraer componentes específicos de la dirección del pedido
  const componentes = direccionPedido.split(',').map(c => c.trim());
  const calleNumero = componentes[0] || '';
  
  // Usar parámetros proporcionados o extraer de la dirección
  let localidad = '';
  let ciudad = '';
  let codigoPostalFinal = codigoPostal || '';
  let provinciaFinal = provincia || '';
  
  // Si no se proporcionaron parámetros, intentar extraer de los componentes
  if (!codigoPostalFinal || !provinciaFinal) {
    // Los componentes pueden estar en cualquier orden, así que los identificamos por contenido
    for (let i = 1; i < componentes.length; i++) {
      const componente = componentes[i].toLowerCase();
      
      // Identificar código postal (solo números)
      if (!codigoPostalFinal && /^\d{4,5}$/.test(componente)) {
        codigoPostalFinal = componente;
      }
      // Identificar provincia (palabras conocidas)
      else if (!provinciaFinal && (componente.includes('buenos aires') || componente.includes('capital federal') || 
               componente.includes('córdoba') || componente.includes('santa fe') || 
               componente.includes('mendoza') || componente.includes('tucumán') || 
               componente.includes('entre ríos') || componente.includes('salta') || 
               componente.includes('misiones') || componente.includes('chaco') || 
               componente.includes('corrientes') || componente.includes('formosa') || 
               componente.includes('jujuy') || componente.includes('la rioja') || 
               componente.includes('catamarca') || componente.includes('santiago del estero') || 
               componente.includes('san juan') || componente.includes('san luis') || 
               componente.includes('la pampa') || componente.includes('río negro') || 
               componente.includes('neuquén') || componente.includes('chubut') || 
               componente.includes('santa cruz') || componente.includes('tierra del fuego'))) {
        provinciaFinal = componente;
      }
      // Si no es código postal ni provincia, es localidad o ciudad
      else if (!localidad) {
        localidad = componente;
      } else if (!ciudad) {
        ciudad = componente;
      }
    }
  }
  
  console.log('Componentes extraídos:', { calleNumero, localidad, ciudad, codigoPostal: codigoPostalFinal, provincia: provinciaFinal });
  
  // Normalizar la calle y número del pedido
  const calleNumeroNormalizada = normalizarDireccion(calleNumero);
  const calleNumeroFlexible = normalizarNumeroCalle(calleNumero);
  
  console.log('Calle original:', calleNumero);
  console.log('Calle normalizada:', calleNumeroNormalizada);
  console.log('Calle flexible:', calleNumeroFlexible);
  console.log('Buscando también con prefijo:', `PUNTO ANDREANI HOP ${calleNumero}`);
  
  // Función para extraer el código postal de una dirección de sucursal
  const extraerCodigoPostalSucursal = (direccion: string): string | null => {
    if (!direccion) return null;
    
    // Buscar códigos postales en formato estándar (B8000, C1200, etc. o solo números)
    // Patrón: letra opcional seguida de 4-5 dígitos
    const matches = direccion.match(/\b([A-Z]?\d{4,5})\b/g);
    if (matches && matches.length > 0) {
      // Tomar el primer match (generalmente es el código postal)
      const cp = matches[0];
      // Si tiene letra prefijo, extraer solo el número
      if (/^[A-Z]/.test(cp)) {
        return cp.substring(1); // Quitar la letra (ej: B8000 -> 8000)
      }
      return cp;
    }
    
    // Fallback: buscar solo números de 4-5 dígitos
    const soloNumeros = direccion.match(/\b(\d{4,5})\b/);
    if (soloNumeros) {
      return soloNumeros[1];
    }
    
    return null;
  };
  
  // Función para extraer la dirección real de la sucursal (después de "PUNTO ANDREANI HOP")
  const extraerDireccionReal = (sucursal: AndreaniSucursalInfo): string => {
    // Si la dirección está vacía, usar el nombre de la sucursal
    if (!sucursal.direccion || sucursal.direccion.trim() === '') {
      return sucursal.nombre_sucursal;
    }
    
    // Si el nombre contiene "PUNTO ANDREANI HOP", extraer la parte después de eso
    const nombreSucursal = sucursal.nombre_sucursal.toLowerCase();
    if (nombreSucursal.includes('punto andreani hop')) {
      // Extraer todo después de "PUNTO ANDREANI HOP"
      const partes = sucursal.nombre_sucursal.split(/punto andreani hop/i);
      if (partes.length > 1) {
        return partes[1].trim();
      }
    }
    
    // Si no, usar la dirección normal
    return sucursal.direccion;
  };
  
  // ⚠️ FLUJO CORRECTO: Buscar coincidencia EXACTA de dirección primero
  // Luego validar según el tipo (HOP o oficial)
  
  console.log(`📊 Total sucursales: ${sucursales.length}`);
  console.log(`🔍 Buscando coincidencia EXACTA para: "${calleNumero}"`);
  
  // Función para normalizar texto removiendo tildes y caracteres especiales
  const normalizarTexto = (texto: string): string => {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover tildes
      .replace(/\./g, ' ') // Reemplazar puntos con espacios
      .replace(/[^\w\s]/g, ' ') // Reemplazar otros caracteres especiales con espacios
      .replace(/\s+/g, ' ') // Normalizar espacios múltiples
      .trim();
  };
  
  // Función para validar coincidencia EXACTA de dirección
  // Debe ser IDÉNTICA: "BALCARCE 333" = "BALCARCE 333", NO "VALCARCE", "BALCARC", "334", "332"
  const esCoincidenciaExacta = (direccionSucursal: string, calleNumeroPedido: string): boolean => {
    if (!calleNumeroPedido || !direccionSucursal) return false;
    
    // Normalizar ambas direcciones (remover tildes, caracteres especiales, etc.)
    const direccionRealNormalizada = normalizarTexto(direccionSucursal);
    const calleNumeroNormalizado = normalizarTexto(calleNumeroPedido);
    
    console.log(`🔍 Comparando: "${calleNumeroNormalizado}" con "${direccionRealNormalizada}"`);
    
    // Extraer números de ambas direcciones
    const numerosSucursal = direccionRealNormalizada.match(/\d+/g) || [];
    const numerosPedido = calleNumeroNormalizado.match(/\d+/g) || [];
    
    // Si los números no coinciden exactamente, descartar
    if (numerosPedido.length > 0) {
      const numeroPrincipalPedido = numerosPedido[numerosPedido.length - 1];
      const tieneNumeroExacto = numerosSucursal.some(num => num === numeroPrincipalPedido);
      if (!tieneNumeroExacto) {
        console.log(`❌ Número no coincide: pedido tiene "${numeroPrincipalPedido}", sucursal tiene [${numerosSucursal.join(', ')}]`);
        return false;
      }
      console.log(`✅ Número coincide: "${numeroPrincipalPedido}"`);
    }
    
    // Extraer palabras de la calle (sin el número)
    const palabrasDireccion = direccionRealNormalizada.split(/\s+/).filter(p => !/^\d+$/.test(p));
    const palabrasPedido = calleNumeroNormalizado.split(/\s+/).filter(p => !/^\d+$/.test(p));
    
    // Verificar que todas las palabras importantes del pedido estén en la dirección
    const palabrasImportantesPedido = palabrasPedido.filter(p => p.length >= 3); // Solo palabras de 3+ caracteres
    const todasLasPalabrasCoinciden = palabrasImportantesPedido.every(palabra => {
      const coincide = palabrasDireccion.some(palabraDir => 
        palabraDir === palabra || 
        palabraDir.startsWith(palabra) || 
        palabra.startsWith(palabraDir) ||
        palabraDir.includes(palabra) ||
        palabra.includes(palabraDir)
      );
      if (!coincide) {
        console.log(`❌ Palabra "${palabra}" no encontrada en dirección de sucursal`);
      }
      return coincide;
    });
    
    if (!todasLasPalabrasCoinciden) {
      console.log(`❌ No todas las palabras coinciden`);
      return false;
    }
    
    // Verificar que la dirección contiene la calle y número al inicio
    // Puede tener coma, espacio, o estar al inicio exacto
    // Primero verificar si la dirección de la sucursal empieza con la dirección del pedido
    const empiezaConDireccionPedido = direccionRealNormalizada.startsWith(calleNumeroNormalizado);
    
    // También verificar si contiene la dirección del pedido seguida de espacio o coma
    const contieneDireccionPedido = 
      direccionRealNormalizada.startsWith(calleNumeroNormalizado + ' ') ||
      direccionRealNormalizada.startsWith(calleNumeroNormalizado + ',') ||
      direccionRealNormalizada.includes(' ' + calleNumeroNormalizado + ' ') ||
      direccionRealNormalizada.includes(',' + calleNumeroNormalizado + ',') ||
      direccionRealNormalizada.includes(',' + calleNumeroNormalizado + ' ') ||
      direccionRealNormalizada.endsWith(' ' + calleNumeroNormalizado);
    
    const tieneCoincidenciaExacta = empiezaConDireccionPedido || contieneDireccionPedido;
    
    if (tieneCoincidenciaExacta) {
      console.log(`✅ Coincidencia exacta encontrada!`);
      console.log(`   Dirección pedido normalizada: "${calleNumeroNormalizado}"`);
      console.log(`   Dirección sucursal normalizada: "${direccionRealNormalizada}"`);
    } else {
      console.log(`❌ No hay coincidencia exacta`);
      console.log(`   Dirección pedido normalizada: "${calleNumeroNormalizado}"`);
      console.log(`   Dirección sucursal normalizada: "${direccionRealNormalizada}"`);
      console.log(`   Empieza con: ${empiezaConDireccionPedido}`);
      console.log(`   Contiene: ${contieneDireccionPedido}`);
    }
    
    return tieneCoincidenciaExacta && todasLasPalabrasCoinciden;
  };
  
  // Función para validar código postal
  const validarCodigoPostal = (sucursal: AndreaniSucursalInfo): boolean => {
    if (!codigoPostalFinal) return true;
    const cpSucursal = extraerCodigoPostalSucursal(sucursal.direccion);
    return cpSucursal === codigoPostalFinal || sucursal.direccion.includes(codigoPostalFinal);
  };
  
  // Función para validar ciudad y provincia
  const validarCiudadYProvincia = (sucursal: AndreaniSucursalInfo): boolean => {
    if (!ciudad && !localidad && !provinciaFinal) return false;
    
    const direccionSucursal = normalizarTexto(sucursal.direccion);
    const nombreSucursal = normalizarTexto(sucursal.nombre_sucursal);
    
    let coincideProvincia = false;
    let coincideCiudad = false;
    
    // Validar provincia
    if (provinciaFinal) {
      const provinciaNorm = normalizarTexto(provinciaFinal);
      coincideProvincia = direccionSucursal.includes(provinciaNorm) || 
                         nombreSucursal.includes(provinciaNorm) ||
                         direccionSucursal.includes(provinciaNorm.replace(/\s+/g, ''));
    } else {
      coincideProvincia = true; // Si no hay provincia, considerar válido
    }
    
    // Validar ciudad/localidad
    const ciudadValidar = ciudad || localidad;
    if (ciudadValidar) {
      const ciudadNorm = normalizarTexto(ciudadValidar);
      coincideCiudad = direccionSucursal.includes(ciudadNorm) || 
                       nombreSucursal.includes(ciudadNorm) ||
                       direccionSucursal.includes(ciudadNorm.replace(/\s+/g, ''));
    } else {
      coincideCiudad = true; // Si no hay ciudad, considerar válido
    }
    
    return coincideProvincia && coincideCiudad;
  };
  
  // PASO 1: Buscar coincidencias EXACTAS de dirección en TODAS las sucursales
  console.log('🔍 PASO 1: Buscando coincidencias EXACTAS de dirección...');
  
  const todasCoincidenciasExactas = sucursales.filter(sucursal => {
    const direccionReal = extraerDireccionReal(sucursal);
    return esCoincidenciaExacta(direccionReal, calleNumero);
  });
  
  console.log(`✅ Coincidencias EXACTAS encontradas: ${todasCoincidenciasExactas.length}`);
  
  // PASO 2: Separar coincidencias en HOP y oficiales
  const coincidenciasHop = todasCoincidenciasExactas.filter(suc => 
    suc.nombre_sucursal.toLowerCase().startsWith('punto andreani hop')
  );
  const coincidenciasOficialesPorDireccion = todasCoincidenciasExactas.filter(suc => 
    !suc.nombre_sucursal.toLowerCase().startsWith('punto andreani hop')
  );
  
  console.log(`📊 Coincidencias HOP: ${coincidenciasHop.length}, Coincidencias oficiales: ${coincidenciasOficialesPorDireccion.length}`);
  
  // PASO 3: Si hay coincidencia en punto ANDREANI HOP → VÁLIDO (no validar CP)
  if (coincidenciasHop.length > 0) {
    console.log('✅ Coincidencia EXACTA encontrada en punto ANDREANI HOP (aceptada sin validar CP)');
    if (coincidenciasHop.length === 1) {
      console.log(`✅ Punto ANDREANI HOP: ${coincidenciasHop[0].nombre_sucursal}`);
      return coincidenciasHop[0].nombre_sucursal;
    } else {
      console.log(`⚠️ Múltiples puntos HOP, usando el primero: ${coincidenciasHop[0].nombre_sucursal}`);
      return coincidenciasHop[0].nombre_sucursal;
    }
  }
  
  // PASO 4: Si hay coincidencia en sucursal oficial → Validar código postal
  if (coincidenciasOficialesPorDireccion.length > 0) {
    console.log('🔍 PASO 4: Validando código postal en coincidencias oficiales...');
    
    // Filtrar solo las que tienen código postal coincidente
    const coincidenciasOficialesValidas = coincidenciasOficialesPorDireccion.filter(sucursal => {
      if (codigoPostalFinal && !validarCodigoPostal(sucursal)) {
        console.log(`⚠️ Sucursal ${sucursal.nombre_sucursal} descartada: CP no coincide`);
        return false;
      }
      return true;
    });
    
    if (coincidenciasOficialesValidas.length > 0) {
      console.log(`✅ Sucursal oficial válida (dirección exacta + CP): ${coincidenciasOficialesValidas[0].nombre_sucursal}`);
      return coincidenciasOficialesValidas[0].nombre_sucursal;
    } else {
      // Si no coincide el CP, validar CIUDAD Y PROVINCIA
      console.log('🔄 CP no coincide, validando CIUDAD Y PROVINCIA...');
      
      const coincidenciasPorCiudadProvincia = coincidenciasOficialesPorDireccion.filter(sucursal => {
        const esValida = validarCiudadYProvincia(sucursal);
        if (esValida) {
          console.log(`✅ Sucursal ${sucursal.nombre_sucursal} válida: coincide CALLE + NUMERO + CIUDAD + PROVINCIA`);
        }
        return esValida;
      });
      
      if (coincidenciasPorCiudadProvincia.length > 0) {
        console.log(`✅ Sucursal oficial válida (dirección exacta + ciudad/provincia): ${coincidenciasPorCiudadProvincia[0].nombre_sucursal}`);
        return coincidenciasPorCiudadProvincia[0].nombre_sucursal;
      }
      
      // Si no coincide ciudad/provincia, buscar sucursal oficial por código postal como fallback
      console.log('🔄 Ciudad/Provincia no coincide, buscando sucursal oficial por código postal exacto...');
      const todasSucursalesOficiales = sucursales.filter(suc => 
        !suc.nombre_sucursal.toLowerCase().startsWith('punto andreani hop')
      );
      
      const sucursalPorCP = todasSucursalesOficiales.find(sucursal => {
        const cpSucursal = extraerCodigoPostalSucursal(sucursal.direccion);
        return cpSucursal === codigoPostalFinal || sucursal.direccion.includes(codigoPostalFinal);
      });
      
      if (sucursalPorCP) {
        console.log(`✅ Sucursal oficial encontrada por código postal: ${sucursalPorCP.nombre_sucursal}`);
        return sucursalPorCP.nombre_sucursal;
      }
    }
  }
  
  // PASO 5: Si no hay coincidencia exacta de dirección, buscar por código postal
  if (codigoPostalFinal && todasCoincidenciasExactas.length === 0) {
    console.log('🔄 PASO 5: No hay coincidencia exacta de dirección, buscando por código postal...');
    
    const todasSucursalesOficiales = sucursales.filter(suc => 
      !suc.nombre_sucursal.toLowerCase().startsWith('punto andreani hop')
    );
    
    const sucursalPorCP = todasSucursalesOficiales.find(sucursal => {
      const cpSucursal = extraerCodigoPostalSucursal(sucursal.direccion);
      return cpSucursal === codigoPostalFinal || sucursal.direccion.includes(codigoPostalFinal);
    });
    
    if (sucursalPorCP) {
      console.log(`✅ Sucursal oficial encontrada por código postal: ${sucursalPorCP.nombre_sucursal}`);
      return sucursalPorCP.nombre_sucursal;
    } else {
      console.error(`❌ ERROR: No se encontró sucursal oficial con código postal ${codigoPostalFinal}`);
      console.log('Dirección buscada:', direccionNormalizada);
      console.log('=== FIN DEBUG SUCURSAL ===');
      return 'SUCURSAL NO ENCONTRADA';
    }
  }
  
      // Si llegamos aquí, no encontramos ninguna coincidencia
      // Solo buscar por dirección si NO hay código postal (caso excepcional)
      let coincidenciasExactas: AndreaniSucursalInfo[] = [];
      if (!codigoPostalFinal) {
        console.log('⚠️ No hay código postal, buscando por dirección en todas las sucursales...');
        coincidenciasExactas = sucursales.filter(sucursal => {
          const direccionReal = extraerDireccionReal(sucursal);
          const direccionRealNormalizada = normalizarDireccion(direccionReal);
          const direccionSucursal = sucursal.direccion.toLowerCase().trim();
          const direccionSucursalNormalizada = normalizarDireccion(sucursal.direccion);
          
          const tieneCoincidenciaExacta = calleNumeroNormalizada && direccionRealNormalizada.includes(calleNumeroNormalizada);
          const tieneCoincidenciaDirecta = calleNumero && direccionReal.toLowerCase().includes(calleNumero.toLowerCase());
          
          return tieneCoincidenciaExacta || tieneCoincidenciaDirecta;
        });
      } else {
        console.error(`❌ DEBUG: No se encontró sucursal después de todos los pasos`);
        console.error(`   - Código postal proporcionado: "${codigoPostalFinal}"`);
        console.error(`   - Provincia proporcionada: "${provinciaFinal}"`);
        console.error(`   - Calle y número buscado: "${calleNumero}"`);
        console.error(`   - Total sucursales revisadas: ${sucursales.length}`);
        
        // Mostrar algunas sucursales de la provincia para debugging
        if (provinciaFinal) {
          const sucursalesEnProvincia = sucursales.filter(suc => {
            const dirSuc = suc.direccion.toLowerCase();
            const nombreSuc = suc.nombre_sucursal.toLowerCase();
            return dirSuc.includes(provinciaFinal.toLowerCase()) || nombreSuc.includes(provinciaFinal.toLowerCase());
          });
          console.error(`   - Sucursales en provincia "${provinciaFinal}": ${sucursalesEnProvincia.length}`);
          if (sucursalesEnProvincia.length > 0 && sucursalesEnProvincia.length <= 5) {
            console.error(`   - Ejemplos de sucursales en la provincia:`);
            sucursalesEnProvincia.slice(0, 5).forEach(suc => {
              console.error(`     * ${suc.nombre_sucursal} - ${suc.direccion}`);
            });
          }
        }
        
        // Mostrar sucursales con código postal similar
        if (codigoPostalFinal) {
          const sucursalesConCPSimilar = sucursales.filter(suc => {
            const cpSuc = extraerCodigoPostalSucursal(suc.direccion);
            return cpSuc && cpSuc === codigoPostalFinal;
          });
          console.error(`   - Sucursales con código postal "${codigoPostalFinal}": ${sucursalesConCPSimilar.length}`);
          if (sucursalesConCPSimilar.length > 0 && sucursalesConCPSimilar.length <= 5) {
            console.error(`   - Ejemplos de sucursales con ese CP:`);
            sucursalesConCPSimilar.slice(0, 5).forEach(suc => {
              console.error(`     * ${suc.nombre_sucursal} - ${suc.direccion}`);
            });
          }
        }
      }
  
  // Si no hay coincidencias exactas, intentar búsqueda difusa (solo si no hay código postal)
  let coincidenciasDifusas: { sucursal: AndreaniSucursalInfo; similitud: number }[] = [];
  if (coincidenciasExactas.length === 0 && !codigoPostalFinal) {
    console.log('No hay coincidencias exactas y no hay código postal, intentando búsqueda difusa...');
    
    coincidenciasDifusas = sucursales.map(sucursal => {
      const direccionReal = extraerDireccionReal(sucursal);
      const direccionRealNormalizada = normalizarDireccion(direccionReal);
      const nombreSucursalNormalizado = normalizarDireccion(sucursal.nombre_sucursal);
      
      // Calcular similitud en la dirección real
      const similitudDireccion = calcularSimilitud(calleNumeroNormalizada, direccionRealNormalizada);
      
      // Calcular similitud con prefijo "PUNTO ANDREANI HOP"
      const direccionConPrefijo = `PUNTO ANDREANI HOP ${calleNumero}`.toLowerCase();
      const direccionConPrefijoNormalizada = normalizarDireccion(direccionConPrefijo);
      const similitudConPrefijo = calcularSimilitud(direccionConPrefijoNormalizada, nombreSucursalNormalizado);
      
      // Tomar la mayor similitud
      const similitud = Math.max(similitudDireccion, similitudConPrefijo);
      
      return { sucursal, similitud };
    }).filter(item => item.similitud > 0.6) // Solo similitudes > 60%
    .sort((a, b) => b.similitud - a.similitud);
    
    console.log('Coincidencias difusas encontradas:', coincidenciasDifusas.length);
    coincidenciasDifusas.slice(0, 3).forEach(item => 
      console.log(`- ${item.sucursal.nombre_sucursal}: ${item.similitud.toFixed(2)} - ${item.sucursal.direccion}`)
    );
  }
  
  console.log(`Coincidencias encontradas para "${calleNumero}":`, coincidenciasExactas.length);
  
  // Debug: mostrar sucursales que contienen la calle
  if (calleNumero) {
    const sucursalesConCalle = sucursales.filter(sucursal => 
      sucursal.direccion.toLowerCase().includes(calleNumero.toLowerCase())
    );
    console.log(`Sucursales que contienen "${calleNumero}":`, sucursalesConCalle.slice(0, 5).map(s => s.nombre_sucursal));
  }
  
  // LÓGICA: Si hay múltiples números en la dirección, buscar sucursal más cercana por número
  // Esta lógica solo se ejecuta si ya hay coincidencias exactas pero múltiples
  const numeroPedidoMatch = calleNumero.match(/\b(\d+)\b/g);
  if (numeroPedidoMatch && numeroPedidoMatch.length >= 2 && coincidenciasExactas.length > 1) {
    // Hay múltiples números (ej: "CALLE 49 621")
    const ultimoNumeroPedido = parseInt(numeroPedidoMatch[numeroPedidoMatch.length - 1]);
    const numeroCallePedido = numeroPedidoMatch[0]; // Primer número es el de la calle
    
    console.log(`🔍 Buscando sucursal más cercana: Calle "${numeroCallePedido}", Número pedido: ${ultimoNumeroPedido}`);
    
    // Buscar todas las sucursales que tienen el mismo número de calle (dentro de las coincidencias exactas)
    const todasSucursalesMismaCalle = coincidenciasExactas.filter(sucursal => {
      const direccionSuc = extraerDireccionReal(sucursal).toLowerCase();
      const numerosSuc = direccionSuc.match(/\b(\d+)\b/g);
      
      // Verificar que el primer número coincide (ej: "49" en "CALLE 49 621" debe coincidir con "49" en "49 843" o "CALLE 49 120")
      if (numerosSuc && numerosSuc.length >= 1 && numerosSuc[0] === numeroCallePedido) {
        return true;
      }
      return false;
    });
    
    if (todasSucursalesMismaCalle.length >= 2) {
      console.log(`✅ Encontradas ${todasSucursalesMismaCalle.length} sucursales en la calle ${numeroCallePedido}`);
      
      // Encontrar la sucursal con el número más cercano
      let sucursalMasCercana: AndreaniSucursalInfo | null = null;
      let distanciaMinima = Infinity;
      
      for (const sucursal of todasSucursalesMismaCalle) {
        const direccionSuc = extraerDireccionReal(sucursal);
        const numerosSuc = direccionSuc.match(/\b(\d+)\b/g);
        
        if (numerosSuc && numerosSuc.length >= 2) {
          const ultimoNumeroSuc = parseInt(numerosSuc[numerosSuc.length - 1]);
          const distancia = Math.abs(ultimoNumeroPedido - ultimoNumeroSuc);
          
          console.log(`  - ${sucursal.nombre_sucursal}: número ${ultimoNumeroSuc}, distancia ${distancia}`);
          
          if (distancia < distanciaMinima) {
            distanciaMinima = distancia;
            sucursalMasCercana = sucursal;
          }
        }
      }
      
      if (sucursalMasCercana && distanciaMinima !== Infinity) {
        console.log(`✅ Sucursal más cercana encontrada: ${sucursalMasCercana.nombre_sucursal} (distancia: ${distanciaMinima})`);
        return sucursalMasCercana.nombre_sucursal;
      }
    }
  }

  // Si no hay coincidencias exactas, usar búsqueda difusa
  if (coincidenciasExactas.length === 0) {
    if (coincidenciasDifusas.length > 0) {
      console.log('Usando mejor coincidencia difusa:', coincidenciasDifusas[0].sucursal.nombre_sucursal, 
                  'con similitud:', coincidenciasDifusas[0].similitud.toFixed(2));
      return coincidenciasDifusas[0].sucursal.nombre_sucursal;
    } else {
      // Si no hay coincidencias exactas ni difusas, intentar buscar por código postal
      if (codigoPostalFinal) {
        console.log('🔄 Sin coincidencias, intentando búsqueda por código postal:', codigoPostalFinal);
        
        // Si llegamos aquí y hay código postal, ya debería estar filtrado
        // Pero por si acaso, buscar en sucursales oficiales
        const todasSucursalesOficiales = sucursales.filter(suc => 
          !suc.nombre_sucursal.toLowerCase().startsWith('punto andreani hop')
        );
        
        const sucursalOficialPorCP = todasSucursalesOficiales.find(sucursal => {
          const cpSucursal = extraerCodigoPostalSucursal(sucursal.direccion);
          return cpSucursal === codigoPostalFinal || sucursal.direccion.includes(codigoPostalFinal);
        });
        
        if (sucursalOficialPorCP) {
          console.log(`✅ Sucursal oficial encontrada por código postal: ${sucursalOficialPorCP.nombre_sucursal}`);
          return sucursalOficialPorCP.nombre_sucursal;
        }
      }
      
      console.error('❌ No se encontraron coincidencias después de todos los intentos');
      console.error('   Dirección buscada:', direccionNormalizada);
      console.error('   Calle y número:', calleNumero);
      console.error('   Localidad:', localidad);
      console.error('   Ciudad:', ciudad);
      console.error('   Código postal usado:', codigoPostalFinal || 'NINGUNO');
      console.error('   Provincia:', provinciaFinal || 'NINGUNA');
      console.error('   Total sucursales revisadas:', sucursales.length);
      
      // Mostrar información de debugging adicional
      if (codigoPostalFinal) {
        const sucursalesConCP = sucursales.filter(suc => {
          const cpSuc = extraerCodigoPostalSucursal(suc.direccion);
          return cpSuc === codigoPostalFinal;
        });
        console.error(`   Sucursales con código postal "${codigoPostalFinal}": ${sucursalesConCP.length}`);
        if (sucursalesConCP.length > 0 && sucursalesConCP.length <= 3) {
          sucursalesConCP.forEach(suc => {
            console.error(`     - ${suc.nombre_sucursal}: ${suc.direccion}`);
          });
        }
      }
      
      if (provinciaFinal) {
        const provinciaLower = provinciaFinal.toLowerCase();
        const sucursalesEnProvincia = sucursales.filter(suc => {
          const dirSuc = suc.direccion.toLowerCase();
          const nombreSuc = suc.nombre_sucursal.toLowerCase();
          return dirSuc.includes(provinciaLower) || nombreSuc.includes(provinciaLower);
        });
        console.error(`   Sucursales en provincia "${provinciaFinal}": ${sucursalesEnProvincia.length}`);
        if (sucursalesEnProvincia.length > 0 && sucursalesEnProvincia.length <= 3) {
          sucursalesEnProvincia.slice(0, 3).forEach(suc => {
            console.error(`     - ${suc.nombre_sucursal}: ${suc.direccion}`);
          });
        }
      }
      
      console.error('=== FIN DEBUG SUCURSAL ===');
      return 'SUCURSAL NO ENCONTRADA';
    }
  }
  
  // Si hay solo UNA coincidencia, devolverla
  if (coincidenciasExactas.length === 1) {
    console.log('Una sola coincidencia encontrada:', coincidenciasExactas[0].nombre_sucursal);
    return coincidenciasExactas[0].nombre_sucursal;
  }
  
  // Si hay MÚLTIPLES coincidencias, desempatar por localización
  console.log('Múltiples coincidencias encontradas, desempatando por localización...');
  
  let mejorCoincidencia = '';
  let mejorPuntuacion = 0;
  
  for (const sucursal of coincidenciasExactas) {
    const direccionSucursal = sucursal.direccion.toLowerCase().trim();
    const nombreSucursal = sucursal.nombre_sucursal.toLowerCase();
    let puntuacion = 0;
    
    // Desempate por código postal (más específico)
    if (codigoPostalFinal && direccionSucursal.includes(codigoPostalFinal)) {
      puntuacion += 10;
      console.log(`Desempate por código postal ${codigoPostalFinal} en: ${sucursal.nombre_sucursal}`);
    }
    
    // Desempate por localidad
    if (localidad && direccionSucursal.includes(localidad)) {
      puntuacion += 8;
      console.log(`Desempate por localidad ${localidad} en: ${sucursal.nombre_sucursal}`);
    }
    if (localidad && nombreSucursal.includes(localidad)) {
      puntuacion += 6;
    }
    
    // Desempate por ciudad
    if (ciudad && direccionSucursal.includes(ciudad)) {
      puntuacion += 6;
      console.log(`Desempate por ciudad ${ciudad} en: ${sucursal.nombre_sucursal}`);
    }
    if (ciudad && nombreSucursal.includes(ciudad)) {
      puntuacion += 4;
    }
    
    // Desempate por provincia
    if (provinciaFinal && direccionSucursal.includes(provinciaFinal)) {
      puntuacion += 4;
      console.log(`Desempate por provincia ${provinciaFinal} en: ${sucursal.nombre_sucursal}`);
    }
    
    if (puntuacion > mejorPuntuacion) {
      mejorPuntuacion = puntuacion;
      mejorCoincidencia = sucursal.nombre_sucursal;
    }
  }
  
  // Si no se pudo desempatar, devolver la primera coincidencia
  if (mejorPuntuacion === 0) {
    console.log('No se pudo desempatar, devolviendo primera coincidencia:', coincidenciasExactas[0].nombre_sucursal);
    return coincidenciasExactas[0].nombre_sucursal;
  }
  
  console.log('Desempate exitoso, mejor coincidencia:', mejorCoincidencia, 'con puntuación:', mejorPuntuacion);
  return mejorCoincidencia;
};

// Función para generar sugerencias de sucursales cuando no hay coincidencias exactas
export const generarSugerenciaSucursal = (
  direccionPedido: string,
  sucursales: AndreaniSucursalInfo[],
  codigoPostal?: string,
  provincia?: string,
  ciudad?: string,
  localidad?: string,
  numeroOrden?: string
): { sucursal: AndreaniSucursalInfo | null; razon: string; score: number } | null => {
  console.log('🔍 Generando sugerencia de sucursal...');
  console.log(`   Dirección: ${direccionPedido}`);
  console.log(`   CP: ${codigoPostal}, Provincia: ${provincia}, Ciudad: ${ciudad || localidad}`);
  
  const componentes = direccionPedido.split(',').map(c => c.trim());
  const calleNumero = componentes[0] || '';
  
  // Normalizar datos
  const normalizarTexto = (texto: string): string => {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\./g, ' ')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  const calleNumeroNorm = normalizarTexto(calleNumero);
  const provinciaNorm = provincia ? normalizarTexto(provincia) : '';
  const ciudadNorm = (ciudad || localidad) ? normalizarTexto(ciudad || localidad || '') : '';
  const cpLimpio = codigoPostal ? codigoPostal.replace(/\D/g, '') : '';
  
  // Extraer código postal de sucursal
  const extraerCodigoPostalSucursal = (direccion: string): string | null => {
    if (!direccion) return null;
    const matches = direccion.match(/\b([A-Z]?\d{4,5})\b/g);
    if (matches && matches.length > 0) {
      const cp = matches[0];
      if (/^[A-Z]/.test(cp)) {
        return cp.substring(1);
      }
      return cp;
    }
    const soloNumeros = direccion.match(/\b(\d{4,5})\b/);
    if (soloNumeros) {
      return soloNumeros[1];
    }
    return null;
  };
  
  // Calcular score para cada sucursal
  const sugerencias: Array<{ sucursal: AndreaniSucursalInfo; score: number; razones: string[] }> = [];
  
  for (const sucursal of sucursales) {
    const direccionSucNorm = normalizarTexto(sucursal.direccion);
    const nombreSucNorm = normalizarTexto(sucursal.nombre_sucursal);
    let score = 0;
    const razones: string[] = [];
    
    // Excluir puntos HOP de las sugerencias (solo sucursales oficiales)
    if (sucursal.nombre_sucursal.toLowerCase().includes('punto andreani hop')) {
      continue;
    }
    
    // 1. Coincidencia parcial de calle (máximo 50 puntos)
    const palabrasCalle = calleNumeroNorm.split(/\s+/).filter(p => p.length >= 3);
    let palabrasCoinciden = 0;
    for (const palabra of palabrasCalle) {
      if (direccionSucNorm.includes(palabra) || nombreSucNorm.includes(palabra)) {
        palabrasCoinciden++;
      }
    }
    if (palabrasCoinciden > 0) {
      const scoreCalle = Math.min(50, (palabrasCoinciden / palabrasCalle.length) * 50);
      score += scoreCalle;
      razones.push(`${palabrasCoinciden}/${palabrasCalle.length} palabras de la calle coinciden`);
    }
    
    // 2. Coincidencia de código postal (25 puntos)
    if (cpLimpio) {
      const cpSucursal = extraerCodigoPostalSucursal(sucursal.direccion);
      if (cpSucursal === cpLimpio) {
        score += 25;
        razones.push('Código postal coincide exactamente');
      } else if (cpSucursal && cpLimpio.length >= 4 && cpSucursal.startsWith(cpLimpio.substring(0, 4))) {
        score += 12;
        razones.push('Código postal parcialmente coincide');
      }
    }
    
    // 3. Coincidencia de provincia (20 puntos) - CRÍTICO
    if (provinciaNorm) {
      if (direccionSucNorm.includes(provinciaNorm) || nombreSucNorm.includes(provinciaNorm)) {
        score += 20;
        razones.push('Provincia coincide');
      }
    }
    
    // 4. Coincidencia de ciudad/localidad (15 puntos)
    if (ciudadNorm) {
      if (direccionSucNorm.includes(ciudadNorm) || nombreSucNorm.includes(ciudadNorm)) {
        score += 15;
        razones.push('Ciudad/Localidad coincide');
      }
    }
    
    // 5. Bonus por coincidencia exacta de nombre de sucursal con ciudad/localidad (10 puntos)
    if (ciudadNorm && nombreSucNorm.includes(ciudadNorm)) {
      score += 10;
      razones.push('Nombre de sucursal coincide con ciudad/localidad');
    }
    
    // Reducir umbral mínimo a 20 puntos para asegurar que siempre haya sugerencias
    // Si tiene calle + provincia = mínimo 50 puntos, así que 20 es razonable
    if (score >= 20) {
      sugerencias.push({ sucursal, score, razones });
    }
  }
  
  // Ordenar por score descendente
  sugerencias.sort((a, b) => b.score - a.score);
  
  if (sugerencias.length > 0) {
    const mejorSugerencia = sugerencias[0];
    const razonCompleta = mejorSugerencia.razones.join('; ');
    console.log(`✅ Sugerencia generada: ${mejorSugerencia.sucursal.nombre_sucursal} (Score: ${mejorSugerencia.score})`);
    console.log(`   Razón: ${razonCompleta}`);
    return {
      sucursal: mejorSugerencia.sucursal,
      razon: razonCompleta,
      score: mejorSugerencia.score
    };
  }
  
  console.log('❌ No se encontró sugerencia válida');
  return null;
};

// Detectar si el CSV pertenece a Shopify por sus encabezados característicos
const isShopifyCSV = (text: string): boolean => {
  const head = text.slice(0, 500).toLowerCase();
  return head.includes('name,email,financial status') && head.includes('shipping method');
};

// Procesador específico para CSV de Shopify (detecta envíos a domicilio y sucursal)
const processShopifyOrders = async (
  csvText: string,
  config?: { peso: number; alto: number; ancho: number; profundidad: number; valorDeclarado: number }
): Promise<{
  domicilioCSV: string;
  sucursalCSV: string;
  processingInfo: any;
}> => {
  // Valores por defecto
  const defaultConfig = {
    peso: 400,
    alto: 10,
    ancho: 10,
    profundidad: 10,
    valorDeclarado: 6000,
  };
  const finalConfig = config || defaultConfig;
  // Cargar datos auxiliares
  const [codigosPostales, sucursales] = await Promise.all([
    fetchCodigosPostales(),
    fetchSucursales(),
  ]);

  // Parsear con coma como delimitador
  const parseWithPapa = (): Promise<any[]> => new Promise((resolve) => {
    Papa.parse(csvText.replace(/^\uFEFF/, ''), {
      header: true,
      skipEmptyLines: true,
      delimiter: ',',
      quoteChar: '"',
      complete: (results: { data: any[] }) => resolve(results.data),
    });
  });

  const rows = await parseWithPapa();
  const domicilios: any[] = [];
  const sucursalesOutput: AndreaniSucursalOutput[] = [];

  let contadorDomicilios = 0;
  let contadorSucursales = 0;
  let contadorNoProcesados = 0;
  const droppedOrders: string[] = [];
  const sugerenciasSucursalShopify: SucursalSugerencia[] = [];
  const autofilledEmails: string[] = [];

  // Construir índice PROVINCIA/LOCALIDAD -> formato exacto del catálogo
  const provLocToFormato: Map<string, string> = new Map();
  for (const [, formato] of codigosPostales.entries()) {
    const norm = formato
      .toUpperCase()
      .replace(/[ÁÀÄÂ]/g, 'A')
      .replace(/[ÉÈËÊ]/g, 'E')
      .replace(/[ÍÌÏÎ]/g, 'I')
      .replace(/[ÓÒÖÔ]/g, 'O')
      .replace(/[ÚÙÜÛ]/g, 'U')
      .replace(/[Ñ]/g, 'N')
      .replace(/\./g, ' ')
      .replace(/,/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const partes = norm.split('/').map(p => p.trim());
    if (partes.length >= 2) {
      const key = `${partes[0]} / ${partes[1]}`;
      if (!provLocToFormato.has(key)) provLocToFormato.set(key, formato);
    }
  }

  const getRowField = (row: any, key: string): string => (row?.[key] ?? '').toString().trim();

  // Rastrear pedidos ya procesados para evitar duplicados
  const pedidosProcesados = new Set<string>();

  for (const row of rows) {
    if (!row || Object.keys(row).length === 0) continue;

    const numeroOrden = getRowField(row, 'Name') || getRowField(row, 'Id') || '';
    let email = getRowField(row, 'Email');
    const telefono = getRowField(row, 'Shipping Phone') || getRowField(row, 'Phone');
    const medioEnvio = getRowField(row, 'Shipping Method');

    // Verificar si es una línea de producto adicional (tiene número de orden pero falta información esencial)
    // Las líneas de productos adicionales tienen número de orden pero campos vacíos como email, dirección, etc.
    const shippingAddress1 = getRowField(row, 'Shipping Address1');
    const shippingCity = getRowField(row, 'Shipping City');
    
    // Si ya procesamos este pedido, saltar (es un producto adicional)
    if (numeroOrden && pedidosProcesados.has(numeroOrden)) {
      console.log(`⏭️ Saltando producto adicional del pedido ${numeroOrden} (ya procesado)`);
      continue;
    }
    
    // Si tiene número de orden pero le faltan campos esenciales (email, dirección), es producto adicional
    // Detectar si es línea incompleta: tiene número de orden pero no tiene email O no tiene dirección
    if (numeroOrden && (!email || !shippingAddress1 || !shippingCity)) {
      console.log(`⏭️ Saltando línea incompleta del pedido ${numeroOrden} (email: "${email}", dirección: "${shippingAddress1}")`);
      continue;
    }

    // Nombre y apellido desde dirección de envío (fallback a facturación)
    const shippingName = getRowField(row, 'Shipping Name') || getRowField(row, 'Billing Name');
    const [nombre, ...apParts] = shippingName.split(' ');
    const apellido = apParts.join(' ');

    // Dirección
    const address1 = getRowField(row, 'Shipping Address1');
    const address2 = getRowField(row, 'Shipping Address2');
    const localidad = getRowField(row, 'Shipping City');
    // Mejorar extracción de código postal: extraer solo los dígitos (4-5 dígitos consecutivos)
    const zipRaw = getRowField(row, 'Shipping Zip');
    let codigoPostal = '';
    // Buscar secuencia de 4-5 dígitos en el código postal
    const cpMatch = zipRaw.match(/\d{4,5}/);
    if (cpMatch) {
      codigoPostal = cpMatch[0];
    } else {
      // Si no hay secuencia de 4-5 dígitos, usar solo dígitos (fallback)
      codigoPostal = zipRaw.replace(/[^\d]/g, '');
    }
    const provincia = getRowField(row, 'Shipping Province Name') || getRowField(row, 'Shipping Province');

    // Extraer calle y número desde address1
    const calle = normalizarNombre(address1);
    let numeroCalle = '0';
    const numMatch = address1.match(/\b(\d{1,6})\b/);
    if (numMatch) {
      numeroCalle = numMatch[1];
    }

    const pisoDepto = normalizarNombre(address2);

    // Teléfono: limpiar prefijos +54 y el 9
    let tel = telefono.replace(/[^\d]/g, '');
    if (tel.startsWith('54')) tel = tel.substring(2);
    if (tel.startsWith('9')) tel = tel.substring(1);

    // Código de área básico: intentar detectar 2/3/4 dígitos comunes
    let celularCodigo = '11';
    let celularNumero = tel;
    const posibles4 = ['2652','2901','2920','2944','2954','2965','2966','3541'];
    const posibles3 = ['221','223','291','341','342','343','351','358','261','381','376','362','379','370','387','388','380','383','385','264','297','299'];
    if (tel.length >= 10 && posibles4.some(p => tel.startsWith(p))) {
      celularCodigo = posibles4.find(p => tel.startsWith(p))!;
      celularNumero = tel.substring(4);
    } else if (tel.length >= 10 && posibles3.some(p => tel.startsWith(p))) {
      celularCodigo = posibles3.find(p => tel.startsWith(p))!;
      celularNumero = tel.substring(3);
    } else if (tel.length >= 8) {
      celularCodigo = tel.substring(0, 2);
      celularNumero = tel.substring(2);
    }

    // DNI: Intentar extraer de Billing Company o Billing Name
    let dniProcesado = '00000000';
    const billingCompany = getRowField(row, 'Billing Company');
    const billingName = getRowField(row, 'Billing Name');
    
    // Intentar extraer DNI de Billing Company primero
    const dniDesdeCompany = extraerDNI(billingCompany);
    if (dniDesdeCompany) {
      dniProcesado = dniDesdeCompany;
      console.log(`DNI extraído de Billing Company para pedido ${numeroOrden}: ${dniProcesado}`);
    } else {
      // Si no se encontró en Billing Company, intentar en Billing Name
      const dniDesdeName = extraerDNI(billingName);
      if (dniDesdeName) {
        dniProcesado = dniDesdeName;
        console.log(`DNI extraído de Billing Name para pedido ${numeroOrden}: ${dniProcesado}`);
      } else {
        console.warn(`No se pudo extraer DNI para pedido ${numeroOrden} (Billing Company: "${billingCompany}", Billing Name: "${billingName}")`);
      }
    }

    // Armar formato Provincia / Localidad / CP
    let formatoProvinciaLocalidadCP = '';
    if (codigoPostal && codigosPostales.has(codigoPostal)) {
      formatoProvinciaLocalidadCP = codigosPostales.get(codigoPostal)!;
    } else {
      // Fallback: buscar por PROVINCIA + LOCALIDAD en el catálogo, ignorando CP provisto
      const provinciaPedido = (provincia || '').toUpperCase().replace(/\s*\(.*?\)\s*/g, '').trim();
      const localidadPedido = (localidad || '').toUpperCase().trim();

      const provinciaNormalizada = provinciaPedido
        .replace(/[áàäâ]/g, 'A')
        .replace(/[éèëê]/g, 'E')
        .replace(/[íìïî]/g, 'I')
        .replace(/[óòöô]/g, 'O')
        .replace(/[úùüû]/g, 'U')
        .replace(/[ñ]/g, 'N')
        .replace(/\./g, ' ')
        .replace(/,/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const localidadNormalizada = localidadPedido
        .replace(/[áàäâ]/g, 'A')
        .replace(/[éèëê]/g, 'E')
        .replace(/[íìïî]/g, 'I')
        .replace(/[óòöô]/g, 'O')
        .replace(/[úùüû]/g, 'U')
        .replace(/[ñ]/g, 'N')
        .replace(/\./g, ' ')
        .replace(/,/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      let encontradoPorProvinciaLocalidad = false;

      // Regla directa: VILLA GESELL -> BUENOS AIRES / VILLA GESELL / 7165
      if (localidadNormalizada === 'VILLA GESELL' || localidadNormalizada.includes('VILLA GESELL')) {
        formatoProvinciaLocalidadCP = 'BUENOS AIRES / VILLA GESELL / 7165';
        encontradoPorProvinciaLocalidad = true;
      }

      // Intento directo por índice exacto
      const keyDirecta = `${provinciaNormalizada} / ${localidadNormalizada}`;
      if (provLocToFormato.has(keyDirecta)) {
        formatoProvinciaLocalidadCP = provLocToFormato.get(keyDirecta)!;
        encontradoPorProvinciaLocalidad = true;
      }
      for (const [, formato] of codigosPostales.entries()) {
        const formatoNormalizado = formato
          .replace(/[áàäâ]/g, 'A')
          .replace(/[éèëê]/g, 'E')
          .replace(/[íìïî]/g, 'I')
          .replace(/[óòöô]/g, 'O')
          .replace(/[úùüû]/g, 'U')
          .replace(/[ñ]/g, 'N')
          .toUpperCase()
          .replace(/\./g, ' ')
          .replace(/,/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // provinciaNormalizada y localidadNormalizada ya calculadas fuera del bucle

        const patronBusqueda = `${provinciaNormalizada} / ${localidadNormalizada}`;
        if (!encontradoPorProvinciaLocalidad && formatoNormalizado.includes(patronBusqueda)) {
          formatoProvinciaLocalidadCP = formato;
          encontradoPorProvinciaLocalidad = true;
          break;
        }
      }

      // Si no se encontró por provincia+localidad, NO escribir una opción inválida; dejar vacío para corrección manual
      if (!encontradoPorProvinciaLocalidad) {
        // Fallback adicional: buscar por localidad exacta (ignorando provincia), tomar primera coincidencia
        for (const [, formato] of codigosPostales.entries()) {
          const formatoNormalizado = formato
            .replace(/[áàäâ]/g, 'A')
            .replace(/[éèëê]/g, 'E')
            .replace(/[íìïî]/g, 'I')
            .replace(/[óòöô]/g, 'O')
            .replace(/[úùüû]/g, 'U')
            .replace(/[ñ]/g, 'N')
            .toUpperCase()
            .replace(/\./g, ' ')
            .replace(/,/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          const partes = formatoNormalizado.split('/').map(p => p.trim());
          if (partes.length >= 2) {
            const localidadCatalogo = partes[1];
            if (localidadCatalogo === localidadNormalizada) {
              formatoProvinciaLocalidadCP = formato;
              encontradoPorProvinciaLocalidad = true;
              break;
            }
          }
        }
        // Fallback por inclusión de localidad (maneja pequeñas diferencias)
        if (!encontradoPorProvinciaLocalidad && localidadNormalizada) {
          // Primero buscar con localidad completa
          for (const [, formato] of codigosPostales.entries()) {
            const formatoNormalizado = formato
              .replace(/[áàäâ]/g, 'A')
              .replace(/[éèëê]/g, 'E')
              .replace(/[íìïî]/g, 'I')
              .replace(/[óòöô]/g, 'O')
              .replace(/[úùüû]/g, 'U')
              .replace(/[ñ]/g, 'N')
              .toUpperCase()
              .replace(/\./g, ' ')
              .replace(/,/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            const partes = formatoNormalizado.split('/').map(p => p.trim());
            if (partes.length >= 2) {
              const localidadCatalogo = partes[1];
              if (localidadCatalogo.includes(localidadNormalizada) || localidadNormalizada.includes(localidadCatalogo)) {
                formatoProvinciaLocalidadCP = formato;
                encontradoPorProvinciaLocalidad = true;
                break;
              }
            }
          }
          
          // Extraer localidad clave (última palabra significativa) para búsquedas más flexibles
          // Ejemplo: "Villa Gesell" -> "GESELL", "San Miguel" -> "MIGUEL"
          const palabrasLocalidad = localidadNormalizada.split(/\s+/).filter(p => p.length > 2);
          const localidadClave = palabrasLocalidad.length > 0 ? palabrasLocalidad[palabrasLocalidad.length - 1] : '';
          
          // Si todavía no encontró, buscar con localidad clave (última palabra significativa)
          if (!encontradoPorProvinciaLocalidad && localidadClave && localidadClave !== localidadNormalizada && localidadClave.length > 2) {
            for (const [, formato] of codigosPostales.entries()) {
              const formatoNormalizado = formato
                .replace(/[áàäâ]/g, 'A')
                .replace(/[éèëê]/g, 'E')
                .replace(/[íìïî]/g, 'I')
                .replace(/[óòöô]/g, 'O')
                .replace(/[úùüû]/g, 'U')
                .replace(/[ñ]/g, 'N')
                .toUpperCase()
                .replace(/\./g, ' ')
                .replace(/,/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
              const partes = formatoNormalizado.split('/').map(p => p.trim());
              if (partes.length >= 2) {
                const localidadCatalogo = partes[1];
                if (localidadCatalogo.includes(localidadClave) || localidadClave.includes(localidadCatalogo)) {
                  // Verificar que la provincia también coincida si es posible
                  if (partes.length >= 1 && (partes[0].includes(provinciaNormalizada) || provinciaNormalizada.includes(partes[0]))) {
                    formatoProvinciaLocalidadCP = formato;
                    encontradoPorProvinciaLocalidad = true;
                    console.log(`✅ Encontrado por localidad clave "${localidadClave}" (de "${localidadNormalizada}") y provincia para pedido ${numeroOrden}`);
                    break;
                  }
                }
              }
            }
          }
        }
        
        // Fallback FINAL: buscar por código postal directamente en el catálogo
        if (!encontradoPorProvinciaLocalidad && codigoPostal && codigoPostal.length >= 4) {
          for (const [cpCatalogo, formato] of codigosPostales.entries()) {
            // Comparar últimos 4 dígitos del código postal
            if (cpCatalogo && codigoPostal.length >= 4 && cpCatalogo.length >= 4) {
              const cpCatalogoLimpio = cpCatalogo.replace(/\D/g, '');
              const cpPedidoLimpio = codigoPostal.replace(/\D/g, '');
              
              // Coincidencia exacta o últimos 4 dígitos
              if (cpCatalogoLimpio === cpPedidoLimpio || 
                  (cpCatalogoLimpio.length >= 4 && cpPedidoLimpio.length >= 4 && 
                   cpCatalogoLimpio.slice(-4) === cpPedidoLimpio.slice(-4))) {
                // Verificar que la provincia también coincida si es posible
                const formatoNormalizado = formato
                  .replace(/[áàäâ]/g, 'A')
                  .replace(/[éèëê]/g, 'E')
                  .replace(/[íìïî]/g, 'I')
                  .replace(/[óòöô]/g, 'O')
                  .replace(/[úùüû]/g, 'U')
                  .replace(/[ñ]/g, 'N')
                  .toUpperCase()
                  .replace(/\./g, ' ')
                  .replace(/,/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();
                const partes = formatoNormalizado.split('/').map(p => p.trim());
                
                // Si hay provincia en el formato, verificar coincidencia
                if (partes.length >= 1) {
                  const provinciaCatalogo = partes[0];
                  // Buscar si la provincia coincide (flexible)
                  if (!provinciaNormalizada || provinciaCatalogo.includes(provinciaNormalizada) || provinciaNormalizada.includes(provinciaCatalogo)) {
                    formatoProvinciaLocalidadCP = formato;
                    encontradoPorProvinciaLocalidad = true;
                    console.log(`✅ Encontrado por código postal "${codigoPostal}" (CP catálogo: "${cpCatalogo}") para pedido ${numeroOrden}`);
                    break;
                  }
                } else {
                  // Si no hay provincia en el formato, aceptarlo de todas formas
                  formatoProvinciaLocalidadCP = formato;
                  encontradoPorProvinciaLocalidad = true;
                  console.log(`✅ Encontrado por código postal "${codigoPostal}" (CP catálogo: "${cpCatalogo}") sin verificación de provincia para pedido ${numeroOrden}`);
                  break;
                }
              }
            }
          }
        }
        
        // Fallback dirigido: forzar match por clave conocida de catálogo (sin depender de provincia)
        if (!encontradoPorProvinciaLocalidad) {
          if (localidadNormalizada === 'VILLA GESELL' || localidadNormalizada.includes('VILLA GESELL')) {
            const clave = 'BUENOS AIRES / VILLA GESELL';
            if (provLocToFormato.has(clave)) {
              formatoProvinciaLocalidadCP = provLocToFormato.get(clave)!;
              encontradoPorProvinciaLocalidad = true;
            }
          }
        }
        // Fallback temporal: si el pedido es #1029, forzar VILLA GESELL para desbloquear
        if (!encontradoPorProvinciaLocalidad && (numeroOrden === '#1029' || numeroOrden.includes('1029'))) {
          const clave = 'BUENOS AIRES / VILLA GESELL';
          if (provLocToFormato.has(clave)) {
            console.warn('[Shopify][Hotfix] Forzando formato para pedido #1029 -> BUENOS AIRES / VILLA GESELL / 7165');
            formatoProvinciaLocalidadCP = provLocToFormato.get(clave)!;
            encontradoPorProvinciaLocalidad = true;
          }
        }
        if (!encontradoPorProvinciaLocalidad) {
          formatoProvinciaLocalidadCP = '';
        }
      }
    }

    // Verificar si el pedido tiene número de orden (OBLIGATORIO)
    if (!numeroOrden) {
      contadorNoProcesados++;
      console.warn(`Pedido Shopify omitido: Sin número de orden`);
      continue;
    }

    // Si falta email, autocompletar con un placeholder y registrar (NO BLOQUEAR)
    if (!email || !email.trim()) {
      email = 'ejemplo@gmail.com';
      autofilledEmails.push(numeroOrden);
      console.log(`📧 Email autocompletado para pedido ${numeroOrden}: ejemplo@gmail.com`);
    }

    // Detectar tipo de envío basándose en Shipping Method
    const normalizeText = (text: string) => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\./g, ' ')
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const medioEnvioNormalizado = medioEnvio ? normalizeText(medioEnvio) : '';
    
    // Detectar envío a sucursal
    const esSucursal = medioEnvioNormalizado && (
      medioEnvioNormalizado.includes('sucursal') ||
      medioEnvioNormalizado.includes('retiro') ||
      medioEnvioNormalizado.includes('punto de retiro')
    );

    // Detectar envío a domicilio
    const esDomicilio = !esSucursal && medioEnvioNormalizado && (
      medioEnvioNormalizado.includes('domicilio') ||
      medioEnvioNormalizado.includes('andreani') ||
      medioEnvioNormalizado.includes('envio a domicilio') ||
      medioEnvioNormalizado.includes('a domicilio')
    );

    // Si no se detecta ni domicilio ni sucursal, asumir domicilio por defecto
    const tipoEnvio = esSucursal ? 'sucursal' : 'domicilio';

    console.log(`🔍 Pedido ${numeroOrden}: Medio de envío="${medioEnvio}", Normalizado="${medioEnvioNormalizado}", Tipo="${tipoEnvio}"`);

    if (tipoEnvio === 'sucursal') {
      // Procesar como envío a sucursal
      const baseData = {
        'Paquete Guardado Ej:': '',
        'Peso (grs)': finalConfig.peso,
        'Alto (cm)': finalConfig.alto,
        'Ancho (cm)': finalConfig.ancho,
        'Profundidad (cm)': finalConfig.profundidad,
        'Valor declarado ($ C/IVA) *': finalConfig.valorDeclarado,
        'Numero Interno': numeroOrden,
        'Nombre *': nombre ? normalizarNombre(nombre) : '',
        'Apellido *': apellido ? normalizarNombre(apellido) : '',
        'DNI *': dniProcesado,
        'Email *': email,
        'Celular código *': celularCodigo,
        'Celular número *': celularNumero,
      };

      // Construir dirección completa para búsqueda de sucursal
      let direccionCompleta = `${calle} ${numeroCalle}`.trim();
      if (pisoDepto && pisoDepto.trim()) {
        direccionCompleta += `, ${pisoDepto}`;
      }
      if (localidad && localidad.trim()) {
        direccionCompleta += `, ${localidad}`;
      }
      if (codigoPostal && codigoPostal.trim()) {
        direccionCompleta += `, ${codigoPostal}`;
      }
      if (provincia && provincia.trim()) {
        direccionCompleta += `, ${provincia}`;
      }

      console.log(`🔍 Buscando sucursal para pedido ${numeroOrden}, dirección: ${direccionCompleta}`);

      const nombreSucursal = findSucursalByAddress(direccionCompleta, sucursales, codigoPostal, provincia);

      if (nombreSucursal === 'SUCURSAL NO ENCONTRADA') {
        // Si no encontró coincidencia exacta, generar sugerencia automática primero
        let sugerencia: { sucursal: AndreaniSucursalInfo | null; razon: string; score: number } | null = generarSugerenciaSucursal(
          direccionCompleta,
          sucursales,
          codigoPostal,
          provincia,
          localidad,
          localidad,
          numeroOrden
        );

        // Si no se generó sugerencia, buscar por código postal primero, luego por ciudad
        if (!sugerencia || !sugerencia.sucursal) {
          console.log(`⚠️ No se generó sugerencia automática para ${numeroOrden}, buscando por código postal/ciudad...`);
          
          // Función auxiliar para extraer código postal de dirección de sucursal
          const extraerCPDeDireccion = (direccion: string): string | null => {
            if (!direccion) return null;
            // Buscar códigos postales en formato estándar (B8000, C1200, etc. o solo números)
            const matches = direccion.match(/\b([A-Z]?\d{4,5})\b/g);
            if (matches && matches.length > 0) {
              const cp = matches[0];
              // Si tiene letra prefijo, extraer solo el número
              if (/^[A-Z]/.test(cp)) {
                return cp.substring(1);
              }
              return cp;
            }
            // Fallback: buscar solo números de 4-5 dígitos
            const soloNumeros = direccion.match(/\b(\d{4,5})\b/);
            if (soloNumeros) {
              return soloNumeros[1];
            }
            return null;
          };

          // Buscar por código postal primero
          if (codigoPostal && codigoPostal.trim()) {
            const cpLimpio = codigoPostal.replace(/\D/g, '').trim();
            console.log(`🔍 Buscando sucursal por código postal: ${cpLimpio}`);
            
            const sucursalPorCP = sucursales.find(s => {
              const cpSucursal = extraerCPDeDireccion(s.direccion);
              if (cpSucursal) {
                // Comparar códigos postales (pueden tener diferentes formatos)
                const cpSucursalLimpio = cpSucursal.replace(/\D/g, '').trim();
                // Comparar últimos 4 dígitos o coincidencia exacta
                const matchExacto = cpSucursalLimpio === cpLimpio;
                const matchUltimos4 = cpSucursalLimpio.length >= 4 && cpLimpio.length >= 4 &&
                  cpSucursalLimpio.slice(-4) === cpLimpio.slice(-4);
                return matchExacto || matchUltimos4;
              }
              return false;
            });
            
            if (sucursalPorCP) {
              const cpEncontrado = extraerCPDeDireccion(sucursalPorCP.direccion);
              sugerencia = {
                sucursal: sucursalPorCP,
                razon: `Sucursal encontrada por código postal ${cpLimpio} (sucursal CP: ${cpEncontrado})`,
                score: 70
              };
              console.log(`✅ Sugerencia por código postal para ${numeroOrden}: ${sucursalPorCP.nombre_sucursal} (CP: ${cpEncontrado})`);
            } else {
              console.log(`⚠️ No se encontró sucursal con código postal ${cpLimpio}, buscando por ciudad...`);
            }
          }

          // Si no se encontró por CP, buscar por ciudad/localidad
          if (!sugerencia || !sugerencia.sucursal) {
            if (localidad && localidad.trim()) {
              const localidadNorm = localidad.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
              const sucursalPorCiudad = sucursales.find(s => {
                const dirNorm = s.direccion.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                const nombreNorm = s.nombre_sucursal.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                return dirNorm.includes(localidadNorm) || nombreNorm.includes(localidadNorm);
              });

              if (sucursalPorCiudad) {
                sugerencia = {
                  sucursal: sucursalPorCiudad,
                  razon: `Sucursal encontrada en la ciudad/localidad ${localidad}`,
                  score: 50
                };
                console.log(`✅ Sugerencia por ciudad para ${numeroOrden}: ${sucursalPorCiudad.nombre_sucursal}`);
              }
            }
          }

          // Si todavía no hay sugerencia, buscar por provincia (último recurso)
          if (!sugerencia || !sugerencia.sucursal) {
            if (provincia && provincia.trim()) {
              const provinciaNorm = provincia.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
              const sucursalPorProvincia = sucursales.find(s => {
                const dirNorm = s.direccion.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                const nombreNorm = s.nombre_sucursal.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                return dirNorm.includes(provinciaNorm) || nombreNorm.includes(provinciaNorm);
              });

              if (sucursalPorProvincia) {
                sugerencia = {
                  sucursal: sucursalPorProvincia,
                  razon: `Sucursal encontrada en la provincia ${provincia} (verificar manualmente)`,
                  score: 30
                };
                console.log(`⚠️ Sugerencia por provincia (baja confianza) para ${numeroOrden}: ${sucursalPorProvincia.nombre_sucursal}`);
              }
            }
          }

          // Si todavía no hay sugerencia, usar la primera sucursal disponible (último recurso absoluto)
          if (!sugerencia || !sugerencia.sucursal) {
            if (sucursales.length > 0) {
              sugerencia = {
                sucursal: sucursales[0],
                razon: 'No se encontró sucursal específica, usando primera disponible - REVISAR MANUALMENTE',
                score: 10
              };
              console.log(`⚠️ Sugerencia de último recurso para ${numeroOrden}: ${sucursales[0].nombre_sucursal}`);
            }
          }
        }

        // Si tenemos una sugerencia, agregarla SIEMPRE
        if (sugerencia && sugerencia.sucursal) {
          sugerenciasSucursalShopify.push({
            numeroOrden: numeroOrden,
            direccionPedido: direccionCompleta,
            numero: numeroCalle,
            localidad: localidad,
            ciudad: localidad,
            codigoPostal: codigoPostal,
            provincia: provincia,
            sucursalSugerida: sugerencia.sucursal,
            razon: sugerencia.razon,
            score: sugerencia.score,
            decision: 'pendiente',
            pedidoData: {
              peso: baseData['Peso (grs)'],
              alto: baseData['Alto (cm)'],
              ancho: baseData['Ancho (cm)'],
              profundidad: baseData['Profundidad (cm)'],
              valorDeclarado: baseData['Valor declarado ($ C/IVA) *'],
              nombre: baseData['Nombre *'],
              apellido: baseData['Apellido *'],
              dni: baseData['DNI *'],
              email: baseData['Email *'],
              celularCodigo: baseData['Celular código *'],
              celularNumero: baseData['Celular número *']
            }
          });
          console.log(`💡 Sugerencia SIEMPRE generada para pedido ${numeroOrden}: ${sugerencia.sucursal.nombre_sucursal} (${sugerencia.razon})`);
        } else {
          // Esto no debería pasar nunca, pero por si acaso
          console.error(`❌ ERROR: No se pudo generar sugerencia para pedido ${numeroOrden} - no hay sucursales disponibles`);
          const motivoDetallado = `no se pudo generar sugerencia de sucursal - Provincia: "${provincia}", Localidad: "${localidad}", CP: "${codigoPostal}"`;
          droppedOrders.push(`${numeroOrden} - ${motivoDetallado}`);
          contadorNoProcesados++;
        }
      } else {
        // Sucursal encontrada, agregar directamente al output (sin modal)
        sucursalesOutput.push({
          ...baseData,
          'Sucursal *': nombreSucursal,
        });
        contadorSucursales++;
        console.log(`✅ Sucursal asignada directamente para pedido ${numeroOrden}: ${nombreSucursal}`);
      }
    } else {
      // Procesar como envío a domicilio
      if (!formatoProvinciaLocalidadCP) {
        contadorNoProcesados++;
        const motivoDetallado = `sin match Provincia/Localidad/CP - Provincia: "${provincia}", Localidad: "${localidad}", CP: "${codigoPostal}"`;
        droppedOrders.push(`${numeroOrden} - ${motivoDetallado}`);
        console.error(`❌ [NO PROCESADO] Pedido ${numeroOrden}`);
        console.error(`   Tipo: DOMICILIO`);
        console.error(`   Provincia: "${provincia}"`);
        console.error(`   Localidad: "${localidad}"`);
        console.error(`   Código Postal: "${codigoPostal}"`);
        console.error(`   Email: "${email}"`);
        console.error(`   Razón: No se encontró coincidencia en catálogo de códigos postales`);
        continue;
      }
      contadorDomicilios++;
      domicilios.push({
        'Paquete Guardado Ej:': '',
        'Peso (grs)': finalConfig.peso,
        'Alto (cm)': finalConfig.alto,
        'Ancho (cm)': finalConfig.ancho,
        'Profundidad (cm)': finalConfig.profundidad,
        'Valor declarado ($ C/IVA) *': finalConfig.valorDeclarado,
        'Numero Interno': numeroOrden,
        'Nombre *': nombre ? normalizarNombre(nombre) : '',
        'Apellido *': apellido ? normalizarNombre(apellido) : '',
        'DNI *': dniProcesado,
        'Email *': email,
        'Celular código *': celularCodigo,
        'Celular número *': celularNumero,
        'Calle *': calle,
        'Número *': numeroCalle,
        'Piso': pisoDepto,
        'Departamento': pisoDepto,
        'Provincia / Localidad / CP *': formatoProvinciaLocalidadCP,
      });
    }
    
    // Marcar el pedido como procesado para evitar duplicados
    if (numeroOrden) {
      pedidosProcesados.add(numeroOrden);
    }
  }

  const processingInfo: ProcessingInfo = {
    totalOrders: rows.length,
    domiciliosProcessed: contadorDomicilios,
    sucursalesProcessed: contadorSucursales,
    noProcessed: contadorNoProcesados,
    processingLogs: [
      `Total pedidos cargados: ${rows.length}`,
      `Domicilios procesados: ${contadorDomicilios}`,
      `Sucursales procesadas: ${contadorSucursales}`,
      `No procesados: ${contadorNoProcesados}`,
      ...(sugerenciasSucursalShopify.length > 0 ? [`Sugerencias de sucursal pendientes: ${sugerenciasSucursalShopify.length}`] : []),
      ...(droppedOrders.length > 0 ? [`Pedidos no procesados: ${droppedOrders.length}`] : []),
    ],
    noProcessedReason: contadorNoProcesados > 0 ? 'Pedidos descartados por Provincia/Localidad/CP no encontrados o campos faltantes' : '',
    sugerenciasSucursal: sugerenciasSucursalShopify.length > 0 ? sugerenciasSucursalShopify : undefined,
    droppedOrders: droppedOrders.length > 0 ? droppedOrders : undefined,
  };

  console.log('\n=== RESUMEN PROCESAMIENTO SHOPIFY ===');
  console.log(`Total pedidos: ${rows.length}`);
  console.log(`Domicilios procesados: ${contadorDomicilios}`);
  console.log(`Sucursales procesadas: ${contadorSucursales}`);
  console.log(`Sugerencias pendientes: ${sugerenciasSucursalShopify.length}`);
  console.log(`No procesados: ${contadorNoProcesados}`);
  console.log(`Total procesados: ${contadorDomicilios + contadorSucursales}`);
  console.log(`Suma esperada: ${rows.length - contadorNoProcesados}`);
  
  if (droppedOrders.length > 0) {
    console.log('\n🚨 PEDIDOS NO PROCESADOS DETALLADOS:');
    droppedOrders.forEach((pedido, idx) => {
      console.log(`  ${idx + 1}. ${pedido}`);
    });
  }
  
  if (contadorDomicilios + contadorSucursales + contadorNoProcesados !== rows.length) {
    console.error(`\n⚠️ ADVERTENCIA: La suma no coincide!`);
    console.error(`  Esperado: ${rows.length}`);
    console.error(`  Calculado: ${contadorDomicilios + contadorSucursales + contadorNoProcesados}`);
    console.error(`  Diferencia: ${rows.length - (contadorDomicilios + contadorSucursales + contadorNoProcesados)}`);
  }
  
  console.log('======================================\n');

  return {
    domicilioCSV: unparseCSV(domicilios),
    sucursalCSV: unparseCSV(sucursalesOutput),
    processingInfo,
  };
};

export const processOrders = async (
  tiendanubeCsvText: string,
  config?: { peso: number; alto: number; ancho: number; profundidad: number; valorDeclarado: number }
): Promise<{ domicilioCSV: string; sucursalCSV: string; processingInfo: any; }> => {
  // Valores por defecto
  const defaultConfig = {
    peso: 400,
    alto: 10,
    ancho: 10,
    profundidad: 10,
    valorDeclarado: 6000,
  };
  const finalConfig = config || defaultConfig;
  
  // Ruta Shopify
  if (isShopifyCSV(tiendanubeCsvText)) {
    console.log('CSV de Shopify detectado. Procesando como Shopify (envíos a domicilio).');
    return await processShopifyOrders(tiendanubeCsvText, finalConfig);
  }
  const [sucursales, codigosPostales, tiendanubeOrders] = await Promise.all([
    fetchSucursales(),
    fetchCodigosPostales(),
    parseCSV<TiendanubeOrder>(tiendanubeCsvText),
  ]);

  console.log('=== INFORMACIÓN DE PROCESAMIENTO ===');
  console.log('Total orders loaded:', tiendanubeOrders.length);
  
  // Función para obtener el valor de una columna por posición
  const getColumnValue = (order: any, columnIndex: number): string => {
    const columns = Object.keys(order);
    if (columnIndex < columns.length) {
      const columnName = columns[columnIndex];
      const value = order[columnName];
      console.log(`Column ${columnIndex} (${columnName}):`, value);
      return value || '';
    }
    console.log(`Column ${columnIndex} not found`);
    return '';
  };
  
  console.log('Sample order keys:', Object.keys(tiendanubeOrders[0] || {}));
  console.log('Sample order values:', tiendanubeOrders[0]);
  
  // Mostrar las primeras 10 columnas para identificar posiciones
  for (let i = 0; i < Math.min(10, Object.keys(tiendanubeOrders[0] || {}).length); i++) {
    console.log(`Column ${i}:`, getColumnValue(tiendanubeOrders[0], i));
  }
  
  // Verificar si hay valores en las columnas
  console.log('Verificando valores de columnas:');
  for (const key of Object.keys(tiendanubeOrders[0] || {})) {
    const value = tiendanubeOrders[0][key];
    if (value && value.toString().trim() !== '') {
      console.log(`  ${key}: "${value}"`);
    }
  }

  const domicilios: AndreaniDomicilioOutput[] = [];
  const sucursalesOutput: AndreaniSucursalOutput[] = [];
  
  let contadorDomicilios = 0;
  let contadorSucursales = 0;
  let contadorNoProcesados = 0;
  let contadorSucursalesNoEncontradas = 0;
  const sugerenciasSucursal: SucursalSugerencia[] = [];
  
  // Variables para funciones de Shopify (solo domicilios, no tienen sugerencias)
  const sugerenciasSucursalShopify: SucursalSugerencia[] = [];

  for (const order of tiendanubeOrders) {
    // Helper function to split name and surname
    const nombreCompleto = getColumnValue(order, 11); // Nombre del comprador
    const [nombre, ...apellidoParts] = nombreCompleto.split(' ');
    const apellido = apellidoParts.join(' ');
    
    // Normalizar nombres y apellidos para evitar caracteres inválidos
    let nombreNormalizado = normalizarNombre(nombre);
    let apellidoNormalizado = normalizarNombre(apellido);

    // Helper function to split phone number based on province and phone number
    const telefono = getColumnValue(order, 13); // Teléfono
    const provincia = getColumnValue(order, 22); // Provincia o estado
    let cleanPhone = telefono.replace(/\D/g, '');
    
    // Remover el prefijo internacional +54 si existe
    if (cleanPhone.startsWith('54')) {
      cleanPhone = cleanPhone.substring(2);
    }
    
    // Remover el "9" adicional de celulares argentinos (formato: +54 9 AREA NUMERO)
    // En Argentina, después del código de país viene un "9" para celulares
    if (cleanPhone.startsWith('9')) {
      cleanPhone = cleanPhone.substring(1);
    }
    
    // Función para obtener el código de área basado en la provincia
    const getCodigoArea = (provincia: string, phone: string): { codigo: string; numero: string } => {
      const provinciaLower = provincia.toLowerCase();
      
      // Buenos Aires
      if (provinciaLower.includes('buenos aires') || provinciaLower.includes('capital federal')) {
        if (phone.startsWith('11')) {
          return { codigo: '11', numero: phone.substring(2) };
        }
        if (phone.startsWith('221')) {
          return { codigo: '221', numero: phone.substring(3) };
        }
        if (phone.startsWith('223')) {
          return { codigo: '223', numero: phone.substring(3) };
        }
        if (phone.startsWith('291')) {
          return { codigo: '291', numero: phone.substring(3) };
        }
      }
      
      // Córdoba
      if (provinciaLower.includes('córdoba') || provinciaLower.includes('cordoba')) {
        if (phone.startsWith('351')) {
          return { codigo: '351', numero: phone.substring(3) };
        }
        if (phone.startsWith('3541')) {
          return { codigo: '3541', numero: phone.substring(4) };
        }
        if (phone.startsWith('358')) {
          return { codigo: '358', numero: phone.substring(3) };
        }
      }
      
      // Santa Fe
      if (provinciaLower.includes('santa fe')) {
        if (phone.startsWith('341')) {
          return { codigo: '341', numero: phone.substring(3) };
        }
        if (phone.startsWith('342')) {
          return { codigo: '342', numero: phone.substring(3) };
        }
      }
      
      // Mendoza
      if (provinciaLower.includes('mendoza')) {
        if (phone.startsWith('261')) {
          return { codigo: '261', numero: phone.substring(3) };
        }
      }
      
      // Tucumán
      if (provinciaLower.includes('tucumán') || provinciaLower.includes('tucuman')) {
        if (phone.startsWith('381')) {
          return { codigo: '381', numero: phone.substring(3) };
        }
      }
      
      // Entre Ríos
      if (provinciaLower.includes('entre ríos') || provinciaLower.includes('entre rios')) {
        if (phone.startsWith('343')) {
          return { codigo: '343', numero: phone.substring(3) };
        }
      }
      
      // Salta
      if (provinciaLower.includes('salta')) {
        if (phone.startsWith('387')) {
          return { codigo: '387', numero: phone.substring(3) };
        }
      }
      
      // Misiones
      if (provinciaLower.includes('misiones')) {
        if (phone.startsWith('376')) {
          return { codigo: '376', numero: phone.substring(3) };
        }
      }
      
      // Chaco
      if (provinciaLower.includes('chaco')) {
        if (phone.startsWith('362')) {
          return { codigo: '362', numero: phone.substring(3) };
        }
      }
      
      // Corrientes
      if (provinciaLower.includes('corrientes')) {
        if (phone.startsWith('379')) {
          return { codigo: '379', numero: phone.substring(3) };
        }
      }
      
      // Formosa
      if (provinciaLower.includes('formosa')) {
        if (phone.startsWith('370')) {
          return { codigo: '370', numero: phone.substring(3) };
        }
      }
      
      // Jujuy
      if (provinciaLower.includes('jujuy')) {
        if (phone.startsWith('388')) {
          return { codigo: '388', numero: phone.substring(3) };
        }
      }
      
      // La Rioja
      if (provinciaLower.includes('la rioja')) {
        if (phone.startsWith('380')) {
          return { codigo: '380', numero: phone.substring(3) };
        }
      }
      
      // Catamarca
      if (provinciaLower.includes('catamarca')) {
        if (phone.startsWith('383')) {
          return { codigo: '383', numero: phone.substring(3) };
        }
      }
      
      // Santiago del Estero
      if (provinciaLower.includes('santiago del estero')) {
        if (phone.startsWith('385')) {
          return { codigo: '385', numero: phone.substring(3) };
        }
      }
      
      // San Juan
      if (provinciaLower.includes('san juan')) {
        if (phone.startsWith('264')) {
          return { codigo: '264', numero: phone.substring(3) };
        }
      }
      
      // San Luis
      if (provinciaLower.includes('san luis')) {
        if (phone.startsWith('2652')) {
          return { codigo: '2652', numero: phone.substring(4) };
        }
      }
      
      // La Pampa
      if (provinciaLower.includes('la pampa')) {
        if (phone.startsWith('2954')) {
          return { codigo: '2954', numero: phone.substring(4) };
        }
      }
      
      // Río Negro
      if (provinciaLower.includes('río negro') || provinciaLower.includes('rio negro')) {
        if (phone.startsWith('2944')) {
          return { codigo: '2944', numero: phone.substring(4) };
        }
        if (phone.startsWith('2920')) {
          return { codigo: '2920', numero: phone.substring(4) };
        }
      }
      
      // Neuquén
      if (provinciaLower.includes('neuquén') || provinciaLower.includes('neuquen')) {
        if (phone.startsWith('299')) {
          return { codigo: '299', numero: phone.substring(3) };
        }
      }
      
      // Chubut
      if (provinciaLower.includes('chubut')) {
        if (phone.startsWith('297')) {
          return { codigo: '297', numero: phone.substring(3) };
        }
        if (phone.startsWith('2965')) {
          return { codigo: '2965', numero: phone.substring(4) };
        }
      }
      
      // Santa Cruz
      if (provinciaLower.includes('santa cruz')) {
        if (phone.startsWith('2966')) {
          return { codigo: '2966', numero: phone.substring(4) };
        }
      }
      
      // Tierra del Fuego
      if (provinciaLower.includes('tierra del fuego')) {
        if (phone.startsWith('2901')) {
          return { codigo: '2901', numero: phone.substring(4) };
        }
      }
      
      // Si no encuentra coincidencia, usar los primeros 4 dígitos como fallback
      return { codigo: phone.substring(0, 4), numero: phone.substring(4) };
    };
    
    const { codigo: celularCodigo, numero: celularNumero } = getCodigoArea(provincia, cleanPhone);
    
    // Procesar DNI / CUIT
    // Si tiene 11 dígitos (CUIT), convertir a DNI eliminando los primeros 2 y el último dígito
    const dniCuit = getColumnValue(order, 12).replace(/\D/g, ''); // Eliminar caracteres no numéricos
    let dniProcesado = dniCuit;
    if (dniCuit.length === 11) {
      // Es un CUIT, extraer el DNI (quitar los primeros 2 dígitos y el último)
      dniProcesado = dniCuit.substring(2, 10);
      console.log(`CUIT detectado (${dniCuit}) -> DNI extraído: ${dniProcesado}`);
    } else if (dniCuit.length === 8 || dniCuit.length === 7) {
      // Es un DNI válido
      dniProcesado = dniCuit;
    } else {
      console.warn(`Formato de DNI/CUIT no reconocido: ${dniCuit} (${dniCuit.length} dígitos)`);
    }
    
    // Validar campos obligatorios antes de procesar
    const emailOrder = getColumnValue(order, 1);
    if (!emailOrder || !emailOrder.trim()) {
      console.warn(`⚠️ Pedido #${getColumnValue(order, 0)}: Email vacío, omitiendo pedido`);
      contadorNoProcesados++;
      continue;
    }
    
    if (!dniProcesado || dniProcesado.trim() === '') {
      console.warn(`⚠️ Pedido #${getColumnValue(order, 0)}: DNI vacío, usando placeholder`);
      dniProcesado = '00000000';
    }
    
    if (!nombreNormalizado || !nombreNormalizado.trim()) {
      console.warn(`⚠️ Pedido #${getColumnValue(order, 0)}: Nombre vacío, usando placeholder`);
      nombreNormalizado = 'SIN NOMBRE';
    }
    
    if (!apellidoNormalizado || !apellidoNormalizado.trim()) {
      console.warn(`⚠️ Pedido #${getColumnValue(order, 0)}: Apellido vacío, usando placeholder`);
      apellidoNormalizado = 'SIN APELLIDO';
    }
    
    // Asegurar que código de área y número de teléfono no estén vacíos
    const celularCodigoFinal = celularCodigo && celularCodigo.trim() ? celularCodigo.trim() : '11';
    const celularNumeroFinal = celularNumero && celularNumero.trim() ? celularNumero.trim() : '00000000';
    
    const baseData = {
      'Paquete Guardado Ej:': '', // Siempre vacío
      'Peso (grs)': finalConfig.peso,
      'Alto (cm)': finalConfig.alto,
      'Ancho (cm)': finalConfig.ancho,
      'Profundidad (cm)': finalConfig.profundidad,
      'Valor declarado ($ C/IVA) *': finalConfig.valorDeclarado,
      'Numero Interno': `#${getColumnValue(order, 0)}`, // Número de orden con #
      'Nombre *': nombreNormalizado || 'SIN NOMBRE',
      'Apellido *': apellidoNormalizado || 'SIN APELLIDO',
      'DNI *': dniProcesado, // DNI procesado (convertido desde CUIT si es necesario)
      'Email *': emailOrder.trim(),
      'Celular código *': celularCodigoFinal,
      'Celular número *': celularNumeroFinal,
    };
    
    const medioEnvio = getColumnValue(order, 24); // Medio de envío
    console.log('🔍 Processing order:', baseData['Numero Interno'], 'Medio de envío:', medioEnvio);
    
    // Función auxiliar para normalizar texto y comparar
    const normalizeText = (text: string) => {
      return text
        .replace(/"/g, '') // Quitar comillas dobles
        .replace(/'/g, '') // Quitar comillas simples
        .replace(/[¡!¿?]/g, '') // Quitar signos de exclamación e interrogación
        .replace(/\+/g, ' ') // Reemplazar + con espacio para detectar "ENVIO PRIORITARIO + SEGUIMIENTO + SEGURO"
        .replace(/\uFFFD/g, 'i') // Reemplazar caracteres de reemplazo Unicode () con 'i'
        .replace(/\u00ed/g, 'i') // Corregir caracteres mal codificados y quitar tildes
        .replace(/\u00f3/g, 'o')
        .replace(/\u00e1/g, 'a')
        .replace(/\u00e9/g, 'e')
        .replace(/\u00fa/g, 'u')
        .replace(/\u00f1/g, 'n')
        .replace(/\u00fc/g, 'u')
        .replace(/\u00e7/g, 'c')
        .replace(/\s+/g, ' ') // Normalizar espacios múltiples a uno solo
        .trim()
        .toLowerCase();
    };
    
    const medioEnvioNormalizado = medioEnvio ? normalizeText(medioEnvio) : '';
    console.log('📦 Medio de envío normalizado:', medioEnvioNormalizado);
    
    // Detectar envío a domicilio
    // Reglas:
    // - "Andreani" → domicilio
    // - "Andreani Estándar" → domicilio
    // - "Andreani Despacho" → domicilio
    // - Cualquier cosa con "domicilio" → domicilio
    // - "Envio Prioritario" o "Prioritario" → domicilio
    // - "ENVIO PRIORITARIO + SEGUIMIENTO + SEGURO" → domicilio (detecta "envio prioritario", "seguimiento", "seguro")
    // - "Envio Gratis" o "Envío Gratis" → domicilio (incluso con encoding corrupto)
    // - "¡Te vamos a contactar para coordinar para la entrega!" → domicilio (con variaciones)
    // Detección flexible: busca "envi" seguido eventualmente de "gratis" (puede haber caracteres corruptos entre ellos)
    const tieneEnvioGratisNormalizado = medioEnvioNormalizado && (
      medioEnvioNormalizado.includes("envio gratis") ||
      // Detección flexible: "envi" + "gratis" (puede haber caracteres corruptos como "" entre ellos)
      (medioEnvioNormalizado.includes("envi") && medioEnvioNormalizado.includes("gratis"))
    );
    
    // Detectar "ENVIO PRIORITARIO + SEGUIMIENTO + SEGURO" (puede venir con o sin los +)
    const tieneEnvioPrioritarioCompleto = medioEnvioNormalizado && (
      (medioEnvioNormalizado.includes("envio prioritario") && 
       (medioEnvioNormalizado.includes("seguimiento") || medioEnvioNormalizado.includes("seguro"))) ||
      (medioEnvioNormalizado.includes("prioritario") && 
       (medioEnvioNormalizado.includes("seguimiento") || medioEnvioNormalizado.includes("seguro")))
    );
    
    // Detectar mensaje de contacto (con variaciones: con/sin signos de exclamación, con/sin "para" duplicado)
    const tieneMensajeContacto = medioEnvioNormalizado && (
      medioEnvioNormalizado.includes("te vamos a contactar para coordinar") ||
      medioEnvioNormalizado.includes("vamos a contactar para coordinar") ||
      medioEnvioNormalizado.includes("te vamos a contactar para coordinar para la entrega") ||
      medioEnvioNormalizado.includes("vamos a contactar para coordinar para la entrega") ||
      (medioEnvioNormalizado.includes("contactar") && 
       medioEnvioNormalizado.includes("coordinar") && 
       medioEnvioNormalizado.includes("entrega"))
    );
    
    const esDomicilio = medioEnvioNormalizado && (
      medioEnvioNormalizado.includes("domicilio") ||
      medioEnvioNormalizado.includes("andreani") ||
      medioEnvioNormalizado.includes("envio a domicilio") ||
      medioEnvioNormalizado.includes("a domicilio") ||
      medioEnvioNormalizado.includes("envio prioritario") ||
      medioEnvioNormalizado.includes("prioritario") ||
      tieneEnvioPrioritarioCompleto ||
      tieneEnvioGratisNormalizado ||
      tieneMensajeContacto
    );
    
    // Detectar envío a sucursal
    // Reglas:
    // - "Punto de retiro" → sucursal
    // - "Andreani Sucursal" → sucursal
    // - "retiro" (genérico) → sucursal
    const esSucursal = medioEnvioNormalizado && (
      medioEnvioNormalizado.includes("punto de retiro") ||
      (medioEnvioNormalizado.includes("andreani") && medioEnvioNormalizado.includes("sucursal")) ||
      medioEnvioNormalizado.includes("retiro")
    );
    
    console.log('🏠 Es domicilio?', esDomicilio, '| 🏢 Es sucursal?', esSucursal);
    
    if (esDomicilio && !esSucursal) {
      contadorDomicilios++;
      console.log(`[DOMICILIO ${contadorDomicilios}] Agregando pedido:`, baseData['Numero Interno']);
      
      // Obtener el código postal del pedido
      const codigoPostalPedido = getColumnValue(order, 21).trim(); // Código postal
      
      // Buscar el formato EXACTO en domiciliosData.ts - TAL CUAL como está definido
      let formatoProvinciaLocalidadCP = '';
      
      console.log(`=== DEBUGGING CÓDIGO POSTAL ${codigoPostalPedido} ===`);
      console.log('¿Existe en mapeo domiciliosData.ts?', codigosPostales.has(codigoPostalPedido));
      
      if (codigosPostales.has(codigoPostalPedido)) {
        formatoProvinciaLocalidadCP = codigosPostales.get(codigoPostalPedido)!;
        console.log(`✅ Código postal ${codigoPostalPedido} encontrado TAL CUAL en domiciliosData.ts: ${formatoProvinciaLocalidadCP}`);
      } else {
        console.log(`❌ Código postal ${codigoPostalPedido} NO encontrado en domiciliosData.ts`);
        
        // FALLBACK: Buscar por PROVINCIA + LOCALIDAD
        const provinciaPedido = getColumnValue(order, 22).toUpperCase();
        const localidadPedido = getColumnValue(order, 19).toUpperCase();
        
        console.log(`🔍 Buscando por PROVINCIA + LOCALIDAD: "${provinciaPedido} / ${localidadPedido}"`);
        
        let encontradoPorProvinciaLocalidad = false;
        for (const [cp, formato] of codigosPostales.entries()) {
          // Normalizar para comparar (quitar acentos y convertir a mayúsculas)
          const formatoNormalizado = formato
            .replace(/[áàäâ]/g, 'A')
            .replace(/[éèëê]/g, 'E')
            .replace(/[íìïî]/g, 'I')
            .replace(/[óòöô]/g, 'O')
            .replace(/[úùüû]/g, 'U')
            .replace(/[ñ]/g, 'N')
            .toUpperCase();
          
          const provinciaNormalizada = provinciaPedido
            .replace(/[áàäâ]/g, 'A')
            .replace(/[éèëê]/g, 'E')
            .replace(/[íìïî]/g, 'I')
            .replace(/[óòöô]/g, 'O')
            .replace(/[úùüû]/g, 'U')
            .replace(/[ñ]/g, 'N');
          
          const localidadNormalizada = localidadPedido
            .replace(/[áàäâ]/g, 'A')
            .replace(/[éèëê]/g, 'E')
            .replace(/[íìïî]/g, 'I')
            .replace(/[óòöô]/g, 'O')
            .replace(/[úùüû]/g, 'U')
            .replace(/[ñ]/g, 'N');
          
          const patronBusqueda = `${provinciaNormalizada} / ${localidadNormalizada}`;
          
          if (formatoNormalizado.includes(patronBusqueda)) {
            formatoProvinciaLocalidadCP = formato;
            encontradoPorProvinciaLocalidad = true;
            console.log(`✅ Encontrado por PROVINCIA + LOCALIDAD: ${formato}`);
            break;
          }
        }
        
        if (!encontradoPorProvinciaLocalidad) {
          console.log(`❌ No encontrado por PROVINCIA + LOCALIDAD tampoco`);
          // Último fallback: formato por defecto
          formatoProvinciaLocalidadCP = `${provinciaPedido} / ${localidadPedido} / ${codigoPostalPedido}`;
          console.log('Usando formato de fallback final:', formatoProvinciaLocalidadCP);
        }
      }
      
      // Normalizar campos de dirección para evitar caracteres inválidos
      const calleNormalizada = normalizarNombre(getColumnValue(order, 16));
      const pisoNormalizado = normalizarNombre(getColumnValue(order, 18));
      
      // Procesar número de calle - debe ser SOLO números
      let numeroCalle = getColumnValue(order, 17).trim();
      
      // Reemplazar "SN" o "S/N" con "0"
      if (/^s[\s\/\-]*n$/i.test(numeroCalle)) {
        numeroCalle = '0';
      } else {
        // Extraer solo números del campo
        const soloNumeros = numeroCalle.match(/\d+/);
        if (soloNumeros && soloNumeros[0]) {
          numeroCalle = soloNumeros[0];
        } else {
          // Si no hay números, usar "0" como fallback
          console.warn(`Número de calle no válido: "${numeroCalle}" - usando "0" como fallback`);
          numeroCalle = '0';
        }
      }
      
      // Validar formato de Provincia / Localidad / CP
      if (!formatoProvinciaLocalidadCP || formatoProvinciaLocalidadCP.trim() === '') {
        console.warn(`⚠️ Pedido ${baseData['Numero Interno']}: Formato de Provincia/Localidad/CP vacío, omitiendo pedido`);
        contadorNoProcesados++;
        continue;
      }
      
      // Validar que el formato tenga exactamente 3 partes separadas por /
      const partesFormato = formatoProvinciaLocalidadCP.split('/').map(p => p.trim());
      if (partesFormato.length !== 3) {
        console.warn(`⚠️ Pedido ${baseData['Numero Interno']}: Formato de Provincia/Localidad/CP inválido: "${formatoProvinciaLocalidadCP}"`);
        contadorNoProcesados++;
        continue;
      }
      
      domicilios.push({
        ...baseData,
        'Calle *': calleNormalizada, // Dirección normalizada
        'Número *': numeroCalle, // Número procesado (solo dígitos)
        'Piso': pisoNormalizado, // Piso normalizado
        'Departamento': pisoNormalizado, // As per spec, use 'Piso' for both
        'Provincia / Localidad / CP *': formatoProvinciaLocalidadCP,
      });
    } else if (esSucursal && !esDomicilio) {
      contadorSucursales++;
      console.log(`[SUCURSAL ${contadorSucursales}] Agregando pedido:`, baseData['Numero Interno']);
      // Construir dirección completa con TODA la información disponible
      const calle = getColumnValue(order, 16); // Dirección
      const numero = getColumnValue(order, 17); // Número
      const piso = getColumnValue(order, 18); // Piso
      const localidad = getColumnValue(order, 19); // Localidad
      const ciudad = getColumnValue(order, 20); // Ciudad
      const codigoPostal = getColumnValue(order, 21); // Código postal
      const provincia = getColumnValue(order, 22); // Provincia o estado
      
      // Construir dirección básica para matching de sucursal
      // Extraer solo el número básico del campo número (antes de "entre", "y", etc.)
      let numeroBasico = numero;
      if (numero && numero.includes('entre')) {
        numeroBasico = numero.split('entre')[0].trim();
      } else if (numero && numero.includes('y')) {
        numeroBasico = numero.split('y')[0].trim();
      }
      
      let direccionCompleta = `${calle} ${numeroBasico}`.trim();
      if (piso && piso.trim()) {
        direccionCompleta += `, ${piso}`;
      }
      if (localidad && localidad.trim()) {
        direccionCompleta += `, ${localidad}`;
      }
      if (ciudad && ciudad.trim() && ciudad !== localidad) {
        direccionCompleta += `, ${ciudad}`;
      }
      if (codigoPostal && codigoPostal.trim()) {
        direccionCompleta += `, ${codigoPostal}`;
      }
      if (provincia && provincia.trim()) {
        direccionCompleta += `, ${provincia}`;
      }
      
      console.log('=== DEBUGGING SUCURSAL ===');
      console.log('Calle extraída:', calle);
      console.log('Número extraído:', numero);
      console.log('Número básico extraído:', numeroBasico);
      console.log('Piso extraído:', piso);
      console.log('Localidad extraída:', localidad);
      console.log('Ciudad extraída:', ciudad);
      console.log('Código postal extraído:', codigoPostal);
      console.log('Provincia extraída:', provincia);
      console.log('Calle y número básico combinados:', `${calle} ${numeroBasico}`);
      console.log('Dirección completa del pedido:', direccionCompleta);
      
      const nombreSucursal = findSucursalByAddress(direccionCompleta, sucursales, codigoPostal, provincia);
      console.log('Sucursal encontrada:', nombreSucursal);
      console.log('=== FIN DEBUGGING ===');

      // Verificar si se encontró la sucursal correctamente
      if (nombreSucursal === 'SUCURSAL NO ENCONTRADA') {
        // Generar sugerencia cuando no hay coincidencia exacta
        const sugerencia = generarSugerenciaSucursal(
          direccionCompleta,
          sucursales,
          codigoPostal,
          provincia,
          ciudad,
          localidad,
          baseData['Numero Interno']
        );
        
        if (sugerencia && sugerencia.sucursal) {
          // Agregar a sugerencias pendientes (se procesará en el UI)
          sugerenciasSucursal.push({
            numeroOrden: baseData['Numero Interno'],
            direccionPedido: direccionCompleta,
            numero: numeroBasico,
            localidad: localidad,
            ciudad: ciudad,
            codigoPostal: codigoPostal,
            provincia: provincia,
            sucursalSugerida: sugerencia.sucursal,
            razon: sugerencia.razon,
            score: sugerencia.score,
            decision: 'pendiente',
            pedidoData: {
              peso: baseData['Peso (grs)'],
              alto: baseData['Alto (cm)'],
              ancho: baseData['Ancho (cm)'],
              profundidad: baseData['Profundidad (cm)'],
              valorDeclarado: baseData['Valor declarado ($ C/IVA) *'],
              nombre: baseData['Nombre *'],
              apellido: baseData['Apellido *'],
              dni: baseData['DNI *'],
              email: baseData['Email *'],
              celularCodigo: baseData['Celular código *'],
              celularNumero: baseData['Celular número *']
            }
          });
          
          console.log(`\n💡 ==========================================`);
          console.log(`💡 SUGERENCIA GENERADA PARA PEDIDO #${baseData['Numero Interno']}`);
          console.log(`💡 ==========================================`);
          console.log(`📦 Número de Orden: ${baseData['Numero Interno']}`);
          console.log(`👤 Cliente: ${getColumnValue(order, 11)}`);
          console.log(`📍 Dirección: ${direccionCompleta}`);
          console.log(`💡 Sucursal sugerida: ${sugerencia.sucursal.nombre_sucursal}`);
          console.log(`📊 Score: ${sugerencia.score}/100`);
          console.log(`📝 Razón: ${sugerencia.razon}`);
          console.log(`⚠️ ACCIÓN REQUERIDA: Revisar y decidir si aceptar o rechazar la sugerencia`);
          console.log(`💡 ==========================================\n`);
        } else {
          // Si no se pudo generar sugerencia, buscar la sucursal más cercana por provincia
          // para asegurar que siempre haya una sugerencia
          const normalizarTextoFallback = (texto: string): string => {
            return texto
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/\./g, ' ')
              .replace(/[^\w\s]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
          };
          
          const sucursalesProvincia = sucursales.filter(s => {
            const direccionSucNorm = normalizarTextoFallback(s.direccion);
            const nombreSucNorm = normalizarTextoFallback(s.nombre_sucursal);
            const provinciaNorm = provincia ? normalizarTextoFallback(provincia) : '';
            return provinciaNorm && (direccionSucNorm.includes(provinciaNorm) || nombreSucNorm.includes(provinciaNorm));
          });
          
          if (sucursalesProvincia.length > 0) {
            // Usar la primera sucursal de la provincia como sugerencia de último recurso
            const sucursalFallback = sucursalesProvincia[0];
            sugerenciasSucursal.push({
              numeroOrden: baseData['Numero Interno'],
              direccionPedido: direccionCompleta,
              numero: numeroBasico,
              localidad: localidad,
              ciudad: ciudad,
              codigoPostal: codigoPostal,
              provincia: provincia,
              sucursalSugerida: sucursalFallback,
              razon: `Sucursal en la misma provincia (${provincia}) - Revisar manualmente`,
              score: 20,
              decision: 'pendiente',
              pedidoData: {
                peso: baseData['Peso (grs)'],
                alto: baseData['Alto (cm)'],
                ancho: baseData['Ancho (cm)'],
                profundidad: baseData['Profundidad (cm)'],
                valorDeclarado: baseData['Valor declarado ($ C/IVA) *'],
                nombre: baseData['Nombre *'],
                apellido: baseData['Apellido *'],
                dni: baseData['DNI *'],
                email: baseData['Email *'],
                celularCodigo: baseData['Celular código *'],
                celularNumero: baseData['Celular número *']
              }
            });
            console.log(`\n💡 ==========================================`);
            console.log(`💡 SUGERENCIA FALLBACK GENERADA PARA PEDIDO #${baseData['Numero Interno']}`);
            console.log(`💡 ==========================================`);
            console.log(`📦 Número de Orden: ${baseData['Numero Interno']}`);
            console.log(`👤 Cliente: ${getColumnValue(order, 11)}`);
            console.log(`📍 Dirección: ${direccionCompleta}`);
            console.log(`💡 Sucursal sugerida (fallback): ${sucursalFallback.nombre_sucursal}`);
            console.log(`📊 Score: 20/100 (Baja confianza - Revisar manualmente)`);
            console.log(`📝 Razón: Sucursal en la misma provincia`);
            console.log(`⚠️ ACCIÓN REQUERIDA: Revisar y decidir si aceptar o rechazar la sugerencia`);
            console.log(`💡 ==========================================\n`);
          } else {
            // Si no hay sucursales en la provincia, buscar cualquier sucursal disponible como último recurso
            if (sucursales.length > 0) {
              // Usar la primera sucursal disponible como sugerencia de último recurso
              const sucursalUltimoRecurso = sucursales[0];
              sugerenciasSucursal.push({
                numeroOrden: baseData['Numero Interno'],
                direccionPedido: direccionCompleta,
                numero: numeroBasico,
                localidad: localidad,
                ciudad: ciudad,
                codigoPostal: codigoPostal,
                provincia: provincia,
                sucursalSugerida: sucursalUltimoRecurso,
                razon: `No se encontraron sucursales en ${provincia}. Sucursal genérica sugerida - REVISAR MANUALMENTE`,
                score: 10,
                decision: 'pendiente',
                pedidoData: {
                  peso: baseData['Peso (grs)'],
                  alto: baseData['Alto (cm)'],
                  ancho: baseData['Ancho (cm)'],
                  profundidad: baseData['Profundidad (cm)'],
                  valorDeclarado: baseData['Valor declarado ($ C/IVA) *'],
                  nombre: baseData['Nombre *'],
                  apellido: baseData['Apellido *'],
                  dni: baseData['DNI *'],
                  email: baseData['Email *'],
                  celularCodigo: baseData['Celular código *'],
                  celularNumero: baseData['Celular número *']
                }
              });
              console.log(`\n💡 ==========================================`);
              console.log(`💡 SUGERENCIA ÚLTIMO RECURSO GENERADA PARA PEDIDO #${baseData['Numero Interno']}`);
              console.log(`💡 ==========================================`);
              console.log(`📦 Número de Orden: ${baseData['Numero Interno']}`);
              console.log(`👤 Cliente: ${getColumnValue(order, 11)}`);
              console.log(`📍 Dirección: ${direccionCompleta}`);
              console.log(`💡 Sucursal sugerida (último recurso): ${sucursalUltimoRecurso.nombre_sucursal}`);
              console.log(`📊 Score: 10/100 (Muy baja confianza - Revisar manualmente)`);
              console.log(`📝 Razón: No se encontraron sucursales en la provincia ${provincia}`);
              console.log(`⚠️ ACCIÓN REQUERIDA: Revisar y decidir si aceptar o rechazar la sugerencia`);
              console.log(`💡 ==========================================\n`);
            } else {
              contadorSucursalesNoEncontradas++;
              console.error(`\n🚨 ==========================================`);
              console.error(`🚨 PEDIDO A SUCURSAL NO PROCESADO #${contadorSucursalesNoEncontradas}`);
              console.error(`🚨 ==========================================`);
              console.error(`📦 Número de Orden: ${baseData['Numero Interno']}`);
              console.error(`👤 Cliente: ${getColumnValue(order, 11)}`);
              console.error(`📧 Email: ${getColumnValue(order, 1)}`);
              console.error(`📞 Teléfono: ${getColumnValue(order, 13)}`);
              console.error(`📍 Dirección completa del pedido:`);
              console.error(`   - Calle: "${calle}"`);
              console.error(`   - Número: "${numero}" (básico: "${numeroBasico}")`);
              console.error(`   - Piso: "${piso}"`);
              console.error(`   - Localidad: "${localidad}"`);
              console.error(`   - Ciudad: "${ciudad}"`);
              console.error(`   - Código Postal: "${codigoPostal}"`);
              console.error(`   - Provincia: "${provincia}"`);
              console.error(`   - Dirección construida: "${direccionCompleta}"`);
              console.error(`📋 Medio de envío: "${medioEnvio}"`);
              console.error(`❌ MOTIVO: No se encontró sucursal Andreani y no hay sucursales disponibles en el sistema`);
              console.error(`💡 ACCIÓN REQUERIDA: Revisar manualmente y asignar sucursal correcta`);
              console.error(`🚨 ==========================================\n`);
            }
          }
        }
      } else {
        sucursalesOutput.push({
          ...baseData,
          'Sucursal *': nombreSucursal,
        });
        console.log(`✅ Sucursal asignada correctamente: ${nombreSucursal}`);
      }
    } else {
      contadorNoProcesados++;
      console.error(`❌ [NO PROCESADO ${contadorNoProcesados}] Pedido ${baseData['Numero Interno']}`);
      console.error(`   Medio de envío original: "${medioEnvio}"`);
      console.error(`   Medio de envío normalizado: "${medioEnvioNormalizado}"`);
      console.error(`   ⚠️ El medio de envío no coincide con ningún patrón conocido`);
      console.error(`   ✅ Patrones de DOMICILIO: "domicilio", "a domicilio", "andreani estandar"`);
      console.error(`   ✅ Patrones de SUCURSAL: "punto de retiro", "sucursal", "retiro"`);
    }
  }

  console.log('\n=== RESUMEN DE PROCESAMIENTO ===');
  console.log(`Total pedidos procesados: ${contadorDomicilios + contadorSucursales + contadorNoProcesados}`);
  console.log(`- Domicilios: ${contadorDomicilios}`);
  console.log(`- Sucursales encontradas y procesadas: ${contadorSucursales - contadorSucursalesNoEncontradas}`);
  console.log(`- Sucursales NO encontradas (requieren revisión manual): ${contadorSucursalesNoEncontradas}`);
  console.log(`- No procesados (medio de envío no reconocido): ${contadorNoProcesados}`);
  console.log('Final results - Domicilios:', domicilios.length, 'Sucursales:', sucursalesOutput.length);
  
  if (contadorSucursalesNoEncontradas > 0) {
    console.error(`\n⚠️ ATENCIÓN: ${contadorSucursalesNoEncontradas} pedido(s) a sucursal no pudieron ser procesados automáticamente.`);
    console.error(`   Revisa los logs anteriores para ver los detalles de cada pedido.`);
  }

  // Recopilar logs de procesamiento
  const processingLogs: string[] = [];
  processingLogs.push(`Total pedidos cargados: ${tiendanubeOrders.length}`);
  processingLogs.push(`Domicilios procesados: ${contadorDomicilios}`);
  processingLogs.push(`Sucursales procesadas: ${contadorSucursales - contadorSucursalesNoEncontradas}`);
  if (contadorSucursalesNoEncontradas > 0) {
    processingLogs.push(`⚠️ Sucursales NO encontradas (requieren revisión manual): ${contadorSucursalesNoEncontradas}`);
  }
  processingLogs.push(`No procesados (medio de envío no reconocido): ${contadorNoProcesados}`);
  processingLogs.push(`Total procesados: ${contadorDomicilios + contadorSucursales + contadorNoProcesados}`);
  
  // Determinar razón de no procesados para processOrders
  let noProcessedReason = '';
  if (contadorNoProcesados > 0) {
    noProcessedReason = 'Medio de envío no reconocido. Verifica los medios de envío en el archivo original.';
  }

  return {
    domicilioCSV: unparseCSV(domicilios),
    sucursalCSV: unparseCSV(sucursalesOutput),
    processingInfo: {
      totalOrders: tiendanubeOrders.length,
      domiciliosProcessed: contadorDomicilios,
      sucursalesProcessed: contadorSucursales,
      noProcessed: contadorNoProcesados,
      processingLogs,
      noProcessedReason,
      sugerenciasSucursal: sugerenciasSucursal.length > 0 ? sugerenciasSucursal : undefined
    }
  };
};

// Nueva función para procesar el formato de ventas específico
export const processVentasOrders = async (
  csvContent: string, 
  config?: { peso: number; alto: number; ancho: number; profundidad: number; valorDeclarado: number }
): Promise<{
  domicilioCSV: string;
  sucursalCSV: string;
  processingInfo: ProcessingInfo;
}> => {
  // Valores por defecto
  const defaultConfig = {
    peso: 400,
    alto: 10,
    ancho: 10,
    profundidad: 10,
    valorDeclarado: 6000,
  };
  
  const finalConfig = config || defaultConfig;
  
  console.log('Procesando archivo de ventas...');
  
  // Cargar datos necesarios
  const [codigosPostales, sucursales] = await Promise.all([
    fetchCodigosPostales(),
    fetchSucursales()
  ]);

  // Parsear el CSV de ventas
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('El archivo CSV no tiene datos válidos');
  }

  // Detectar delimitador automáticamente: contar comas y punto y coma en la primera línea
  const primeraLinea = lines[0];
  const countComas = (primeraLinea.match(/,/g) || []).length;
  const countPuntoComa = (primeraLinea.match(/;/g) || []).length;
  
  // Usar el delimitador que aparezca más veces (o coma por defecto si hay empate)
  const delimiter = countPuntoComa > countComas ? ';' : ',';
  console.log(`📊 Delimitador detectado: "${delimiter}" (comas: ${countComas}, punto y coma: ${countPuntoComa})`);

  // Parsear headers respetando comillas
  const headers: string[] = [];
  if (delimiter === ',') {
    let currentHeader = '';
    let insideQuotes = false;
    
    for (let j = 0; j < primeraLinea.length; j++) {
      const char = primeraLinea[j];
      if (char === '"') {
        if (j + 1 < primeraLinea.length && primeraLinea[j + 1] === '"') {
          currentHeader += '"';
          j++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        headers.push(currentHeader.trim().replace(/^"|"$/g, ''));
        currentHeader = '';
      } else {
        currentHeader += char;
      }
    }
    if (currentHeader || !insideQuotes) {
      headers.push(currentHeader.trim().replace(/^"|"$/g, ''));
    }
  } else {
    headers.push(...primeraLinea.split(';').map(h => h.trim().replace(/^"|"$/g, '')));
  }
  console.log('Headers del archivo de ventas:', headers);

  const domicilios: any[] = [];
  const sucursalesOutput: any[] = [];
  
  let contadorDomicilios = 0;
  let contadorSucursales = 0;
  let contadorNoProcesados = 0;
  let contadorErroresSucursal = 0;
  const droppedOrders: string[] = [];
  const erroresSucursal: string[] = [];
  const erroresSucursalDetallados: Array<{
    numeroOrden: string;
    direccion: string;
    numero: string;
    localidad: string;
    ciudad: string;
    codigoPostal: string;
    provincia: string;
    motivo: string;
  }> = [];
  const sugerenciasSucursal: SucursalSugerencia[] = [];

  // Rastrear pedidos ya procesados para evitar duplicados
  const pedidosProcesados = new Set<string>();

  console.log('=== PROCESANDO ARCHIVO DE VENTAS ===');
  console.log('Total líneas de datos:', lines.length - 1);

  // Procesar cada línea de datos
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parsear la línea respetando comas dentro de comillas si el delimitador es coma
    const values: string[] = [];
    if (delimiter === ',') {
      // Parsear respetando comas dentro de comillas usando un enfoque más robusto
      let currentValue = '';
      let insideQuotes = false;
      let j = 0;
      
      while (j < line.length) {
        const char = line[j];
        
        if (char === '"') {
          // Verificar si es una comilla doble escapada ("")
          if (j + 1 < line.length && line[j + 1] === '"') {
            // Es una comilla doble escapada, agregar una comilla al valor
            currentValue += '"';
            j += 2; // Saltar ambas comillas
            continue;
          } else {
            // Es el inicio o fin de un campo entre comillas
            insideQuotes = !insideQuotes;
            j++;
            continue;
          }
        }
        
        if (char === ',' && !insideQuotes) {
          // Es un delimitador fuera de comillas, finalizar el valor actual
          values.push(currentValue.trim());
          currentValue = '';
          j++;
          continue;
        }
        
        // Agregar el carácter al valor actual
        currentValue += char;
        j++;
      }
      
      // Agregar el último valor (si existe)
      if (currentValue.length > 0 || !insideQuotes) {
        values.push(currentValue.trim());
      }
      
      // Limpiar comillas iniciales y finales de cada valor
      for (let k = 0; k < values.length; k++) {
        values[k] = values[k].replace(/^"|"$/g, '').replace(/""/g, '"');
      }
    } else {
      // Para punto y coma, usar split simple
      const valuesTemp = line.split(';');
      values.push(...valuesTemp.map(v => v.trim().replace(/^"|"$/g, '')));
    }
    
    if (values.length < headers.length) {
      console.warn(`⚠️ Línea ${i} tiene menos columnas (${values.length}) que headers (${headers.length}), omitiendo`);
      continue;
    }

    // Extraer datos del pedido
    const numeroOrden = values[0]?.replace(/"/g, '') || '';
    
    // Si no hay número de orden, es una línea duplicada del mismo pedido con múltiples productos - saltar
    if (!numeroOrden || numeroOrden.trim() === '') {
      console.log(`⏭️ Línea ${i} omitida: no tiene número de orden (producto adicional del pedido)`);
      continue;
    }
    
    // Si ya procesamos este pedido, saltar (es un producto adicional)
    if (pedidosProcesados.has(numeroOrden)) {
      console.log(`⏭️ Saltando producto adicional del pedido ${numeroOrden} (ya procesado)`);
      continue;
    }
    
    // Extraer datos del pedido
    const nombreComprador = values[11]?.replace(/"/g, '') || '';
    let apellidoComprador = nombreComprador.split(' ')[0] || '';
    let nombreCompleto = nombreComprador.split(' ').slice(1).join(' ') || '';
    const dni = values[12]?.replace(/"/g, '') || '';
    let email = values[1]?.replace(/"/g, '') || '';
    const telefono = values[13]?.replace(/"/g, '') || '';
    const direccion = values[16]?.replace(/"/g, '') || '';
    const numero = values[17]?.replace(/"/g, '') || '';
    const piso = values[18]?.replace(/"/g, '') || '';
    let localidad = values[19]?.replace(/"/g, '') || '';
    const ciudad = values[20]?.replace(/"/g, '') || '';
    
    // Si la localidad está vacía pero hay ciudad, usar la ciudad como localidad
    if ((!localidad || localidad.trim() === '') && ciudad && ciudad.trim() !== '') {
      localidad = ciudad;
      console.log(`⚠️ Pedido ${numeroOrden}: Localidad vacía, usando ciudad "${ciudad}" como localidad`);
    }
    
    // Debug: mostrar información de parseo para las primeras líneas
    if (i <= 3) {
      console.log(`🔍 DEBUG Línea ${i} - Pedido ${numeroOrden}:`);
      console.log(`   - Total valores parseados: ${values.length}`);
      console.log(`   - Email (índice 1): "${email}"`);
      console.log(`   - Dirección (índice 16): "${direccion}"`);
      console.log(`   - Localidad (índice 19): "${values[19]}"`);
      console.log(`   - Ciudad (índice 20): "${ciudad}"`);
      console.log(`   - Localidad final usada: "${localidad}"`);
      console.log(`   - Primeros 5 valores:`, values.slice(0, 5));
    }
    
    // Completar email si falta
    if (!email || email.trim() === '') {
      email = 'ejemplo@gmail.com';
      console.log(`⚠️ Pedido ${numeroOrden} sin email, usando: ${email}`);
    }
    
    // Verificar si es una línea incompleta (tiene número de orden pero le faltan campos esenciales)
    if (!direccion || !localidad) {
      console.log(`⏭️ Saltando línea incompleta del pedido ${numeroOrden} (dirección: "${direccion}", localidad: "${localidad}", ciudad: "${ciudad}")`);
      console.log(`   - Total valores: ${values.length}, Headers: ${headers.length}`);
      console.log(`   - Valores clave: direccion[16]="${values[16]}", localidad[19]="${values[19]}", ciudad[20]="${values[20]}"`);
      droppedOrders.push(`Pedido ${numeroOrden}: Faltan datos esenciales (dirección: ${direccion ? 'OK' : 'FALTA'}, localidad: ${localidad ? 'OK' : 'FALTA'}, ciudad: ${ciudad ? 'OK' : 'FALTA'})`);
      continue;
    }
    const codigoPostal = values[21]?.replace(/"/g, '') || '';
    const provincia = values[22]?.replace(/"/g, '') || '';
    const medioEnvio = values[24]?.replace(/"/g, '') || '';
    const valorDeclarado = values[9]?.replace(/"/g, '') || '6000';

    // Separar código de área y número de teléfono
    let telefonoLimpio = (telefono || '').replace(/[^\d]/g, '');
    
    // Si no hay teléfono o es muy corto, usar valores por defecto
    if (!telefonoLimpio || telefonoLimpio.length < 6) {
      telefonoLimpio = '1100000000'; // Teléfono por defecto (11 + 8 dígitos)
    }
    
    // Remover el prefijo internacional +54 si existe
    if (telefonoLimpio.startsWith('54')) {
      telefonoLimpio = telefonoLimpio.substring(2);
    }
    
    // Remover el "9" adicional de celulares argentinos (formato: +54 9 AREA NUMERO)
    if (telefonoLimpio.startsWith('9')) {
      telefonoLimpio = telefonoLimpio.substring(1);
    }
    
    // Función auxiliar para obtener código de área y número
    const separarTelefono = (phone: string, prov: string): { codigo: string; numero: string } => {
      const provinciaLower = prov.toLowerCase();
      
      // Buenos Aires - código 11 (2 dígitos)
      if ((provinciaLower.includes('buenos aires') || provinciaLower.includes('capital federal')) && phone.startsWith('11')) {
        return { codigo: '11', numero: phone.substring(2) };
      }
      
      // Códigos de 3 dígitos
      const codigos3 = ['221', '223', '291', '341', '342', '343', '351', '358', '261', '381', '376', '362', '379', '370', '387', '388', '380', '383', '385', '264', '297', '299'];
      for (const cod of codigos3) {
        if (phone.startsWith(cod)) {
          return { codigo: cod, numero: phone.substring(3) };
        }
      }
      
      // Códigos de 4 dígitos
      const codigos4 = ['2652', '2901', '2920', '2944', '2954', '2965', '2966', '3541'];
      for (const cod of codigos4) {
        if (phone.startsWith(cod)) {
          return { codigo: cod, numero: phone.substring(4) };
        }
      }
      
      // Fallback: asumir código de 2 dígitos
      return { codigo: phone.substring(0, 2), numero: phone.substring(2) };
    };
    
    const { codigo: codigoArea, numero: numeroTelefono } = separarTelefono(telefonoLimpio, provincia);

    // Procesar DNI / CUIT - primero intentar desde el campo DNI directo
    let dniCuitLimpio = dni.replace(/\D/g, '');
    let dniProcesado = '';
    
    // Si no hay DNI en el campo directo, buscar en Billing Company o Billing Name
    if (!dniCuitLimpio || dniCuitLimpio.trim() === '') {
      // Buscar índice de Billing Company y Billing Name en headers
      const billingCompanyIndex = headers.findIndex((h: string) => h.trim().toLowerCase() === 'billing company');
      const billingNameIndex = headers.findIndex((h: string) => h.trim().toLowerCase() === 'billing name');
      
      // Intentar extraer de Billing Company primero
      if (billingCompanyIndex >= 0 && values[billingCompanyIndex]) {
        const billingCompany = values[billingCompanyIndex]?.replace(/"/g, '') || '';
        const dniDesdeCompany = extraerDNI(billingCompany);
        if (dniDesdeCompany) {
          dniCuitLimpio = dniDesdeCompany.replace(/\D/g, '');
          console.log(`DNI extraído de Billing Company para pedido ${numeroOrden}: ${dniCuitLimpio}`);
        }
      }
      
      // Si no se encontró en Billing Company, intentar en Billing Name
      if (!dniCuitLimpio && billingNameIndex >= 0 && values[billingNameIndex]) {
        const billingName = values[billingNameIndex]?.replace(/"/g, '') || '';
        const dniDesdeName = extraerDNI(billingName);
        if (dniDesdeName) {
          dniCuitLimpio = dniDesdeName.replace(/\D/g, '');
          console.log(`DNI extraído de Billing Name para pedido ${numeroOrden}: ${dniCuitLimpio}`);
        }
      }
    }
    
    // Procesar el DNI encontrado
    if (dniCuitLimpio && dniCuitLimpio.trim() !== '') {
      if (dniCuitLimpio.length === 11) {
        // Es un CUIT, extraer el DNI (quitar los primeros 2 dígitos y el último)
        dniProcesado = dniCuitLimpio.substring(2, 10);
        console.log(`CUIT detectado (${dniCuitLimpio}) -> DNI extraído: ${dniProcesado}`);
      } else if (dniCuitLimpio.length === 8 || dniCuitLimpio.length === 7) {
        // Es un DNI válido
        dniProcesado = dniCuitLimpio;
      } else {
        console.warn(`Formato de DNI/CUIT no reconocido: ${dniCuitLimpio} (${dniCuitLimpio.length} dígitos)`);
      }
    }

    // Validar campos obligatorios antes de procesar
    if (!email || !email.trim()) {
      console.warn(`⚠️ Pedido ${numeroOrden}: Email vacío, omitiendo pedido`);
      contadorNoProcesados++;
      continue;
    }
    
    if (!dniProcesado || dniProcesado.trim() === '') {
      console.warn(`⚠️ Pedido ${numeroOrden}: DNI vacío, usando placeholder`);
      dniProcesado = '00000000';
    }
    
    if (!nombreCompleto || !nombreCompleto.trim()) {
      console.warn(`⚠️ Pedido ${numeroOrden}: Nombre vacío, usando placeholder`);
      nombreCompleto = 'SIN NOMBRE';
    }
    
    if (!apellidoComprador || !apellidoComprador.trim()) {
      console.warn(`⚠️ Pedido ${numeroOrden}: Apellido vacío, usando placeholder`);
      apellidoComprador = 'SIN APELLIDO';
    }
    
    // Asegurar que código de área y número de teléfono no estén vacíos
    const codigoAreaFinal = codigoArea && codigoArea.trim() ? codigoArea.trim() : '11';
    const numeroTelefonoFinal = numeroTelefono && numeroTelefono.trim() ? numeroTelefono.trim() : '00000000';
    
    // Normalizar nombre y apellido (remover acentos y caracteres especiales)
    const nombreCompletoNormalizado = normalizarNombre(nombreCompleto) || 'SIN NOMBRE';
    const apellidoCompradorNormalizado = normalizarNombre(apellidoComprador) || 'SIN APELLIDO';
    
    // Datos base para ambos tipos
    const baseData = {
      'Paquete Guardado \nEj: 1': '',
      'Peso (grs)\nEj: ': String(finalConfig.peso),
      'Alto (cm)\nEj: ': String(finalConfig.alto),
      'Ancho (cm)\nEj: ': String(finalConfig.ancho),
      'Profundidad (cm)\nEj: ': String(finalConfig.profundidad),
      'Valor declarado ($ C/IVA) *\nEj: ': valorDeclarado || String(finalConfig.valorDeclarado),
      'Numero Interno\nEj: ': `#${numeroOrden}`,
      'Nombre *\nEj: ': nombreCompletoNormalizado,
      'Apellido *\nEj: ': apellidoCompradorNormalizado,
      'DNI *\nEj: ': dniProcesado,
      'Email *\nEj: ': email.trim(),
      'Celular código *\nEj: ': codigoAreaFinal,
      'Celular número *\nEj: ': numeroTelefonoFinal,
    };

    // Normalizar medio de envío para detectar tipo
    // Primero normalizar quitando tildes y caracteres especiales, pero manteniendo la estructura básica
    let medioEnvioNorm = medioEnvio.toLowerCase().trim()
      // Remover caracteres corruptos comunes de encoding (incluyendo caracteres de reemplazo Unicode)
      .replace(/\uFFFD/g, '') // Carácter de reemplazo Unicode
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Caracteres de control y no imprimibles
      // Normalizar tildes y acentos
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/[ñ]/g, 'n')
      // Remover signos de exclamación e interrogación (incluyendo variantes Unicode)
      .replace(/[¡!¿?]/g, '')
      // Reemplazar + con espacio para detectar "ENVIO PRIORITARIO + SEGUIMIENTO + SEGURO"
      .replace(/\+/g, ' ')
      // Remover comillas dobles que pueden estar alrededor del texto
      .replace(/^["']|["']$/g, '')
      // Normalizar espacios múltiples a uno solo
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log('🔍 Processing order (VENTAS):', numeroOrden, 'Medio de envío original:', medioEnvio);
    console.log('📦 Medio de envío normalizado:', medioEnvioNorm);
    
    // Detectar envío a domicilio
    // Reglas:
    // - "Andreani" → domicilio
    // - "Andreani Estándar" → domicilio
    // - "Andreani Despacho" → domicilio
    // - Cualquier cosa con "domicilio" → domicilio
    // - "Envio Prioritario" o "Prioritario" → domicilio
    // - "ENVIO PRIORITARIO + SEGUIMIENTO + SEGURO" → domicilio (detecta "envio prioritario", "seguimiento", "seguro")
    // - "Envio Gratis" o "Envío Gratis" → domicilio (incluso con encoding corrupto)
    // - "¡Te vamos a contactar para coordinar para la entrega!" → domicilio (con variaciones)
    // Detección flexible: busca "envi" seguido eventualmente de "gratis" (puede haber caracteres corruptos entre ellos)
    // Esta detección funciona incluso si el texto tiene encoding corrupto como "Envi Gratis" o "Envi Gratis"
    const tieneEnvioGratis = medioEnvioNorm && (
      medioEnvioNorm.includes("envio gratis") ||
      // Detección flexible: "envi" + "gratis" (puede haber caracteres corruptos como "" entre ellos)
      // Esto captura "envió gratis", "envio gratis", "envi gratis", etc.
      (medioEnvioNorm.includes("envi") && medioEnvioNorm.includes("gratis"))
    );
    
    // Detectar "ENVIO PRIORITARIO + SEGUIMIENTO + SEGURO" (puede venir con o sin los +)
    const tieneEnvioPrioritarioCompleto = medioEnvioNorm && (
      (medioEnvioNorm.includes("envio prioritario") && 
       (medioEnvioNorm.includes("seguimiento") || medioEnvioNorm.includes("seguro"))) ||
      (medioEnvioNorm.includes("prioritario") && 
       (medioEnvioNorm.includes("seguimiento") || medioEnvioNorm.includes("seguro")))
    );
    
    // Detectar mensaje de contacto (con variaciones: con/sin signos de exclamación, con/sin "para" duplicado)
    const tieneMensajeContacto = medioEnvioNorm && (
      medioEnvioNorm.includes("te vamos a contactar para coordinar") ||
      medioEnvioNorm.includes("vamos a contactar para coordinar") ||
      medioEnvioNorm.includes("te vamos a contactar para coordinar para la entrega") ||
      medioEnvioNorm.includes("vamos a contactar para coordinar para la entrega") ||
      (medioEnvioNorm.includes("contactar") && 
       medioEnvioNorm.includes("coordinar") && 
       medioEnvioNorm.includes("entrega"))
    );
    
    const esDomicilioVentas = medioEnvioNorm && (
      medioEnvioNorm.includes("domicilio") ||
      medioEnvioNorm.includes("andreani") ||
      medioEnvioNorm.includes("envio a domicilio") ||
      medioEnvioNorm.includes("a domicilio") ||
      medioEnvioNorm.includes("envio prioritario") ||
      medioEnvioNorm.includes("prioritario") ||
      tieneEnvioPrioritarioCompleto ||
      tieneEnvioGratis ||
      tieneMensajeContacto
    );
    
    // Detectar envío a sucursal
    // Reglas:
    // - "Punto de retiro" → sucursal
    // - "Andreani Sucursal" → sucursal
    // - "retiro" (genérico) → sucursal
    const esSucursalVentas = medioEnvioNorm && (
      medioEnvioNorm.includes("punto de retiro") ||
      (medioEnvioNorm.includes("andreani") && medioEnvioNorm.includes("sucursal")) ||
      medioEnvioNorm.includes("retiro")
    );
    
    console.log('🏠 Es domicilio?', esDomicilioVentas, '| 🏢 Es sucursal?', esSucursalVentas);
    
    // Determinar si es envío a domicilio o sucursal
    if (esDomicilioVentas && !esSucursalVentas) {
      contadorDomicilios++;
      console.log(`[DOMICILIO ${contadorDomicilios}] Procesando pedido:`, numeroOrden);
      // Procesar envío a domicilio
      const calleNormalizada = direccion.replace(/[áàäâ]/g, 'a')
        .replace(/[éèëê]/g, 'e')
        .replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o')
        .replace(/[úùüû]/g, 'u')
        .replace(/[ñ]/g, 'n')
        .replace(/[ÁÀÄÂ]/g, 'A')
        .replace(/[ÉÈËÊ]/g, 'E')
        .replace(/[ÍÌÏÎ]/g, 'I')
        .replace(/[ÓÒÖÔ]/g, 'O')
        .replace(/[ÚÙÜÛ]/g, 'U')
        .replace(/[Ñ]/g, 'N')
        .replace(/[ç]/g, 'c')
        .replace(/[Ç]/g, 'C')
        .replace(/['']/g, '')
        .replace(/[""]/g, '"')
        .replace(/[–—]/g, '-')
        .replace(/[…]/g, '...')
        .replace(/[]/g, '');

      // Limpiar campo de Piso: eliminar caracteres inválidos (. , * - _ etc.) y solo dejar letras, números y espacios
      // Primero extraer el departamento antes de limpiar todo, para poder identificarlo correctamente
      let departamentoNormalizado = '';
      let pisoSinDepto = piso;
      
      // Buscar patrones comunes de departamento (antes de limpiar caracteres)
      // Estos patrones deben ser flexibles para encontrar depto/dto con diferentes formatos
      const deptoPatterns = [
        /([\.\-\s]*depto[\.\-\s]*[a-z0-9]+)/i,
        /([\.\-\s]*dto[\.\-\s]*[a-z0-9]+)/i,
        /([\.\-\s]*departamento[\.\-\s]*[a-z0-9]+)/i,
        /([\.\-\s]*apto[\.\-\s]*[a-z0-9]+)/i,
        /([\.\-\s]*apartamento[\.\-\s]*[a-z0-9]+)/i,
      ];
      
      let deptoEncontrado = false;
      for (const pattern of deptoPatterns) {
        const match = piso.match(pattern);
        if (match && match[0]) {
          // Extraer solo el valor del departamento (número o letra)
          const deptoMatch = match[0].match(/([a-z0-9]+)$/i);
          if (deptoMatch && deptoMatch[1]) {
            departamentoNormalizado = limpiarPisoDepto(deptoMatch[1]);
            // Remover la parte del departamento del texto del piso antes de limpiarlo
            pisoSinDepto = piso.replace(pattern, '').trim();
            deptoEncontrado = true;
            console.log(`✅ Departamento extraído del piso para pedido ${numeroOrden}: "${departamentoNormalizado}" (piso original: "${piso}")`);
            break;
          }
        }
      }
      
      // Limpiar el campo piso (sin la parte del departamento si se extrajo)
      const pisoNormalizado = limpiarPisoDepto(pisoSinDepto);
      
      // Si no se encontró departamento explícito, usar vacío (no copiar el piso completo)
      if (!deptoEncontrado) {
        departamentoNormalizado = '';
        console.log(`ℹ️ No se encontró departamento explícito en el piso para pedido ${numeroOrden}, usando campo vacío`);
      }

      // Procesar número de calle - debe ser SOLO números
      let numeroCalleVentas = numero.trim();
      
      // Reemplazar "SN" o "S/N" con "0"
      if (/^s[\s\/\-]*n$/i.test(numeroCalleVentas)) {
        numeroCalleVentas = '0';
      } else {
        // Extraer solo números del campo
        const soloNumeros = numeroCalleVentas.match(/\d+/);
        if (soloNumeros && soloNumeros[0]) {
          numeroCalleVentas = soloNumeros[0];
        } else {
          // Si no hay números, usar "0" como fallback
          console.warn(`Número de calle no válido: "${numeroCalleVentas}" - usando "0" como fallback`);
          numeroCalleVentas = '0';
        }
      }

      // Buscar el formato EXACTO en domiciliosData.ts - TAL CUAL como está definido
      let formatoProvinciaLocalidadCP = '';
      
      console.log(`=== DEBUGGING CÓDIGO POSTAL ${codigoPostal} (VENTAS) ===`);
      console.log('¿Existe en mapeo domiciliosData.ts?', codigosPostales.has(codigoPostal));
      
      if (codigosPostales.has(codigoPostal)) {
        formatoProvinciaLocalidadCP = codigosPostales.get(codigoPostal)!;
        console.log(`✅ Código postal ${codigoPostal} encontrado TAL CUAL en domiciliosData.ts: ${formatoProvinciaLocalidadCP}`);
      } else {
        console.log(`❌ Código postal ${codigoPostal} NO encontrado en domiciliosData.ts`);
        
        // FALLBACK: Buscar por PROVINCIA + LOCALIDAD
        const provinciaPedido = provincia.toUpperCase();
        const localidadPedido = localidad.toUpperCase();
        
        console.log(`🔍 Buscando por PROVINCIA + LOCALIDAD: "${provinciaPedido} / ${localidadPedido}"`);
        
        let encontradoPorProvinciaLocalidad = false;
        for (const [cp, formato] of codigosPostales.entries()) {
          // Normalizar para comparar (quitar acentos y convertir a mayúsculas)
          const formatoNormalizado = formato
            .replace(/[áàäâ]/g, 'A')
            .replace(/[éèëê]/g, 'E')
            .replace(/[íìïî]/g, 'I')
            .replace(/[óòöô]/g, 'O')
            .replace(/[úùüû]/g, 'U')
            .replace(/[ñ]/g, 'N')
            .toUpperCase();
          
          const provinciaNormalizada = provinciaPedido
            .replace(/[áàäâ]/g, 'A')
            .replace(/[éèëê]/g, 'E')
            .replace(/[íìïî]/g, 'I')
            .replace(/[óòöô]/g, 'O')
            .replace(/[úùüû]/g, 'U')
            .replace(/[ñ]/g, 'N');
          
          const localidadNormalizada = localidadPedido
            .replace(/[áàäâ]/g, 'A')
            .replace(/[éèëê]/g, 'E')
            .replace(/[íìïî]/g, 'I')
            .replace(/[óòöô]/g, 'O')
            .replace(/[úùüû]/g, 'U')
            .replace(/[ñ]/g, 'N');
          
          const patronBusqueda = `${provinciaNormalizada} / ${localidadNormalizada}`;
          
          if (formatoNormalizado.includes(patronBusqueda)) {
            formatoProvinciaLocalidadCP = formato;
            encontradoPorProvinciaLocalidad = true;
            console.log(`✅ Encontrado por PROVINCIA + LOCALIDAD: ${formato}`);
            break;
          }
        }
        
        if (!encontradoPorProvinciaLocalidad) {
          console.log(`❌ No encontrado por PROVINCIA + LOCALIDAD tampoco`);
          // Último fallback: formato por defecto
          formatoProvinciaLocalidadCP = `${provinciaPedido} / ${localidadPedido} / ${codigoPostal}`;
          console.log('Usando formato de fallback final:', formatoProvinciaLocalidadCP);
        }
      }

      // Validar formato de Provincia / Localidad / CP
      if (!formatoProvinciaLocalidadCP || formatoProvinciaLocalidadCP.trim() === '') {
        console.warn(`⚠️ Pedido ${numeroOrden}: Formato de Provincia/Localidad/CP vacío, omitiendo pedido`);
        contadorNoProcesados++;
        continue;
      }
      
      // Validar que el formato tenga exactamente 3 partes separadas por /
      const partesFormato = formatoProvinciaLocalidadCP.split('/').map(p => p.trim());
      if (partesFormato.length !== 3) {
        console.warn(`⚠️ Pedido ${numeroOrden}: Formato de Provincia/Localidad/CP inválido: "${formatoProvinciaLocalidadCP}"`);
        contadorNoProcesados++;
        continue;
      }
      
      domicilios.push({
        ...baseData,
        'Calle *\nEj: ': calleNormalizada,
        'Número *\nEj: ': numeroCalleVentas,
        'Piso\nEj: ': pisoNormalizado,
        'Departamento\nEj: ': departamentoNormalizado,
        'Provincia / Localidad / CP * \nEj: BUENOS AIRES / 11 DE SEPTIEMBRE / 1657': formatoProvinciaLocalidadCP,
        'Observaciones\nEj: ': '',
      });
      
      // Marcar el pedido como procesado para evitar duplicados
      if (numeroOrden) {
        pedidosProcesados.add(numeroOrden);
      }

    } else if (esSucursalVentas && !esDomicilioVentas) {
      console.log(`[SUCURSAL] Procesando pedido:`, numeroOrden);
      // Procesar envío a sucursal
      // Extraer solo el número básico del campo número (antes de "entre", "Local", "y", etc.)
      let numeroBasico = numero;
      if (numero) {
        // Eliminar texto después de palabras clave comunes
        const textoAntes = numero.split(/entre|y|local|piso|depto|dto/i)[0].trim();
        if (textoAntes) {
          numeroBasico = textoAntes;
        }
        // Extraer solo números si hay texto adicional
        const soloNumeros = numeroBasico.match(/\d+/);
        if (soloNumeros && soloNumeros[0] && numeroBasico !== soloNumeros[0]) {
          numeroBasico = soloNumeros[0];
        }
      }
      // Construir dirección completa para búsqueda (solo calle y número, sin localidad/ciudad que pueden interferir)
      // Limpiar espacios múltiples y asegurar formato correcto
      const direccionLimpia = direccion.trim();
      const numeroLimpio = numeroBasico.trim();
      const direccionParaBusqueda = `${direccionLimpia} ${numeroLimpio}`.replace(/\s+/g, ' ').trim();
      
      console.log(`🔍 DEBUG: Búsqueda de sucursal para pedido ${numeroOrden}`);
      console.log(`   Dirección original: "${direccion}"`);
      console.log(`   Número: "${numeroBasico}"`);
      console.log(`   Dirección para búsqueda: "${direccionParaBusqueda}"`);
      console.log(`   CP: ${codigoPostal}, Provincia: ${provincia}`);
      
      const nombreSucursal = findSucursalByAddress(direccionParaBusqueda, sucursales, codigoPostal, provincia);

      console.log(`🔍 DEBUG: Resultado búsqueda sucursal para pedido ${numeroOrden}:`, nombreSucursal);
      console.log(`🔍 DEBUG: Comparación con 'SUCURSAL NO ENCONTRADA':`, nombreSucursal === 'SUCURSAL NO ENCONTRADA');

      // Verificar si se encontró la sucursal correctamente
      if (nombreSucursal === 'SUCURSAL NO ENCONTRADA') {
        // Generar sugerencia cuando no hay coincidencia exacta
        const direccionCompletaParaSugerencia = `${direccion} ${numeroBasico}`.trim();
        const sugerencia = generarSugerenciaSucursal(
          direccionCompletaParaSugerencia,
          sucursales,
          codigoPostal,
          provincia,
          ciudad,
          localidad,
          numeroOrden
        );
        
        if (sugerencia && sugerencia.sucursal) {
          // Agregar a sugerencias pendientes (se procesará en el UI)
          sugerenciasSucursal.push({
            numeroOrden: numeroOrden,
            direccionPedido: direccionCompletaParaSugerencia,
            numero: numeroBasico,
            localidad: localidad,
            ciudad: ciudad,
            codigoPostal: codigoPostal,
            provincia: provincia,
            sucursalSugerida: sugerencia.sucursal,
            razon: sugerencia.razon,
            score: sugerencia.score,
            decision: 'pendiente',
            pedidoData: {
              peso: baseData['Peso (grs)\nEj: '] ? Number(baseData['Peso (grs)\nEj: ']) : finalConfig.peso,
              alto: baseData['Alto (cm)\nEj: '] ? Number(baseData['Alto (cm)\nEj: ']) : finalConfig.alto,
              ancho: baseData['Ancho (cm)\nEj: '] ? Number(baseData['Ancho (cm)\nEj: ']) : finalConfig.ancho,
              profundidad: baseData['Profundidad (cm)\nEj: '] ? Number(baseData['Profundidad (cm)\nEj: ']) : finalConfig.profundidad,
              valorDeclarado: baseData['Valor declarado ($ C/IVA) *\nEj: '] ? Number(baseData['Valor declarado ($ C/IVA) *\nEj: ']) : finalConfig.valorDeclarado,
              nombre: baseData['Nombre *\nEj: '],
              apellido: baseData['Apellido *\nEj: '],
              dni: baseData['DNI *\nEj: '],
              email: baseData['Email *\nEj: '],
              celularCodigo: baseData['Celular código *\nEj: '],
              celularNumero: baseData['Celular número *\nEj: ']
            }
          });
          
          console.log(`\n💡 ==========================================`);
          console.log(`💡 SUGERENCIA GENERADA PARA PEDIDO #${numeroOrden}`);
          console.log(`💡 ==========================================`);
          console.log(`📦 Número de Orden: ${numeroOrden}`);
          console.log(`📍 Dirección: ${direccionCompletaParaSugerencia}`);
          console.log(`💡 Sucursal sugerida: ${sugerencia.sucursal.nombre_sucursal}`);
          console.log(`📊 Score: ${sugerencia.score}/100`);
          console.log(`📝 Razón: ${sugerencia.razon}`);
          console.log(`⚠️ ACCIÓN REQUERIDA: Revisar y decidir si aceptar o rechazar la sugerencia`);
          console.log(`💡 ==========================================\n`);
        } else {
          // Si no se pudo generar sugerencia, buscar la sucursal más cercana por provincia
          // para asegurar que siempre haya una sugerencia
          const normalizarTextoFallback = (texto: string): string => {
            return texto
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/\./g, ' ')
              .replace(/[^\w\s]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
          };
          
          const sucursalesProvincia = sucursales.filter(s => {
            const direccionSucNorm = normalizarTextoFallback(s.direccion);
            const nombreSucNorm = normalizarTextoFallback(s.nombre_sucursal);
            const provinciaNorm = provincia ? normalizarTextoFallback(provincia) : '';
            return provinciaNorm && (direccionSucNorm.includes(provinciaNorm) || nombreSucNorm.includes(provinciaNorm));
          });
          
          if (sucursalesProvincia.length > 0) {
            // Usar la primera sucursal de la provincia como sugerencia de último recurso
            const sucursalFallback = sucursalesProvincia[0];
            sugerenciasSucursal.push({
              numeroOrden: numeroOrden,
              direccionPedido: direccionCompletaParaSugerencia,
              numero: numeroBasico,
              localidad: localidad,
              ciudad: ciudad,
              codigoPostal: codigoPostal,
              provincia: provincia,
              sucursalSugerida: sucursalFallback,
              razon: `Sucursal en la misma provincia (${provincia}) - Revisar manualmente`,
              score: 20,
              decision: 'pendiente',
              pedidoData: {
                peso: baseData['Peso (grs)\nEj: '] ? Number(baseData['Peso (grs)\nEj: ']) : finalConfig.peso,
                alto: baseData['Alto (cm)\nEj: '] ? Number(baseData['Alto (cm)\nEj: ']) : finalConfig.alto,
                ancho: baseData['Ancho (cm)\nEj: '] ? Number(baseData['Ancho (cm)\nEj: ']) : finalConfig.ancho,
                profundidad: baseData['Profundidad (cm)\nEj: '] ? Number(baseData['Profundidad (cm)\nEj: ']) : finalConfig.profundidad,
                valorDeclarado: baseData['Valor declarado ($ C/IVA) *\nEj: '] ? Number(baseData['Valor declarado ($ C/IVA) *\nEj: ']) : finalConfig.valorDeclarado,
                nombre: baseData['Nombre *\nEj: '],
                apellido: baseData['Apellido *\nEj: '],
                dni: baseData['DNI *\nEj: '],
                email: baseData['Email *\nEj: '],
                celularCodigo: baseData['Celular código *\nEj: '],
                celularNumero: baseData['Celular número *\nEj: ']
              }
            });
            console.log(`\n💡 ==========================================`);
            console.log(`💡 SUGERENCIA FALLBACK GENERADA PARA PEDIDO #${numeroOrden}`);
            console.log(`💡 ==========================================`);
            console.log(`📦 Número de Orden: ${numeroOrden}`);
            console.log(`📍 Dirección: ${direccionCompletaParaSugerencia}`);
            console.log(`💡 Sucursal sugerida (fallback): ${sucursalFallback.nombre_sucursal}`);
            console.log(`📊 Score: 20/100 (Baja confianza - Revisar manualmente)`);
            console.log(`📝 Razón: Sucursal en la misma provincia`);
            console.log(`⚠️ ACCIÓN REQUERIDA: Revisar y decidir si aceptar o rechazar la sugerencia`);
            console.log(`💡 ==========================================\n`);
          } else {
            // Si no hay sucursales en la provincia, buscar cualquier sucursal disponible como último recurso
            // o crear una sugerencia especial indicando que no hay sucursales disponibles
            if (sucursales.length > 0) {
              // Usar la primera sucursal disponible como sugerencia de último recurso
              const sucursalUltimoRecurso = sucursales[0];
              sugerenciasSucursal.push({
                numeroOrden: numeroOrden,
                direccionPedido: direccionCompletaParaSugerencia,
                numero: numeroBasico,
                localidad: localidad,
                ciudad: ciudad,
                codigoPostal: codigoPostal,
                provincia: provincia,
                sucursalSugerida: sucursalUltimoRecurso,
                razon: `No se encontraron sucursales en ${provincia}. Sucursal genérica sugerida - REVISAR MANUALMENTE`,
                score: 10,
                decision: 'pendiente',
                pedidoData: {
                  peso: baseData['Peso (grs)\nEj: '] ? Number(baseData['Peso (grs)\nEj: ']) : finalConfig.peso,
                  alto: baseData['Alto (cm)\nEj: '] ? Number(baseData['Alto (cm)\nEj: ']) : finalConfig.alto,
                  ancho: baseData['Ancho (cm)\nEj: '] ? Number(baseData['Ancho (cm)\nEj: ']) : finalConfig.ancho,
                  profundidad: baseData['Profundidad (cm)\nEj: '] ? Number(baseData['Profundidad (cm)\nEj: ']) : finalConfig.profundidad,
                  valorDeclarado: baseData['Valor declarado ($ C/IVA) *\nEj: '] ? Number(baseData['Valor declarado ($ C/IVA) *\nEj: ']) : finalConfig.valorDeclarado,
                  nombre: baseData['Nombre *\nEj: '],
                  apellido: baseData['Apellido *\nEj: '],
                  dni: baseData['DNI *\nEj: '],
                  email: baseData['Email *\nEj: '],
                  celularCodigo: baseData['Celular código *\nEj: '],
                  celularNumero: baseData['Celular número *\nEj: ']
                }
              });
              console.log(`\n💡 ==========================================`);
              console.log(`💡 SUGERENCIA ÚLTIMO RECURSO GENERADA PARA PEDIDO #${numeroOrden}`);
              console.log(`💡 ==========================================`);
              console.log(`📦 Número de Orden: ${numeroOrden}`);
              console.log(`📍 Dirección: ${direccionCompletaParaSugerencia}`);
              console.log(`💡 Sucursal sugerida (último recurso): ${sucursalUltimoRecurso.nombre_sucursal}`);
              console.log(`📊 Score: 10/100 (Muy baja confianza - Revisar manualmente)`);
              console.log(`📝 Razón: No se encontraron sucursales en la provincia ${provincia}`);
              console.log(`⚠️ ACCIÓN REQUERIDA: Revisar y decidir si aceptar o rechazar la sugerencia`);
              console.log(`💡 ==========================================\n`);
            } else {
              // Si no hay sucursales disponibles en absoluto, registrar como error
              contadorErroresSucursal++;
              const errorDetalle = {
                numeroOrden: numeroOrden,
                direccion: direccion,
                numero: numeroBasico,
                localidad: localidad,
                ciudad: ciudad,
                codigoPostal: codigoPostal,
                provincia: provincia,
                motivo: `No se encontró sucursal que coincida con la dirección "${direccion} ${numeroBasico}" en ${localidad || ciudad}, ${provincia} (CP: ${codigoPostal}) y no hay sucursales disponibles en el sistema`
              };
              erroresSucursal.push(`Pedido #${numeroOrden} - ${errorDetalle.motivo}`);
              erroresSucursalDetallados.push(errorDetalle);
              console.error(`❌ Pedido #${numeroOrden} NO PROCESADO: no se encontró la sucursal y no hay sucursales disponibles.`);
              console.error(`   📍 Dirección: ${direccion} ${numeroBasico}`);
              console.error(`   📍 Localidad: ${localidad}, Ciudad: ${ciudad}`);
              console.error(`   📍 Provincia: ${provincia}, CP: ${codigoPostal}`);
              console.error(`   ⚠️ Debe cargar este pedido manualmente en el sistema de Andreani.`);
              console.log(`📊 Contador de errores de sucursal actualizado:`, contadorErroresSucursal);
              console.log(`📊 Total errores detallados capturados:`, erroresSucursalDetallados.length);
              console.log(`📊 Último error capturado:`, JSON.stringify(errorDetalle, null, 2));
            }
          }
        }
      } else {
        contadorSucursales++;
        console.log(`[SUCURSAL ${contadorSucursales}] Sucursal encontrada:`, nombreSucursal);
        sucursalesOutput.push({
          ...baseData,
          'Sucursal * \nEj: 9 DE JULIO': nombreSucursal,
        });
        
        // Marcar el pedido como procesado para evitar duplicados
        if (numeroOrden) {
          pedidosProcesados.add(numeroOrden);
        }
      }
    } else {
      // Si no se detectó claramente como domicilio o sucursal, pero tiene indicadores de sucursal,
      // intentar procesarlo como sucursal con sugerencia
      const tieneIndicadoresSucursal = medioEnvioNorm && (
        medioEnvioNorm.includes("retiro") ||
        medioEnvioNorm.includes("sucursal") ||
        medioEnvioNorm.includes("punto")
      );
      
      if (tieneIndicadoresSucursal) {
        console.log(`⚠️ [SUCURSAL AMBIGUA] Pedido ${numeroOrden} tiene indicadores de sucursal pero no se detectó claramente`);
        console.log(`   Medio de envío: "${medioEnvio}"`);
        console.log(`   Procesando como sucursal con sugerencia...`);
        
        // Procesar como sucursal pero forzar generación de sugerencia
        let numeroBasico = numero || '';
        if (numero) {
          const textoAntes = numero.split(/entre|y|local|piso|depto|dto/i)[0].trim();
          if (textoAntes) {
            numeroBasico = textoAntes;
          }
          const soloNumeros = numeroBasico.match(/\d+/);
          if (soloNumeros && soloNumeros[0] && numeroBasico !== soloNumeros[0]) {
            numeroBasico = soloNumeros[0];
          }
        }
        
        const direccionCompletaParaSugerencia = `${direccion} ${numeroBasico}`.trim();
        const sugerencia = generarSugerenciaSucursal(
          direccionCompletaParaSugerencia,
          sucursales,
          codigoPostal,
          provincia,
          ciudad,
          localidad,
          numeroOrden
        );
        
        if (sugerencia && sugerencia.sucursal) {
          sugerenciasSucursal.push({
            numeroOrden: numeroOrden,
            direccionPedido: direccionCompletaParaSugerencia,
            numero: numeroBasico,
            localidad: localidad,
            ciudad: ciudad,
            codigoPostal: codigoPostal,
            provincia: provincia,
            sucursalSugerida: sugerencia.sucursal,
            razon: `Medio de envío ambiguo detectado como sucursal: ${sugerencia.razon}`,
            score: sugerencia.score,
            decision: 'pendiente',
            pedidoData: {
              peso: baseData['Peso (grs)\nEj: '] ? Number(baseData['Peso (grs)\nEj: ']) : finalConfig.peso,
              alto: baseData['Alto (cm)\nEj: '] ? Number(baseData['Alto (cm)\nEj: ']) : finalConfig.alto,
              ancho: baseData['Ancho (cm)\nEj: '] ? Number(baseData['Ancho (cm)\nEj: ']) : finalConfig.ancho,
              profundidad: baseData['Profundidad (cm)\nEj: '] ? Number(baseData['Profundidad (cm)\nEj: ']) : finalConfig.profundidad,
              valorDeclarado: baseData['Valor declarado ($ C/IVA) *\nEj: '] ? Number(baseData['Valor declarado ($ C/IVA) *\nEj: ']) : finalConfig.valorDeclarado,
              nombre: baseData['Nombre *\nEj: '],
              apellido: baseData['Apellido *\nEj: '],
              dni: baseData['DNI *\nEj: '],
              email: baseData['Email *\nEj: '],
              celularCodigo: baseData['Celular código *\nEj: '],
              celularNumero: baseData['Celular número *\nEj: ']
            }
          });
          console.log(`💡 Sugerencia generada para pedido ambiguo #${numeroOrden}`);
        } else {
          // Si no se pudo generar sugerencia, usar fallback
          const normalizarTextoFallback = (texto: string): string => {
            return texto
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/\./g, ' ')
              .replace(/[^\w\s]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
          };
          
          const sucursalesProvincia = sucursales.filter(s => {
            const direccionSucNorm = normalizarTextoFallback(s.direccion);
            const nombreSucNorm = normalizarTextoFallback(s.nombre_sucursal);
            const provinciaNorm = provincia ? normalizarTextoFallback(provincia) : '';
            return provinciaNorm && (direccionSucNorm.includes(provinciaNorm) || nombreSucNorm.includes(provinciaNorm));
          });
          
          if (sucursalesProvincia.length > 0 || sucursales.length > 0) {
            const sucursalFallback = sucursalesProvincia.length > 0 ? sucursalesProvincia[0] : sucursales[0];
            sugerenciasSucursal.push({
              numeroOrden: numeroOrden,
              direccionPedido: direccionCompletaParaSugerencia,
              numero: numeroBasico,
              localidad: localidad,
              ciudad: ciudad,
              codigoPostal: codigoPostal,
              provincia: provincia,
              sucursalSugerida: sucursalFallback,
              razon: `Medio de envío ambiguo - Sucursal sugerida para revisar manualmente`,
              score: 15,
              decision: 'pendiente',
              pedidoData: {
                peso: baseData['Peso (grs)\nEj: '] ? Number(baseData['Peso (grs)\nEj: ']) : finalConfig.peso,
                alto: baseData['Alto (cm)\nEj: '] ? Number(baseData['Alto (cm)\nEj: ']) : finalConfig.alto,
                ancho: baseData['Ancho (cm)\nEj: '] ? Number(baseData['Ancho (cm)\nEj: ']) : finalConfig.ancho,
                profundidad: baseData['Profundidad (cm)\nEj: '] ? Number(baseData['Profundidad (cm)\nEj: ']) : finalConfig.profundidad,
                valorDeclarado: baseData['Valor declarado ($ C/IVA) *\nEj: '] ? Number(baseData['Valor declarado ($ C/IVA) *\nEj: ']) : finalConfig.valorDeclarado,
                nombre: baseData['Nombre *\nEj: '],
                apellido: baseData['Apellido *\nEj: '],
                dni: baseData['DNI *\nEj: '],
                email: baseData['Email *\nEj: '],
                celularCodigo: baseData['Celular código *\nEj: '],
                celularNumero: baseData['Celular número *\nEj: ']
              }
            });
            console.log(`💡 Sugerencia fallback generada para pedido ambiguo #${numeroOrden}`);
          } else {
            contadorNoProcesados++;
            console.error(`❌ [NO PROCESADO ${contadorNoProcesados}] Pedido ${numeroOrden}`);
            console.error(`   Medio de envío original: "${medioEnvio}"`);
            console.error(`   Medio de envío normalizado: "${medioEnvioNorm}"`);
            console.error(`   ⚠️ El medio de envío no coincide con ningún patrón conocido y no hay sucursales disponibles`);
          }
        }
      } else {
        contadorNoProcesados++;
        console.error(`❌ [NO PROCESADO ${contadorNoProcesados}] Pedido ${numeroOrden}`);
        console.error(`   Medio de envío original: "${medioEnvio}"`);
        console.error(`   Medio de envío normalizado: "${medioEnvioNorm}"`);
        console.error(`   ⚠️ El medio de envío no coincide con ningún patrón conocido`);
        console.error(`   ✅ Patrones de DOMICILIO: "domicilio", "a domicilio", "andreani estandar"`);
        console.error(`   ✅ Patrones de SUCURSAL: "punto de retiro", "sucursal", "retiro"`);
      }
    }
  }

  console.log('\n=== RESUMEN DE PROCESAMIENTO (VENTAS) ===');
  console.log(`Total pedidos procesados: ${contadorDomicilios + contadorSucursales + contadorNoProcesados}`);
  console.log(`- Domicilios: ${contadorDomicilios}`);
  console.log(`- Sucursales encontradas y procesadas: ${contadorSucursales}`);
  console.log(`- Sucursales NO encontradas (requieren revisión manual): ${contadorErroresSucursal}`);
  console.log(`- No procesados (medio de envío no reconocido): ${contadorNoProcesados}`);
  console.log('Resultados finales - Domicilios:', domicilios.length, 'Sucursales:', sucursalesOutput.length);
  
  if (contadorErroresSucursal > 0) {
    console.error(`\n⚠️ ATENCIÓN: ${contadorErroresSucursal} pedido(s) a sucursal no pudieron ser procesados automáticamente.`);
    console.error(`   Revisa los logs anteriores para ver los detalles de cada pedido.`);
  }

  // Recopilar logs de procesamiento
  const processingLogs: string[] = [];
  processingLogs.push(`Total pedidos cargados: ${lines.length - 1}`);
  processingLogs.push(`Domicilios procesados: ${contadorDomicilios}`);
  processingLogs.push(`Sucursales procesadas: ${contadorSucursales}`);
  if (contadorErroresSucursal > 0) {
    processingLogs.push(`⚠️ Sucursales NO encontradas (requieren revisión manual): ${contadorErroresSucursal}`);
  }
  processingLogs.push(`No procesados (medio de envío no reconocido): ${contadorNoProcesados}`);
  processingLogs.push(`Total procesados: ${contadorDomicilios + contadorSucursales + contadorNoProcesados}`);
  
  // Calcular total de órdenes reales (sin líneas duplicadas de productos)
  const totalRowsWithData = lines.length - 1; // Todas las líneas del CSV
  const actualSalesProcessed = contadorDomicilios + contadorSucursales; // Pedidos únicos procesados
  const shipmentsToDomicilio = contadorDomicilios;
  const shipmentsToSucursal = contadorSucursales;
  
  // Calcular tasa de efectividad (excluyendo errores de sucursal de no procesados)
  const totalProcesadosExitosamente = actualSalesProcessed;
  const totalIntentos = totalProcesadosExitosamente + contadorErroresSucursal;
  const tasaEfectividad = totalIntentos > 0 ? Math.round((totalProcesadosExitosamente / totalIntentos) * 100) : 100;
  
  // Determinar razón de no procesados
  let noProcessedReason = '';
  if (contadorNoProcesados > 0) {
    noProcessedReason = contadorNoProcesados > 1 
      ? `Se omitieron ${contadorNoProcesados} líneas duplicadas (productos adicionales del mismo pedido)`
      : 'Se omitió 1 línea duplicada (producto adicional del mismo pedido)';
  }

  console.log('📊 RESUMEN FINAL DE PROCESAMIENTO:');
  console.log(`   - Domicilios procesados: ${contadorDomicilios}`);
  console.log(`   - Sucursales procesadas: ${contadorSucursales}`);
  console.log(`   - Líneas duplicadas omitidas: ${contadorNoProcesados}`);
  console.log(`   - Errores de sucursal: ${contadorErroresSucursal}`);
  console.log(`   - Tasa de efectividad: ${tasaEfectividad}%`);
  if (erroresSucursal.length > 0) {
    console.log(`   - Pedidos con errores: ${erroresSucursal.join(', ')}`);
  }
  if (erroresSucursalDetallados.length > 0) {
    console.log(`   - Errores detallados capturados: ${erroresSucursalDetallados.length}`);
    erroresSucursalDetallados.forEach((error, idx) => {
      console.log(`     ${idx + 1}. Pedido #${error.numeroOrden}: ${error.motivo}`);
    });
  }

  const processingInfo: ProcessingInfo = {
    totalOrders: actualSalesProcessed,
    domiciliosProcessed: contadorDomicilios,
    sucursalesProcessed: contadorSucursales,
    noProcessed: contadorNoProcesados,
    processingLogs,
    totalRowsWithData,
    actualSalesProcessed,
    shipmentsToDomicilio,
    shipmentsToSucursal,
    noProcessedReason,
    sugerenciasSucursal: sugerenciasSucursal.length > 0 ? sugerenciasSucursal : undefined,
    erroresSucursal: erroresSucursal.length > 0 ? erroresSucursal : undefined,
    erroresSucursalDetallados: erroresSucursalDetallados.length > 0 ? erroresSucursalDetallados : undefined,
    droppedOrders: droppedOrders.length > 0 ? droppedOrders : undefined,
    tasaEfectividad
  };
  
  console.log('🔍 DEBUG: ProcessingInfo antes de retornar:');
  console.log(`   - erroresSucursal: ${processingInfo.erroresSucursal?.length || 0}`);
  console.log(`   - erroresSucursalDetallados: ${processingInfo.erroresSucursalDetallados?.length || 0}`);
  if (processingInfo.erroresSucursalDetallados && processingInfo.erroresSucursalDetallados.length > 0) {
    console.log(`   - Detalles:`, JSON.stringify(processingInfo.erroresSucursalDetallados, null, 2));
  }

  return {
    domicilioCSV: unparseCSV(domicilios),
    sucursalCSV: unparseCSV(sucursalesOutput),
    processingInfo
  };
};

// Función helper para extraer DNI de campos como Billing Company o Billing Name
const extraerDNI = (campo: string): string | null => {
  if (!campo || !campo.trim()) return null;
  
  // Limpiar el campo de espacios y caracteres especiales
  const campoLimpio = campo.trim().replace(/[^\d]/g, '');
  
  // Si el campo contiene solo números, podría ser un DNI
  if (campoLimpio.length >= 7 && campoLimpio.length <= 11) {
    // Si tiene 11 dígitos, es un CUIT - extraer el DNI (posición 2-9)
    if (campoLimpio.length === 11) {
      const dni = campoLimpio.substring(2, 10);
      console.log(`CUIT detectado en campo (${campoLimpio}) -> DNI extraído: ${dni}`);
      return dni;
    }
    // Si tiene 7-10 dígitos, probablemente es un DNI
    if (campoLimpio.length >= 7 && campoLimpio.length <= 10) {
      console.log(`DNI detectado en campo: ${campoLimpio}`);
      return campoLimpio;
    }
  }
  
  // Si el campo tiene texto mezclado, intentar extraer números que parezcan DNI
  // Buscar patrones como "13.400.498" o "16821485" dentro del texto
  const patronesDNI = [
    /\b(\d{7,8})\b/g,  // 7-8 dígitos (DNI típico)
    /\b(\d{2})\.(\d{3})\.(\d{3})\b/g,  // Formato 13.400.498
    /\b(\d{11})\b/g,  // 11 dígitos (CUIT)
  ];
  
  for (const patron of patronesDNI) {
    const matches = campo.match(patron);
    if (matches && matches.length > 0) {
      const numeroEncontrado = matches[0].replace(/[^\d]/g, '');
      if (numeroEncontrado.length === 11) {
        // Es CUIT
        const dni = numeroEncontrado.substring(2, 10);
        console.log(`CUIT detectado en texto (${numeroEncontrado}) -> DNI extraído: ${dni}`);
        return dni;
      } else if (numeroEncontrado.length >= 7 && numeroEncontrado.length <= 10) {
        // Es DNI
        console.log(`DNI detectado en texto: ${numeroEncontrado}`);
        return numeroEncontrado;
      }
    }
  }
  
  return null;
};

// NOTA: Esta función está duplicada, considerar eliminar la duplicación en el futuro
const processShopifyOrdersDuplicate = async (
  csvText: string,
  config?: { peso: number; alto: number; ancho: number; profundidad: number; valorDeclarado: number }
): Promise<{
  domicilioCSV: string;
  sucursalCSV: string;
  processingInfo: any;
}> => {
  // Valores por defecto
  const defaultConfig = {
    peso: 400,
    alto: 10,
    ancho: 10,
    profundidad: 10,
    valorDeclarado: 6000,
  };
  const finalConfig = config || defaultConfig;
  // Cargar datos auxiliares
  const [codigosPostales] = await Promise.all([
    fetchCodigosPostales(),
  ]);

  // Parsear con coma como delimitador
  const parseWithPapa = (): Promise<any[]> => new Promise((resolve) => {
    Papa.parse(csvText.replace(/^\uFEFF/, ''), {
      header: true,
      skipEmptyLines: true,
      delimiter: ',',
      quoteChar: '"',
      complete: (results: { data: any[] }) => resolve(results.data),
    });
  });

  const rows = await parseWithPapa();
  const domicilios: any[] = [];

  let contadorDomicilios = 0;
  let contadorNoProcesados = 0;
  const droppedOrders: string[] = [];
  const sugerenciasSucursalShopify: SucursalSugerencia[] = [];
  const autofilledEmails: string[] = [];

  // Construir índice PROVINCIA/LOCALIDAD -> formato exacto del catálogo
  const provLocToFormato: Map<string, string> = new Map();
  for (const [, formato] of codigosPostales.entries()) {
    const norm = formato
      .toUpperCase()
      .replace(/[ÁÀÄÂ]/g, 'A')
      .replace(/[ÉÈËÊ]/g, 'E')
      .replace(/[ÍÌÏÎ]/g, 'I')
      .replace(/[ÓÒÖÔ]/g, 'O')
      .replace(/[ÚÙÜÛ]/g, 'U')
      .replace(/[Ñ]/g, 'N')
      .replace(/\./g, ' ')
      .replace(/,/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const partes = norm.split('/').map(p => p.trim());
    if (partes.length >= 2) {
      const key = `${partes[0]} / ${partes[1]}`;
      if (!provLocToFormato.has(key)) provLocToFormato.set(key, formato);
    }
  }

  const getRowField = (row: any, key: string): string => (row?.[key] ?? '').toString().trim();

  // Rastrear pedidos ya procesados para evitar duplicados
  const pedidosProcesados = new Set<string>();

  for (const row of rows) {
    if (!row || Object.keys(row).length === 0) continue;

    const numeroOrden = getRowField(row, 'Name') || getRowField(row, 'Id') || '';
    let email = getRowField(row, 'Email');
    const telefono = getRowField(row, 'Shipping Phone') || getRowField(row, 'Phone');
    const medioEnvio = getRowField(row, 'Shipping Method');

    // Verificar si es una línea de producto adicional (tiene número de orden pero falta información esencial)
    // Las líneas de productos adicionales tienen número de orden pero campos vacíos como email, dirección, etc.
    const shippingAddress1 = getRowField(row, 'Shipping Address1');
    const shippingCity = getRowField(row, 'Shipping City');
    
    // Si ya procesamos este pedido, saltar (es un producto adicional)
    if (numeroOrden && pedidosProcesados.has(numeroOrden)) {
      console.log(`⏭️ Saltando producto adicional del pedido ${numeroOrden} (ya procesado)`);
      continue;
    }
    
    // Si tiene número de orden pero le faltan campos esenciales (email, dirección), es producto adicional
    // Detectar si es línea incompleta: tiene número de orden pero no tiene email O no tiene dirección
    if (numeroOrden && (!email || !shippingAddress1 || !shippingCity)) {
      console.log(`⏭️ Saltando línea incompleta del pedido ${numeroOrden} (email: "${email}", dirección: "${shippingAddress1}")`);
      continue;
    }

    // Nombre y apellido desde dirección de envío (fallback a facturación)
    const shippingName = getRowField(row, 'Shipping Name') || getRowField(row, 'Billing Name');
    const [nombre, ...apParts] = shippingName.split(' ');
    const apellido = apParts.join(' ');

    // Dirección
    const address1 = getRowField(row, 'Shipping Address1');
    const address2 = getRowField(row, 'Shipping Address2');
    const localidad = getRowField(row, 'Shipping City');
    const codigoPostal = getRowField(row, 'Shipping Zip').replace(/[^\d]/g, '');
    const provincia = getRowField(row, 'Shipping Province Name') || getRowField(row, 'Shipping Province');

    // Extraer calle y número desde address1
    const calle = normalizarNombre(address1);
    let numeroCalle = '0';
    const numMatch = address1.match(/\b(\d{1,6})\b/);
    if (numMatch) {
      numeroCalle = numMatch[1];
    }

    const pisoDepto = normalizarNombre(address2);

    // Teléfono: limpiar prefijos +54 y el 9
    let tel = telefono.replace(/[^\d]/g, '');
    if (tel.startsWith('54')) tel = tel.substring(2);
    if (tel.startsWith('9')) tel = tel.substring(1);

    // Código de área básico: intentar detectar 2/3/4 dígitos comunes
    let celularCodigo = '11';
    let celularNumero = tel;
    const posibles4 = ['2652','2901','2920','2944','2954','2965','2966','3541'];
    const posibles3 = ['221','223','291','341','342','343','351','358','261','381','376','362','379','370','387','388','380','383','385','264','297','299'];
    if (tel.length >= 10 && posibles4.some(p => tel.startsWith(p))) {
      celularCodigo = posibles4.find(p => tel.startsWith(p))!;
      celularNumero = tel.substring(4);
    } else if (tel.length >= 10 && posibles3.some(p => tel.startsWith(p))) {
      celularCodigo = posibles3.find(p => tel.startsWith(p))!;
      celularNumero = tel.substring(3);
    } else if (tel.length >= 8) {
      celularCodigo = tel.substring(0, 2);
      celularNumero = tel.substring(2);
    }

    // DNI: Intentar extraer de Billing Company o Billing Name
    let dniProcesado = '00000000';
    const billingCompany = getRowField(row, 'Billing Company');
    const billingName = getRowField(row, 'Billing Name');
    
    // Intentar extraer DNI de Billing Company primero
    const dniDesdeCompany = extraerDNI(billingCompany);
    if (dniDesdeCompany) {
      dniProcesado = dniDesdeCompany;
      console.log(`DNI extraído de Billing Company para pedido ${numeroOrden}: ${dniProcesado}`);
    } else {
      // Si no se encontró en Billing Company, intentar en Billing Name
      const dniDesdeName = extraerDNI(billingName);
      if (dniDesdeName) {
        dniProcesado = dniDesdeName;
        console.log(`DNI extraído de Billing Name para pedido ${numeroOrden}: ${dniProcesado}`);
      } else {
        console.warn(`No se pudo extraer DNI para pedido ${numeroOrden} (Billing Company: "${billingCompany}", Billing Name: "${billingName}")`);
      }
    }

    // Armar formato Provincia / Localidad / CP
    let formatoProvinciaLocalidadCP = '';
    if (codigoPostal && codigosPostales.has(codigoPostal)) {
      formatoProvinciaLocalidadCP = codigosPostales.get(codigoPostal)!;
    } else {
      // Fallback: buscar por PROVINCIA + LOCALIDAD en el catálogo, ignorando CP provisto
      const provinciaPedido = (provincia || '').toUpperCase().replace(/\s*\(.*?\)\s*/g, '').trim();
      const localidadPedido = (localidad || '').toUpperCase().trim();

      const provinciaNormalizada = provinciaPedido
        .replace(/[áàäâ]/g, 'A')
        .replace(/[éèëê]/g, 'E')
        .replace(/[íìïî]/g, 'I')
        .replace(/[óòöô]/g, 'O')
        .replace(/[úùüû]/g, 'U')
        .replace(/[ñ]/g, 'N')
        .replace(/\./g, ' ')
        .replace(/,/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const localidadNormalizada = localidadPedido
        .replace(/[áàäâ]/g, 'A')
        .replace(/[éèëê]/g, 'E')
        .replace(/[íìïî]/g, 'I')
        .replace(/[óòöô]/g, 'O')
        .replace(/[úùüû]/g, 'U')
        .replace(/[ñ]/g, 'N')
        .replace(/\./g, ' ')
        .replace(/,/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      let encontradoPorProvinciaLocalidad = false;

      // Regla directa: VILLA GESELL -> BUENOS AIRES / VILLA GESELL / 7165
      if (localidadNormalizada === 'VILLA GESELL' || localidadNormalizada.includes('VILLA GESELL')) {
        formatoProvinciaLocalidadCP = 'BUENOS AIRES / VILLA GESELL / 7165';
        encontradoPorProvinciaLocalidad = true;
      }

      // Intento directo por índice exacto
      const keyDirecta = `${provinciaNormalizada} / ${localidadNormalizada}`;
      if (provLocToFormato.has(keyDirecta)) {
        formatoProvinciaLocalidadCP = provLocToFormato.get(keyDirecta)!;
        encontradoPorProvinciaLocalidad = true;
      }
      for (const [, formato] of codigosPostales.entries()) {
        const formatoNormalizado = formato
          .replace(/[áàäâ]/g, 'A')
          .replace(/[éèëê]/g, 'E')
          .replace(/[íìïî]/g, 'I')
          .replace(/[óòöô]/g, 'O')
          .replace(/[úùüû]/g, 'U')
          .replace(/[ñ]/g, 'N')
          .toUpperCase()
          .replace(/\./g, ' ')
          .replace(/,/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // provinciaNormalizada y localidadNormalizada ya calculadas fuera del bucle

        const patronBusqueda = `${provinciaNormalizada} / ${localidadNormalizada}`;
        if (!encontradoPorProvinciaLocalidad && formatoNormalizado.includes(patronBusqueda)) {
          formatoProvinciaLocalidadCP = formato;
          encontradoPorProvinciaLocalidad = true;
          break;
        }
      }

      // Si no se encontró por provincia+localidad, NO escribir una opción inválida; dejar vacío para corrección manual
      if (!encontradoPorProvinciaLocalidad) {
        // Fallback adicional: buscar por localidad exacta (ignorando provincia), tomar primera coincidencia
        for (const [, formato] of codigosPostales.entries()) {
          const formatoNormalizado = formato
            .replace(/[áàäâ]/g, 'A')
            .replace(/[éèëê]/g, 'E')
            .replace(/[íìïî]/g, 'I')
            .replace(/[óòöô]/g, 'O')
            .replace(/[úùüû]/g, 'U')
            .replace(/[ñ]/g, 'N')
            .toUpperCase()
            .replace(/\./g, ' ')
            .replace(/,/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          const partes = formatoNormalizado.split('/').map(p => p.trim());
          if (partes.length >= 2) {
            const localidadCatalogo = partes[1];
            if (localidadCatalogo === localidadNormalizada) {
              formatoProvinciaLocalidadCP = formato;
              encontradoPorProvinciaLocalidad = true;
              break;
            }
          }
        }
        // Fallback por inclusión de localidad (maneja pequeñas diferencias)
        if (!encontradoPorProvinciaLocalidad && localidadNormalizada) {
          for (const [, formato] of codigosPostales.entries()) {
            const formatoNormalizado = formato
              .replace(/[áàäâ]/g, 'A')
              .replace(/[éèëê]/g, 'E')
              .replace(/[íìïî]/g, 'I')
              .replace(/[óòöô]/g, 'O')
              .replace(/[úùüû]/g, 'U')
              .replace(/[ñ]/g, 'N')
              .toUpperCase()
              .replace(/\./g, ' ')
              .replace(/,/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            const partes = formatoNormalizado.split('/').map(p => p.trim());
            if (partes.length >= 2) {
              const localidadCatalogo = partes[1];
              if (localidadCatalogo.includes(localidadNormalizada) || localidadNormalizada.includes(localidadCatalogo)) {
                formatoProvinciaLocalidadCP = formato;
                encontradoPorProvinciaLocalidad = true;
                break;
              }
            }
          }
        }
        // Fallback dirigido: forzar match por clave conocida de catálogo (sin depender de provincia)
        if (!encontradoPorProvinciaLocalidad) {
          if (localidadNormalizada === 'VILLA GESELL' || localidadNormalizada.includes('VILLA GESELL')) {
            const clave = 'BUENOS AIRES / VILLA GESELL';
            if (provLocToFormato.has(clave)) {
              formatoProvinciaLocalidadCP = provLocToFormato.get(clave)!;
              encontradoPorProvinciaLocalidad = true;
            }
          }
        }
        // Fallback temporal: si el pedido es #1029, forzar VILLA GESELL para desbloquear
        if (!encontradoPorProvinciaLocalidad && (numeroOrden === '#1029' || numeroOrden.includes('1029'))) {
          const clave = 'BUENOS AIRES / VILLA GESELL';
          if (provLocToFormato.has(clave)) {
            console.warn('[Shopify][Hotfix] Forzando formato para pedido #1029 -> BUENOS AIRES / VILLA GESELL / 7165');
            formatoProvinciaLocalidadCP = provLocToFormato.get(clave)!;
            encontradoPorProvinciaLocalidad = true;
          }
        }
        if (!encontradoPorProvinciaLocalidad) {
          formatoProvinciaLocalidadCP = '';
        }
      }
    }

    // Si falta email, autocompletar con un placeholder y registrar
    if (!email) {
      email = 'ejemplo@gmail.com';
      if (numeroOrden) {
        autofilledEmails.push(numeroOrden);
      }
    }

    // Todos los envíos se consideran a domicilio según requerimiento
    if (numeroOrden && email) {
      // Si no hay formato válido de Provincia/Localidad/CP, descartar pedido y notificar
      if (!formatoProvinciaLocalidadCP) {
        contadorNoProcesados++;
        droppedOrders.push(`${numeroOrden} - sin match Provincia/Localidad/CP`);
        continue;
      }
      contadorDomicilios++;
      domicilios.push({
        'Paquete Guardado Ej:': '',
        'Peso (grs)': finalConfig.peso,
        'Alto (cm)': finalConfig.alto,
        'Ancho (cm)': finalConfig.ancho,
        'Profundidad (cm)': finalConfig.profundidad,
        'Valor declarado ($ C/IVA) *': finalConfig.valorDeclarado,
        'Numero Interno': numeroOrden,
        'Nombre *': nombre ? normalizarNombre(nombre) : '',
        'Apellido *': apellido ? normalizarNombre(apellido) : '',
        'DNI *': dniProcesado,
        'Email *': email,
        'Celular código *': celularCodigo,
        'Celular número *': celularNumero,
        'Calle *': calle,
        'Número *': numeroCalle,
        'Piso': pisoDepto,
        'Departamento': pisoDepto,
        'Provincia / Localidad / CP *': formatoProvinciaLocalidadCP,
      });
    } else {
      contadorNoProcesados++;
      console.warn(`Pedido Shopify omitido: Name="${numeroOrden}", Email="${email}"`);
    }
  }

  const processingInfo: ProcessingInfo = {
    totalOrders: rows.length,
    domiciliosProcessed: contadorDomicilios,
    sucursalesProcessed: 0,
    noProcessed: contadorNoProcesados,
    processingLogs: [
      `Total pedidos cargados: ${rows.length}`,
      `Domicilios procesados: ${contadorDomicilios}`,
      `Sucursales procesadas: 0`,
      `No procesados: ${contadorNoProcesados}`,
    ],
    noProcessedReason: contadorNoProcesados > 0 ? 'Pedidos descartados por Provincia/Localidad/CP no encontrados' : '',
    sugerenciasSucursal: sugerenciasSucursalShopify.length > 0 ? sugerenciasSucursalShopify : undefined,
  };

  return {
    domicilioCSV: unparseCSV(domicilios),
    sucursalCSV: '',
    processingInfo,
  };
};
