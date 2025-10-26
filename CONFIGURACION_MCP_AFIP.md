# Configuración MCP AFIP SDK

## 🚀 Configuración Completa

Tu aplicación ahora está configurada para conectarse al MCP de AFIP SDK. He creado los siguientes archivos:

### Archivos Creados:

1. **`services/afipService.ts`** - Servicio base para AFIP
2. **`services/mcpAfipService.ts`** - Servicio MCP para AFIP SDK
3. **`hooks/useMcpAfip.ts`** - Hook de React para usar el MCP
4. **`components/McpAfipDemo.tsx`** - Componente de demostración
5. **`pages/McpAfipPage.tsx`** - Página para el demo
6. **`.env.example`** - Ejemplo de configuración de variables de entorno

## 📋 Pasos para Configurar:

### 1. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Copia el archivo de ejemplo
cp .env.example .env
```

Edita el archivo `.env` y agrega tu API key de AFIP SDK:

```env
VITE_AFIP_SDK_API_KEY=tu_api_key_de_afip_sdk
```

### 2. Instalar Dependencias

Las dependencias necesarias ya están instaladas:
- `@modelcontextprotocol/sdk` ✅

### 3. Configurar el Servidor MCP

Según la documentación de AFIP SDK, necesitas:

1. **Obtener API Key**: Regístrate en [AFIP SDK](https://afipsdk.com) y obtén tu API key
2. **Configurar el servidor MCP**: El servidor debe ejecutarse según las especificaciones de AFIP SDK

### 4. Usar en tu Aplicación

#### Opción A: Usar el Hook (Recomendado)

```tsx
import { useMcpAfip } from '../hooks/useMcpAfip';

function MiComponente() {
  const {
    conectado,
    conectar,
    generarFactura,
    validarCuit
  } = useMcpAfip(true); // auto-conectar

  const handleGenerarFactura = async () => {
    const resultado = await generarFactura({
      cuit: '20111111112',
      puntoVenta: 1,
      tipoComprobante: 11,
      // ... otros parámetros
    });
    
    if (resultado.success) {
      console.log('Factura generada:', resultado.content);
    }
  };

  return (
    <div>
      <p>Estado: {conectado ? 'Conectado' : 'Desconectado'}</p>
      <button onClick={handleGenerarFactura}>
        Generar Factura
      </button>
    </div>
  );
}
```

#### Opción B: Usar el Servicio Directamente

```tsx
import McpAfipService from '../services/mcpAfipService';

// Conectar
await McpAfipService.conectar();

// Usar herramientas
const resultado = await McpAfipService.generarFactura({
  cuit: '20111111112',
  puntoVenta: 1,
  tipoComprobante: 11,
  // ... parámetros
});
```

## 🧪 Probar la Configuración

1. **Accede a la página de demo**: `/mcp-afip` (necesitas agregar la ruta)
2. **Haz clic en "Conectar"** para establecer la conexión
3. **Prueba las funcionalidades** disponibles

## 🔧 Funcionalidades Disponibles

### Herramientas del MCP:
- ✅ `generarFactura` - Generar facturas electrónicas
- ✅ `consultarComprobantes` - Consultar comprobantes existentes
- ✅ `obtenerProximoNumero` - Obtener próximo número de comprobante
- ✅ `consultarTiposComprobante` - Listar tipos de comprobante
- ✅ `consultarAlicuotasIVA` - Consultar alícuotas de IVA
- ✅ `consultarMonedas` - Listar monedas disponibles
- ✅ `consultarCotizacion` - Obtener cotización de moneda
- ✅ `validarCuit` - Validar formato de CUIT
- ✅ `obtenerContribuyente` - Obtener información de contribuyente

### Métodos del Hook:
- `conectar()` - Conectar al MCP
- `desconectar()` - Desconectar del MCP
- `ejecutarHerramienta(nombre, args)` - Ejecutar cualquier herramienta
- Métodos específicos para cada funcionalidad de AFIP

## 🚨 Troubleshooting

### Error: "No hay conexión activa con el MCP"
- Verifica que la API key esté configurada
- Asegúrate de llamar a `conectar()` antes de usar las herramientas

### Error: "API Key de AFIP SDK no configurada"
- Verifica que `VITE_AFIP_SDK_API_KEY` esté en tu archivo `.env`
- Reinicia el servidor de desarrollo después de cambiar variables de entorno

### Error de conexión al servidor MCP
- Verifica la documentación oficial de AFIP SDK para la configuración del servidor
- Asegúrate de que el servidor MCP esté ejecutándose

## 📚 Próximos Pasos

1. **Agregar la ruta** para la página de demo en tu router
2. **Configurar tu API key** de AFIP SDK
3. **Probar la conexión** con el demo
4. **Integrar las funcionalidades** en tus componentes existentes

## 🔗 Enlaces Útiles

- [Documentación AFIP SDK](https://docs.afipsdk.com)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Documentación MCP AFIP](https://docs.afipsdk.com/~gitbook/mcp)

---

¡Tu aplicación está lista para usar el MCP de AFIP SDK! 🎉