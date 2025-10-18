# Integración MCP AFIP SDK

Esta integración permite conectar tu aplicación con los servicios de AFIP a través del Model Context Protocol (MCP) usando el SDK de AFIP.

## Archivos Creados

- `mcp-config.json` - Configuración del servidor MCP
- `mcp-afip-server.js` - Servidor MCP para AFIP SDK
- `mcp-client-example.js` - Cliente de ejemplo para probar la conexión
- `services/afipMCPService.ts` - Servicio TypeScript para integración con React
- `components/AfipMCPConnector.tsx` - Componente React para interactuar con AFIP

## Requisitos Previos

1. **Certificados AFIP**: Necesitas tener los certificados de AFIP (.crt y .key)
2. **CUIT**: El CUIT del contribuyente registrado en AFIP
3. **Node.js**: Versión 16 o superior

## Instalación

Las dependencias ya fueron instaladas:
```bash
npm install @afipsdk/afip.js @modelcontextprotocol/sdk
```

## Configuración

### 1. Certificados AFIP

Coloca tus certificados AFIP en una carpeta segura (por ejemplo, `./certs/`):
- `certificado.crt` - Certificado público
- `clave.key` - Clave privada

### 2. Variables de Entorno

Crea un archivo `.env` con:
```env
AFIP_CERT_PATH=./certs/certificado.crt
AFIP_KEY_PATH=./certs/clave.key
AFIP_CUIT=20123456789
AFIP_PRODUCTION=false
```

## Uso

### 1. Servidor MCP Standalone

Para ejecutar el servidor MCP independientemente:
```bash
node mcp-afip-server.js
```

### 2. Cliente de Prueba

Para probar la conexión:
```bash
node mcp-client-example.js
```

### 3. Integración en React

Importa y usa el componente en tu aplicación:

```tsx
import { AfipMCPConnector } from './components/AfipMCPConnector';

function App() {
  return (
    <div>
      <AfipMCPConnector 
        onConnectionChange={(connected) => {
          console.log('MCP AFIP conectado:', connected);
        }}
      />
    </div>
  );
}
```

### 4. Uso del Servicio

```tsx
import { afipMCPService } from './services/afipMCPService';

// Conectar
await afipMCPService.connect();

// Inicializar AFIP
await afipMCPService.initialize({
  cert: './certs/certificado.crt',
  key: './certs/clave.key',
  cuit: '20123456789',
  production: false
});

// Obtener último comprobante
const lastVoucher = await afipMCPService.getLastVoucher(1, 1);

// Crear comprobante
const voucher = await afipMCPService.createVoucher({
  CantReg: 1,
  PtoVta: 1,
  CbteTipo: 1,
  // ... más datos
});
```

## Herramientas MCP Disponibles

El servidor MCP proporciona las siguientes herramientas:

1. **afip_initialize** - Inicializar conexión con AFIP
2. **afip_get_last_voucher** - Obtener último número de comprobante
3. **afip_create_voucher** - Crear nuevo comprobante electrónico
4. **afip_get_voucher_info** - Obtener información de un comprobante
5. **afip_get_voucher_types** - Obtener tipos de comprobantes disponibles
6. **afip_get_sales_points** - Obtener puntos de venta disponibles

## Arquitectura

```
Frontend (React) 
    ↓
afipMCPService.ts 
    ↓
HTTP/WebSocket API (Backend)
    ↓
MCP Client
    ↓
MCP Server (mcp-afip-server.js)
    ↓
AFIP SDK (@afipsdk/afip.js)
    ↓
AFIP Web Services
```

## Consideraciones de Seguridad

1. **Certificados**: Nunca expongas los certificados en el frontend
2. **Backend**: Implementa un backend que maneje la comunicación MCP
3. **HTTPS**: Usa siempre HTTPS en producción
4. **Validación**: Valida todos los datos antes de enviarlos a AFIP

## Tipos de Comprobantes Comunes

- **1**: Factura A
- **6**: Factura B  
- **11**: Factura C
- **3**: Nota de Crédito A
- **8**: Nota de Crédito B
- **13**: Nota de Crédito C

## Tipos de Documento

- **80**: CUIT
- **86**: CUIL
- **96**: DNI
- **99**: Sin identificar

## Troubleshooting

### Error de Certificados
- Verifica que los archivos .crt y .key existan
- Asegúrate de que los certificados sean válidos y no hayan expirado
- Verifica que el CUIT coincida con el certificado

### Error de Conexión
- Verifica tu conexión a internet
- En testing, usa `production: false`
- Revisa los logs del servidor MCP

### Error de Permisos
- Asegúrate de tener permisos para el tipo de comprobante
- Verifica que el punto de venta esté habilitado

## Próximos Pasos

1. Implementar backend para manejar MCP de forma segura
2. Agregar más funcionalidades de AFIP (padrón, retenciones, etc.)
3. Implementar cache y manejo de errores robusto
4. Agregar tests unitarios y de integración

## Soporte

Para más información sobre AFIP SDK: https://docs.afipsdk.com
Para más información sobre MCP: https://modelcontextprotocol.io