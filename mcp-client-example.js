#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

class AfipMCPClient {
  constructor() {
    this.client = new Client(
      {
        name: 'afipsdk-mcp-client',
        version: '0.1.0',
      },
      {
        capabilities: {},
      }
    );
  }

  async connect() {
    // Iniciar el servidor MCP
    const serverProcess = spawn('node', ['mcp-afip-server.js'], {
      stdio: ['pipe', 'pipe', 'inherit'],
      cwd: process.cwd()
    });

    const transport = new StdioClientTransport({
      readable: serverProcess.stdout,
      writable: serverProcess.stdin,
    });

    await this.client.connect(transport);
    console.log('Conectado al servidor MCP de AFIP SDK');

    return serverProcess;
  }

  async listTools() {
    const response = await this.client.request(
      { method: 'tools/list' },
      {}
    );
    return response.tools;
  }

  async callTool(name, args) {
    const response = await this.client.request(
      { method: 'tools/call' },
      {
        name,
        arguments: args,
      }
    );
    return response;
  }

  async disconnect() {
    await this.client.close();
  }
}

// Ejemplo de uso
async function main() {
  const client = new AfipMCPClient();
  
  try {
    const serverProcess = await client.connect();
    
    // Listar herramientas disponibles
    console.log('Herramientas disponibles:');
    const tools = await client.listTools();
    tools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });

    // Ejemplo de inicialización (necesitarás proporcionar tus propios certificados)
    // const initResult = await client.callTool('afip_initialize', {
    //   cert: 'ruta/a/tu/certificado.crt',
    //   key: 'ruta/a/tu/clave.key',
    //   cuit: '20123456789',
    //   production: false
    // });
    // console.log('Resultado de inicialización:', initResult);

    await client.disconnect();
    serverProcess.kill();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}