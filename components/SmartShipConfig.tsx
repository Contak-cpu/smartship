import React, { useState, useEffect } from 'react';

export type PlatformType = 'tiendanube' | 'shopify';

export interface SmartShipConfigValues {
  peso: number;
  alto: number;
  ancho: number;
  profundidad: number;
  valorDeclarado: number;
  platform: PlatformType;
}

interface SmartShipConfigProps {
  onConfigChange: (config: SmartShipConfigValues) => void;
  onPlatformChange?: (platform: PlatformType) => void;
}

const SmartShipConfig: React.FC<SmartShipConfigProps> = ({ onConfigChange, onPlatformChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<SmartShipConfigValues>({
    peso: 400,
    alto: 10,
    ancho: 10,
    profundidad: 10,
    valorDeclarado: 6000,
    platform: 'tiendanube',
  });

  // Cargar configuración guardada al iniciar
  useEffect(() => {
    const savedConfig = localStorage.getItem('smartship-config');
    const savedPlatform = localStorage.getItem('smartship-platform');
    
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        // Asegurar que platform esté presente
        if (!parsedConfig.platform) {
          parsedConfig.platform = savedPlatform === 'shopify' ? 'shopify' : 'tiendanube';
        }
        setConfig(parsedConfig);
        onConfigChange(parsedConfig);
        if (onPlatformChange) {
          onPlatformChange(parsedConfig.platform);
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error);
        onConfigChange(config);
      }
    } else {
      // Si hay plataforma guardada, usarla
      if (savedPlatform) {
        const platform = savedPlatform === 'shopify' ? 'shopify' : 'tiendanube';
        config.platform = platform;
        if (onPlatformChange) {
          onPlatformChange(platform);
        }
      }
      onConfigChange(config);
    }
  }, []);
  
  // Manejar cambio de plataforma
  const handlePlatformChange = (platform: PlatformType) => {
    const newConfig = { ...config, platform };
    setConfig(newConfig);
    localStorage.setItem('smartship-config', JSON.stringify(newConfig));
    localStorage.setItem('smartship-platform', platform);
    onConfigChange(newConfig);
    if (onPlatformChange) {
      onPlatformChange(platform);
    }
  };

  // Guardar configuración cuando cambie
  const handleConfigChange = (field: keyof SmartShipConfigValues, value: number) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    localStorage.setItem('smartship-config', JSON.stringify(newConfig));
    onConfigChange(newConfig);
  };

  return (
    <>
      {/* Selector de plataforma */}
      <div className="absolute top-4 left-4 flex items-center gap-3">
        <div className="bg-gray-800 rounded-lg p-2 border border-gray-700">
          <label className="text-sm text-gray-300 mr-2">Plataforma:</label>
          <select
            value={config.platform}
            onChange={(e) => handlePlatformChange(e.target.value as PlatformType)}
            className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="tiendanube">Tiendanube</option>
            <option value="shopify">Shopify</option>
          </select>
        </div>
      </div>
      
      {/* Botón para abrir configuración con ícono de información */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        {/* Ícono de información */}
        <div className="group relative">
          <div className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-all duration-300 cursor-help shadow-lg">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          {/* Tooltip */}
          <div className="hidden group-hover:block absolute right-0 top-10 z-50 w-80 bg-gray-900 text-white text-sm rounded-lg shadow-xl p-4 border border-gray-700">
            <strong className="text-blue-400">ℹ️ Configuración de Valores Predeterminados</strong>
            <div className="mt-3 space-y-2 text-gray-300">
              <p><strong>Valor Declarado:</strong> Valor asegurado del paquete que Andreani usará para calcular el costo del seguro (incluye IVA).</p>
              <p><strong>Peso:</strong> Peso total del paquete en gramos. Andreani cobra según el peso del paquete.</p>
              <p><strong>Dimensiones:</strong> Alto, ancho y profundidad del paquete en centímetros. Importantes para calcular el volumen del envío.</p>
              <p className="text-xs text-gray-400 mt-2">Estos valores se aplicarán automáticamente a todos los paquetes procesados.</p>
            </div>
          </div>
        </div>
        
        {/* Botón de configuración */}
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Configurar Valores
        </button>
      </div>

      {/* Modal de configuración */}
      {isOpen && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6">
            {/* Encabezado */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Configuración de Valores</h2>
                <p className="text-gray-400 text-sm mt-1">Define los valores predeterminados para el procesamiento</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido */}
            <div className="space-y-4">
              {/* Valor Declarado */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Valor Declarado ($ C/IVA) *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={config.valorDeclarado}
                    onChange={(e) => handleConfigChange('valorDeclarado', parseInt(e.target.value) || 6000)}
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                  />
                  <span className="text-gray-400 text-sm">$</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Valor asegurado del paquete</p>
              </div>

              {/* Peso */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Peso (gramos)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={config.peso}
                    onChange={(e) => handleConfigChange('peso', parseInt(e.target.value) || 400)}
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                  />
                  <span className="text-gray-400 text-sm">g</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Peso del paquete en gramos</p>
              </div>

              {/* Medidas */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Alto (cm)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={config.alto}
                      onChange={(e) => handleConfigChange('alto', parseInt(e.target.value) || 10)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="0"
                    />
                    <span className="text-gray-400 text-sm">cm</span>
                  </div>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ancho (cm)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={config.ancho}
                      onChange={(e) => handleConfigChange('ancho', parseInt(e.target.value) || 10)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="0"
                    />
                    <span className="text-gray-400 text-sm">cm</span>
                  </div>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Profundidad (cm)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={config.profundidad}
                      onChange={(e) => handleConfigChange('profundidad', parseInt(e.target.value) || 10)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="0"
                    />
                    <span className="text-gray-400 text-sm">cm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SmartShipConfig;

