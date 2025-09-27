# Soporte para Archivos CSV de Shopify

## Descripción

La aplicación ahora soporta el procesamiento de archivos CSV de exportación de órdenes de Shopify, además de los formatos existentes de Andreani y archivos de ventas.

## Formatos Soportados

1. **Archivos de Andreani** (formato original)
2. **Archivos de Ventas** (formato con columnas en español)
3. **Archivos de Shopify** (formato con columnas en inglés) - **NUEVO**

## Detección Automática

La aplicación detecta automáticamente el tipo de archivo basándose en el contenido:

- **Shopify**: Detecta columnas como `Name`, `Email`, `Financial Status`, `Shipping Method`
- **Ventas**: Detecta columnas como `Número de orden`, `Estado de la orden`
- **Andreani**: Formato por defecto si no coincide con los anteriores

## Archivos de Shopify

### Estructura Esperada

El archivo debe contener las siguientes columnas principales:
- `Name`: Número de orden (ej: #1306)
- `Email`: Email del cliente
- `Financial Status`: Estado financiero (debe ser "paid")
- `Shipping Method`: Método de envío
- `Shipping Name`: Nombre del cliente
- `Shipping Street`: Dirección de envío
- `Shipping City`: Ciudad
- `Shipping Zip`: Código postal
- `Shipping Province`: Provincia
- `Shipping Phone`: Teléfono

### Procesamiento

1. **Filtrado**: Solo procesa órdenes con `Financial Status = "paid"`
2. **Agrupación**: Agrupa múltiples líneas de la misma orden
3. **Clasificación**: Determina si es envío a domicilio o sucursal basándose en `Shipping Method`
4. **Normalización**: Aplica las mismas normalizaciones que los otros formatos

### Métodos de Envío Reconocidos

**Para Domicilio:**
- Contiene "domicilio", "Domicilio", "Envio a Domicilio", "Envío a Domicilio"

**Para Sucursal:**
- Contiene "sucursal", "Sucursal", "Punto de retiro", "retiro"

## Uso

1. Exporta tu archivo de órdenes desde Shopify
2. Sube el archivo CSV a la aplicación
3. La aplicación detectará automáticamente que es un archivo de Shopify
4. Procesa y genera los archivos de Andreani correspondientes

## Notas Técnicas

- Los archivos de Shopify no incluyen DNI por defecto, por lo que este campo quedará vacío
- El sistema normaliza automáticamente nombres y direcciones
- Se aplican las mismas validaciones de códigos postales y sucursales que en otros formatos
