# 📊 Integración de Sección Información

## Objetivos

La sección Información permitirá:
1. ✅ Contar pedidos únicos procesados (sin duplicados)
2. ✅ Rastrear clientes recurrentes
3. ✅ Control de stock despachado
4. ✅ Estadísticas completas de operación

## 🔄 Integración con SmartShip

### Paso 1: Modificar `services/csvProcessor.ts`

En las funciones `processOrders` y `processVentasOrders`, después de procesar los pedidos, agregar:

```typescript
import { guardarPedidosDesdeCSV, PedidoProcesado } from './informacionService';
import { useAuth } from '../hooks/useAuth';

// Dentro de processOrders o processVentasOrders:
const pedidosParaGuardar: PedidoProcesado[] = [];

// Por cada pedido procesado (en el loop de procesamiento):
for (const order of orders) {
  const pedido: PedidoProcesado = {
    username, // Del contexto de autenticación
    numeroPedido: order['Número'],
    emailCliente: order['Email del comprador'],
    nombreCliente: order['Nombre del comprador'],
    apellidoCliente: order['Apellido del comprador'],
    telefono: order['Teléfono del comprador'],
    direccion: order['Dirección de envío'],
    provincia: extractProvincia(order['Dirección de envío']),
    localidad: extractLocalidad(order['Dirección de envío']),
    codigoPostal: extractCodigoPostal(order['Dirección de envío']),
    tipoEnvio: esSucursal ? 'sucursal' : 'domicilio',
    fechaProcesamiento: new Date().toISOString().split('T')[0],
    archivoOrigen: nombreArchivo,
  };
  
  pedidosParaGuardar.push(pedido);
}

// Después del procesamiento:
try {
  const resultado = await guardarPedidosDesdeCSV(pedidosParaGuardar);
  console.log(`✅ Pedidos guardados: ${resultado.guardados}`);
  console.log(`⚠️ Duplicados detectados: ${resultado.duplicados}`);
  console.log(`❌ Errores: ${resultado.errores}`);
} catch (error) {
  console.error('Error guardando pedidos en Supabase:', error);
}
```

### Paso 2: Modificar componentes de SmartShip

En los componentes que procesan archivos (FileUploader, HomePage), pasar el `username`:

```typescript
// En HomePage.tsx o donde se procese el CSV
const { username } = useAuth();

// Al llamar a processOrders:
const resultado = await processOrders(csvText, username);
```

## 🏷️ Integración con Generador de PDF/SKU

### En `components/pdf/PDFGenerator.tsx`

Después de generar el PDF con SKUs:

```typescript
import { guardarStockDespachado, StockDespachado } from '../../services/informacionService';

// Por cada producto/SKU en el PDF:
const stockDespachado: StockDespachado[] = [];

for (const item of itemsEnPDF) {
  stockDespachado.push({
    username,
    sku: item.sku,
    nombreProducto: item.nombreProducto,
    cantidad: item.cantidad,
    numeroPedido: item.numeroPedido,
    fechaDespacho: new Date().toISOString().split('T')[0],
    archivoRotulo: nombreArchivoPDF,
  });
}

// Guardar en Supabase:
try {
  await guardarStockDespachado(stockDespachado);
  console.log(`✅ Stock despachado registrado: ${stockDespachado.length} items`);
} catch (error) {
  console.error('Error registrando stock:', error);
}
```

## 📄 Estructura de Datos

### Pedidos Procesados
- **numeroPedido**: Identificador único del pedido
- **emailCliente**: Email del cliente (clave para detectar recurrentes)
- **tipoEnvio**: 'domicilio' o 'sucursal'
- **fechaProcesamiento**: Fecha en que se procesó el pedido

### Stock Despachado
- **sku**: Código SKU del producto
- **nombreProducto**: Nombre descriptivo
- **cantidad**: Cantidad despachada
- **fechaDespacho**: Fecha del despacho

## 🎯 Detección de Duplicados

El sistema automáticamente:
1. Verifica si existe un pedido con el mismo `numeroPedido` + `emailCliente`
2. Si existe, NO lo guarda (evita duplicados)
3. Retorna estadísticas de guardados vs duplicados

## 📊 Reportes Disponibles

La sección Información mostrará:

1. **Estadísticas Generales**
   - Total de pedidos únicos
   - Clientes únicos
   - Pedidos domicilio vs sucursal

2. **Clientes Recurrentes**
   - Lista de clientes que compraron más de una vez
   - Cantidad de compras por cliente

3. **Stock Despachado**
   - Total por SKU
   - Historial de despachos
   - Productos más despachados

4. **Tendencias**
   - Pedidos por fecha
   - Crecimiento de clientes
   - SKUs más populares

## 🔄 Flujo Completo

```
1. Usuario sube CSV a SmartShip
   ↓
2. Sistema procesa pedidos (domicilio/sucursal)
   ↓
3. Por cada pedido:
   - Verifica si ya existe (numeroPedido + email)
   - Si es nuevo → Guarda en Supabase
   - Si es duplicado → Registra pero no guarda
   ↓
4. Genera archivos Excel/CSV
   ↓
5. Usuario genera PDF con SKUs
   ↓
6. Sistema registra stock despachado por SKU
   ↓
7. Usuario accede a Información:
   - Ve estadísticas actualizadas
   - Consulta clientes recurrentes
   - Revisa stock despachado
```

## 🚀 Próximos Pasos

1. Ejecutar SQL en Supabase (archivo: `SUPABASE_TABLES_INFORMACION.sql`)
2. Integrar llamadas a `informacionService` en los componentes
3. Crear la página de Información con visualizaciones
4. Agregar ruta al menú de navegación

---

**FACIL.UNO - Gestión Inteligente de Información** 🚀

