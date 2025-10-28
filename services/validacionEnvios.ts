// 🚨 SISTEMA DE VALIDACIÓN DE ENVÍOS ANDREANI
// Previene errores costosos antes del envío

export interface ValidacionResult {
  esValido: boolean;
  errores: string[];
  advertencias: string[];
  sucursalRecomendada?: string;
  accionRequerida?: string;
}

export interface PedidoParaValidar {
  numeroOrden: string;
  direccion: string;
  sucursalSeleccionada: string;
  tipoEnvio: 'domicilio' | 'sucursal';
  provincia: string;
  ciudad: string;
}

// 🔍 VALIDADOR PRINCIPAL
export const validarEnvioAntesDeProcesar = (pedido: PedidoParaValidar): ValidacionResult => {
  const resultado: ValidacionResult = {
    esValido: true,
    errores: [],
    advertencias: []
  };

  console.log(`🔍 Validando pedido ${pedido.numeroOrden}...`);

  // 1️⃣ VALIDACIONES CRÍTICAS (errores que bloquean envío)
  
  // Verificar si hay sucursal en provincia
  if (pedido.tipoEnvio === 'sucursal' && pedido.sucursalSeleccionada.includes('❌ SIN SUCURSAL')) {
    resultado.esValido = false;
    resultado.errores.push(`🚨 CRÍTICO: No existe sucursal Andreani en ${pedido.provincia}`);
    resultado.accionRequerida = `Cambiar a envío a domicilio o contactar cliente para otra provincia`;
  }

  // Verificar coincidencia de provincia
  if (pedido.tipoEnvio === 'sucursal' && !verificarCoincidenciaProvincia(pedido)) {
    resultado.esValido = false;
    resultado.errores.push(`🚨 CRÍTICO: Sucursal ${pedido.sucursalSeleccionada} NO está en ${pedido.provincia}`);
    resultado.accionRequerida = `Revisar manualmente la selección de sucursal`;
  }

  // 2️⃣ VALIDACIONES DE ADVERTENCIA (no bloquean pero requieren atención)
  
  // Verificar coherencia geográfica
  if (pedido.tipoEnvio === 'sucursal' && !verificarCoherenciaGeografica(pedido)) {
    resultado.advertencias.push(`⚠️ VERIFICAR: Sucursal puede estar lejos de ${pedido.ciudad}`);
  }

  // Verificar patrones de errores anteriores
  const patronesProblematicos = detectarPatronesProblematicos(pedido);
  resultado.advertencias.push(...patronesProblematicos);

  return resultado;
};

// 🗺️ VERIFICAR COINCIDENCIA DE PROVINCIA
const verificarCoincidenciaProvincia = (pedido: PedidoParaValidar): boolean => {
  const provinciasProblemáticas = [
    { pedido: 'tucumán', sucursal: ['florencio varela', 'buenos aires'] },
    { pedido: 'san juan', sucursal: ['formosa'] },
    { pedido: 'misiones', sucursal: ['catamarca'] },
    { pedido: 'chubut', sucursal: ['buenos aires'] },
    { pedido: 'santa fe', sucursal: ['mendoza'] }
  ];

  const provPedido = pedido.provincia.toLowerCase();
  const sucursalNorm = pedido.sucursalSeleccionada.toLowerCase();

  for (const problema of provinciasProblemáticas) {
    if (provPedido.includes(problema.pedido)) {
      const tieneProblema = problema.sucursal.some(suc => sucursalNorm.includes(suc));
      if (tieneProblema) {
        return false;
      }
    }
  }

  return true;
};

// 🌍 VERIFICAR COHERENCIA GEOGRÁFICA
const verificarCoherenciaGeografica = (pedido: PedidoParaValidar): boolean => {
  // Mapeo de ciudades principales por provincia
  const ciudadesPrincipales: { [key: string]: string[] } = {
    'tucumán': ['san miguel de tucumán', 'tucuman', 'concepcion'],
    'san juan': ['san juan'],
    'misiones': ['posadas', 'oberá', 'eldorado'],
    'chubut': ['comodoro rivadavia', 'puerto madryn', 'trelew', 'esquel'],
    'santa fe': ['santa fe', 'rosario', 'santo tomé'],
    'formosa': ['formosa', 'clorinda']
  };

  const provPedido = pedido.provincia.toLowerCase();
  const ciudadPedido = pedido.ciudad.toLowerCase();
  const sucursalNorm = pedido.sucursalSeleccionada.toLowerCase();

  // Verificar si la ciudad del pedido tiene coherencia con la sucursal
  if (ciudadesPrincipales[provPedido]) {
    const ciudadesValidas = ciudadesPrincipales[provPedido];
    const ciudadTieneCoherencia = ciudadesValidas.some(ciudad => 
      sucursalNorm.includes(ciudad) || ciudadPedido.includes(ciudad)
    );
    
    return ciudadTieneCoherencia;
  }

  return true; // Si no conocemos la provincia, asumir coherencia
};

// 🔍 DETECTAR PATRONES PROBLEMÁTICOS
const detectarPatronesProblematicos = (pedido: PedidoParaValidar): string[] => {
  const advertencias: string[] = [];
  const sucursalNorm = pedido.sucursalSeleccionada.toLowerCase();
  const direccionNorm = pedido.direccion.toLowerCase();

  // Patrón: San Martín coincide con muchas sucursales
  if (direccionNorm.includes('san martin') && sucursalNorm.includes('varela')) {
    advertencias.push(`⚠️ PATRÓN RIESGOSO: "San Martín" puede matchear sucursales incorrectas`);
  }

  // Patrón: Rutas nacionales deben ser específicas
  if (direccionNorm.includes('ruta') && !sucursalNorm.includes('ruta') && !sucursalNorm.includes('rn')) {
    advertencias.push(`⚠️ VERIFICAR: Dirección de ruta nacional, revisar sucursal seleccionada`);
  }

  // Patrón: Avenidas principales genéricas
  if ((direccionNorm.includes('libertador') || direccionNorm.includes('mitre')) && 
      sucursalNorm.includes('varela')) {
    advertencias.push(`⚠️ RIESGO: Direcciones genéricas pueden causar match incorrecto`);
  }

  return advertencias;
};

// 📊 GENERAR REPORTE DE VALIDACIÓN
export const generarReporteValidacion = (pedidos: PedidoParaValidar[]): void => {
  console.log('\n=== 📊 REPORTE DE VALIDACIÓN DE ENVÍOS ===');
  
  let totalPedidos = pedidos.length;
  let pedidosValidos = 0;
  let pedidosConErrores = 0;
  let pedidosConAdvertencias = 0;

  pedidos.forEach(pedido => {
    const validacion = validarEnvioAntesDeProcesar(pedido);
    
    if (validacion.esValido) {
      pedidosValidos++;
    } else {
      pedidosConErrores++;
    }
    
    if (validacion.advertencias.length > 0) {
      pedidosConAdvertencias++;
    }

    // Mostrar solo problemas
    if (!validacion.esValido || validacion.advertencias.length > 0) {
      console.log(`\n🔍 Pedido ${pedido.numeroOrden}:`);
      
      if (validacion.errores.length > 0) {
        console.log('   ❌ ERRORES:');
        validacion.errores.forEach(error => console.log(`      ${error}`));
        if (validacion.accionRequerida) {
          console.log(`   💡 ACCIÓN: ${validacion.accionRequerida}`);
        }
      }
      
      if (validacion.advertencias.length > 0) {
        console.log('   ⚠️  ADVERTENCIAS:');
        validacion.advertencias.forEach(adv => console.log(`      ${adv}`));
      }
    }
  });

  console.log(`\n📈 RESUMEN:`);
  console.log(`   Total pedidos: ${totalPedidos}`);
  console.log(`   ✅ Válidos: ${pedidosValidos}`);
  console.log(`   ❌ Con errores: ${pedidosConErrores}`);
  console.log(`   ⚠️  Con advertencias: ${pedidosConAdvertencias}`);
  
  if (pedidosConErrores > 0) {
    console.log(`\n🚨 ATENCIÓN: ${pedidosConErrores} pedidos requieren corrección antes del envío`);
  }
};

// 🎯 SUGERENCIAS DE MEJORA
export const generarSugerenciasMejora = (): void => {
  console.log('\n=== 💡 SUGERENCIAS DE MEJORA ===');
  console.log('1. Validar siempre provincia antes de seleccionar sucursal');
  console.log('2. Implementar lista de direcciones "problemáticas" conocidas');
  console.log('3. Añadir confirmación manual para envíos fuera de ciudad principal');
  console.log('4. Crear base de datos de errores anteriores para aprender');
  console.log('5. Implementar geocodificación para verificar distancias reales');
};
