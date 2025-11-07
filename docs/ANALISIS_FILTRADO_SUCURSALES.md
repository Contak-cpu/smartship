# 📊 Análisis del Flujo de Filtrado de Sucursales

## 🔍 Contexto del Commit Corregido

**Commit**: `073bd7f31ab7d3197e62f97b204bd65f4c33433b`  
**Problema corregido**: `sucursalesFiltradas` y `sucursalesOficiales` no estaban definidas en `csvProcessor.ts`

---

## 📋 Estado Actual del Flujo de Trabajo

### 1️⃣ **Flujo Principal en `csvProcessor.ts`**

#### **Función: `findSucursalByAddress`**

**Entrada:**
- `direccionPedido`: string - Dirección completa del pedido
- `sucursales`: `AndreaniSucursalInfo[]` - **TODAS las sucursales sin filtrar**
- `codigoPostal?`: string opcional
- `provincia?`: string opcional

**Flujo de Filtrado Actual:**

```typescript
// PASO 1: Buscar coincidencias EXACTAS en TODAS las sucursales
const todasCoincidenciasExactas = sucursales.filter(...)

// PASO 2: Separar en HOP y oficiales (filtrado interno)
const coincidenciasHop = todasCoincidenciasExactas.filter(suc => 
  suc.nombre_sucursal.toLowerCase().startsWith('punto andreani hop')
)
const coincidenciasOficialesPorDireccion = todasCoincidenciasExactas.filter(suc => 
  !suc.nombre_sucursal.toLowerCase().startsWith('punto andreani hop')
)

// PASO 3-5: Filtrado dinámico cuando se necesita
const todasSucursalesOficiales = sucursales.filter(suc => 
  !suc.nombre_sucursal.toLowerCase().startsWith('punto andreani hop')
)
```

**Características:**
- ✅ **Filtrado interno**: Las variables `todasSucursalesOficiales` se definen **dentro** de la función cuando se necesitan
- ✅ **Sin filtrado previo por provincia**: Recibe TODAS las sucursales y filtra internamente
- ✅ **Múltiples puntos de filtrado**: Se filtran las sucursales en diferentes momentos según la lógica

#### **Criterios de Aceptación/Rechazo:**

**✅ ACEPTA:**
1. **Coincidencia exacta HOP**: Si encuentra dirección exacta en "PUNTO ANDREANI HOP" → acepta sin validar CP
2. **Coincidencia exacta oficial + CP válido**: Dirección exacta + código postal coincide
3. **Coincidencia exacta única**: Si hay UNA sola coincidencia exacta, acepta aunque CP no coincida
4. **Capital Federal especial**: Acepta coincidencia exacta aunque CP no coincida (múltiples CPs cercanos)
5. **Búsqueda por CP**: Si no hay coincidencia exacta, busca por código postal en sucursales oficiales
6. **Búsqueda difusa**: Si no hay CP, intenta búsqueda difusa con similitud > 60%

**❌ RECHAZA:**
1. **Sin coincidencias**: No encuentra ninguna coincidencia después de todos los intentos
2. **CP no coincide en múltiples coincidencias**: Si hay múltiples coincidencias y ninguna tiene CP válido (excepto Capital Federal)
3. **Sin código postal y sin coincidencias difusas**: No hay CP ni búsqueda difusa exitosa

**🔍 POR QUÉ RECHAZA:**
- Protección contra envíos a sucursales incorrectas
- Validación de coherencia geográfica
- Prevención de errores costosos

---

### 2️⃣ **Flujo Alternativo en `shopifyCsvProcessor.ts`**

#### **Función: `findSucursalByCodigoPostal`**

**Entrada:**
- `codigoPostal`: string
- `provincia`: string opcional
- `sucursales`: `AndreaniSucursalInfo[]` - **TODAS las sucursales sin filtrar**

**Flujo de Filtrado:**

```typescript
// FILTRADO PREVIO (define sucursalesFiltradas ANTES de usarlas)
const sucursalesFiltradas = sucursales.filter(suc => {
  const esPuntoHop = suc.nombre_sucursal.toLowerCase().includes('punto andreani hop');
  return !esPuntoHop; // Excluir punto hop
})

// Luego usa sucursalesFiltradas en toda la función
for (const suc of sucursalesFiltradas) { ... }
const matchesPorProvincia = sucursalesFiltradas.filter(...)
```

**Características:**
- ✅ **Filtrado previo**: Define `sucursalesFiltradas` ANTES de usarlas
- ✅ **Enfoque por CP**: Prioriza código postal sobre dirección
- ✅ **Sistema de scoring**: Asigna puntuaciones a matches (100 + 50 por provincia)

#### **Criterios de Aceptación/Rechazo:**

**✅ ACEPTA:**
1. **Match exacto CP + provincia**: 150 puntos (100 + 50)
2. **Match exacto CP**: 100 puntos
3. **Match parcial CP + provincia**: 80 puntos (50 + 30)
4. **Match parcial CP**: 50 puntos
5. **Match por provincia**: Si no hay match por CP, busca por provincia

**❌ RECHAZA:**
1. **Sin matches**: No encuentra ningún match por CP ni provincia

---

## 🔄 Diferencia Clave: Problema del Commit vs Estado Actual

### **Problema del Commit (Antes de la corrección):**
Probablemente había código que intentaba usar `sucursalesFiltradas` o `sucursalesOficiales` **antes de definirlas**, o fuera del scope donde se definían.

**Ejemplo del error probable:**
```typescript
// ❌ ERROR: Variable usada antes de definir
const resultado = procesarConFiltradas(sucursalesFiltradas); // Error: no está definida

const sucursalesFiltradas = sucursales.filter(...); // Definida después
```

### **Estado Actual (Después de la corrección):**

#### **En `csvProcessor.ts`:**
- ✅ Variables `todasSucursalesOficiales` se definen **dentro** de la función cuando se necesitan
- ✅ No hay variables globales `sucursalesFiltradas` o `sucursalesOficiales` en el scope principal
- ✅ Cada filtrado es **local** a su contexto de uso

#### **En `shopifyCsvProcessor.ts`:**
- ✅ `sucursalesFiltradas` se define **antes** de cualquier uso
- ✅ Se usa consistentemente en toda la función

---

## 🚀 Mejoras Propuestas para una Solución Innovadora y Robusta

### **1. Centralizar Filtrado con Funciones Reutilizables**

```typescript
// Funciones de filtrado centralizadas
const filtrarPorTipo = (sucursales: AndreaniSucursalInfo[], incluirHop: boolean = true) => {
  if (incluirHop) return sucursales;
  return sucursales.filter(suc => 
    !suc.nombre_sucursal.toLowerCase().includes('punto andreani hop')
  );
};

const filtrarPorProvincia = (sucursales: AndreaniSucursalInfo[], provincia: string) => {
  const provinciaNorm = normalizarProvincia(provincia);
  return sucursales.filter(suc => {
    const dirSuc = normalizarDireccionParaBusqueda(suc.direccion || '');
    return dirSuc.includes(provinciaNorm);
  });
};

const filtrarPorCodigoPostal = (sucursales: AndreaniSucursalInfo[], cp: string) => {
  const cpLimpio = cp.replace(/\D/g, '');
  return sucursales.filter(suc => {
    const cpSucursal = extraerCodigoPostalSucursal(suc.direccion);
    return cpSucursal === cpLimpio;
  });
};
```

### **2. Pipeline de Filtrado Inteligente**

```typescript
interface FiltradoConfig {
  provincia?: string;
  codigoPostal?: string;
  incluirHop?: boolean;
  priorizarExactitud?: boolean;
}

const crearPipelineFiltrado = (config: FiltradoConfig) => {
  return (sucursales: AndreaniSucursalInfo[]): AndreaniSucursalInfo[] => {
    let resultado = [...sucursales];
    
    // Paso 1: Filtrar por tipo (HOP o no)
    if (config.incluirHop === false) {
      resultado = filtrarPorTipo(resultado, false);
    }
    
    // Paso 2: Filtrar por provincia (si está disponible)
    if (config.provincia) {
      resultado = filtrarPorProvincia(resultado, config.provincia);
      // Si después de filtrar por provincia no hay resultados, mantener todas
      if (resultado.length === 0 && !config.priorizarExactitud) {
        resultado = filtrarPorTipo(sucursales, config.incluirHop ?? true);
      }
    }
    
    // Paso 3: Filtrar por código postal (si está disponible y priorizarExactitud)
    if (config.codigoPostal && config.priorizarExactitud) {
      const filtradasPorCP = filtrarPorCodigoPostal(resultado, config.codigoPostal);
      if (filtradasPorCP.length > 0) {
        resultado = filtradasPorCP;
      }
    }
    
    return resultado;
  };
};
```

### **3. Estrategia de Búsqueda Configurable**

```typescript
interface EstrategiaBusqueda {
  nombre: string;
  prioridad: number;
  ejecutar: (sucursales: AndreaniSucursalInfo[], criterios: CriteriosBusqueda) => ResultadoBusqueda;
}

const estrategias: EstrategiaBusqueda[] = [
  {
    nombre: 'Coincidencia Exacta HOP',
    prioridad: 1,
    ejecutar: (sucursales, criterios) => {
      const hopSucursales = filtrarPorTipo(sucursales, true)
        .filter(suc => suc.nombre_sucursal.toLowerCase().includes('punto andreani hop'));
      return buscarCoincidenciaExacta(hopSucursales, criterios.direccion);
    }
  },
  {
    nombre: 'Coincidencia Exacta + CP',
    prioridad: 2,
    ejecutar: (sucursales, criterios) => {
      const oficiales = filtrarPorTipo(sucursales, false);
      const porDireccion = buscarCoincidenciaExacta(oficiales, criterios.direccion);
      if (criterios.codigoPostal) {
        return filtrarPorCodigoPostal(porDireccion, criterios.codigoPostal);
      }
      return porDireccion;
    }
  },
  {
    nombre: 'Búsqueda por CP',
    prioridad: 3,
    ejecutar: (sucursales, criterios) => {
      if (!criterios.codigoPostal) return [];
      const oficiales = filtrarPorTipo(sucursales, false);
      return filtrarPorCodigoPostal(oficiales, criterios.codigoPostal);
    }
  },
  {
    nombre: 'Búsqueda por Provincia',
    prioridad: 4,
    ejecutar: (sucursales, criterios) => {
      if (!criterios.provincia) return [];
      return filtrarPorProvincia(sucursales, criterios.provincia);
    }
  }
];
```

### **4. Validación Robusta con Sistema de Puntuación**

```typescript
interface ScoreSucursal {
  sucursal: AndreaniSucursalInfo;
  score: number;
  razones: string[];
}

const calcularScore = (sucursal: AndreaniSucursalInfo, criterios: CriteriosBusqueda): ScoreSucursal => {
  let score = 0;
  const razones: string[] = [];
  
  // Coincidencia exacta de dirección (+100)
  if (esCoincidenciaExacta(sucursal.direccion, criterios.direccion)) {
    score += 100;
    razones.push('Coincidencia exacta de dirección');
  }
  
  // Coincidencia de código postal (+50)
  if (criterios.codigoPostal) {
    const cpSucursal = extraerCodigoPostalSucursal(sucursal.direccion);
    if (cpSucursal === criterios.codigoPostal) {
      score += 50;
      razones.push('Coincidencia de código postal');
    }
  }
  
  // Coincidencia de provincia (+30)
  if (criterios.provincia) {
    if (coincideProvincia(sucursal.direccion, criterios.provincia)) {
      score += 30;
      razones.push('Coincidencia de provincia');
    }
  }
  
  // Es sucursal oficial (no HOP) (+10)
  if (!esPuntoHop(sucursal)) {
    score += 10;
    razones.push('Sucursal oficial');
  }
  
  return { sucursal, score, razones };
};
```

### **5. Sistema de Fallback Inteligente**

```typescript
const encontrarSucursalConFallback = (
  sucursales: AndreaniSucursalInfo[],
  criterios: CriteriosBusqueda
): ResultadoBusqueda => {
  
  // Intentar estrategias en orden de prioridad
  for (const estrategia of estrategias.sort((a, b) => a.prioridad - b.prioridad)) {
    const resultado = estrategia.ejecutar(sucursales, criterios);
    
    if (resultado.sucursales.length > 0) {
      // Si hay múltiples, usar scoring
      if (resultado.sucursales.length > 1) {
        const scored = resultado.sucursales.map(s => calcularScore(s, criterios));
        scored.sort((a, b) => b.score - a.score);
        
        return {
          exitoso: true,
          sucursal: scored[0].sucursal,
          estrategia: estrategia.nombre,
          razones: scored[0].razones,
          alternativas: scored.slice(1, 3).map(s => s.sucursal)
        };
      }
      
      return {
        exitoso: true,
        sucursal: resultado.sucursales[0],
        estrategia: estrategia.nombre
      };
    }
  }
  
  // Fallback final: sucursal más cercana geográficamente
  if (criterios.provincia) {
    const porProvincia = filtrarPorProvincia(sucursales, criterios.provincia);
    if (porProvincia.length > 0) {
      return {
        exitoso: true,
        sucursal: porProvincia[0],
        estrategia: 'Fallback por provincia',
        advertencia: 'No se encontró coincidencia exacta, usando sucursal de la provincia'
      };
    }
  }
  
  return {
    exitoso: false,
    error: 'No se encontró sucursal válida'
  };
};
```

---

## 📊 Resumen del Flujo Actual

### **Fortalezas:**
1. ✅ Filtrado dinámico según contexto
2. ✅ Manejo de casos especiales (Capital Federal, HOP)
3. ✅ Múltiples estrategias de búsqueda
4. ✅ Validación de coherencia geográfica

### **Áreas de Mejora:**
1. ⚠️ Filtrado repetido en múltiples lugares
2. ⚠️ Variables definidas múltiples veces
3. ⚠️ Falta de centralización de lógica de filtrado
4. ⚠️ Dificultad para testear estrategias individuales
5. ⚠️ No hay sistema de scoring unificado

### **Recomendaciones:**
1. ✅ Centralizar funciones de filtrado
2. ✅ Implementar pipeline configurable
3. ✅ Agregar sistema de scoring unificado
4. ✅ Mejorar logging y trazabilidad
5. ✅ Agregar tests unitarios para cada estrategia

---

## 🎯 Conclusión

El commit corrigió un problema de variables no definidas. El código actual funciona correctamente pero tiene oportunidades de mejora para:

- **Robustez**: Manejo más elegante de casos edge
- **Mantenibilidad**: Código más modular y testeable
- **Innovación**: Sistema de scoring y estrategias configurables
- **Trazabilidad**: Mejor logging y razonamiento de decisiones

Las mejoras propuestas mantienen la funcionalidad actual mientras agregan:
- ✅ Código más limpio y mantenible
- ✅ Mejor separación de responsabilidades
- ✅ Facilidad para agregar nuevas estrategias
- ✅ Sistema de fallback más inteligente
