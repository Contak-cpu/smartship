# Configuración Permanente de Vercel MCP

## Resumen
Se ha configurado una conexión permanente al servidor MCP de Vercel utilizando el token: `k72PAk8f1VJms6qowWugrLrk`

## Archivos de Configuración Creados

### 1. `.cursor/mcp.json` - Configuración para Cursor
```json
{
  "mcpServers": {
    "vercel": {
      "url": "https://mcp.vercel.com",
      "headers": {
        "Authorization": "Bearer k72PAk8f1VJms6qowWugrLrk"
      }
    }
  }
}
```

### 2. `.cursor/config.json` - Configuración alternativa para Cursor
```json
{
  "mcpServers": {
    "vercel": {
      "command": "node",
      "args": ["mcp-vercel.js", "server"],
      "env": {
        "VERCEL_TOKEN": "k72PAk8f1VJms6qowWugrLrk"
      }
    }
  }
}
```

### 3. `.env` - Variables de entorno
```env
VERCEL_TOKEN=k72PAk8f1VJms6qowWugrLrk
VERCEL_MCP_URL=https://mcp.vercel.com
```

### 4. `mcp-config.json` - Configuración estándar MCP
```json
{
  "servers": {
    "vercel": {
      "command": "npx",
      "args": ["@vercel/mcp"],
      "env": {
        "VERCEL_TOKEN": "k72PAk8f1VJms6qowWugrLrk"
      }
    }
  }
}
```

## Scripts Disponibles

### `mcp-vercel.js` - Herramienta de gestión
- **Test**: `node mcp-vercel.js test`
- **Config**: `node mcp-vercel.js config`
- **Status**: `node mcp-vercel.js status`
- **Server**: `node mcp-vercel.js server`

### Scripts npm
- **`npm run mcp:test`** - Verificar configuración del token
- **`npm run mcp:status`** - Mostrar estado y probar conexión
- **`npm run mcp:start`** - Iniciar servidor MCP (automático con scripts shell)
- **`npm run mcp:stop`** - Detener servidor MCP
- **`npm run mcp:server`** - Iniciar servidor MCP (manual)

### Scripts Shell
- **`./start-vercel-mcp.sh`** - Iniciar servidor MCP en background
- **`./stop-vercel-mcp.sh`** - Detener servidor MCP

## Uso Permanente

### Para Cursor:
1. Los archivos de configuración en `.cursor/` se cargarán automáticamente
2. Reinicia Cursor para que tome la nueva configuración
3. El servidor MCP de Vercel debería aparecer disponible

### Para otros clientes MCP:
1. Usa el archivo `mcp-config.json` como referencia
2. Configura tu cliente para usar el token `k72PAk8f1VJms6qowWugrLrk`
3. URL del servidor: `https://mcp.vercel.com`

## Verificación

Para verificar que todo funciona correctamente:

```bash
# Verificar configuración
npm run mcp:status

# Probar conexión
node mcp-vercel.js test

# Ver configuración actual
node mcp-vercel.js config
```

## Mantenimiento

### Renovar Token
Si necesitas actualizar el token:
1. Edita el archivo `.env`
2. Actualiza los archivos de configuración en `.cursor/`
3. Reinicia los servicios MCP

### Backup de Configuración
Los archivos importantes a respaldar son:
- `.env`
- `.cursor/mcp.json`
- `mcp-config.json`
- `mcp-vercel.js`

## Troubleshooting

### Si la conexión falla:
1. Verifica que el token sea válido
2. Comprueba que tienes acceso a internet
3. Revisa que los archivos de configuración existan
4. Reinicia el cliente MCP

### Logs y Debug:
Ejecuta `npm run mcp:status` para obtener información detallada del estado de la conexión.