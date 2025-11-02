import { 
  TiendanubeOrder
} from '../types';
import { getCodigoProvinciaCorreoArgentino } from './correoArgentinoProvincias';
import { getDomiciliosMapping } from './domiciliosData';
import { getSucursalesData } from './sucursalesData';
import { loadCorreoArgentinoSucursales, findCodigoSucursalCorreoArgentino, type CorreoArgentinoSucursal } from './correoArgentinoSucursales';

// PapaParse is loaded from a CDN and available as a global variable.
declare const Papa: any;

// Función para corregir problemas de codificación UTF-8
const fixEncoding = (text: string): string => {
  if (!text) return '';
  
  let cleanText = text;
  
  // Primero, corregir caracteres mal codificados comunes
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
  
  // Corregir caracteres de reemplazo Unicode (U+FFFD) que aparecen cuando hay problemas de codificación
  // Mapeo específico para provincias argentinas comunes con acentos
  const charReemplazo = '\uFFFD';
  
  cleanText = cleanText
    // Entre Ríos - múltiples variantes posibles
    .replace(new RegExp(`Entre R[${charReemplazo}]os`, 'gi'), 'Entre Ríos')
    .replace(/Entre Ros/gi, 'Entre Ríos')
    .replace(new RegExp(`([Ee]ntre R)[${charReemplazo}]([Oo]s)`, 'g'), '$1í$2')
    // Córdoba
    .replace(new RegExp(`C[${charReemplazo}]rdoba`, 'gi'), 'Córdoba')
    .replace(/Crdoba/gi, 'Córdoba')
    .replace(new RegExp(`([Cc])[${charReemplazo}]([Rr]doba)`, 'g'), '$1ó$2')
    // Neuquén
    .replace(new RegExp(`Neuqu[${charReemplazo}]n`, 'gi'), 'Neuquén')
    .replace(/Neuqun/gi, 'Neuquén')
    .replace(new RegExp(`([Nn]euqu)[${charReemplazo}]([Nn])`, 'g'), '$1é$2')
    // Tucumán
    .replace(new RegExp(`Tucum[${charReemplazo}]n`, 'gi'), 'Tucumán')
    .replace(/Tucumn/gi, 'Tucumán')
    .replace(new RegExp(`([Tt]ucum)[${charReemplazo}]([Nn])`, 'g'), '$1á$2')
    // Río Negro
    .replace(new RegExp(`R[${charReemplazo}]o Negro`, 'gi'), 'Río Negro')
    .replace(/Ro Negro/gi, 'Río Negro')
    .replace(new RegExp(`([Rr])[${charReemplazo}]([Oo] Negro)`, 'g'), '$1í$2');
  
  // Si aún quedan caracteres de reemplazo, intentar inferir el carácter correcto basándose en el contexto
  if (new RegExp(`[${charReemplazo}]`).test(cleanText)) {
    // Patrones genéricos para inferir acentos comunes en español argentino
    cleanText = cleanText
      .replace(new RegExp(`([Ee]ntre R)[${charReemplazo}]([Oo]s)`, 'g'), '$1í$2')
      .replace(new RegExp(`([Cc])[${charReemplazo}]([Rr]doba)`, 'g'), '$1ó$2')
      .replace(new RegExp(`([Nn]euqu)[${charReemplazo}]([Nn])`, 'g'), '$1é$2')
      .replace(new RegExp(`([Tt]ucum)[${charReemplazo}]([Nn])`, 'g'), '$1á$2')
      .replace(new RegExp(`([Rr])[${charReemplazo}]([Oo] Negro)`, 'g'), '$1í$2');
  }
  
  // Correcciones adicionales para casos específicos del archivo
  // Estas se aplican después de todas las correcciones de caracteres de reemplazo
  cleanText = cleanText
    // Nombre de archivo específico - detectar "Lanús" sin tilde
    .replace(/Lanus\b/gi, 'Lanús')
    // Detectar y corregir "Crdoba" sin acento
    .replace(/\bCrdoba\b/gi, 'Córdoba');
  
  return cleanText;
};

// Función para parsear CSV
const parseCSV = <T,>(csvText: string): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    console.log('Iniciando parsing del CSV de entrada para Correo Argentino...');
    
    let cleanText = csvText.replace(/^\uFEFF/, '');
    cleanText = fixEncoding(cleanText);
    
    Papa.parse(cleanText, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';',
      quoteChar: '"',
      escapeChar: '"',
      complete: (results: { data: T[]; errors: any[] }) => {
        if (results.errors.length > 0) {
          console.error("CSV Parsing Errors:", results.errors);
        }
        console.log('Total de filas parseadas:', results.data.length);
        resolve(results.data);
      },
      error: (error: Error) => {
        console.error('Error parsing CSV:', error);
        reject(error);
      },
    });
  });
};

// Tipo para el output de Correo Argentino
interface CorreoArgentinoOutput {
  tipo_producto: string; // Siempre "CP"
  largo: string; // en CM
  ancho: string; // en CM
  altura: string; // en CM
  peso: string; // en KG
  valor_del_contenido: string; // en pesos argentinos
  provincia_destino: string; // código de una letra
  sucursal_destino: string; // solo si es envío a sucursal
  localidad_destino: string; // solo si es envío a domicilio
  calle_destino: string; // solo si es envío a domicilio
  altura_destino: string; // solo si es envío a domicilio
  piso: string; // opcional
  dpto: string; // opcional
  codpostal_destino: string; // solo si es envío a domicilio
  destino_nombre: string; // obligatorio
  destino_email: string; // obligatorio
  cod_area_tel: string; // opcional
  tel: string; // opcional
  cod_area_cel: string; // opcional
  cel: string; // opcional
  numero_orden: string; // opcional
}

// Función para generar CSV desde array de objetos
const unparseCSV = (data: CorreoArgentinoOutput[]): string => {
  if (data.length === 0) return "";
  
  // Encabezados según el formato de Correo Argentino
  const headers = [
    'tipo_producto(obligatorio)',
    'largo(obligatorio en CM)',
    'ancho(obligatorio en CM)',
    'altura(obligatorio en CM)',
    'peso(obligatorio en KG)',
    'valor_del_contenido(obligatorio en pesos argentinos)',
    'provincia_destino(obligatorio)',
    'sucursal_destino(obligatorio solo en caso de no ingresar localidad de destino)',
    'localidad_destino(obligatorio solo en caso de no ingresar sucursal de destino)',
    'calle_destino(obligatorio solo en caso de no ingresar sucursal de destino)',
    'altura_destino(obligatorio solo en caso de no ingresar sucursal de destino)',
    'piso(opcional solo en caso de no ingresar sucursal de destino)',
    'dpto(opcional solo en caso de no ingresar sucursal de destino)',
    'codpostal_destino(obligatorio solo en caso de no ingresar sucursal de destino)',
    'destino_nombre(obligatorio)',
    'destino_email(obligatorio, debe ser un email valido)',
    'cod_area_tel(opcional)',
    'tel(opcional)',
    'cod_area_cel(opcional)',
    'cel(opcional)',
    'numero_orden(opcional)'
  ];
  
  const csvLines = [headers.join(';')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      // Mapear el encabezado al campo del objeto
      const fieldMap: Record<string, keyof CorreoArgentinoOutput> = {
        'tipo_producto(obligatorio)': 'tipo_producto',
        'largo(obligatorio en CM)': 'largo',
        'ancho(obligatorio en CM)': 'ancho',
        'altura(obligatorio en CM)': 'altura',
        'peso(obligatorio en KG)': 'peso',
        'valor_del_contenido(obligatorio en pesos argentinos)': 'valor_del_contenido',
        'provincia_destino(obligatorio)': 'provincia_destino',
        'sucursal_destino(obligatorio solo en caso de no ingresar localidad de destino)': 'sucursal_destino',
        'localidad_destino(obligatorio solo en caso de no ingresar sucursal de destino)': 'localidad_destino',
        'calle_destino(obligatorio solo en caso de no ingresar sucursal de destino)': 'calle_destino',
        'altura_destino(obligatorio solo en caso de no ingresar sucursal de destino)': 'altura_destino',
        'piso(opcional solo en caso de no ingresar sucursal de destino)': 'piso',
        'dpto(opcional solo en caso de no ingresar sucursal de destino)': 'dpto',
        'codpostal_destino(obligatorio solo en caso de no ingresar sucursal de destino)': 'codpostal_destino',
        'destino_nombre(obligatorio)': 'destino_nombre',
        'destino_email(obligatorio, debe ser un email valido)': 'destino_email',
        'cod_area_tel(opcional)': 'cod_area_tel',
        'tel(opcional)': 'tel',
        'cod_area_cel(opcional)': 'cod_area_cel',
        'cel(opcional)': 'cel',
        'numero_orden(opcional)': 'numero_orden'
      };
      
      const fieldName = fieldMap[header];
      let value = row[fieldName] || '';
      
      // Asegurar que todos los campos de texto estén normalizados (sin acentos, tildes ni caracteres especiales)
      // NO normalizar: tipo_producto, largo, ancho, altura, peso, valor_del_contenido, provincia_destino, altura_destino, codpostal_destino, cod_area_tel, tel, cod_area_cel, cel, numero_orden
      const camposTextuales = [
        'sucursal_destino',
        'localidad_destino',
        'calle_destino',
        'piso',
        'dpto',
        'destino_nombre'
      ];
      
      if (fieldName && camposTextuales.includes(fieldName) && typeof value === 'string') {
        value = normalizarNombre(value);
      }
      
      // Para destino_email, solo limpiar espacios y convertir a minúsculas (no normalizar porque los emails tienen caracteres especiales permitidos)
      if (fieldName === 'destino_email' && typeof value === 'string') {
        value = value.toLowerCase().trim();
      }
      
      return value;
    });
    csvLines.push(values.join(';'));
  });
  
  return csvLines.join('\n');
};

// Función para normalizar nombres y eliminar TODOS los acentos, tildes y caracteres especiales
// Correo Argentino no acepta acentos, tildes ni caracteres especiales
const normalizarNombre = (nombre: string): string => {
  if (!nombre) return '';
  
  let texto = nombre;
  
  // Primero, corregir cualquier carácter mal codificado que pueda quedar
  texto = fixEncoding(texto);
  
  // Eliminar todos los acentos y tildes (minúsculas)
  texto = texto
    .replace(/[áàäâãå]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöôõ]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c');
  
  // Eliminar todos los acentos y tildes (mayúsculas)
  texto = texto
    .replace(/[ÁÀÄÂÃÅ]/g, 'A')
    .replace(/[ÉÈËÊ]/g, 'E')
    .replace(/[ÍÌÏÎ]/g, 'I')
    .replace(/[ÓÒÖÔÕ]/g, 'O')
    .replace(/[ÚÙÜÛ]/g, 'U')
    .replace(/[Ñ]/g, 'N')
    .replace(/[Ç]/g, 'C');
  
  // Eliminar caracteres especiales que Correo Argentino no acepta
  texto = texto
    .replace(/[''""]/g, '') // Eliminar comillas simples y dobles
    .replace(/[–—]/g, '-') // Reemplazar guiones especiales por guión simple
    .replace(/[…]/g, '...') // Reemplazar puntos suspensivos
    .replace(/[^\w\s\-\.]/g, '') // Eliminar cualquier otro carácter que no sea letra, número, espacio, guión o punto
    .replace(/\s+/g, ' ') // Reemplazar múltiples espacios por uno solo
    .trim();
  
  return texto;
};

// Detectar si el CSV pertenece a Shopify
const isShopifyCSV = (text: string): boolean => {
  const head = text.slice(0, 500).toLowerCase();
  return head.includes('name,email,financial status') && head.includes('shipping method');
};

// Función para separar código de área y número de teléfono
const separarTelefono = (phone: string, prov: string): { codigo: string; numero: string } => {
  const provinciaLower = prov.toLowerCase();
  let cleanPhone = phone.replace(/\D/g, '');
  
  // Remover prefijo internacional +54
  if (cleanPhone.startsWith('54')) {
    cleanPhone = cleanPhone.substring(2);
  }
  
  // Remover el "9" adicional de celulares argentinos
  if (cleanPhone.startsWith('9')) {
    cleanPhone = cleanPhone.substring(1);
  }
  
  // Buenos Aires - código 11 (2 dígitos)
  if ((provinciaLower.includes('buenos aires') || provinciaLower.includes('capital federal')) && cleanPhone.startsWith('11')) {
    return { codigo: '11', numero: cleanPhone.substring(2) };
  }
  
  // Códigos de 4 dígitos
  const codigos4 = ['2652', '2901', '2920', '2944', '2954', '2965', '2966', '3541'];
  for (const cod of codigos4) {
    if (cleanPhone.startsWith(cod)) {
      return { codigo: cod, numero: cleanPhone.substring(4) };
    }
  }
  
  // Códigos de 3 dígitos
  const codigos3 = ['221', '223', '291', '341', '342', '343', '351', '358', '261', '381', '376', '362', '379', '370', '387', '388', '380', '383', '385', '264', '297', '299'];
  for (const cod of codigos3) {
    if (cleanPhone.startsWith(cod)) {
      return { codigo: cod, numero: cleanPhone.substring(3) };
    }
  }
  
  // Fallback: asumir código de 2 dígitos
  return { codigo: cleanPhone.substring(0, 2), numero: cleanPhone.substring(2) };
};

// Función para encontrar código de sucursal de Correo Argentino (código de 3 letras)
// Ahora usa el servicio de códigos de sucursales de Correo Argentino
const findSucursalCorreoArgentino = (
  direccion: string, 
  codigoPostal: string, 
  provincia: string, 
  localidad: string,
  sucursales: CorreoArgentinoSucursal[]
): string => {
  // Buscar código de 3 letras usando localidad, provincia y dirección
  const codigoSucursal = findCodigoSucursalCorreoArgentino(
    localidad,
    provincia,
    codigoPostal,
    direccion,
    sucursales
  );
  
  return codigoSucursal;
};

// Procesar órdenes de TiendaNube/Shopify para Correo Argentino
export const processOrdersCorreoArgentino = async (
  csvText: string,
  config?: { peso: number; largo: number; ancho: number; altura: number; valorDeclarado: number }
): Promise<{
  correoArgentinoCSV: string;
  processingInfo: any;
}> => {
  // Valores por defecto (convertir a las unidades de Correo Argentino)
  const defaultConfig = {
    peso: 1.0, // KG (Correo Argentino usa KG, no gramos)
    largo: 10, // CM
    ancho: 10, // CM
    altura: 10, // CM
    valorDeclarado: 100, // pesos argentinos
  };
  
  const finalConfig = config || defaultConfig;
  
  // Detectar Shopify
  if (isShopifyCSV(csvText)) {
    console.log('CSV de Shopify detectado. Procesando para Correo Argentino...');
    // Por ahora, Shopify no está implementado específicamente para Correo Argentino
    // Se puede extender en el futuro
    throw new Error('Procesamiento de Shopify para Correo Argentino aún no está implementado');
  }
  
  // Cargar datos auxiliares
  const [codigosPostales, andreaniSucursales, correoArgentinoSucursales, tiendanubeOrders] = await Promise.all([
    getDomiciliosMapping(),
    getSucursalesData(), // Para otras validaciones si es necesario
    loadCorreoArgentinoSucursales(), // Cargar códigos de sucursales de Correo Argentino
    parseCSV<TiendanubeOrder>(csvText),
  ]);
  
  console.log('=== PROCESAMIENTO PARA CORREO ARGENTINO ===');
  console.log('Total orders loaded:', tiendanubeOrders.length);
  
  const correoArgentinoOrders: CorreoArgentinoOutput[] = [];
  const domiciliosOrders: CorreoArgentinoOutput[] = [];
  const sucursalesOrders: CorreoArgentinoOutput[] = [];
  
  let contadorProcesados = 0;
  let contadorNoProcesados = 0;
  let contadorDomicilio = 0;
  let contadorSucursal = 0;
  const errores: string[] = [];
  
  // Función auxiliar para obtener valor de columna
  const getColumnValue = (order: any, columnIndex: number): string => {
    const columns = Object.keys(order);
    if (columnIndex < columns.length) {
      const columnName = columns[columnIndex];
      return order[columnName] || '';
    }
    return '';
  };
  
  for (const order of tiendanubeOrders) {
    try {
      // Extraer datos básicos
      const numeroOrden = getColumnValue(order, 0); // Número de orden
      const email = getColumnValue(order, 1); // Email
      const nombreCompleto = fixEncoding(getColumnValue(order, 11)); // Nombre del comprador - corregir encoding
      
      // Si no hay número de orden, email o nombre completo, es una línea duplicada del mismo pedido con múltiples productos - saltar
      if (!numeroOrden || !email || !nombreCompleto || numeroOrden.trim() === '' || email.trim() === '' || nombreCompleto.trim() === '') {
        console.log(`⏭️ Línea omitida: no tiene número de orden, email o nombre (producto adicional del pedido)`);
        continue;
      }
      
      const [nombre, ...apellidoParts] = nombreCompleto.split(' ');
      const apellido = apellidoParts.join(' ');
      const nombreDestinatario = `${nombre} ${apellido}`.trim();
      
      const telefono = getColumnValue(order, 13); // Teléfono
      const direccion = fixEncoding(getColumnValue(order, 16)); // Dirección - corregir encoding
      const numero = getColumnValue(order, 17); // Número
      const piso = fixEncoding(getColumnValue(order, 18)); // Piso - corregir encoding
      const localidad = fixEncoding(getColumnValue(order, 19)); // Localidad - corregir encoding
      const ciudad = fixEncoding(getColumnValue(order, 20)); // Ciudad - corregir encoding
      const codigoPostal = getColumnValue(order, 21); // Código postal
      const provincia = fixEncoding(getColumnValue(order, 22)); // Provincia - corregir encoding ANTES de buscar código
      const medioEnvio = fixEncoding(getColumnValue(order, 24)); // Medio de envío - corregir encoding
      const valorTotal = getColumnValue(order, 10); // Total (puede usarse para valor del contenido)
      
      // Validar datos obligatorios (validación adicional por si acaso)
      if (!email || !nombreDestinatario || !provincia) {
        contadorNoProcesados++;
        errores.push(`Orden ${numeroOrden}: Faltan datos obligatorios (email, nombre o provincia)`);
        continue;
      }
      
      // Obtener código de provincia
      const codigoProvincia = getCodigoProvinciaCorreoArgentino(provincia);
      if (!codigoProvincia) {
        contadorNoProcesados++;
        errores.push(`Orden ${numeroOrden}: Provincia no reconocida: ${provincia}`);
        continue;
      }
      
      // Separar teléfono
      const { codigo: codigoArea, numero: numeroTelefono } = separarTelefono(telefono, provincia);
      
      // Detectar tipo de envío (domicilio o sucursal)
      const medioEnvioNormalizado = medioEnvio.toLowerCase().trim();
      const esSucursal = medioEnvioNormalizado.includes('punto de retiro') || 
                         medioEnvioNormalizado.includes('retiro') ||
                         (medioEnvioNormalizado.includes('correo argentino') && medioEnvioNormalizado.includes('sucursal'));
      
      // Determinar valor del contenido
      let valorContenido = finalConfig.valorDeclarado.toString();
      if (valorTotal) {
        const valorNumerico = parseFloat(valorTotal.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(valorNumerico) && valorNumerico > 0) {
          valorContenido = valorNumerico.toFixed(2);
        }
      }
      
      // Procesar número de calle
      let alturaDestino = numero.trim();
      if (/^s[\s\/\-]*n$/i.test(alturaDestino)) {
        alturaDestino = '0';
      } else {
        const soloNumeros = alturaDestino.match(/\d+/);
        if (soloNumeros && soloNumeros[0]) {
          alturaDestino = soloNumeros[0];
        } else {
          alturaDestino = '0';
        }
      }
      
      // Normalizar TODOS los campos de texto para eliminar acentos, tildes y caracteres especiales
      // Correo Argentino requiere texto sin acentos ni caracteres especiales
      const calleDestino = normalizarNombre(direccion);
      const pisoNormalizado = normalizarNombre(piso);
      
      if (esSucursal) {
        // ENVÍO A SUCURSAL
        contadorSucursal++;
        
        // Normalizar para comparar - usar fixEncoding primero para corregir caracteres mal codificados
        const ciudadLimpia = ciudad ? fixEncoding(ciudad) : '';
        const localidadLimpia = localidad ? fixEncoding(localidad) : '';
        const provinciaLimpia = fixEncoding(provincia);
        
        // Lógica para determinar la localidad a buscar usando valores ya limpiados
        // PRIORIZAR CIUDAD sobre localidad - la ciudad suele ser más específica y confiable
        // Si la ciudad es "Capital" y la provincia/localidad es el nombre de la provincia (ej: Córdoba),
        // entonces usar el nombre de la provincia como localidad (CORDOBA en el CSV)
        let localidadParaBusqueda = ciudadLimpia || localidadLimpia || '';
        
        const ciudadNormalizada = ciudadLimpia ? normalizarNombre(ciudadLimpia).toUpperCase() : '';
        const localidadNormalizada = localidadLimpia ? normalizarNombre(localidadLimpia).toUpperCase() : '';
        const provinciaNormalizada = provinciaLimpia ? normalizarNombre(provinciaLimpia).toUpperCase() : '';
        
        // Si la ciudad es "Capital" y hay provincia, usar la provincia como localidad
        if (ciudadNormalizada === 'CAPITAL' && provinciaLimpia) {
          localidadParaBusqueda = provinciaLimpia;
          console.log(`   ℹ️ Ciudad es "Capital", usando provincia "${provinciaLimpia}" como localidad`);
        }
        // Si la localidad es "Capital" y hay provincia, usar la provincia como localidad
        else if (localidadNormalizada === 'CAPITAL' && provinciaLimpia) {
          localidadParaBusqueda = provinciaLimpia;
          console.log(`   ℹ️ Localidad es "Capital", usando provincia "${provinciaLimpia}" como localidad`);
        }
        // Si la localidad está vacía pero hay ciudad y no es "Capital", usar ciudad
        else if (!localidadParaBusqueda && ciudadLimpia && ciudadNormalizada !== 'CAPITAL') {
          localidadParaBusqueda = ciudadLimpia;
        }
        // Si la localidad es igual a la provincia (ej: Córdoba = Córdoba), usar la provincia directamente
        // Esto es común cuando la localidad genérica coincide con la provincia
        else if (localidadParaBusqueda && provinciaLimpia && localidadNormalizada === provinciaNormalizada) {
          localidadParaBusqueda = provinciaLimpia;
          console.log(`   ℹ️ Localidad igual a provincia, usando "${provinciaLimpia}" como localidad`);
        }
        
        // Asegurar que si no tenemos localidad pero tenemos provincia, usar la provincia
        if (!localidadParaBusqueda && provinciaLimpia) {
          localidadParaBusqueda = provinciaLimpia;
          console.log(`   ℹ️ Sin localidad, usando provincia "${provinciaLimpia}" como localidad`);
        }
        
        console.log(`🔍 Buscando sucursal para orden ${numeroOrden}:`);
        console.log(`   - Localidad original: "${localidad}"`);
        console.log(`   - Ciudad original: "${ciudad}"`);
        console.log(`   - Provincia original: "${provincia}"`);
        console.log(`   - Localidad para búsqueda: "${localidadParaBusqueda}"`);
        
        let sucursalCodigo = findSucursalCorreoArgentino(
          direccion, 
          codigoPostal, 
          provincia, 
          localidadParaBusqueda,
          correoArgentinoSucursales
        );
        
        console.log(`   - Resultado búsqueda con localidad "${localidadParaBusqueda}": "${sucursalCodigo || 'NO ENCONTRADO'}"`);
        
        // Si no se encontró y tenemos una ciudad diferente, intentar con la ciudad
        if (!sucursalCodigo && ciudadLimpia && ciudadLimpia !== localidadLimpia && ciudadNormalizada !== 'CAPITAL') {
          console.log(`   🔄 No se encontró con localidad, intentando con ciudad "${ciudadLimpia}"`);
          sucursalCodigo = findSucursalCorreoArgentino(
            direccion, 
            codigoPostal, 
            provincia, 
            ciudadLimpia,
            correoArgentinoSucursales
          );
          console.log(`   - Resultado búsqueda con ciudad: "${sucursalCodigo || 'NO ENCONTRADO'}"`);
        }
        
        if (!sucursalCodigo) {
          contadorNoProcesados++;
          errores.push(`Orden ${numeroOrden}: No se encontró código de sucursal para ${localidadParaBusqueda || 'sin localidad'}, ${provincia}`);
          continue;
        }
        
        const sucursalOrder: CorreoArgentinoOutput = {
          tipo_producto: 'CP',
          largo: finalConfig.largo.toString(),
          ancho: finalConfig.ancho.toString(),
          altura: finalConfig.altura.toString(),
          peso: finalConfig.peso.toFixed(3),
          valor_del_contenido: valorContenido,
          provincia_destino: codigoProvincia,
          sucursal_destino: normalizarNombre(sucursalCodigo || ''), // Normalizar código de sucursal también
          localidad_destino: '', // Vacío para sucursal
          calle_destino: '', // Vacío para sucursal
          altura_destino: '', // Vacío para sucursal
          piso: '', // Vacío para sucursal
          dpto: '', // Vacío para sucursal
          codpostal_destino: '', // Vacío para sucursal
          destino_nombre: normalizarNombre(nombreDestinatario),
          destino_email: email.toLowerCase().trim(), // Email sin espacios y en minúsculas
          cod_area_tel: codigoArea,
          tel: numeroTelefono,
          cod_area_cel: codigoArea,
          cel: numeroTelefono,
          numero_orden: numeroOrden
        };
        
        correoArgentinoOrders.push(sucursalOrder);
        sucursalesOrders.push(sucursalOrder);
      } else {
        // ENVÍO A DOMICILIO
        contadorDomicilio++;
        
        // Validar que tenemos los datos necesarios para domicilio
        // Usar ciudad como fallback si no hay localidad
        const localidadFinal = localidad || ciudad || '';
        // Si no hay código postal pero hay provincia, intentar continuar (el CP puede estar en otro campo o ser opcional en algunos casos)
        // Pero requerimos al menos dirección o localidad
        if ((!localidadFinal || localidadFinal.trim() === '') && (!direccion || direccion.trim() === '')) {
          contadorNoProcesados++;
          errores.push(`Orden ${numeroOrden}: Faltan datos para envío a domicilio (localidad/ciudad o dirección)`);
          continue;
        }
        
        // Usar valores por defecto si faltan algunos campos opcionales
        const codigoPostalFinal = codigoPostal || '';
        const direccionFinal = direccion || localidadFinal;
        
        const domicilioOrder: CorreoArgentinoOutput = {
          tipo_producto: 'CP',
          largo: finalConfig.largo.toString(),
          ancho: finalConfig.ancho.toString(),
          altura: finalConfig.altura.toString(),
          peso: finalConfig.peso.toFixed(3),
          valor_del_contenido: valorContenido,
          provincia_destino: codigoProvincia,
          sucursal_destino: '', // Vacío para domicilio
          localidad_destino: normalizarNombre(localidadFinal),
          calle_destino: normalizarNombre(direccionFinal),
          altura_destino: alturaDestino,
          piso: normalizarNombre(pisoNormalizado), // Asegurar que piso también esté normalizado
          dpto: normalizarNombre(pisoNormalizado), // Usar piso también para depto si no hay depto específico
          codpostal_destino: codigoPostalFinal,
          destino_nombre: normalizarNombre(nombreDestinatario),
          destino_email: email.toLowerCase().trim(), // Email sin espacios y en minúsculas
          cod_area_tel: codigoArea,
          tel: numeroTelefono,
          cod_area_cel: codigoArea,
          cel: numeroTelefono,
          numero_orden: numeroOrden
        };
        
        correoArgentinoOrders.push(domicilioOrder);
        domiciliosOrders.push(domicilioOrder);
      }
      
      contadorProcesados++;
    } catch (error) {
      const numeroOrden = getColumnValue(order, 0);
      contadorNoProcesados++;
      errores.push(`Orden ${numeroOrden}: Error en procesamiento - ${error instanceof Error ? error.message : 'Error desconocido'}`);
      console.error(`Error procesando orden ${numeroOrden}:`, error);
    }
  }
  
  console.log('=== RESUMEN DE PROCESAMIENTO ===');
  console.log(`Total procesados: ${contadorProcesados}`);
  console.log(`- Domicilios: ${contadorDomicilio}`);
  console.log(`- Sucursales: ${contadorSucursal}`);
  console.log(`- No procesados: ${contadorNoProcesados}`);
  
  const processingInfo = {
    totalOrders: tiendanubeOrders.length,
    procesados: contadorProcesados,
    domicilios: contadorDomicilio,
    sucursales: contadorSucursal,
    noProcesados: contadorNoProcesados,
    processingLogs: [
      `Total pedidos cargados: ${tiendanubeOrders.length}`,
      `Pedidos procesados: ${contadorProcesados}`,
      `Envíos a domicilio: ${contadorDomicilio}`,
      `Envíos a sucursal: ${contadorSucursal}`,
      `No procesados: ${contadorNoProcesados}`,
    ],
    errores: errores.length > 0 ? errores : undefined,
  };
  
  return {
    correoArgentinoCSV: unparseCSV(correoArgentinoOrders),
    domicilioCSV: unparseCSV(domiciliosOrders),
    sucursalCSV: unparseCSV(sucursalesOrders),
    processingInfo,
  };
};

