import React, { useState, useEffect } from 'react';
import { afipMCPService, AfipConfig, VoucherData } from '../services/afipMCPService';

interface AfipMCPConnectorProps {
  onConnectionChange?: (connected: boolean) => void;
}

export const AfipMCPConnector: React.FC<AfipMCPConnectorProps> = ({ onConnectionChange }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [voucherTypes, setVoucherTypes] = useState<any[]>([]);
  const [salesPoints, setSalesPoints] = useState<any[]>([]);
  
  const [config, setConfig] = useState<AfipConfig>({
    cert: '',
    key: '',
    cuit: '',
    production: false
  });

  const [voucherData, setVoucherData] = useState<Partial<VoucherData>>({
    CantReg: 1,
    PtoVta: 1,
    CbteTipo: 1,
    Concepto: 1,
    DocTipo: 80,
    DocNro: 0,
    CbteDesde: 1,
    CbteHasta: 1,
    CbteFch: new Date().toISOString().split('T')[0].replace(/-/g, ''),
    ImpTotal: 0,
    ImpTotConc: 0,
    ImpNeto: 0,
    ImpOpEx: 0,
    ImpIVA: 0,
    ImpTrib: 0,
    MonId: 'PES',
    MonCotiz: 1
  });

  useEffect(() => {
    return () => {
      afipMCPService.disconnect();
    };
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const connected = await afipMCPService.connect();
      setIsConnected(connected);
      onConnectionChange?.(connected);
      
      if (connected) {
        setMessage('Conectado al MCP de AFIP SDK exitosamente');
      } else {
        setMessage('Error conectando al MCP de AFIP SDK');
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInitialize = async () => {
    if (!config.cert || !config.key || !config.cuit) {
      setMessage('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const result = await afipMCPService.initialize(config);
      setIsInitialized(result.success);
      setMessage(result.message);
      
      if (result.success) {
        // Cargar datos iniciales
        await loadInitialData();
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      const [types, points] = await Promise.all([
        afipMCPService.getVoucherTypes(),
        afipMCPService.getSalesPoints()
      ]);
      
      setVoucherTypes(types);
      setSalesPoints(points);
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    }
  };

  const handleGetLastVoucher = async () => {
    if (!voucherData.PtoVta || !voucherData.CbteTipo) {
      setMessage('Selecciona punto de venta y tipo de comprobante');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const result = await afipMCPService.getLastVoucher(
        voucherData.PtoVta,
        voucherData.CbteTipo
      );
      setMessage(`Último comprobante: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVoucher = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const result = await afipMCPService.createVoucher(voucherData as VoucherData);
      setMessage(`Comprobante creado: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Conector MCP AFIP SDK</h2>
      
      {/* Estado de conexión */}
      <div className="mb-6 p-4 rounded-lg bg-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="font-medium">
            Estado: {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        
        {!isConnected && (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Conectando...' : 'Conectar al MCP'}
          </button>
        )}
      </div>

      {/* Configuración AFIP */}
      {isConnected && !isInitialized && (
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Configuración AFIP</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Certificado (.crt)</label>
              <input
                type="text"
                value={config.cert}
                onChange={(e) => setConfig(prev => ({ ...prev, cert: e.target.value }))}
                placeholder="Ruta al archivo .crt"
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Clave privada (.key)</label>
              <input
                type="text"
                value={config.key}
                onChange={(e) => setConfig(prev => ({ ...prev, key: e.target.value }))}
                placeholder="Ruta al archivo .key"
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">CUIT</label>
              <input
                type="text"
                value={config.cuit}
                onChange={(e) => setConfig(prev => ({ ...prev, cuit: e.target.value }))}
                placeholder="20123456789"
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.production}
                  onChange={(e) => setConfig(prev => ({ ...prev, production: e.target.checked }))}
                />
                <span className="text-sm font-medium">Ambiente de producción</span>
              </label>
            </div>
          </div>
          
          <button
            onClick={handleInitialize}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Inicializando...' : 'Inicializar AFIP'}
          </button>
        </div>
      )}

      {/* Operaciones AFIP */}
      {isInitialized && (
        <div className="space-y-6">
          {/* Información de comprobantes */}
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Consultar Último Comprobante</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Punto de Venta</label>
                <select
                  value={voucherData.PtoVta || ''}
                  onChange={(e) => setVoucherData(prev => ({ ...prev, PtoVta: parseInt(e.target.value) }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Seleccionar...</option>
                  {salesPoints.map(point => (
                    <option key={point.Id} value={point.Id}>{point.Desc}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Comprobante</label>
                <select
                  value={voucherData.CbteTipo || ''}
                  onChange={(e) => setVoucherData(prev => ({ ...prev, CbteTipo: parseInt(e.target.value) }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Seleccionar...</option>
                  {voucherTypes.map(type => (
                    <option key={type.Id} value={type.Id}>{type.Desc}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <button
              onClick={handleGetLastVoucher}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Consultando...' : 'Obtener Último Comprobante'}
            </button>
          </div>

          {/* Crear comprobante */}
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Crear Comprobante</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Documento Tipo</label>
                <input
                  type="number"
                  value={voucherData.DocTipo || ''}
                  onChange={(e) => setVoucherData(prev => ({ ...prev, DocTipo: parseInt(e.target.value) }))}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Documento Número</label>
                <input
                  type="number"
                  value={voucherData.DocNro || ''}
                  onChange={(e) => setVoucherData(prev => ({ ...prev, DocNro: parseInt(e.target.value) }))}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Importe Total</label>
                <input
                  type="number"
                  step="0.01"
                  value={voucherData.ImpTotal || ''}
                  onChange={(e) => setVoucherData(prev => ({ ...prev, ImpTotal: parseFloat(e.target.value) }))}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            
            <button
              onClick={handleCreateVoucher}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Comprobante'}
            </button>
          </div>
        </div>
      )}

      {/* Mensajes */}
      {message && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <pre className="whitespace-pre-wrap text-sm">{message}</pre>
        </div>
      )}
    </div>
  );
};