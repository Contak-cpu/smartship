# Correcciones para CSV de Andreani

## Problemas Identificados y Corregidos

### 1. **Escape de Valores CSV** ✅
   - **Problema**: Los valores que contenían comillas (`"`) o punto y coma (`;`) no estaban correctamente escapados en el CSV generado, lo que puede causar que Andreani rechace el archivo.
   - **Solución**: Se agregó la función `escapeCSVValue` que:
     - Encierra valores con comillas cuando contienen caracteres especiales
     - Escapa comillas internas duplicándolas (estándar CSV: `"` → `""`)

### 2. **Validación de Campos Obligatorios** ✅
   - **Problema**: Algunos pedidos podían tener campos obligatorios vacíos (email, nombre, apellido, DNI, teléfono).
   - **Solución**: Se agregaron validaciones que:
     - Omiten pedidos sin email (obligatorio)
     - Usan placeholders para DNI, nombre y apellido vacíos
     - Aseguran que teléfono tenga valores por defecto válidos

### 3. **Formato de "Provincia / Localidad / CP"** ✅
   - **Problema**: Algunos pedidos podían tener formato inválido o vacío.
   - **Solución**: Se valida que el formato tenga exactamente 3 partes separadas por `/`. Los pedidos con formato inválido se omiten automáticamente.

### 4. **Normalización de Texto** ✅
   - **Problema**: Los nombres y direcciones pueden contener acentos o caracteres especiales que Andreani rechaza.
   - **Solución**: Se aplica normalización completa removiendo acentos y caracteres especiales antes de generar el CSV.

### 5. **Valores Numéricos** ✅
   - **Problema**: Los valores numéricos (peso, dimensiones) deben ser números válidos.
   - **Solución**: Se asegura que todos los valores numéricos sean strings válidos.

## Cómo Usar el Script de Diagnóstico

Para diagnosticar un archivo CSV generado antes de subirlo a Andreani:

```bash
node diagnosticar-csv-andreani.js <ruta-al-archivo.csv>
```

Ejemplo:
```bash
node diagnosticar-csv-andreani.js Andreani_Domicilio.csv
```

El script detectará:
- ✅ Campos obligatorios vacíos
- ✅ Emails inválidos
- ✅ DNI con formato incorrecto
- ✅ Teléfonos inválidos
- ✅ Valores no numéricos en campos numéricos
- ✅ Caracteres especiales problemáticos (acentos)
- ✅ Formato incorrecto de "Provincia / Localidad / CP"
- ✅ Valores con punto y coma sin comillas (problemas de escape)

## Pedidos Problemáticos Detectados en tu Archivo

Basado en el análisis del archivo `ventas-b0cd23df-7196-4d30-9eaa-ccf8425f2a7b.csv`, se encontraron:

1. **Líneas duplicadas**: Hay líneas que son productos adicionales del mismo pedido (ej: línea 20 es producto adicional del pedido 2821)
   - **Solución**: Ya se están omitiendo automáticamente

2. **Problemas de encoding**: Varios nombres con caracteres mal codificados:
   - "Gualeguaych" (debería ser "Gualeguaychú")
   - "Curuz Cuati" (debería ser "Curuzú Cuatiá")
   - "Lcar" (debería ser "Lácar")
   - "Julin" (debería ser "Julián")
   - "Jos Hernndez" (debería ser "José Hernández")
   - "Hctor", "Gmez" (debería ser "Héctor", "Gómez")
   - "Lpez" (debería ser "López")
   - "Zuiga" (debería ser "Zúñiga")
   - "Mara" (debería ser "María")
   - **Solución**: La función `fixEncoding` y `normalizarNombre` corrigen estos problemas

3. **Números de calle con "SN"**: Varios pedidos tienen "SN" o "S/N" como número
   - **Solución**: Se convierte automáticamente a "0"

## Recomendaciones

1. **Usa el script de diagnóstico** antes de subir el archivo a Andreani para identificar problemas específicos.

2. **Revisa los pedidos descartados**: Si algunos pedidos son omitidos, revisa el motivo en los logs de la consola del navegador.

3. **Valida el formato generado**: Después de descargar el CSV, ábrelo en Excel o un editor de texto para verificar que:
   - Los valores con comillas o punto y coma estén correctamente entre comillas
   - Todos los campos obligatorios tengan valores
   - El formato "Provincia / Localidad / CP" tenga 3 partes separadas por `/`

4. **Si Andreani sigue rechazando el archivo**:
   - Ejecuta el script de diagnóstico en el archivo descargado
   - Comparte el reporte generado para identificar el problema específico
   - Verifica que el archivo tenga el encoding UTF-8 con BOM (ya está implementado)

## Archivos Modificados

- `services/csvProcessor.ts`: Correcciones en escape CSV y validaciones
- `diagnosticar-csv-andreani.js`: Nuevo script de diagnóstico






























