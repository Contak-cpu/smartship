#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import pkg from '@afipsdk/afip.js';
const { Afip } = pkg;

class AfipMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'afipsdk-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.afip = null;
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'afip_initialize',
            description: 'Inicializar conexión con AFIP usando certificado y clave privada',
            inputSchema: {
              type: 'object',
              properties: {
                cert: {
                  type: 'string',
                  description: 'Ruta al archivo de certificado (.crt)',
                },
                key: {
                  type: 'string',
                  description: 'Ruta al archivo de clave privada (.key)',
                },
                cuit: {
                  type: 'string',
                  description: 'CUIT del contribuyente',
                },
                production: {
                  type: 'boolean',
                  description: 'Usar ambiente de producción (true) o testing (false)',
                  default: false,
                },
              },
              required: ['cert', 'key', 'cuit'],
            },
          },
          {
            name: 'afip_get_last_voucher',
            description: 'Obtener el último número de comprobante',
            inputSchema: {
              type: 'object',
              properties: {
                sales_point: {
                  type: 'number',
                  description: 'Punto de venta',
                },
                voucher_type: {
                  type: 'number',
                  description: 'Tipo de comprobante',
                },
              },
              required: ['sales_point', 'voucher_type'],
            },
          },
          {
            name: 'afip_create_voucher',
            description: 'Crear un nuevo comprobante electrónico',
            inputSchema: {
              type: 'object',
              properties: {
                data: {
                  type: 'object',
                  description: 'Datos del comprobante a crear',
                },
              },
              required: ['data'],
            },
          },
          {
            name: 'afip_get_voucher_info',
            description: 'Obtener información de un comprobante',
            inputSchema: {
              type: 'object',
              properties: {
                number: {
                  type: 'number',
                  description: 'Número del comprobante',
                },
                sales_point: {
                  type: 'number',
                  description: 'Punto de venta',
                },
                voucher_type: {
                  type: 'number',
                  description: 'Tipo de comprobante',
                },
              },
              required: ['number', 'sales_point', 'voucher_type'],
            },
          },
          {
            name: 'afip_get_voucher_types',
            description: 'Obtener tipos de comprobantes disponibles',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'afip_get_sales_points',
            description: 'Obtener puntos de venta disponibles',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'afip_initialize':
            return await this.initializeAfip(args);
          case 'afip_get_last_voucher':
            return await this.getLastVoucher(args);
          case 'afip_create_voucher':
            return await this.createVoucher(args);
          case 'afip_get_voucher_info':
            return await this.getVoucherInfo(args);
          case 'afip_get_voucher_types':
            return await this.getVoucherTypes();
          case 'afip_get_sales_points':
            return await this.getSalesPoints();
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Herramienta desconocida: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Error ejecutando ${name}: ${error.message}`
        );
      }
    });
  }

  async initializeAfip(args) {
    try {
      this.afip = new Afip({
        CUIT: args.cuit,
        cert: args.cert,
        key: args.key,
        production: args.production || false,
      });

      return {
        content: [
          {
            type: 'text',
            text: `AFIP SDK inicializado correctamente para CUIT: ${args.cuit} en modo ${args.production ? 'producción' : 'testing'}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Error inicializando AFIP: ${error.message}`);
    }
  }

  async getLastVoucher(args) {
    if (!this.afip) {
      throw new Error('AFIP no está inicializado. Usa afip_initialize primero.');
    }

    try {
      const lastVoucher = await this.afip.ElectronicBilling.getLastVoucher(
        args.sales_point,
        args.voucher_type
      );

      return {
        content: [
          {
            type: 'text',
            text: `Último comprobante: ${JSON.stringify(lastVoucher, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Error obteniendo último comprobante: ${error.message}`);
    }
  }

  async createVoucher(args) {
    if (!this.afip) {
      throw new Error('AFIP no está inicializado. Usa afip_initialize primero.');
    }

    try {
      const voucher = await this.afip.ElectronicBilling.createVoucher(args.data);

      return {
        content: [
          {
            type: 'text',
            text: `Comprobante creado: ${JSON.stringify(voucher, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Error creando comprobante: ${error.message}`);
    }
  }

  async getVoucherInfo(args) {
    if (!this.afip) {
      throw new Error('AFIP no está inicializado. Usa afip_initialize primero.');
    }

    try {
      const voucherInfo = await this.afip.ElectronicBilling.getVoucherInfo(
        args.number,
        args.sales_point,
        args.voucher_type
      );

      return {
        content: [
          {
            type: 'text',
            text: `Información del comprobante: ${JSON.stringify(voucherInfo, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Error obteniendo información del comprobante: ${error.message}`);
    }
  }

  async getVoucherTypes() {
    if (!this.afip) {
      throw new Error('AFIP no está inicializado. Usa afip_initialize primero.');
    }

    try {
      const voucherTypes = await this.afip.ElectronicBilling.getVoucherTypes();

      return {
        content: [
          {
            type: 'text',
            text: `Tipos de comprobantes: ${JSON.stringify(voucherTypes, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Error obteniendo tipos de comprobantes: ${error.message}`);
    }
  }

  async getSalesPoints() {
    if (!this.afip) {
      throw new Error('AFIP no está inicializado. Usa afip_initialize primero.');
    }

    try {
      const salesPoints = await this.afip.ElectronicBilling.getSalesPoints();

      return {
        content: [
          {
            type: 'text',
            text: `Puntos de venta: ${JSON.stringify(salesPoints, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Error obteniendo puntos de venta: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Servidor MCP de AFIP SDK iniciado');
  }
}

const server = new AfipMCPServer();
server.run().catch(console.error);