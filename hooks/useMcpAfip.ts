import { useState, useEffect, useCallback } from 'react';
import McpAfipService, { AfipMcpTool, AfipMcpResource, ToolCallResult } from '../services/mcpAfipService';

export interface UseMcpAfipState {
  conectado: boolean;
  conectando: boolean;
  herramientas: AfipMcpTool[];
  recursos: AfipMcpResource[];
  error: string | null;
}

export interface UseMcpAfipReturn extends UseMcpAfipState {
  conectar: () => Promise<boolean>;
  desconectar: () => Promise<void>;
  ejecutarHerramienta: (nombre: string, argumentos?: any) => Promise<ToolCallResult>;
  leerRecurso: (uri: string) => Promise<ToolCallResult>;
  actualizarEstado: () => Promise<void>;
  
  // Métodos específicos de AFIP
  generarFactura: (parametros: any) => Promise<ToolCallResult>;
  consultarComprobantes: (parametros: any) => Promise<ToolCallResult>;
  obtenerProximoNumero: (parametros: any) => Promise<ToolCallResult>;
  consultarTiposComprobante: () => Promise<ToolCallResult>;
  consultarAlicuotasIVA: () => Promise<ToolCallResult>;
  consultarMonedas: () => Promise<ToolCallResult>;
  consultarCotizacion: (codigoMoneda: string) => Promise<ToolCallResult>;
  validarCuit: (cuit: string) => Promise<ToolCallResult>;
  obtenerContribuyente: (cuit: string) => Promise<ToolCallResult>;
}

export const useMcpAfip = (autoConectar: boolean = false): UseMcpAfipReturn => {
  const [state, setState] = useState<UseMcpAfipState>({
    conectado: false,
    conectando: false,
    herramientas: [],
    recursos: [],
    error: null,
  });

  // Actualizar estado desde el servicio
  const actualizarEstado = useCallback(async () => {
    try {
      const estado = await McpAfipService.obtenerEstado();
      setState(prev => ({
        ...prev,
        conectado: estado.conectado,
        herramientas: estado.herramientas,
        recursos: estado.recursos,
        error: estado.error || null,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
      }));
    }
  }, []);

  // Conectar al MCP
  const conectar = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, conectando: true, error: null }));
    
    try {
      await McpAfipService.conectar();
      await actualizarEstado();
      setState(prev => ({ ...prev, conectando: false }));
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        conectando: false,
        error: error.message,
        conectado: false,
      }));
      return false;
    }
  }, [actualizarEstado]);

  // Desconectar del MCP
  const desconectar = useCallback(async (): Promise<void> => {
    try {
      await McpAfipService.desconectar();
      setState({
        conectado: false,
        conectando: false,
        herramientas: [],
        recursos: [],
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
      }));
    }
  }, []);

  // Ejecutar herramienta
  const ejecutarHerramienta = useCallback(async (
    nombre: string, 
    argumentos: any = {}
  ): Promise<ToolCallResult> => {
    if (!state.conectado) {
      return {
        success: false,
        content: null,
        error: 'No hay conexión activa con el MCP'
      };
    }

    try {
      return await McpAfipService.ejecutarHerramienta(nombre, argumentos);
    } catch (error: any) {
      return {
        success: false,
        content: null,
        error: error.message
      };
    }
  }, [state.conectado]);

  // Leer recurso
  const leerRecurso = useCallback(async (uri: string): Promise<ToolCallResult> => {
    if (!state.conectado) {
      return {
        success: false,
        content: null,
        error: 'No hay conexión activa con el MCP'
      };
    }

    try {
      return await McpAfipService.leerRecurso(uri);
    } catch (error: any) {
      return {
        success: false,
        content: null,
        error: error.message
      };
    }
  }, [state.conectado]);

  // Métodos específicos de AFIP
  const generarFactura = useCallback(async (parametros: any): Promise<ToolCallResult> => {
    return McpAfipService.generarFactura(parametros);
  }, []);

  const consultarComprobantes = useCallback(async (parametros: any): Promise<ToolCallResult> => {
    return McpAfipService.consultarComprobantes(parametros);
  }, []);

  const obtenerProximoNumero = useCallback(async (parametros: any): Promise<ToolCallResult> => {
    return McpAfipService.obtenerProximoNumero(parametros);
  }, []);

  const consultarTiposComprobante = useCallback(async (): Promise<ToolCallResult> => {
    return McpAfipService.consultarTiposComprobante();
  }, []);

  const consultarAlicuotasIVA = useCallback(async (): Promise<ToolCallResult> => {
    return McpAfipService.consultarAlicuotasIVA();
  }, []);

  const consultarMonedas = useCallback(async (): Promise<ToolCallResult> => {
    return McpAfipService.consultarMonedas();
  }, []);

  const consultarCotizacion = useCallback(async (codigoMoneda: string): Promise<ToolCallResult> => {
    return McpAfipService.consultarCotizacion(codigoMoneda);
  }, []);

  const validarCuit = useCallback(async (cuit: string): Promise<ToolCallResult> => {
    return McpAfipService.validarCuit(cuit);
  }, []);

  const obtenerContribuyente = useCallback(async (cuit: string): Promise<ToolCallResult> => {
    return McpAfipService.obtenerContribuyente(cuit);
  }, []);

  // Efecto para auto-conectar si está habilitado
  useEffect(() => {
    if (autoConectar && !state.conectado && !state.conectando) {
      conectar();
    }
  }, [autoConectar, state.conectado, state.conectando, conectar]);

  // Efecto para verificar el estado inicial
  useEffect(() => {
    actualizarEstado();
  }, [actualizarEstado]);

  return {
    ...state,
    conectar,
    desconectar,
    ejecutarHerramienta,
    leerRecurso,
    actualizarEstado,
    generarFactura,
    consultarComprobantes,
    obtenerProximoNumero,
    consultarTiposComprobante,
    consultarAlicuotasIVA,
    consultarMonedas,
    consultarCotizacion,
    validarCuit,
    obtenerContribuyente,
  };
};