import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface McpAfipConnection {
  client: Client;
  connected: boolean;
}

export interface AfipMcpTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface AfipMcpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface ToolCallResult {
  success: boolean;
  content: any;
  error?: string;
}

class McpAfipService {
  private static connection: McpAfipConnection | null = null;
  private static readonly MCP_SERVER_COMMAND = 'npx';
  private static readonly MCP_SERVER_ARGS = ['@afipsdk/mcp-server'];
  private static readonly AFIP_SDK_BASE_URL = 'https://api.afipsdk.com';

  /**
   * Conectar al servidor MCP de AFIP SDK
   */
  static async conectar(): Promise<McpAfipConnection> {
    try {
      // Verificar que tenemos la API key
      const apiKey = import.meta.env.VITE_AFIP_SDK_API_KEY;
      if (!apiKey) {
        throw new Error('VITE_AFIP_SDK_API_KEY no está configurada');
      }

      // Por ahora, simulamos la conexión MCP
      // En una implementación real, aquí se conectaría al servidor MCP
      // usando el protocolo JSON-RPC sobre stdio o websockets
      
      // Crear un cliente mock para desarrollo
      const mockClient = {
        listTools: async () => ({
          tools: [
            { name: 'generar_factura', description: 'Generar factura electrónica', inputSchema: {} },
            { name: 'consultar_comprobantes', description: 'Consultar comprobantes', inputSchema: {} },
            { name: 'proximo_numero', description: 'Obtener próximo número', inputSchema: {} },
            { name: 'tipos_comprobante', description: 'Listar tipos de comprobante', inputSchema: {} },
            { name: 'alicuotas_iva', description: 'Consultar alícuotas IVA', inputSchema: {} },
            { name: 'monedas', description: 'Listar monedas', inputSchema: {} },
            { name: 'cotizacion_moneda', description: 'Cotización de moneda', inputSchema: {} },
            { name: 'validar_cuit', description: 'Validar CUIT', inputSchema: {} },
            { name: 'info_contribuyente', description: 'Info de contribuyente', inputSchema: {} },
          ]
        }),
        listResources: async () => ({
          resources: [
            { uri: 'afip://certificados', name: 'Certificados', description: 'Certificados AFIP' },
            { uri: 'afip://comprobantes', name: 'Comprobantes', description: 'Comprobantes emitidos' },
          ]
        }),
        callTool: async ({ name, arguments: args }: { name: string; arguments: any }) => {
          // Aquí se haría la llamada real al MCP
          // Por ahora, delegamos a la API REST
          return await this.llamarApiRest(name, args);
        },
        readResource: async ({ uri }: { uri: string }) => {
          return { contents: [`Recurso: ${uri}`] };
        },
        close: async () => {
          console.log('Cliente MCP cerrado');
        }
      } as any;

      this.connection = {
        client: mockClient,
        connected: true,
      };

      console.log('✅ Conectado exitosamente al MCP de AFIP SDK (modo desarrollo)');
      return this.connection;

    } catch (error: any) {
      console.error('❌ Error conectando al MCP de AFIP SDK:', error);
      throw new Error(`No se pudo conectar al MCP de AFIP SDK: ${error.message}`);
    }
  }

  /**
   * Desconectar del servidor MCP
   */
  static async desconectar(): Promise<void> {
    if (this.connection?.client) {
      try {
        await this.connection.client.close();
        this.connection = null;
        console.log('✅ Desconectado del MCP de AFIP SDK');
      } catch (error: any) {
        console.error('❌ Error desconectando del MCP:', error);
      }
    }
  }

  /**
   * Verificar si está conectado
   */
  static estaConectado(): boolean {
    return this.connection?.connected || false;
  }

  /**
   * Obtener la conexión actual
   */
  static obtenerConexion(): McpAfipConnection | null {
    return this.connection;
  }

  /**
   * Listar herramientas disponibles en el MCP
   */
  static async listarHerramientas(): Promise<AfipMcpTool[]> {
    if (!this.connection?.client) {
      throw new Error('No hay conexión activa con el MCP de AFIP SDK');
    }

    try {
      const response = await this.connection.client.listTools();
      
      return response.tools.map(tool => ({
        name: tool.name,
        description: tool.description || '',
        inputSchema: tool.inputSchema,
      }));

    } catch (error: any) {
      console.error('❌ Error listando herramientas MCP:', error);
      throw new Error(`Error obteniendo herramientas: ${error.message}`);
    }
  }

  /**
   * Listar recursos disponibles en el MCP
   */
  static async listarRecursos(): Promise<AfipMcpResource[]> {
    if (!this.connection?.client) {
      throw new Error('No hay conexión activa con el MCP de AFIP SDK');
    }

    try {
      const response = await this.connection.client.listResources();
      
      return response.resources.map(resource => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      }));

    } catch (error: any) {
      console.error('❌ Error listando recursos MCP:', error);
      throw new Error(`Error obteniendo recursos: ${error.message}`);
    }
  }

  /**
   * Ejecutar una herramienta del MCP
   */
  static async ejecutarHerramienta(
    nombreHerramienta: string, 
    argumentos: any = {}
  ): Promise<ToolCallResult> {
    if (!this.connection?.client) {
      throw new Error('No hay conexión activa con el MCP de AFIP SDK');
    }

    try {
      const response = await this.connection.client.callTool({
        name: nombreHerramienta,
        arguments: argumentos,
      });

      return {
        success: true,
        content: response.content,
      };

    } catch (error: any) {
      console.error(`❌ Error ejecutando herramienta ${nombreHerramienta}:`, error);
      return {
        success: false,
        content: null,
        error: error.message,
      };
    }
  }

  /**
   * Leer un recurso del MCP
   */
  static async leerRecurso(uri: string): Promise<ToolCallResult> {
    if (!this.connection?.client) {
      throw new Error('No hay conexión activa con el MCP de AFIP SDK');
    }

    try {
      const response = await this.connection.client.readResource({ uri });

      return {
        success: true,
        content: response.contents,
      };

    } catch (error: any) {
      console.error(`❌ Error leyendo recurso ${uri}:`, error);
      return {
        success: false,
        content: null,
        error: error.message,
      };
    }
  }

  /**
   * Métodos específicos para AFIP SDK
   */

  /**
   * Generar factura electrónica
   */
  static async generarFactura(parametros: {
    cuit: string;
    puntoVenta: number;
    tipoComprobante: number;
    numeroComprobante: number;
    fecha: string;
    tipoDocumento: number;
    numeroDocumento: string;
    importeTotal: number;
    importeNeto: number;
    importeIVA: number;
    concepto: number;
    moneda: string;
    cotizacion: number;
    items?: Array<{
      descripcion: string;
      cantidad: number;
      precio: number;
      alicuotaIVA: number;
    }>;
  }): Promise<ToolCallResult> {
    return this.ejecutarHerramienta('generar_factura', parametros);
  }

  /**
   * Consultar comprobantes
   */
  static async consultarComprobantes(parametros: {
    cuit: string;
    puntoVenta: number;
    tipoComprobante: number;
    numeroDesde?: number;
    numeroHasta?: number;
    fechaDesde?: string;
    fechaHasta?: string;
  }): Promise<ToolCallResult> {
    return this.ejecutarHerramienta('consultar_comprobantes', parametros);
  }

  /**
   * Obtener próximo número de comprobante
   */
  static async obtenerProximoNumero(parametros: {
    cuit: string;
    puntoVenta: number;
    tipoComprobante: number;
  }): Promise<ToolCallResult> {
    return this.ejecutarHerramienta('proximo_numero', parametros);
  }

  /**
   * Consultar tipos de comprobante
   */
  static async consultarTiposComprobante(): Promise<ToolCallResult> {
    return this.ejecutarHerramienta('tipos_comprobante');
  }

  /**
   * Consultar alícuotas de IVA
   */
  static async consultarAlicuotasIVA(): Promise<ToolCallResult> {
    return this.ejecutarHerramienta('alicuotas_iva');
  }

  /**
   * Consultar monedas
   */
  static async consultarMonedas(): Promise<ToolCallResult> {
    return this.ejecutarHerramienta('monedas');
  }

  /**
   * Consultar cotización de moneda
   */
  static async consultarCotizacion(codigoMoneda: string): Promise<ToolCallResult> {
    return this.ejecutarHerramienta('cotizacion_moneda', { codigo: codigoMoneda });
  }

  /**
   * Validar CUIT
   */
  static async validarCuit(cuit: string): Promise<ToolCallResult> {
    return this.ejecutarHerramienta('validar_cuit', { cuit });
  }

  /**
   * Obtener información de contribuyente
   */
  static async obtenerContribuyente(cuit: string): Promise<ToolCallResult> {
    return this.ejecutarHerramienta('info_contribuyente', { cuit });
  }

  /**
   * Llamar a la API REST de AFIP SDK (método interno)
   */
  private static async llamarApiRest(herramienta: string, argumentos: any = {}): Promise<any> {
    const apiKey = import.meta.env.VITE_AFIP_SDK_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_AFIP_SDK_API_KEY no está configurada');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };

    try {
      let url = '';
      let method = 'GET';
      let body = null;

      // Mapear herramientas MCP a endpoints REST
      switch (herramienta) {
        case 'generar_factura':
          url = `${this.AFIP_SDK_BASE_URL}/v1/facturacion/generar`;
          method = 'POST';
          body = JSON.stringify(argumentos);
          break;
        
        case 'consultar_comprobantes':
          url = `${this.AFIP_SDK_BASE_URL}/v1/facturacion/consultar`;
          method = 'POST';
          body = JSON.stringify(argumentos);
          break;
        
        case 'proximo_numero':
          url = `${this.AFIP_SDK_BASE_URL}/v1/facturacion/proximo-numero`;
          method = 'POST';
          body = JSON.stringify(argumentos);
          break;
        
        case 'tipos_comprobante':
          url = `${this.AFIP_SDK_BASE_URL}/v1/parametros/tipos-comprobante`;
          break;
        
        case 'alicuotas_iva':
          url = `${this.AFIP_SDK_BASE_URL}/v1/parametros/alicuotas-iva`;
          break;
        
        case 'monedas':
          url = `${this.AFIP_SDK_BASE_URL}/v1/parametros/monedas`;
          break;
        
        case 'cotizacion_moneda':
          url = `${this.AFIP_SDK_BASE_URL}/v1/parametros/cotizacion/${argumentos.codigo}`;
          break;
        
        case 'validar_cuit':
          url = `${this.AFIP_SDK_BASE_URL}/v1/contribuyentes/validar/${argumentos.cuit}`;
          break;
        
        case 'info_contribuyente':
          url = `${this.AFIP_SDK_BASE_URL}/v1/contribuyentes/info/${argumentos.cuit}`;
          break;
        
        default:
          throw new Error(`Herramienta no soportada: ${herramienta}`);
      }

      const response = await fetch(url, {
        method,
        headers,
        body,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { content: [{ type: 'text', text: JSON.stringify(data) }] };

    } catch (error: any) {
      console.error(`❌ Error en API REST para ${herramienta}:`, error);
      throw error;
    }
  }

  /**
   * Método de conveniencia para inicializar la conexión automáticamente
   */
  static async inicializar(): Promise<boolean> {
    try {
      if (!this.estaConectado()) {
        await this.conectar();
      }
      return true;
    } catch (error) {
      console.error('❌ Error inicializando MCP de AFIP SDK:', error);
      return false;
    }
  }

  /**
   * Método para obtener el estado de la conexión con información detallada
   */
  static async obtenerEstado(): Promise<{
    conectado: boolean;
    herramientas: AfipMcpTool[];
    recursos: AfipMcpResource[];
    error?: string;
  }> {
    try {
      const conectado = this.estaConectado();
      
      if (!conectado) {
        return {
          conectado: false,
          herramientas: [],
          recursos: [],
          error: 'No hay conexión activa'
        };
      }

      const [herramientas, recursos] = await Promise.all([
        this.listarHerramientas().catch(() => []),
        this.listarRecursos().catch(() => [])
      ]);

      return {
        conectado: true,
        herramientas,
        recursos
      };

    } catch (error: any) {
      return {
        conectado: false,
        herramientas: [],
        recursos: [],
        error: error.message
      };
    }
  }
}

export default McpAfipService;