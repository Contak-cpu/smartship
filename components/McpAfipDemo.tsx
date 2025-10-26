import React, { useState } from 'react';
import { useMcpAfip } from '../hooks/useMcpAfip';

const McpAfipDemo: React.FC = () => {
  const {
    conectado,
    conectando,
    herramientas,
    recursos,
    error,
    conectar,
    desconectar,
    ejecutarHerramienta,
    generarFactura,
    consultarTiposComprobante,
    validarCuit,
    obtenerContribuyente,
  } = useMcpAfip();

  const [resultados, setResultados] = useState<any>(null);
  const [cargando, setCargando] = useState(false);
  const [cuitTest, setCuitTest] = useState('20111111112');

  const handleConectar = async () => {
    const exito = await conectar();
    if (exito) {
      setResultados({ tipo: 'conexion', mensaje: 'Conectado exitosamente al MCP de AFIP SDK' });
    }
  };

  const handleDesconectar = async () => {
    await desconectar();
    setResultados({ tipo: 'desconexion', mensaje: 'Desconectado del MCP de AFIP SDK' });
  };

  const handleConsultarTipos = async () => {
    setCargando(true);
    try {
      const resultado = await consultarTiposComprobante();
      setResultados({ tipo: 'tipos_comprobante', data: resultado });
    } catch (error: any) {
      setResultados({ tipo: 'error', mensaje: error.message });
    } finally {
      setCargando(false);
    }
  };

  const handleValidarCuit = async () => {
    if (!cuitTest) return;
    
    setCargando(true);
    try {
      const resultado = await validarCuit(cuitTest);
      setResultados({ tipo: 'validar_cuit', data: resultado });
    } catch (error: any) {
      setResultados({ tipo: 'error', mensaje: error.message });
    } finally {
      setCargando(false);
    }
  };

  const handleObtenerContribuyente = async () => {
    if (!cuitTest) return;
    
    setCargando(true);
    try {
      const resultado = await obtenerContribuyente(cuitTest);
      setResultados({ tipo: 'contribuyente', data: resultado });
    } catch (error: any) {
      setResultados({ tipo: 'error', mensaje: error.message });
    } finally {
      setCargando(false);
    }
  };

  const handleGenerarFacturaDemo = async () => {
    setCargando(true);
    try {
      const parametros = {
        cuit: '20111111112',
        puntoVenta: 1,
        tipoComprobante: 11, // Factura C
        numeroComprobante: 1,
        fecha: new Date().toISOString().split('T')[0],
        tipoDocumento: 99, // Sin identificar
        numeroDocumento: '0',
        importeTotal: 121.00,
        importeNeto: 100.00,
        importeIVA: 21.00,
        concepto: 1, // Productos
        moneda: 'PES',
        cotizacion: 1,
        items: [
          {
            descripcion: 'Producto de prueba',
            cantidad: 1,
            precio: 100.00,
            alicuotaIVA: 21
          }
        ]
      };
      
      const resultado = await generarFactura(parametros);
      setResultados({ tipo: 'factura', data: resultado });
    } catch (error: any) {
      setResultados({ tipo: 'error', mensaje: error.message });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Demo MCP AFIP SDK
          </h1>

          {/* Estado de conexión */}
          <div className="mb-6">
            <div className={`p-4 rounded-lg border ${
              conectado 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-medium ${
                    conectado ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Estado: {conectado ? '🟢 Conectado' : '🔴 Desconectado'}
                  </h3>
                  {conectando && (
                    <p className="text-sm text-blue-600">Conectando...</p>
                  )}
                  {error && (
                    <p className="text-sm text-red-600">Error: {error}</p>
                  )}
                </div>
                <div className="space-x-2">
                  <button
                    onClick={handleConectar}
                    disabled={conectado || conectando}
                    className={`px-4 py-2 rounded-md font-medium ${
                      conectado || conectando
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {conectando ? 'Conectando...' : 'Conectar'}
                  </button>
                  <button
                    onClick={handleDesconectar}
                    disabled={!conectado}
                    className={`px-4 py-2 rounded-md font-medium ${
                      !conectado
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    Desconectar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Información de herramientas y recursos */}
          {conectado && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">
                  Herramientas Disponibles ({herramientas.length})
                </h3>
                <div className="space-y-1">
                  {herramientas.map((herramienta, index) => (
                    <div key={index} className="text-sm text-blue-700">
                      <strong>{herramienta.name}</strong>
                      {herramienta.description && (
                        <span className="text-blue-600"> - {herramienta.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-medium text-purple-800 mb-2">
                  Recursos Disponibles ({recursos.length})
                </h3>
                <div className="space-y-1">
                  {recursos.map((recurso, index) => (
                    <div key={index} className="text-sm text-purple-700">
                      <strong>{recurso.name}</strong>
                      {recurso.description && (
                        <span className="text-purple-600"> - {recurso.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Controles de prueba */}
          {conectado && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Pruebas de Funcionalidad
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <button
                  onClick={handleConsultarTipos}
                  disabled={cargando}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Consultar Tipos de Comprobante
                </button>
                
                <button
                  onClick={handleGenerarFacturaDemo}
                  disabled={cargando}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  Generar Factura Demo
                </button>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="text"
                  value={cuitTest}
                  onChange={(e) => setCuitTest(e.target.value)}
                  placeholder="CUIT para probar"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleValidarCuit}
                  disabled={cargando || !cuitTest}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-400"
                >
                  Validar CUIT
                </button>
                <button
                  onClick={handleObtenerContribuyente}
                  disabled={cargando || !cuitTest}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                >
                  Info Contribuyente
                </button>
              </div>
            </div>
          )}

          {/* Resultados */}
          {resultados && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Resultados
              </h2>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="mb-2">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {resultados.tipo}
                  </span>
                </div>
                
                {resultados.mensaje && (
                  <p className="text-gray-700 mb-2">{resultados.mensaje}</p>
                )}
                
                {resultados.data && (
                  <pre className="bg-white border border-gray-300 rounded p-3 text-xs overflow-auto max-h-96">
                    {JSON.stringify(resultados.data, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Información de configuración */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">📋 Configuración Requerida:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Instalar el servidor MCP de AFIP SDK: <code className="bg-yellow-100 px-1 rounded">npm install -g @afipsdk/mcp-server</code></li>
              <li>• Configurar la variable de entorno <code className="bg-yellow-100 px-1 rounded">VITE_AFIP_SDK_API_KEY</code></li>
              <li>• El servidor MCP debe estar ejecutándose para establecer la conexión</li>
              <li>• Las pruebas usan el CUIT de desarrollo por defecto: 20-11111111-2</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default McpAfipDemo;