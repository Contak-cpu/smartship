# Archivos Necesarios para Transferir Funcionalidad Completa del CSV Processor de Andreani

Esta lista incluye todos los archivos necesarios para replicar la funcionalidad completa desde el ingreso del archivo CSV hasta la generación del Excel espectacular de Andreani.

## 📁 Estructura de Archivos

### 1. **Archivos Core del Procesador CSV**

#### `services/csvProcessor.ts`
- **Descripción**: Archivo principal que contiene toda la lógica de procesamiento de CSV
- **Funciones exportadas principales**:
  - `processOrders()` - Procesa archivos CSV de pedidos Andreani
  - `processVentasOrders()` - Procesa archivos CSV de ventas de Tiendanube
  - `fixEncoding()` - Corrige problemas de codificación UTF-8
  - `fixEncodingSoft()` - Versión suave para limpiar archivos de referencia
  - `limpiarPisoDepto()` - Limpia campos de Piso y Departamento
  - `combineCSVs()` - Combina CSVs de domicilio y sucursal
- **Dependencias internas**:
  - `domiciliosData.ts` (getDomiciliosMapping)
  - `sucursalesData.ts` (getSucursalesData)
  - `types.ts` (interfaces y tipos)

### 2. **Archivos de Datos de Referencia**

#### `services/domiciliosData.ts`
- **Descripción**: Contiene el mapeo completo de códigos postales a formato "Provincia / Localidad / CP"
- **Función exportada**: `getDomiciliosMapping()` - Retorna un Map con todos los códigos postales y sus formatos

#### `services/sucursalesData.ts`
- **Descripción**: Contiene la información completa de todas las sucursales de Andreani
- **Función exportada**: `getSucursalesData()` - Retorna un array con datos de sucursales

### 3. **Archivos de Tipos TypeScript**

#### `types.ts`
- **Descripción**: Define todas las interfaces y tipos utilizados
- **Interfaces principales**:
  - `ProcessStatus` (enum)
  - `ProcessingInfo`
  - `TiendanubeOrder`
  - `AndreaniSucursalInfo`
  - `AndreaniDomicilioOutput`
  - `AndreaniSucursalOutput`

### 4. **Componentes de UI (Interfaz de Usuario)**

#### `components/FileUploader.tsx`
- **Descripción**: Componente para subir archivos CSV (drag & drop + click)
- **Props**: `onFileSelect`, `disabled`

#### `components/SmartShipConfig.tsx`
- **Descripción**: Componente de configuración para valores predeterminados (peso, dimensiones, valor declarado)
- **Props**: `onConfigChange`
- **Interface exportada**: `SmartShipConfigValues`

#### `components/StatusDisplay.tsx`
- **Descripción**: Muestra el estado del procesamiento (idle, processing, success, error)
- **Props**: `status`, `error`, `processingInfo`, `successMessage`

#### `components/ResultsDisplay.tsx`
- **Descripción**: Componente que muestra los resultados y permite descargar CSVs y Excel
- **Funcionalidad clave**: 
  - Exportación a Excel con formato Andreani
  - Desplegables (data validation) en Excel
  - Hoja "Llega hoy" opcional
- **Props**: `domicilioCSV`, `sucursalCSV`, `onDownload`, `onDownloadCombined`, `onDownloadExcel`
- **Nota**: Este componente incluye la función `exportToExcel()` que genera el Excel espectacular

### 5. **Página Principal (Orquestador)**

#### `pages/HomePage.tsx`
- **Descripción**: Página principal que orquesta todo el flujo
- **Funcionalidad**:
  - Maneja el estado del procesamiento
  - Detecta tipo de archivo (ventas vs pedidos)
  - Llama a `processOrders()` o `processVentasOrders()`
  - Normaliza y limpia el CSV final
  - Maneja la descarga de archivos

### 6. **Archivo de Configuración JSON**

#### `public/configuracion-data.json`
- **Descripción**: Archivo JSON con datos de configuración para los desplegables del Excel
- **Estructura**: Array de arrays con:
  - Columna A: Sucursales
  - Columna C: ItemNoGenerico
  - Columna E: ProvinciaLocalidaCodigosPostales
- **Uso**: Se carga dinámicamente en `ResultsDisplay.tsx` para crear las validaciones de datos en Excel

### 7. **Dependencias del Package.json**

#### `package.json` (dependencias relevantes)
```json
{
  "dependencies": {
    "exceljs": "^4.4.0",        // Para generar Excel con formato avanzado
    "papaparse": "^5.5.3",       // Para parsear CSV (aunque se usa CDN también)
    "xlsx": "^0.18.5",           // Alternativa para Excel
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/exceljs": "^0.5.3",
    "@types/papaparse": "^5.3.16",
    "@types/xlsx": "^0.0.35",
    "typescript": "~5.8.2"
  }
}
```

## 📋 Resumen de Archivos Mínimos Necesarios

### Archivos Core (Obligatorios):
1. ✅ `services/csvProcessor.ts` - **CRÍTICO**
2. ✅ `services/domiciliosData.ts` - **CRÍTICO**
3. ✅ `services/sucursalesData.ts` - **CRÍTICO**
4. ✅ `types.ts` - **CRÍTICO**

### Archivos de UI (Para funcionalidad completa):
5. ✅ `components/FileUploader.tsx`
6. ✅ `components/SmartShipConfig.tsx`
7. ✅ `components/StatusDisplay.tsx`
8. ✅ `components/ResultsDisplay.tsx` - **CRÍTICO para Excel**
9. ✅ `pages/HomePage.tsx` - Ejemplo de uso

### Archivos de Configuración:
10. ✅ `public/configuracion-data.json` - **CRÍTICO para Excel**

### Archivos de Configuración del Proyecto:
11. ✅ `package.json` - Para instalar dependencias
12. ✅ `tsconfig.json` - Configuración TypeScript (opcional pero recomendado)

## 🔄 Flujo Completo del Procesamiento

```
1. Usuario sube archivo CSV → FileUploader.tsx
   ↓
2. HomePage.tsx detecta tipo de archivo
   ↓
3. Llama a csvProcessor.ts:
   - processOrders() para archivos Andreani
   - processVentasOrders() para archivos de ventas
   ↓
4. csvProcessor.ts:
   - Usa domiciliosData.ts para mapear códigos postales
   - Usa sucursalesData.ts para mapear sucursales
   - Genera dos CSVs: domicilioCSV y sucursalCSV
   ↓
5. ResultsDisplay.tsx muestra resultados
   ↓
6. Usuario descarga:
   - CSV individuales (domicilio/sucursal)
   - CSV combinado
   - Excel.xlsx (con formato Andreani, desplegables, etc.)
      ↓
   - exportToExcel() en ResultsDisplay.tsx:
     * Carga configuracion-data.json
     * Crea hojas "A domicilio" y "A sucursal"
     * Agrega validaciones de datos (desplegables)
     * Crea hoja "Llega hoy" (opcional)
     * Crea hoja "Configuracion" (oculta)
```

## ⚠️ Notas Importantes

1. **PapaParse**: El código usa PapaParse como variable global desde CDN. Si no usas CDN, necesitarás importarlo:
   ```typescript
   import Papa from 'papaparse';
   ```

2. **ExcelJS**: La generación del Excel usa `exceljs` que es más poderoso que `xlsx` para formato avanzado.

3. **configuracion-data.json**: Este archivo debe estar en la carpeta `public/` para que se pueda acceder vía `fetch('/configuracion-data.json')`.

4. **Encoding**: El código maneja problemas de encoding UTF-8, especialmente importantes para caracteres especiales en español.

5. **Datos de Referencia**: Los archivos `domiciliosData.ts` y `sucursalesData.ts` son muy grandes (cientos de miles de líneas). Asegúrate de copiarlos completos.

## 🚀 Instalación en el Nuevo Repositorio

```bash
# 1. Copiar todos los archivos listados arriba
# 2. Instalar dependencias
npm install exceljs papaparse xlsx
npm install --save-dev @types/exceljs @types/papaparse @types/xlsx

# 3. Si usas Vite, agregar en index.html (para PapaParse CDN):
# <script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>
```

## 📝 Archivos Opcionales (pero recomendados)

- `components/layout/DashboardLayout.tsx` - Layout wrapper (si lo usas)
- Cualquier archivo de estilos CSS/Tailwind que uses







