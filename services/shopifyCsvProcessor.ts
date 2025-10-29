
import { 
  ShopifyOrder, 
  AndreaniSucursalInfo,
  AndreaniDomicilioOutput,
  AndreaniSucursalOutput,
  ProcessingInfo
} from '../types';
import { getSucursalesData } from './sucursalesData';
import { fixEncoding } from './csvProcessor';

// PapaParse is loaded from a CDN and available as a global variable.
declare const Papa: any;

// Función para parsear CSV de Shopify
const parseShopifyCSV = <T,>(csvText: string): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    console.log('Iniciando parsing del CSV de Shopify...');
    
    // Remover BOM si existe y corregir problemas de codificación UTF-8
    let cleanText = csvText.replace(/^\uFEFF/, '');
    cleanText = fixEncoding(cleanText);
    
    Papa.parse(cleanText, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        console.log('CSV de Shopify parseado:', results.data.length, 'filas');
        resolve(results.data);
      },
      error: (error: any) => {
        console.error('Error al parsear CSV de Shopify:', error);
        reject(error);
      }
    });
  });
};

// Cargar sucursales
const fetchSucursales = async (): Promise<AndreaniSucursalInfo[]> => {
  try {
    console.log('=== Cargando sucursales para Shopify ===');
    const sucursales = getSucursalesData();
    console.log('✅ Sucursales cargadas:', sucursales.length);
    return sucursales;
  } catch (error) {
    console.error("Error al cargar sucursales:", error);
    throw new Error("No se pudo cargar los datos de sucursales.");
  }
};

// Función para limpiar campos de texto (reutilizada de csvProcessor)
const limpiarCampoTexto = (texto: string): string => {
  if (!texto) return '';
  
  let textoLimpio = texto
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
    .replace(/[Ç]/g, 'C')
    .replace(/\./g, ' ')
    .replace(/\//g, ' ')
    .replace(/\\/g, ' ')
    .replace(/\|/g, ' ')
    .replace(/:/g, ' ')
    .replace(/;/g, ' ')
    .replace(/"/g, '')
    .replace(/'/g, '')
    .replace(/`/g, '')
    .replace(/\*/g, '')
    .replace(/\?/g, '')
    .replace(/!/g, '')
    .replace(/@/g, ' ')
    .replace(/#/g, '')
    .replace(/\$/g, '')
    .replace(/%/g, '')
    .replace(/&/g, ' y ')
    .replace(/\+/g, ' ')
    .replace(/=/g, ' ')
    .replace(/\[/g, '')
    .replace(/\]/g, '')
    .replace(/\{/g, '')
    .replace(/\}/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/<</g, '')
    .replace(/>>/g, '')
    .replace(/~/g, '')
    .replace(/\^/g, '')
    .replace(/[\s]+/g, ' ')
    .trim();
  
  return textoLimpio;
};

// Detectar si el método de envío es a sucursal
const esEnvioSucursal = (shippingMethod: string): boolean => {
  if (!shippingMethod) return false;
  
  const methodLower = shippingMethod.toLowerCase();
  // Buscar palabras clave que indiquen sucursal
  const keywordsSucursal = ['sucursal', 'pickup', 'retiro', 'punto', 'andreani'];
  const keywordsDomicilio = ['domicilio', 'delivery', 'envío', 'envio'];
  
  // Si contiene palabras de sucursal Y no contiene palabras de domicilio
  const tieneSucursal = keywordsSucursal.some(kw => methodLower.includes(kw));
  const tieneDomicilio = keywordsDomicilio.some(kw => methodLower.includes(kw));
  
  // Si contiene "andreani" pero NO contiene "domicilio" o "envio", probablemente es sucursal
  if (methodLower.includes('andreani') && !tieneDomicilio) {
    return !methodLower.includes('domicilio') && !methodLower.includes('envio');
  }
  
  return tieneSucursal && !tieneDomicilio;
};

// Normalizar dirección para búsqueda
const normalizarDireccionParaBusqueda = (texto: string): string => {
  return texto.toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[\.]/g, '')
    .replace(/[\s]+/g, ' ')
    .trim();
};

// Buscar sucursal por código postal (solo sucursales, NO punto hop)
const findSucursalByPostalCode = (codigoPostal: string, provincia: string, sucursales: AndreaniSucursalInfo[]): string => {
  console.log(`=== Buscando sucursal por código postal: ${codigoPostal}, Provincia: ${provincia} ===`);
  
  if (!codigoPostal || codigoPostal.length < 4) {
    console.log('⚠️ Código postal inválido o muy corto');
    return 'SUCURSAL NO ENCONTRADA';
  }
  
  // Limpiar código postal (solo números)
  const cpLimpio = codigoPostal.replace(/\D/g, '');
  if (cpLimpio.length < 4) {
    console.log('⚠️ Código postal inválido después de limpiar');
    return 'SUCURSAL NO ENCONTRADA';
  }
  
  // Normalizar provincia
  const provinciaNorm = normalizarDireccionParaBusqueda(provincia || '');
  
  // Filtrar solo sucursales (NO punto hop)
  const sucursalesFiltradas = sucursales.filter(suc => {
    const esPuntoHop = suc.nombre_sucursal.toLowerCase().includes('punto andreani hop');
    return !esPuntoHop; // Excluir punto hop
  });
  
  console.log(`📋 Sucursales disponibles (sin punto hop): ${sucursalesFiltradas.length}`);
  
  // Buscar sucursales que coincidan con el código postal
  const matchesPorCP: Array<{ sucursal: AndreaniSucursalInfo; score: number }> = [];
  
  for (const suc of sucursalesFiltradas) {
    const dirSuc = suc.direccion || '';
    
    // Buscar el código postal en la dirección de la sucursal
    const cpEncontrado = dirSuc.match(/\b(\d{4,5})\b/g);
    
    if (cpEncontrado) {
      for (const cp of cpEncontrado) {
        const cpSucursal = cp.replace(/\D/g, '');
        
        // Coincidencia exacta del código postal
        if (cpSucursal === cpLimpio) {
          let score = 100; // Base score por coincidencia exacta
          
          // Bonus si la provincia también coincide
          const provSucursal = normalizarDireccionParaBusqueda(dirSuc);
          if (provinciaNorm && provSucursal.includes(provinciaNorm)) {
            score += 50;
            console.log(`✅ Match exacto CP + provincia: ${suc.nombre_sucursal}`);
          } else {
            console.log(`✅ Match exacto CP: ${suc.nombre_sucursal}`);
          }
          
          matchesPorCP.push({ sucursal: suc, score });
        }
        // Coincidencia parcial (primeros 4 dígitos)
        else if (cpSucursal.startsWith(cpLimpio.substring(0, 4)) || cpLimpio.startsWith(cpSucursal.substring(0, 4))) {
          let score = 50; // Score menor por coincidencia parcial
          
          // Bonus si la provincia coincide
          const provSucursal = normalizarDireccionParaBusqueda(dirSuc);
          if (provinciaNorm && provSucursal.includes(provinciaNorm)) {
            score += 30;
          }
          
          matchesPorCP.push({ sucursal: suc, score });
          console.log(`⚠️ Match parcial CP: ${suc.nombre_sucursal}`);
        }
      }
    }
  }
  
  // Ordenar por score descendente
  matchesPorCP.sort((a, b) => b.score - a.score);
  
  if (matchesPorCP.length > 0) {
    const mejorMatch = matchesPorCP[0].sucursal;
    console.log(`✅ Sucursal seleccionada: ${mejorMatch.nombre_sucursal}`);
    return mejorMatch.nombre_sucursal;
  }
  
  // Si no hay match por CP, buscar por provincia solamente
  if (provinciaNorm) {
    const matchesPorProvincia = sucursalesFiltradas.filter(suc => {
      const dirSuc = normalizarDireccionParaBusqueda(suc.direccion || '');
      return dirSuc.includes(provinciaNorm);
    });
    
    if (matchesPorProvincia.length > 0) {
      console.log(`⚠️ Usando sucursal por provincia (sin match de CP): ${matchesPorProvincia[0].nombre_sucursal}`);
      return matchesPorProvincia[0].nombre_sucursal;
    }
  }
  
  console.log('❌ No se encontró sucursal');
  return 'SUCURSAL NO ENCONTRADA';
};

// Obtener código de área del teléfono
const getCodigoArea = (provincia: string, phone: string): { codigo: string; numero: string } => {
  const provinciaLower = provincia.toLowerCase();
  let cleanPhone = phone.replace(/\D/g, '');
  
  // Remover prefijo internacional +54
  if (cleanPhone.startsWith('54')) {
    cleanPhone = cleanPhone.substring(2);
  }
  
  // Remover "9" adicional de celulares argentinos
  if (cleanPhone.startsWith('9')) {
    cleanPhone = cleanPhone.substring(1);
  }
  
  // Buenos Aires
  if ((provinciaLower.includes('buenos aires') || provinciaLower.includes('capital federal') || provinciaLower.includes('caba')) && cleanPhone.startsWith('11')) {
    return { codigo: '11', numero: cleanPhone.substring(2) };
  }
  
  // Códigos de 3 dígitos
  const codigos3 = ['221', '223', '291', '341', '342', '343', '351', '358', '261', '381', '376', '362', '379', '370', '387', '388', '380', '383', '385', '264', '297', '299'];
  for (const cod of codigos3) {
    if (cleanPhone.startsWith(cod)) {
      return { codigo: cod, numero: cleanPhone.substring(3) };
    }
  }
  
  // Códigos de 4 dígitos
  const codigos4 = ['2652', '2901', '2920', '2944', '2954', '2965', '2966', '3541'];
  for (const cod of codigos4) {
    if (cleanPhone.startsWith(cod)) {
      return { codigo: cod, numero: cleanPhone.substring(4) };
    }
  }
  
  // Fallback: primeros 4 dígitos
  return { codigo: cleanPhone.substring(0, 4), numero: cleanPhone.substring(4) };
};

// Convertir array de objetos a CSV
const arrayToCSV = (data: any[]): string => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvLines = [headers.join(';')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      return String(value);
    });
    csvLines.push(values.join(';'));
  });
  
  return csvLines.join('\n');
};

// Procesar órdenes de Shopify
export const processShopifyOrders = async (
  shopifyCsvText: string, 
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
  
  // Cargar datos necesarios
  const [sucursales, shopifyOrders] = await Promise.all([
    fetchSucursales(),
    parseShopifyCSV<ShopifyOrder>(shopifyCsvText),
  ]);
  
  console.log('=== PROCESANDO ÓRDENES DE SHOPIFY ===');
  console.log('Total órdenes cargadas:', shopifyOrders.length);
  
  const domicilios: AndreaniDomicilioOutput[] = [];
  const sucursalesOutput: AndreaniSucursalOutput[] = [];
  
  let contadorDomicilios = 0;
  let contadorSucursales = 0;
  let contadorNoProcesados = 0;
  const processingLogs: string[] = [];
  let shopifySucursalOrders = 0;
  
  // Agrupar por número de orden (ya que Shopify puede tener múltiples lineitems)
  const ordersMap = new Map<string, ShopifyOrder[]>();
  
  for (const order of shopifyOrders) {
    const orderNumber = order.Name?.trim() || '';
    if (!orderNumber) continue;
    
    if (!ordersMap.has(orderNumber)) {
      ordersMap.set(orderNumber, []);
    }
    ordersMap.get(orderNumber)!.push(order);
  }
  
  console.log(`Órdenes únicas: ${ordersMap.size}`);
  
  // Procesar cada orden única
  for (const [orderNumber, lineItems] of ordersMap.entries()) {
    // Usar la primera línea (que tiene la información completa)
    const order = lineItems[0];
    
    // Verificar que tenga información financiera
    if (!order['Financial Status'] || order['Financial Status'].toLowerCase() !== 'paid') {
      console.log(`⏭️ Orden ${orderNumber} no pagada, omitiendo`);
      contadorNoProcesados++;
      continue;
    }
    
    // Extraer información del pedido
    const nombreCompleto = order['Shipping Name'] || order['Billing Name'] || '';
    const [nombre, ...apellidoParts] = nombreCompleto.split(' ');
    const apellido = apellidoParts.join(' ') || nombre; // Si no hay apellido, usar nombre
    
    const email = order['Email'] || '';
    const telefono = order['Shipping Phone'] || order['Billing Phone'] || '';
    const provincia = order['Shipping Province'] || '';
    const ciudad = order['Shipping City'] || '';
    const direccion1 = order['Shipping Address1'] || '';
    const direccion2 = order['Shipping Address2'] || '';
    const codigoPostal = order['Shipping Zip']?.replace(/'/g, '') || ''; // Remover comilla simple al inicio
    const shippingMethod = order['Shipping Method'] || '';
    
    // Procesar DNI (Shopify no tiene DNI directo, usar email o generar placeholder)
    // Como Shopify no proporciona DNI, usaremos un placeholder
    const dniProcesado = '00000000'; // Placeholder, debería ser configurable
    
    // Separar teléfono
    const { codigo: celularCodigo, numero: celularNumero } = getCodigoArea(provincia, telefono);
    
    // Extraer calle y número de la dirección
    const direccionCompleta = `${direccion1} ${direccion2}`.trim();
    let calle = direccionCompleta;
    let numero = '';
    
    // Intentar extraer número de la dirección
    const numeroMatch = direccionCompleta.match(/\b(\d+)\b/);
    if (numeroMatch) {
      numero = numeroMatch[1];
      calle = direccionCompleta.replace(numero, '').trim();
    }
    
    // Determinar si es a domicilio o sucursal
    const esSucursal = esEnvioSucursal(shippingMethod);
    
    const baseData = {
      'Paquete Guardado Ej:': '',
      'Peso (grs)': finalConfig.peso,
      'Alto (cm)': finalConfig.alto,
      'Ancho (cm)': finalConfig.ancho,
      'Profundidad (cm)': finalConfig.profundidad,
      'Valor declarado ($ C/IVA) *': finalConfig.valorDeclarado,
      'Numero Interno': `#${orderNumber.replace('#', '')}`,
      'Nombre *': limpiarCampoTexto(nombre),
      'Apellido *': limpiarCampoTexto(apellido),
      'DNI *': dniProcesado,
      'Email *': email,
      'Celular código *': celularCodigo,
      'Celular número *': celularNumero,
    };
    
    if (esSucursal) {
      // Buscar sucursal por código postal
      const nombreSucursal = findSucursalByPostalCode(codigoPostal, provincia, sucursales);
      
      shopifySucursalOrders++;
      
      const sucursalData: AndreaniSucursalOutput = {
        ...baseData,
        'Sucursal *': nombreSucursal,
      };
      
      sucursalesOutput.push(sucursalData);
      contadorSucursales++;
      
      processingLogs.push(`✅ Orden ${orderNumber}: Sucursal - ${nombreSucursal}`);
    } else {
      // Es a domicilio
      const domicilioCompleto = `${ciudad}, ${provincia}, ${codigoPostal}`.replace(/^,\s*|,\s*$/g, '').trim();
      
      const domicilioData: AndreaniDomicilioOutput = {
        ...baseData,
        'Calle *': limpiarCampoTexto(calle),
        'Número *': numero || '0',
        'Piso': limpiarCampoTexto(direccion2),
        'Departamento': '',
        'Provincia / Localidad / CP *': domicilioCompleto,
      };
      
      domicilios.push(domicilioData);
      contadorDomicilios++;
      
      processingLogs.push(`✅ Orden ${orderNumber}: Domicilio - ${ciudad}, ${provincia}`);
    }
  }
  
  const processingInfo: ProcessingInfo = {
    totalOrders: ordersMap.size,
    domiciliosProcessed: contadorDomicilios,
    sucursalesProcessed: contadorSucursales,
    noProcessed: contadorNoProcesados,
    processingLogs,
    hasShopifySucursalWarnings: shopifySucursalOrders > 0,
    shopifySucursalOrders,
  };
  
  console.log('=== RESUMEN DE PROCESAMIENTO ===');
  console.log('Total órdenes:', ordersMap.size);
  console.log('Domicilios:', contadorDomicilios);
  console.log('Sucursales:', contadorSucursales);
  console.log('No procesadas:', contadorNoProcesados);
  
  return {
    domicilioCSV: arrayToCSV(domicilios),
    sucursalCSV: arrayToCSV(sucursalesOutput),
    processingInfo,
  };
};

