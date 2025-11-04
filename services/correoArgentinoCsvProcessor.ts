import { 
  TiendanubeOrder
} from '../types';
import { getCodigoProvinciaCorreoArgentino } from './correoArgentinoProvincias';
import { getDomiciliosMapping } from './domiciliosData';
import { getSucursalesData } from './sucursalesData';
import { loadCorreoArgentinoSucursales, findCodigoSucursalCorreoArgentino, type CorreoArgentinoSucursal } from './correoArgentinoSucursales';
import { normalizarProvincia } from './sucursalesDataCorreoARG';

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
      let value = row[fieldName];
      
      // Convertir undefined/null a cadena vacía
      if (value === undefined || value === null) {
        value = '';
      }
      
      // Convertir a string si no lo es
      value = String(value);
      
      // Los campos ya están normalizados en el objeto, solo necesitamos asegurarnos de que los valores estén correctos
      // Para destino_email, solo limpiar espacios y convertir a minúsculas (no normalizar porque los emails tienen caracteres especiales permitidos)
      if (fieldName === 'destino_email') {
        value = value.toLowerCase().trim();
      }
      
      // Asegurar que los valores vacíos sean realmente cadenas vacías
      if (!value || value.trim() === '') {
        value = '';
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
  
  // Normalizar usando NFD (Normalization Form Decomposed) para separar caracteres base de sus diacríticos
  texto = texto.normalize('NFD');
  
  // Eliminar todos los diacríticos (acentos, tildes, etc.) - rango Unicode completo
  texto = texto.replace(/[\u0300-\u036f]/g, '');
  
  // Mapeo explícito de caracteres acentuados a sus equivalentes sin acento
  // Esto asegura que incluso si NFD falla, tengamos un fallback
  const mapaAcentos: { [key: string]: string } = {
    'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'ã': 'a', 'å': 'a',
    'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e',
    'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i',
    'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o', 'õ': 'o',
    'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u',
    'ñ': 'n', 'ç': 'c', 'ý': 'y', 'ÿ': 'y',
    'Á': 'A', 'À': 'A', 'Ä': 'A', 'Â': 'A', 'Ã': 'A', 'Å': 'A',
    'É': 'E', 'È': 'E', 'Ë': 'E', 'Ê': 'E',
    'Í': 'I', 'Ì': 'I', 'Ï': 'I', 'Î': 'I',
    'Ó': 'O', 'Ò': 'O', 'Ö': 'O', 'Ô': 'O', 'Õ': 'O',
    'Ú': 'U', 'Ù': 'U', 'Ü': 'U', 'Û': 'U',
    'Ñ': 'N', 'Ç': 'C', 'Ý': 'Y'
  };
  
  // Aplicar mapeo de acentos
  for (const [acento, sinAcento] of Object.entries(mapaAcentos)) {
    texto = texto.replace(new RegExp(acento, 'g'), sinAcento);
  }
  
  // Eliminar caracteres especiales que Correo Argentino no acepta
  texto = texto
    .replace(/[''""]/g, '') // Eliminar comillas simples y dobles
    .replace(/[–—]/g, '-') // Reemplazar guiones especiales por guión simple
    .replace(/[…]/g, '...') // Reemplazar puntos suspensivos
    .replace(/[™®©]/g, '') // Eliminar símbolos de marca
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

// Procesador específico para CSV de Shopify para Correo Argentino
const processShopifyOrdersCorreoArgentino = async (
  csvText: string,
  config?: { peso: number; largo: number; ancho: number; altura: number; valorDeclarado: number }
): Promise<{
  correoArgentinoCSV: string;
  domicilioCSV: string;
  sucursalCSV: string;
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
  
  // Cargar datos auxiliares
  const [correoArgentinoSucursales] = await Promise.all([
    loadCorreoArgentinoSucursales(), // Cargar códigos de sucursales de Correo Argentino
  ]);

  // Parsear con coma como delimitador (formato Shopify)
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
  const correoArgentinoOrders: CorreoArgentinoOutput[] = [];
  const domiciliosOrders: CorreoArgentinoOutput[] = [];
  const sucursalesOrders: CorreoArgentinoOutput[] = [];

  let contadorDomicilio = 0;
  let contadorSucursal = 0;
  let contadorNoProcesados = 0;
  const errores: string[] = [];
  const droppedOrders: string[] = [];
  const autofilledEmails: string[] = [];

  const get = (row: any, key: string): string => (row?.[key] ?? '').toString().trim();

  for (const row of rows) {
    if (!row || Object.keys(row).length === 0) continue;

    const numeroOrden = get(row, 'Name') || get(row, 'Id') || '';
    let email = get(row, 'Email');
    const telefono = get(row, 'Shipping Phone') || get(row, 'Phone');
    const medioEnvio = get(row, 'Shipping Method');
    const total = get(row, 'Total Price') || get(row, 'Total');

    // Nombre y apellido desde dirección de envío (fallback a facturación)
    const shippingName = get(row, 'Shipping Name') || get(row, 'Billing Name');
    const [nombre, ...apParts] = shippingName.split(' ');
    const apellido = apParts.join(' ');
    const nombreDestinatario = `${nombre} ${apellido}`.trim();

    // Dirección
    const address1 = get(row, 'Shipping Address1');
    const address2 = get(row, 'Shipping Address2');
    let localidad = get(row, 'Shipping City');
    let codigoPostal = get(row, 'Shipping Zip') || '';
    // Limpiar código postal pero mantener formato si es válido (ej: X5000KDA -> 5000)
    const codigoPostalSoloNumeros = codigoPostal.replace(/[^\d]/g, '');
    if (codigoPostalSoloNumeros) {
      codigoPostal = codigoPostalSoloNumeros;
    }
    let provincia = get(row, 'Shipping Province Name') || get(row, 'Shipping Province');
    // Limpiar provincia de texto adicional como "(provincia)"
    if (provincia) {
      provincia = provincia.replace(/\s*\([^)]*\)\s*/g, '').trim();
    }

    // Extraer calle y número desde address1
    let calle = address1 || '';
    let alturaDestino = '0';
    // Extraer número de la dirección (puede estar al final o en el medio)
    const numMatch = address1.match(/\b(\d{1,6})\b/);
    if (numMatch) {
      alturaDestino = numMatch[1];
      // Remover el número de la calle para obtener solo el nombre
      calle = address1.replace(/\b\d{1,6}\b/, '').trim();
    }
    
    // Normalizar la calle (sin acentos para Correo Argentino)
    const calleNormalizada = normalizarNombre(calle);
    const pisoNormalizado = normalizarNombre(address2 || '');

    // Si falta email, autocompletar con un placeholder y registrar
    if (!email) {
      email = 'ejemplo@gmail.com';
      if (numeroOrden) {
        autofilledEmails.push(numeroOrden);
      }
    }

    // Validar datos obligatorios
    if (!numeroOrden || !email || !nombreDestinatario || !provincia) {
      contadorNoProcesados++;
      droppedOrders.push(`${numeroOrden || 'sin número'} - faltan datos obligatorios`);
      continue;
    }

    // Obtener código de provincia
    const codigoProvincia = getCodigoProvinciaCorreoArgentino(provincia);
    if (!codigoProvincia) {
      contadorNoProcesados++;
      errores.push(`Orden ${numeroOrden}: Provincia no reconocida: ${provincia}`);
      droppedOrders.push(`${numeroOrden} - provincia no reconocida: ${provincia}`);
      continue;
    }

    // Separar teléfono
    const { codigo: codigoArea, numero: numeroTelefono } = separarTelefono(telefono, provincia);

    // Detectar tipo de envío (domicilio o sucursal)
    const medioEnvioNormalizado = medioEnvio.toLowerCase().trim();
    const esSucursal = medioEnvioNormalizado.includes('punto de retiro') || 
                       medioEnvioNormalizado.includes('retiro') ||
                       (medioEnvioNormalizado.includes('correo argentino') && medioEnvioNormalizado.includes('sucursal')) ||
                       medioEnvioNormalizado.includes('envío a sucursal') ||
                       medioEnvioNormalizado.includes('envio a sucursal');

    // Valor del contenido fijo: 6000 pesos argentinos
    const valorContenido = '6000.00';
    
    // Limpiar número de orden (remover # y otros caracteres especiales)
    const numeroOrdenLimpio = numeroOrden.replace(/^#+/g, '').trim();

    if (esSucursal) {
      // ENVÍO A SUCURSAL
      contadorSucursal++;
      
      // Normalizar para comparar
      const ciudadLimpia = localidad || '';
      const provinciaLimpia = provincia || '';
      
      // Lógica para determinar la localidad a buscar
      let localidadParaBusqueda = ciudadLimpia || '';
      
      // Manejar casos especiales de nombres de ciudades
      const ciudadNormalizada = ciudadLimpia ? normalizarNombre(ciudadLimpia).toUpperCase() : '';
      if (ciudadNormalizada === 'CAPITAL' && provinciaLimpia) {
        localidadParaBusqueda = provinciaLimpia;
      }
      
      // Si la ciudad es "Caba" o similar, usar "Ciudad Autonoma de Buenos Aires"
      if ((ciudadNormalizada === 'CABA' || ciudadNormalizada.includes('CABA')) && provinciaLimpia.includes('Buenos Aires')) {
        localidadParaBusqueda = 'Ciudad Autonoma de Buenos Aires';
      }
      
      // Si no tenemos localidad pero tenemos provincia, usar la provincia
      if (!localidadParaBusqueda && provinciaLimpia) {
        localidadParaBusqueda = provinciaLimpia;
      }
      
      // Intentar buscar sucursal con diferentes variantes de localidad
      let sucursalCodigo = findSucursalCorreoArgentino(
        address1, 
        codigoPostal, 
        provinciaLimpia, 
        localidadParaBusqueda,
        correoArgentinoSucursales
      );
      
      // Si no se encontró, intentar con la ciudad original sin normalizar
      if (!sucursalCodigo && ciudadLimpia && ciudadLimpia !== localidadParaBusqueda) {
        sucursalCodigo = findSucursalCorreoArgentino(
          address1, 
          codigoPostal, 
          provinciaLimpia, 
          ciudadLimpia,
          correoArgentinoSucursales
        );
      }
      
      // Si aún no se encontró, intentar sin dirección (solo con localidad y provincia)
      if (!sucursalCodigo) {
        sucursalCodigo = findSucursalCorreoArgentino(
          '', 
          codigoPostal, 
          provinciaLimpia, 
          localidadParaBusqueda,
          correoArgentinoSucursales
        );
      }
      
      if (!sucursalCodigo) {
        contadorNoProcesados++;
        errores.push(`Orden ${numeroOrden}: No se encontró código de sucursal para ${localidadParaBusqueda || 'sin localidad'}, ${provinciaLimpia}`);
        droppedOrders.push(`${numeroOrden} - sin código de sucursal (${localidadParaBusqueda || 'sin localidad'}, ${provinciaLimpia})`);
        continue;
      }
      
      // Validar que el código de sucursal encontrado corresponde a la provincia correcta
      // Y usar el código de provincia de la sucursal (no del pedido)
      const sucursalEncontrada = correoArgentinoSucursales.find(s => s.codigo === sucursalCodigo);
      let codigoProvinciaFinal = codigoProvincia;
      
      if (sucursalEncontrada) {
        // Obtener el código de provincia de la sucursal encontrada (no del pedido)
        const codigoProvinciaSucursal = getCodigoProvinciaCorreoArgentino(sucursalEncontrada.provincia);
        
        if (codigoProvinciaSucursal) {
          // Usar el código de provincia de la sucursal
          codigoProvinciaFinal = codigoProvinciaSucursal;
          console.log(`   ℹ️ Usando código de provincia de sucursal: ${codigoProvinciaFinal} (${sucursalEncontrada.provincia}) en lugar de ${codigoProvincia} (${provinciaLimpia})`);
        } else {
          // Si no se puede obtener el código de provincia de la sucursal, usar el del pedido pero advertir
          console.warn(`   ⚠️ No se pudo obtener código de provincia para ${sucursalEncontrada.provincia}, usando código del pedido: ${codigoProvincia}`);
        }
      }
      
      // Asegurar que TODOS los campos de texto estén completamente normalizados ANTES de crear el objeto
      // NOTA: El código de sucursal NO debe normalizarse, es un código específico de 3 letras
      const sucursalOrder: CorreoArgentinoOutput = {
        tipo_producto: 'CP',
        largo: finalConfig.largo.toString(),
        ancho: finalConfig.ancho.toString(),
        altura: finalConfig.altura.toString(),
        peso: finalConfig.peso.toFixed(3),
        valor_del_contenido: valorContenido,
        provincia_destino: codigoProvinciaFinal,
        sucursal_destino: sucursalCodigo.toUpperCase().trim(), // Código en mayúsculas, sin normalizar
        localidad_destino: '',
        calle_destino: '',
        altura_destino: '',
        piso: '',
        dpto: '',
        codpostal_destino: '',
        destino_nombre: normalizarNombre(nombreDestinatario),
        destino_email: email.toLowerCase().trim(),
        cod_area_tel: codigoArea,
        tel: numeroTelefono,
        cod_area_cel: codigoArea,
        cel: numeroTelefono,
        numero_orden: numeroOrdenLimpio
      };
      
      correoArgentinoOrders.push(sucursalOrder);
      sucursalesOrders.push(sucursalOrder);
    } else {
      // ENVÍO A DOMICILIO
      contadorDomicilio++;
      
      // Validar que tenemos los datos necesarios para domicilio
      const localidadFinal = localidad || '';
      if ((!localidadFinal || localidadFinal.trim() === '') && (!address1 || address1.trim() === '')) {
        contadorNoProcesados++;
        errores.push(`Orden ${numeroOrden}: Faltan datos para envío a domicilio (localidad o dirección)`);
        droppedOrders.push(`${numeroOrden} - faltan datos de domicilio`);
        continue;
      }
      
      const codigoPostalFinal = codigoPostal || '';
      const direccionFinal = address1 || localidadFinal;
      
      // Normalizar localidad (sin acentos pero mantener estructura)
      // Validar si la localidad parece ser válida (no es un nombre de persona)
      let localidadParaOutput = '';
      if (localidadFinal && localidadFinal.trim()) {
        const localidadNormalizadaTemp = normalizarNombre(localidadFinal);
        // Si la localidad normalizada tiene al menos 3 caracteres y no parece ser solo un nombre
        // (nombres de ciudades generalmente tienen más de 3 caracteres o son nombres conocidos)
        if (localidadNormalizadaTemp.length >= 3) {
          localidadParaOutput = localidadNormalizadaTemp;
        }
      }
      
      // Si la localidad está vacía o parece incorrecta después de normalizar, usar provincia normalizada
      if (!localidadParaOutput || localidadParaOutput.length < 3) {
        localidadParaOutput = normalizarNombre(provincia) || '';
      }
      
      // Asegurar que TODOS los campos de texto estén completamente normalizados ANTES de crear el objeto
      const domicilioOrder: CorreoArgentinoOutput = {
        tipo_producto: 'CP',
        largo: finalConfig.largo.toString(),
        ancho: finalConfig.ancho.toString(),
        altura: finalConfig.altura.toString(),
        peso: finalConfig.peso.toFixed(3),
        valor_del_contenido: valorContenido,
        provincia_destino: codigoProvincia,
        sucursal_destino: '',
        localidad_destino: normalizarNombre(localidadParaOutput),
        calle_destino: normalizarNombre(calleNormalizada || direccionFinal || ''),
        altura_destino: alturaDestino,
        piso: normalizarNombre(pisoNormalizado),
        dpto: normalizarNombre(pisoNormalizado),
        codpostal_destino: codigoPostalFinal,
        destino_nombre: normalizarNombre(nombreDestinatario),
        destino_email: email.toLowerCase().trim(),
        cod_area_tel: codigoArea,
        tel: numeroTelefono,
        cod_area_cel: codigoArea,
        cel: numeroTelefono,
        numero_orden: numeroOrdenLimpio
      };
      
      correoArgentinoOrders.push(domicilioOrder);
      domiciliosOrders.push(domicilioOrder);
    }
  }

  const processingInfo = {
    totalOrders: rows.length,
    procesados: contadorDomicilio + contadorSucursal,
    domicilios: contadorDomicilio,
    sucursales: contadorSucursal,
    noProcesados: contadorNoProcesados,
    processingLogs: [
      `Total pedidos cargados: ${rows.length}`,
      `Domicilios procesados: ${contadorDomicilio}`,
      `Sucursales procesadas: ${contadorSucursal}`,
      `No procesados: ${contadorNoProcesados}`,
    ],
    noProcessedReason: contadorNoProcesados > 0 ? 'Algunos pedidos no pudieron ser procesados. Ver errores.' : '',
    errores: errores.length > 0 ? errores : undefined,
    droppedOrders: droppedOrders.length > 0 ? droppedOrders : undefined,
    autofilledEmails: autofilledEmails.length > 0 ? autofilledEmails : undefined,
  };

  return {
    correoArgentinoCSV: unparseCSV(correoArgentinoOrders),
    domicilioCSV: unparseCSV(domiciliosOrders),
    sucursalCSV: unparseCSV(sucursalesOrders),
    processingInfo,
  };
};

// Procesar órdenes de TiendaNube/Shopify para Correo Argentino
export const processOrdersCorreoArgentino = async (
  csvText: string,
  config?: { peso: number; largo: number; ancho: number; altura: number; valorDeclarado: number }
): Promise<{
  correoArgentinoCSV: string;
  domicilioCSV: string;
  sucursalCSV: string;
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
    return await processShopifyOrdersCorreoArgentino(csvText, finalConfig);
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
      
      // Valor del contenido fijo: 6000 pesos argentinos
      const valorContenido = '6000.00';
      
      // Limpiar número de orden (remover # y otros caracteres especiales)
      const numeroOrdenLimpio = numeroOrden.replace(/^#+/g, '').trim();
      
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
        // PRIORIZAR LOCALIDAD sobre ciudad - la localidad es más específica para Correo Argentino
        // Si la localidad está vacía, usar ciudad como fallback
        let localidadParaBusqueda = localidadLimpia || ciudadLimpia || '';
        
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
        else if (!localidadLimpia && ciudadLimpia && ciudadNormalizada !== 'CAPITAL') {
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
        
        // Validar que el código de sucursal encontrado corresponde a la provincia correcta
        // Y usar el código de provincia de la sucursal (no del pedido)
        const sucursalEncontrada = correoArgentinoSucursales.find(s => s.codigo === sucursalCodigo);
        let codigoProvinciaFinal = codigoProvincia;
        
        if (sucursalEncontrada) {
          // Obtener el código de provincia de la sucursal encontrada (no del pedido)
          const codigoProvinciaSucursal = getCodigoProvinciaCorreoArgentino(sucursalEncontrada.provincia);
          
          if (codigoProvinciaSucursal) {
            // Usar el código de provincia de la sucursal
            codigoProvinciaFinal = codigoProvinciaSucursal;
            console.log(`   ℹ️ Usando código de provincia de sucursal: ${codigoProvinciaFinal} (${sucursalEncontrada.provincia}) en lugar de ${codigoProvincia} (${provincia})`);
          } else {
            // Si no se puede obtener el código de provincia de la sucursal, usar el del pedido pero advertir
            console.warn(`   ⚠️ No se pudo obtener código de provincia para ${sucursalEncontrada.provincia}, usando código del pedido: ${codigoProvincia}`);
          }
        }
        
        const sucursalOrder: CorreoArgentinoOutput = {
          tipo_producto: 'CP',
          largo: finalConfig.largo.toString(),
          ancho: finalConfig.ancho.toString(),
          altura: finalConfig.altura.toString(),
          peso: finalConfig.peso.toFixed(3),
          valor_del_contenido: valorContenido,
          provincia_destino: codigoProvinciaFinal,
          sucursal_destino: sucursalCodigo.toUpperCase().trim(), // Código en mayúsculas, sin normalizar
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
          numero_orden: numeroOrdenLimpio
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
          numero_orden: numeroOrdenLimpio
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

