// 🧪 SCRIPT DE PRUEBA - CASOS FALLIDOS DE ENVÍOS
// Reproduce los casos problemáticos reportados por el usuario

import { findSucursalByAddressImproved, extraerDatosGeograficos, filtrarPorProvincia } from '../services/csvProcessor';
import { getSucursalesData } from '../services/sucursalesData';
import { validarEnvioAntesDeProcesar, PedidoParaValidar } from '../services/validacionEnvios';

interface CasoFallido {
  pedido: string;
  cliente: string;
  direccion: string;
  sucursalEsperada: string;
  sucursalEnviadaError: string;
  provincia: string;
  descripcionError: string;
}

// 📋 CASOS REPORTADOS POR EL USUARIO
const casosFallidos: CasoFallido[] = [
  {
    pedido: "5625",
    cliente: "Facundo Augusto Robledo",
    direccion: "GRAL SAN MARTÍN 344, San Miguel de Tucumán, Tucumán, cp: 4000",
    sucursalEsperada: "TUCUMAN (PARQUE INDUSTRIAL)",
    sucursalEnviadaError: "Florencio Varela",
    provincia: "Tucumán",
    descripcionError: "se envió a una sucursal en florencio varela, y era en tucuman"
  },
  {
    pedido: "5511",
    cliente: "Pablo Luis Jullier",
    direccion: "Autovía Ruta 19 km 2, Santo Tome, Santa Fe, cp: 3016",
    sucursalEsperada: "Sucursal en Santa Fe",
    sucursalEnviadaError: "sucursal equivocada",
    provincia: "Santa Fe",
    descripcionError: "fue enviado a la sucursal equivocada"
  },
  {
    pedido: "5383",
    cliente: "Walter Fernández",
    direccion: "Ruta Nacional 12 (Km 1335), Posadas, Misiones, 3300",
    sucursalEsperada: "POSADAS (BARRIO ITAEMBE GUAZU)",
    sucursalEnviadaError: "Catamarca",
    provincia: "Misiones",
    descripcionError: "fue enviado a la sucursal equivocada, era a Misiones y fue a Catamarca"
  },
  {
    pedido: "5364",
    cliente: "Joaquin Poblete",
    direccion: "Av. Libertador Gral. San Martin Este, 1150, San Juan, San Juan, 5400",
    sucursalEsperada: "SAN JUAN (AV 25 DE MAYO ESTE)",
    sucursalEnviadaError: "Formosa",
    provincia: "San Juan",
    descripcionError: "fue enviado a formosa y era a san juan"
  },
  {
    pedido: "5613",
    cliente: "Gaston Gorosito",
    direccion: "Avenida Vucetich, 298, Rawson, Chubut, 9103",
    sucursalEsperada: "Sucursal en Chubut (más cercana)",
    sucursalEnviadaError: "Buenos Aires",
    provincia: "Chubut",
    descripcionError: "se envió a buenos aires, y el pedido era a chubut"
  },
  {
    pedido: "5352",
    cliente: "Clara Caballero",
    direccion: "Av. San Martín, 191, San Lorenzo, Santa Fe, 2200",
    sucursalEsperada: "Sucursal en Santa Fe",
    sucursalEnviadaError: "sucursal lejana",
    provincia: "Santa Fe",
    descripcionError: "se le envió a una sucursal lejana, no a la que solicitó"
  },
  {
    pedido: "5542",
    cliente: "Marcos Duarte",
    direccion: "Florida, 719, C.A.B.A., Buenos Aires, cp: 1053",
    sucursalEsperada: "Sucursal en CABA",
    sucursalEnviadaError: "Mendoza",
    provincia: "Buenos Aires",
    descripcionError: "fue enviado a Mendoza su pedido, y él es de capital federal"
  },
  {
    pedido: "5633",
    cliente: "Guillermo Fernando Orozco",
    direccion: "Gral. José de San Martín, 1175, San Miguel De Tucuman, Tucuman, cp: 4000",
    sucursalEsperada: "TUCUMAN (PARQUE INDUSTRIAL)",
    sucursalEnviadaError: "Florencio Varela",
    provincia: "Tucumán",
    descripcionError: "se envió a florencio varela, no a Tucumán"
  }
];

// 🧪 EJECUTAR PRUEBAS
export const ejecutarPruebasCasosFallidos = async () => {
  console.log('🧪 === EJECUTANDO PRUEBAS DE CASOS FALLIDOS ===\n');
  
  const sucursales = await getSucursalesData();
  let casosCorregidos = 0;
  let casosAunProblematicos = 0;

  for (const caso of casosFallidos) {
    console.log(`🔍 Probando caso ${caso.pedido} - ${caso.cliente}`);
    console.log(`📍 Dirección: ${caso.direccion}`);
    console.log(`❌ Error anterior: ${caso.descripcionError}`);
    
    // Probar con el nuevo algoritmo
    try {
      const sucursalSeleccionada = findSucursalByAddressImproved(caso.direccion, sucursales);
      console.log(`🎯 Sucursal seleccionada por nuevo algoritmo: ${sucursalSeleccionada}`);
      
      // Validar el resultado
      const pedidoValidacion: PedidoParaValidar = {
        numeroOrden: caso.pedido,
        direccion: caso.direccion,
        sucursalSeleccionada: sucursalSeleccionada,
        tipoEnvio: 'sucursal',
        provincia: caso.provincia,
        ciudad: extraerCiudadDeDireccion(caso.direccion)
      };
      
      const validacion = validarEnvioAntesDeProcesar(pedidoValidacion);
      
      if (validacion.esValido && !sucursalSeleccionada.includes('❌')) {
        console.log(`✅ CASO CORREGIDO: Algoritmo mejorado funciona correctamente`);
        casosCorregidos++;
      } else {
        console.log(`❌ AÚN PROBLEMÁTICO:`);
        validacion.errores.forEach(error => console.log(`   ${error}`));
        validacion.advertencias.forEach(adv => console.log(`   ${adv}`));
        casosAunProblematicos++;
      }
      
      // Verificar si coincide con provincia esperada
      if (verificarCoincidenciaProvincia(sucursalSeleccionada, caso.provincia)) {
        console.log(`✅ Provincia correcta: ${caso.provincia}`);
      } else {
        console.log(`❌ Provincia incorrecta para: ${caso.provincia}`);
      }
      
    } catch (error) {
      console.log(`💥 Error al procesar caso: ${error}`);
      casosAunProblematicos++;
    }
    
    console.log('─────────────────────────────────────────────────────────────\n');
  }

  // Resumen final
  console.log('📊 === RESUMEN DE PRUEBAS ===');
  console.log(`Total casos probados: ${casosFallidos.length}`);
  console.log(`✅ Casos corregidos: ${casosCorregidos}`);
  console.log(`❌ Casos aún problemáticos: ${casosAunProblematicos}`);
  console.log(`🎯 Tasa de mejora: ${Math.round((casosCorregidos / casosFallidos.length) * 100)}%`);

  if (casosCorregidos === casosFallidos.length) {
    console.log('🎉 ¡ÉXITO TOTAL! Todos los casos han sido corregidos.');
  } else if (casosCorregidos > casosFallidos.length / 2) {
    console.log('🎯 MEJORA SIGNIFICATIVA. La mayoría de casos están corregidos.');
  } else {
    console.log('⚠️ NECESITA MÁS TRABAJO. Varios casos aún requieren atención.');
  }
};

// 🔧 FUNCIONES AUXILIARES
const extraerCiudadDeDireccion = (direccion: string): string => {
  const componentes = direccion.split(',').map(c => c.trim());
  // Generalmente la ciudad está en el segundo o tercer componente
  return componentes[2] || componentes[1] || '';
};

const verificarCoincidenciaProvincia = (sucursal: string, provinciaEsperada: string): boolean => {
  const sucursalNorm = sucursal.toLowerCase();
  const provNorm = provinciaEsperada.toLowerCase();
  
  const mapeoProvincias: { [key: string]: string[] } = {
    'tucumán': ['tucuman', 'san miguel de tucumán'],
    'san juan': ['san juan'],
    'misiones': ['posadas', 'misiones'],
    'chubut': ['chubut', 'comodoro', 'puerto madryn', 'trelew', 'esquel'],
    'santa fe': ['santa fe', 'rosario'],
    'buenos aires': ['buenos aires', 'capital federal', 'caba', 'belgrano', 'palermo', 'barracas']
  };
  
  if (mapeoProvincias[provNorm]) {
    return mapeoProvincias[provNorm].some(provincia => sucursalNorm.includes(provincia));
  }
  
  return sucursalNorm.includes(provNorm);
};

// 🎯 CASOS ESPECÍFICOS DE PRUEBA INDIVIDUAL
export const probarCasoEspecifico = async (numeroPedido: string) => {
  const caso = casosFallidos.find(c => c.pedido === numeroPedido);
  if (!caso) {
    console.log(`❌ No se encontró el caso ${numeroPedido}`);
    return;
  }

  console.log(`🔍 Analizando caso específico ${caso.pedido} en detalle:`);
  console.log(`Cliente: ${caso.cliente}`);
  console.log(`Dirección: ${caso.direccion}`);
  console.log(`Problema: ${caso.descripcionError}`);
  
  const sucursales = await getSucursalesData();
  
  // Probar extracción de datos
  const { calle, ciudad, provincia, codigoPostal } = extraerDatosGeograficos(caso.direccion);
  console.log('\n📊 Datos extraídos:');
  console.log(`   Calle: ${calle}`);
  console.log(`   Ciudad: ${ciudad}`);
  console.log(`   Provincia: ${provincia}`);
  console.log(`   CP: ${codigoPostal}`);
  
  // Probar filtrado por provincia
  const sucursalesProvincia = filtrarPorProvincia(sucursales, provincia);
  console.log(`\n🏛️ Sucursales en ${provincia}: ${sucursalesProvincia.length}`);
  sucursalesProvincia.slice(0, 3).forEach(suc => 
    console.log(`   - ${suc.nombre_sucursal}`)
  );
  
  // Resultado final
  const resultado = findSucursalByAddressImproved(caso.direccion, sucursales);
  console.log(`\n🎯 Sucursal seleccionada: ${resultado}`);
  
  if (verificarCoincidenciaProvincia(resultado, caso.provincia)) {
    console.log('✅ Provincia correcta');
  } else {
    console.log('❌ Provincia incorrecta - REQUIERE ATENCIÓN');
  }
};

// 🚀 FUNCIÓN PRINCIPAL PARA EJECUTAR DESDE CONSOLA
if (typeof window === 'undefined') {
  // Solo ejecutar si estamos en Node.js, no en el browser
  ejecutarPruebasCasosFallidos().catch(console.error);
}
