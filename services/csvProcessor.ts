
import { 
  TiendanubeOrder, 
  ShopifyOrder,
  AndreaniSucursalInfo,
  AndreaniDomicilioOutput,
  AndreaniSucursalOutput
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

// Función específica para parsear CSV de Shopify (usa comas como separador)
const parseShopifyCSV = <T,>(csvText: string): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    console.log('Parseando CSV de Shopify con comas como separador...');
    
    // Remover BOM si existe y corregir codificación
    let cleanText = csvText.replace(/^\uFEFF/, '');
    cleanText = fixEncoding(cleanText);
    
    Papa.parse(cleanText, {
      header: true,
      skipEmptyLines: true,
      delimiter: ',', // Usar comas como separador para Shopify
      quoteChar: '"',
      escapeChar: '"',
      complete: (results: { data: T[]; errors: any[] }) => {
        if (results.errors.length > 0) {
          console.error("Shopify CSV Parsing Errors:", results.errors);
        }
        console.log('Total de filas de Shopify parseadas:', results.data.length);
        console.log('Primera fila de Shopify:', results.data[0]);
        resolve(results.data);
      },
      error: (error: Error) => {
        console.error('Error parsing Shopify CSV:', error);
        reject(error);
      },
    });
  });
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
  
  // Crear el CSV manualmente para tener control total
  const csvLines = [headers.join(';')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      // Encontrar el valor correspondiente en el objeto original
      const originalKey = Object.keys(row).find(key => 
        key.replace(/ Ej:.*$/, '').replace(/\n.*$/, '').trim() === header
      );
      return row[originalKey as keyof typeof row] || '';
    });
    csvLines.push(values.join(';'));
  });
  
  return csvLines.join('\n');
};

// Función específica para generar CSV de Shopify con encabezados correctos
const unparseShopifyCSV = (data: (AndreaniDomicilioOutput | AndreaniSucursalOutput)[]): string => {
  if (data.length === 0) return "";
  
  // Usar los encabezados originales con formato "Ej:" y saltos de línea
  const headers = [
    'Paquete Guardado \nEj: 1',
    'Peso (grs)\nEj: ',
    'Alto (cm)\nEj: ', 
    'Ancho (cm)\nEj: ',
    'Profundidad (cm)\nEj: ',
    'Valor declarado ($ C/IVA) *\nEj: ',
    'Numero Interno\nEj: ',
    'Nombre *\nEj: ',
    'Apellido *\nEj: ',
    'DNI *\nEj: ',
    'Email *\nEj: ',
    'Celular código *\nEj: ',
    'Celular número *\nEj: '
  ];
  
  // Agregar columnas específicas según el tipo de datos
  if (data.length > 0 && 'Calle *' in data[0]) {
    // Es un domicilio
    headers.push('Calle *\nEj: ', 'Número *\nEj: ', 'Piso\nEj: ', 'Departamento\nEj: ', 'Provincia / Localidad / CP * \nEj: BUENOS AIRES / 11 DE SEPTIEMBRE / 1657', 'Observaciones\nEj: ');
  } else if (data.length > 0 && 'Sucursal *' in data[0]) {
    // Es una sucursal
    headers.push('Sucursal * \nEj: 9 DE JULIO');
  }
  
  // Crear el CSV manualmente
  const csvLines = [headers.join(';')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      // Mapear encabezados a las claves del objeto
      let value = '';
      switch (header) {
        case 'Paquete Guardado \nEj: 1':
          value = row['Paquete Guardado Ej:'] || '';
          break;
        case 'Peso (grs)\nEj: ':
          value = row['Peso (grs)'] || '';
          break;
        case 'Alto (cm)\nEj: ':
          value = row['Alto (cm)'] || '';
          break;
        case 'Ancho (cm)\nEj: ':
          value = row['Ancho (cm)'] || '';
          break;
        case 'Profundidad (cm)\nEj: ':
          value = row['Profundidad (cm)'] || '';
          break;
        case 'Valor declarado ($ C/IVA) *\nEj: ':
          value = row['Valor declarado ($ C/IVA) *'] || '';
          break;
        case 'Numero Interno\nEj: ':
          value = row['Numero Interno'] || '';
          break;
        case 'Nombre *\nEj: ':
          value = row['Nombre *'] || '';
          break;
        case 'Apellido *\nEj: ':
          value = row['Apellido *'] || '';
          break;
        case 'DNI *\nEj: ':
          value = row['DNI *'] || '';
          break;
        case 'Email *\nEj: ':
          value = row['Email *'] || '';
          break;
        case 'Celular código *\nEj: ':
          value = row['Celular código *'] || '';
          break;
        case 'Celular número *\nEj: ':
          value = row['Celular número *'] || '';
          break;
        case 'Calle *\nEj: ':
          value = row['Calle *'] || '';
          break;
        case 'Número *\nEj: ':
          value = row['Número *'] || '';
          break;
        case 'Piso\nEj: ':
          value = row['Piso'] || '';
          break;
        case 'Departamento\nEj: ':
          value = row['Departamento'] || '';
          break;
        case 'Provincia / Localidad / CP * \nEj: BUENOS AIRES / 11 DE SEPTIEMBRE / 1657':
          value = row['Provincia / Localidad / CP *'] || '';
          break;
        case 'Observaciones\nEj: ':
          value = ''; // Campo observaciones siempre vacío
          break;
        case 'Sucursal * \nEj: 9 DE JULIO':
          value = row['Sucursal *'] || '';
          break;
        default:
          value = '';
      }
      return value;
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
  
  return combinedContent.trim();
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
const findSucursalByAddress = (direccionPedido: string, sucursales: AndreaniSucursalInfo[]): string => {
  const direccionNormalizada = direccionPedido.toLowerCase().trim();
  console.log('=== DEBUG SUCURSAL ===');
  console.log('Buscando sucursal para dirección:', direccionNormalizada);
  console.log('Total sucursales disponibles:', sucursales.length);
  console.log('Primeras 3 sucursales:', sucursales.slice(0, 3));
  
  // Extraer componentes específicos de la dirección del pedido
  const componentes = direccionPedido.split(',').map(c => c.trim());
  const calleNumero = componentes[0] || '';
  
  // Buscar localidad, ciudad, código postal y provincia en los componentes restantes
  let localidad = '';
  let ciudad = '';
  let codigoPostal = '';
  let provincia = '';
  
  // Los componentes pueden estar en cualquier orden, así que los identificamos por contenido
  for (let i = 1; i < componentes.length; i++) {
    const componente = componentes[i].toLowerCase();
    
    // Identificar código postal (solo números)
    if (/^\d{4,5}$/.test(componente)) {
      codigoPostal = componente;
    }
    // Identificar provincia (palabras conocidas)
    else if (componente.includes('buenos aires') || componente.includes('capital federal') || 
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
             componente.includes('santa cruz') || componente.includes('tierra del fuego')) {
      provincia = componente;
    }
    // Si no es código postal ni provincia, es localidad o ciudad
    else if (!localidad) {
      localidad = componente;
    } else if (!ciudad) {
      ciudad = componente;
    }
  }
  
  console.log('Componentes extraídos:', { calleNumero, localidad, ciudad, codigoPostal, provincia });
  
  // Normalizar la calle y número del pedido
  const calleNumeroNormalizada = normalizarDireccion(calleNumero);
  const calleNumeroFlexible = normalizarNumeroCalle(calleNumero);
  
  console.log('Calle original:', calleNumero);
  console.log('Calle normalizada:', calleNumeroNormalizada);
  console.log('Calle flexible:', calleNumeroFlexible);
  console.log('Buscando también con prefijo:', `PUNTO ANDREANI HOP ${calleNumero}`);
  
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

  // Buscar coincidencias con múltiples estrategias
  const coincidenciasExactas = sucursales.filter(sucursal => {
    const direccionReal = extraerDireccionReal(sucursal);
    const direccionRealNormalizada = normalizarDireccion(direccionReal);
    const direccionSucursal = sucursal.direccion.toLowerCase().trim();
    const direccionSucursalNormalizada = normalizarDireccion(sucursal.direccion);
    const nombreSucursal = sucursal.nombre_sucursal.toLowerCase().trim();
    const nombreSucursalNormalizado = normalizarDireccion(sucursal.nombre_sucursal);
    
    // 1. Coincidencia exacta normalizada en dirección real
    const tieneCoincidenciaExacta = calleNumeroNormalizada && direccionRealNormalizada.includes(calleNumeroNormalizada);
    
    // 2. Coincidencia directa (sin normalizar) en dirección real
    const tieneCoincidenciaDirecta = calleNumero && direccionReal.toLowerCase().includes(calleNumero.toLowerCase());
    
    // 3. Coincidencia flexible (maneja variaciones como RN40 vs Ruta 40) en dirección real
    const tieneCoincidenciaFlexible = calleNumeroFlexible && direccionRealNormalizada.includes(calleNumeroFlexible);
    
    // 4. Coincidencia exacta normalizada en dirección original (fallback)
    const tieneCoincidenciaExactaOriginal = calleNumeroNormalizada && direccionSucursalNormalizada.includes(calleNumeroNormalizada);
    
    // 5. Coincidencia directa en dirección original (fallback)
    const tieneCoincidenciaDirectaOriginal = calleNumero && direccionSucursal.includes(calleNumero);
    
    // 6. NUEVA ESTRATEGIA: Buscar "PUNTO ANDREANI HOP" + dirección del pedido en nombre de sucursal
    const direccionConPrefijo = `PUNTO ANDREANI HOP ${calleNumero}`.toLowerCase();
    const direccionConPrefijoNormalizada = normalizarDireccion(direccionConPrefijo);
    const tieneCoincidenciaConPrefijo = nombreSucursal.includes(direccionConPrefijo) || 
                                       nombreSucursalNormalizado.includes(direccionConPrefijoNormalizada);
    
    // 7. Coincidencia por partes (busca cada palabra por separado) en dirección real
    const partesCalle = calleNumeroNormalizada.split(/\s+/).filter(p => p.length > 1);
    const tieneCoincidenciaPorPartes = partesCalle.length > 0 && 
      partesCalle.every(parte => direccionRealNormalizada.includes(parte));
    
    // 8. Coincidencia por partes en nombre con prefijo
    const tieneCoincidenciaPorPartesConPrefijo = partesCalle.length > 0 && 
      partesCalle.every(parte => nombreSucursalNormalizado.includes(parte));
    
    // 9. Coincidencia con tolerancia a errores de tipeo (70% de palabras coinciden) en dirección real
    const palabrasImportantes = partesCalle.filter(p => p.length > 2);
    const coincidenciasPalabras = palabrasImportantes.filter(palabra => 
      direccionRealNormalizada.includes(palabra)
    );
    const tieneCoincidenciaTolerante = palabrasImportantes.length > 0 && 
      coincidenciasPalabras.length >= Math.ceil(palabrasImportantes.length * 0.7);
    
    // 10. Coincidencia con tolerancia a errores de tipeo en nombre con prefijo
    const coincidenciasPalabrasConPrefijo = palabrasImportantes.filter(palabra => 
      nombreSucursalNormalizado.includes(palabra)
    );
    const tieneCoincidenciaToleranteConPrefijo = palabrasImportantes.length > 0 && 
      coincidenciasPalabrasConPrefijo.length >= Math.ceil(palabrasImportantes.length * 0.7);
    
    return tieneCoincidenciaExacta || tieneCoincidenciaDirecta || tieneCoincidenciaFlexible || 
           tieneCoincidenciaExactaOriginal || tieneCoincidenciaDirectaOriginal ||
           tieneCoincidenciaConPrefijo || tieneCoincidenciaPorPartes || tieneCoincidenciaPorPartesConPrefijo ||
           tieneCoincidenciaTolerante || tieneCoincidenciaToleranteConPrefijo;
  });
  
  // Si no hay coincidencias exactas, intentar búsqueda difusa
  let coincidenciasDifusas: { sucursal: AndreaniSucursalInfo; similitud: number }[] = [];
  if (coincidenciasExactas.length === 0) {
    console.log('No hay coincidencias exactas, intentando búsqueda difusa...');
    
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
  
  // Si no hay coincidencias exactas, usar búsqueda difusa
  if (coincidenciasExactas.length === 0) {
    if (coincidenciasDifusas.length > 0) {
      console.log('Usando mejor coincidencia difusa:', coincidenciasDifusas[0].sucursal.nombre_sucursal, 
                  'con similitud:', coincidenciasDifusas[0].similitud.toFixed(2));
      return coincidenciasDifusas[0].sucursal.nombre_sucursal;
    } else {
      console.log('❌ No se encontraron coincidencias');
      console.log('Dirección buscada:', direccionNormalizada);
      console.log('Total sucursales revisadas:', sucursales.length);
      console.log('=== FIN DEBUG SUCURSAL ===');
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
    if (codigoPostal && direccionSucursal.includes(codigoPostal)) {
      puntuacion += 10;
      console.log(`Desempate por código postal ${codigoPostal} en: ${sucursal.nombre_sucursal}`);
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
    if (provincia && direccionSucursal.includes(provincia)) {
      puntuacion += 4;
      console.log(`Desempate por provincia ${provincia} en: ${sucursal.nombre_sucursal}`);
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

export const processOrders = async (tiendanubeCsvText: string): Promise<{ domicilioCSV: string; sucursalCSV: string; }> => {
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

  for (const order of tiendanubeOrders) {
    // Helper function to split name and surname
    const nombreCompleto = getColumnValue(order, 11); // Nombre del comprador
    const [nombre, ...apellidoParts] = nombreCompleto.split(' ');
    const apellido = apellidoParts.join(' ');
    
    // Normalizar nombres y apellidos para evitar caracteres inválidos
    const nombreNormalizado = normalizarNombre(nombre);
    const apellidoNormalizado = normalizarNombre(apellido);

    // Helper function to split phone number based on province and phone number
    const telefono = getColumnValue(order, 13); // Teléfono
    const provincia = getColumnValue(order, 22); // Provincia o estado
    let cleanPhone = telefono.replace(/\D/g, '');
    
    // Remover el prefijo internacional +54 si existe
    if (cleanPhone.startsWith('54')) {
      cleanPhone = cleanPhone.substring(2);
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
    
    const baseData = {
      'Paquete Guardado Ej:': '', // Siempre vacío
      'Peso (grs)': 1,
      'Alto (cm)': 1,
      'Ancho (cm)': 1,
      'Profundidad (cm)': 1,
      'Valor declarado ($ C/IVA) *': 4500,
      'Numero Interno': getColumnValue(order, 0), // Número de orden
      'Nombre *': nombreNormalizado || '',
      'Apellido *': apellidoNormalizado || '',
      'DNI *': getColumnValue(order, 12), // DNI / CUIT
      'Email *': getColumnValue(order, 1), // Email
      'Celular código *': celularCodigo,
      'Celular número *': celularNumero,
    };
    
    const medioEnvio = getColumnValue(order, 24); // Medio de envío
    console.log('Processing order:', baseData['Numero Interno'], 'Medio de envío:', medioEnvio);
    
    if (medioEnvio && medioEnvio.includes("Andreani Estandar") && medioEnvio.includes("domicilio")) {
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
      
      domicilios.push({
        ...baseData,
        'Calle *': calleNormalizada, // Dirección normalizada
        'Número *': getColumnValue(order, 17).replace(/^SN$/i, '0'), // Número (reemplazar SN con 0)
        'Piso': pisoNormalizado, // Piso normalizado
        'Departamento': pisoNormalizado, // As per spec, use 'Piso' for both
        'Provincia / Localidad / CP *': formatoProvinciaLocalidadCP,
      });
    } else if (medioEnvio && medioEnvio.includes('Punto de retiro')) {
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
      
      // Construir dirección completa con toda la información disponible
      let direccionCompleta = `${calle} ${numero}`.trim();
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
      console.log('Piso extraído:', piso);
      console.log('Localidad extraída:', localidad);
      console.log('Ciudad extraída:', ciudad);
      console.log('Código postal extraído:', codigoPostal);
      console.log('Provincia extraída:', provincia);
      console.log('Calle y número combinados:', `${calle} ${numero}`);
      console.log('Dirección completa del pedido:', direccionCompleta);
      
      const nombreSucursal = findSucursalByAddress(direccionCompleta, sucursales);
      console.log('Sucursal encontrada:', nombreSucursal);
      console.log('=== FIN DEBUGGING ===');

      sucursalesOutput.push({
        ...baseData,
        'Sucursal *': nombreSucursal,
      });
    } else {
      contadorNoProcesados++;
      console.log(`[NO PROCESADO ${contadorNoProcesados}] Pedido ${baseData['Numero Interno']} - Medio de envío desconocido:`, medioEnvio);
    }
  }

  console.log('=== RESUMEN DE PROCESAMIENTO ===');
  console.log(`Total pedidos procesados: ${contadorDomicilios + contadorSucursales + contadorNoProcesados}`);
  console.log(`- Domicilios: ${contadorDomicilios}`);
  console.log(`- Sucursales: ${contadorSucursales}`);
  console.log(`- No procesados: ${contadorNoProcesados}`);
  console.log('Final results - Domicilios:', domicilios.length, 'Sucursales:', sucursalesOutput.length);

  // Recopilar logs de procesamiento
  const processingLogs: string[] = [];
  processingLogs.push(`Total pedidos cargados: ${tiendanubeOrders.length}`);
  processingLogs.push(`Domicilios procesados: ${contadorDomicilios}`);
  processingLogs.push(`Sucursales procesadas: ${contadorSucursales}`);
  processingLogs.push(`No procesados: ${contadorNoProcesados}`);
  processingLogs.push(`Total procesados: ${contadorDomicilios + contadorSucursales + contadorNoProcesados}`);

  return {
    domicilioCSV: unparseCSV(domicilios),
    sucursalCSV: unparseCSV(sucursalesOutput),
    processingInfo: {
      totalOrders: tiendanubeOrders.length,
      domiciliosProcessed: contadorDomicilios,
      sucursalesProcessed: contadorSucursales,
      noProcessed: contadorNoProcesados,
      processingLogs: processingLogs
    }
  };
};

// Nueva función para procesar el formato de ventas específico
export const processVentasOrders = async (csvContent: string): Promise<{
  domicilioCSV: string;
  sucursalCSV: string;
}> => {
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

  const headers = lines[0].split(';');
  console.log('Headers del archivo de ventas:', headers);

  const domicilios: any[] = [];
  const sucursalesOutput: any[] = [];
  
  let contadorDomicilios = 0;
  let contadorSucursales = 0;
  let contadorNoProcesados = 0;

  console.log('=== PROCESANDO ARCHIVO DE VENTAS ===');
  console.log('Total líneas de datos:', lines.length - 1);

  // Procesar cada línea de datos
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(';');
    if (values.length < headers.length) continue;

    // Extraer datos del pedido
    const numeroOrden = values[0]?.replace(/"/g, '') || '';
    const nombreComprador = values[11]?.replace(/"/g, '') || '';
    const apellidoComprador = nombreComprador.split(' ')[0] || '';
    const nombreCompleto = nombreComprador.split(' ').slice(1).join(' ') || '';
    const dni = values[12]?.replace(/"/g, '') || '';
    const email = values[1]?.replace(/"/g, '') || '';
    const telefono = values[13]?.replace(/"/g, '') || '';
    const direccion = values[16]?.replace(/"/g, '') || '';
    const numero = values[17]?.replace(/"/g, '') || '';
    const piso = values[18]?.replace(/"/g, '') || '';
    const localidad = values[19]?.replace(/"/g, '') || '';
    const ciudad = values[20]?.replace(/"/g, '') || '';
    const codigoPostal = values[21]?.replace(/"/g, '') || '';
    const provincia = values[22]?.replace(/"/g, '') || '';
    const medioEnvio = values[24]?.replace(/"/g, '') || '';
    const valorDeclarado = values[9]?.replace(/"/g, '') || '4500';

    // Separar código de área y número de teléfono
    const telefonoLimpio = telefono.replace(/[^\d]/g, '');
    const codigoArea = telefonoLimpio.substring(0, telefonoLimpio.length - 8) || '11';
    const numeroTelefono = telefonoLimpio.substring(telefonoLimpio.length - 8) || '00000000';

    // Datos base para ambos tipos
    const baseData = {
      'Paquete Guardado \nEj: 1': '',
      'Peso (grs)\nEj: ': '1',
      'Alto (cm)\nEj: ': '1',
      'Ancho (cm)\nEj: ': '1',
      'Profundidad (cm)\nEj: ': '1',
      'Valor declarado ($ C/IVA) *\nEj: ': valorDeclarado,
      'Numero Interno\nEj: ': numeroOrden,
      'Nombre *\nEj: ': nombreCompleto,
      'Apellido *\nEj: ': apellidoComprador,
      'DNI *\nEj: ': dni,
      'Email *\nEj: ': email,
      'Celular código *\nEj: ': codigoArea,
      'Celular número *\nEj: ': numeroTelefono,
    };

    // Determinar si es envío a domicilio o sucursal
    if (medioEnvio.includes('domicilio')) {
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

      const pisoNormalizado = piso.replace(/[áàäâ]/g, 'a')
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

      domicilios.push({
        ...baseData,
        'Calle *\nEj: ': calleNormalizada,
        'Número *\nEj: ': numero,
        'Piso\nEj: ': pisoNormalizado,
        'Departamento\nEj: ': pisoNormalizado,
        'Provincia / Localidad / CP * \nEj: BUENOS AIRES / 11 DE SEPTIEMBRE / 1657': formatoProvinciaLocalidadCP,
        'Observaciones\nEj: ': '',
      });

    } else if (medioEnvio.includes('Punto de retiro') || medioEnvio.includes('sucursal')) {
      contadorSucursales++;
      console.log(`[SUCURSAL ${contadorSucursales}] Procesando pedido:`, numeroOrden);
      // Procesar envío a sucursal
      const direccionCompleta = `${direccion} ${numero} ${piso} ${localidad} ${ciudad}`.trim();
      const nombreSucursal = findSucursalByAddress(direccionCompleta, sucursales);

      sucursalesOutput.push({
        ...baseData,
        'Sucursal * \nEj: 9 DE JULIO': nombreSucursal,
      });
    } else {
      contadorNoProcesados++;
      console.log(`[NO PROCESADO ${contadorNoProcesados}] Pedido ${numeroOrden} - Medio de envío desconocido:`, medioEnvio);
    }
  }

  console.log('=== RESUMEN DE PROCESAMIENTO (VENTAS) ===');
  console.log(`Total pedidos procesados: ${contadorDomicilios + contadorSucursales + contadorNoProcesados}`);
  console.log(`- Domicilios: ${contadorDomicilios}`);
  console.log(`- Sucursales: ${contadorSucursales}`);
  console.log(`- No procesados: ${contadorNoProcesados}`);
  console.log('Resultados finales - Domicilios:', domicilios.length, 'Sucursales:', sucursalesOutput.length);

  // Recopilar logs de procesamiento
  const processingLogs: string[] = [];
  processingLogs.push(`Total pedidos cargados: ${lines.length - 1}`);
  processingLogs.push(`Domicilios procesados: ${contadorDomicilios}`);
  processingLogs.push(`Sucursales procesadas: ${contadorSucursales}`);
  processingLogs.push(`No procesados: ${contadorNoProcesados}`);
  processingLogs.push(`Total procesados: ${contadorDomicilios + contadorSucursales + contadorNoProcesados}`);

  return {
    domicilioCSV: unparseCSV(domicilios),
    sucursalCSV: unparseCSV(sucursalesOutput),
    processingInfo: {
      totalOrders: lines.length - 1,
      domiciliosProcessed: contadorDomicilios,
      sucursalesProcessed: contadorSucursales,
      noProcessed: contadorNoProcesados,
      processingLogs: processingLogs
    }
  };
};

// Nueva función para procesar archivos CSV de Shopify
export const processShopifyOrders = async (shopifyCsvText: string): Promise<{
  domicilioCSV: string;
  sucursalCSV: string;
  processingInfo?: {
    totalOrders: number;
    domiciliosProcessed: number;
    sucursalesProcessed: number;
    noProcessed: number;
    processingLogs: string[];
  };
}> => {
  console.log('=== PROCESANDO ARCHIVO SHOPIFY ===');
  
  // Cargar datos necesarios
  const [codigosPostales, sucursales] = await Promise.all([
    fetchCodigosPostales(),
    fetchSucursales()
  ]);

  // Parsear el CSV de Shopify (usar comas como separador)
  const shopifyOrders = await parseShopifyCSV(shopifyCsvText);
  
  console.log('Total órdenes de Shopify cargadas:', shopifyOrders.length);
  console.log('Primera orden de ejemplo:', shopifyOrders[0]);

  const domicilios: AndreaniDomicilioOutput[] = [];
  const sucursalesOutput: AndreaniSucursalOutput[] = [];
  
  let contadorDomicilios = 0;
  let contadorSucursales = 0;
  let contadorNoProcesados = 0;

  // Agrupar órdenes por número (ya que Shopify puede tener múltiples líneas por orden)
  const ordersGrouped = new Map<string, ShopifyOrder[]>();
  
  for (const order of shopifyOrders) {
    const orderNumber = order.Name; // Ej: #1306
    if (!ordersGrouped.has(orderNumber)) {
      ordersGrouped.set(orderNumber, []);
    }
    ordersGrouped.get(orderNumber)!.push(order);
  }

  console.log('Órdenes agrupadas:', ordersGrouped.size);

  // Procesar cada orden agrupada
  for (const [orderNumber, orderLines] of ordersGrouped) {
    // Usar la primera línea para obtener datos del cliente (las líneas adicionales son productos)
    const firstLine = orderLines[0];
    
    // Verificar que el pedido esté pagado
    if (firstLine['Financial Status'] !== 'paid') {
      contadorNoProcesados++;
      console.log(`[NO PROCESADO] Pedido ${orderNumber} - No está pagado: ${firstLine['Financial Status']}`);
      continue;
    }

    // Extraer información del cliente
    const nombreCompleto = firstLine['Shipping Name'] || firstLine['Billing Name'] || '';
    const [nombre, ...apellidoParts] = nombreCompleto.split(' ');
    const apellido = apellidoParts.join(' ');
    
    // Normalizar nombres
    const nombreNormalizado = normalizarNombre(nombre);
    const apellidoNormalizado = normalizarNombre(apellido);

    // Extraer teléfono
    const telefono = firstLine['Shipping Phone'] || firstLine['Billing Phone'] || firstLine.Phone || '';
    const cleanPhone = telefono.replace(/\D/g, '');
    
    // Remover prefijo internacional +54 si existe
    let phoneToProcess = cleanPhone;
    if (phoneToProcess.startsWith('54')) {
      phoneToProcess = phoneToProcess.substring(2);
    }
    
    // Obtener código de área y número
    const provincia = firstLine['Shipping Province'] || firstLine['Billing Province'] || '';
    const { codigo: celularCodigo, numero: celularNumero } = getCodigoArea(provincia, phoneToProcess);
    
    // Extraer dirección de envío
    const direccionCompleta = firstLine['Shipping Street'] || firstLine['Billing Street'] || '';
    const direccionParts = direccionCompleta.split(',');
    const calle = direccionParts[0]?.trim() || '';
    const numero = direccionParts[1]?.trim() || '';
    const piso = firstLine['Shipping Address2'] || firstLine['Billing Address2'] || '';
    
    const localidad = firstLine['Shipping City'] || firstLine['Billing City'] || '';
    const codigoPostal = (firstLine['Shipping Zip'] || firstLine['Billing Zip'] || '').replace(/'/g, '').trim();
    const provinciaCompleta = firstLine['Shipping Province'] || firstLine['Billing Province'] || '';
    
    // Determinar método de envío basado en Shipping Method
    const shippingMethod = firstLine['Shipping Method'] || '';
    console.log(`Procesando orden ${orderNumber}, método de envío: ${shippingMethod}`);

    // Datos base para ambos tipos
    const baseData = {
      'Paquete Guardado Ej:': '',
      'Peso (grs)': 1,
      'Alto (cm)': 1,
      'Ancho (cm)': 1,
      'Profundidad (cm)': 1,
      'Valor declarado ($ C/IVA) *': 4500,
      'Numero Interno': orderNumber.replace('#', ''), // Remover # del número de orden
      'Nombre *': nombreNormalizado || '',
      'Apellido *': apellidoNormalizado || '',
      'DNI *': '', // Shopify no incluye DNI por defecto
      'Email *': firstLine.Email || '',
      'Celular código *': celularCodigo,
      'Celular número *': celularNumero,
    };

    // Determinar si es envío a domicilio o sucursal
    if (shippingMethod.includes('domicilio') || shippingMethod.includes('Domicilio') || 
        shippingMethod.includes('Envio a Domicilio') || shippingMethod.includes('Envío a Domicilio') ||
        shippingMethod.includes('Andreani - Envio a Domicilio') || shippingMethod.includes('Andreani - Envío a Domicilio') ||
        shippingMethod.includes('Andreani - Despacho Express')) {
      
      contadorDomicilios++;
      console.log(`[DOMICILIO ${contadorDomicilios}] Procesando pedido:`, orderNumber);
      
      // Buscar el formato EXACTO en domiciliosData.ts - TAL CUAL como está definido
      let formatoProvinciaLocalidadCP = '';
      
      console.log(`=== DEBUGGING CÓDIGO POSTAL ${codigoPostal} (SHOPIFY) ===`);
      console.log('¿Existe en mapeo domiciliosData.ts?', codigosPostales.has(codigoPostal));
      
      if (codigosPostales.has(codigoPostal)) {
        formatoProvinciaLocalidadCP = codigosPostales.get(codigoPostal)!;
        console.log(`✅ Código postal ${codigoPostal} encontrado TAL CUAL en domiciliosData.ts: ${formatoProvinciaLocalidadCP}`);
      } else {
        console.log(`❌ Código postal ${codigoPostal} NO encontrado en domiciliosData.ts`);
        
        // FALLBACK: Buscar por PROVINCIA + LOCALIDAD
        const provinciaPedido = provinciaCompleta.toUpperCase();
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

      // Normalizar campos de dirección
      const calleNormalizada = normalizarNombre(calle);
      const pisoNormalizado = normalizarNombre(piso);
      
      domicilios.push({
        ...baseData,
        'Calle *': calleNormalizada,
        'Número *': numero || '0',
        'Piso': pisoNormalizado,
        'Departamento': pisoNormalizado,
        'Provincia / Localidad / CP *': formatoProvinciaLocalidadCP,
      });

    } else if (shippingMethod.includes('sucursal') || shippingMethod.includes('Sucursal') || 
               shippingMethod.includes('Punto de retiro') || shippingMethod.includes('retiro')) {
      
      contadorSucursales++;
      console.log(`[SUCURSAL ${contadorSucursales}] Procesando pedido:`, orderNumber);
      
      // Construir dirección completa para buscar sucursal
      let direccionCompletaSucursal = `${calle} ${numero}`.trim();
      if (piso && piso.trim()) {
        direccionCompletaSucursal += `, ${piso}`;
      }
      if (localidad && localidad.trim()) {
        direccionCompletaSucursal += `, ${localidad}`;
      }
      if (codigoPostal && codigoPostal.trim()) {
        direccionCompletaSucursal += `, ${codigoPostal}`;
      }
      if (provinciaCompleta && provinciaCompleta.trim()) {
        direccionCompletaSucursal += `, ${provinciaCompleta}`;
      }

      const nombreSucursal = findSucursalByAddress(direccionCompletaSucursal, sucursales);
      console.log('Sucursal encontrada:', nombreSucursal);

      sucursalesOutput.push({
        ...baseData,
        'Sucursal *': nombreSucursal,
      });

    } else {
      contadorNoProcesados++;
      console.log(`[NO PROCESADO ${contadorNoProcesados}] Pedido ${orderNumber} - Método de envío desconocido:`, shippingMethod);
    }
  }

  console.log('=== RESUMEN DE PROCESAMIENTO (SHOPIFY) ===');
  console.log(`Total órdenes procesadas: ${contadorDomicilios + contadorSucursales + contadorNoProcesados}`);
  console.log(`- Domicilios: ${contadorDomicilios}`);
  console.log(`- Sucursales: ${contadorSucursales}`);
  console.log(`- No procesados: ${contadorNoProcesados}`);

  // Recopilar logs de procesamiento
  const processingLogs: string[] = [];
  processingLogs.push(`Total órdenes cargadas: ${shopifyOrders.length}`);
  processingLogs.push(`Domicilios procesados: ${contadorDomicilios}`);
  processingLogs.push(`Sucursales procesadas: ${contadorSucursales}`);
  processingLogs.push(`No procesados: ${contadorNoProcesados}`);
  processingLogs.push(`Total procesados: ${contadorDomicilios + contadorSucursales + contadorNoProcesados}`);

  return {
    domicilioCSV: unparseShopifyCSV(domicilios),
    sucursalCSV: unparseShopifyCSV(sucursalesOutput),
    processingInfo: {
      totalOrders: shopifyOrders.length,
      domiciliosProcessed: contadorDomicilios,
      sucursalesProcessed: contadorSucursales,
      noProcessed: contadorNoProcesados,
      processingLogs: processingLogs
    }
  };
};

// Función auxiliar para obtener código de área (reutilizada del código existente)
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
