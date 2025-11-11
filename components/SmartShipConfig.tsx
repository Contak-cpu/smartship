import React, { useState, useEffect } from 'react';

export interface SmartShipConfigValues {
  peso: number;
  alto: number;
  ancho: number;
  profundidad: number;
  valorDeclarado: number;
}

interface SmartShipConfigProps {
  onConfigChange: (config: SmartShipConfigValues) => void;
}

const SmartShipConfig: React.FC<SmartShipConfigProps> = ({ onConfigChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<SmartShipConfigValues>({
    peso: 400,
    alto: 10,
    ancho: 10,
    profundidad: 10,
    valorDeclarado: 6000,
  });

  // Cargar configuración guardada al iniciar
  useEffect(() => {
    const savedConfig = localStorage.getItem('smartship-config');
    
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        // Eliminar platform si existe (para compatibilidad con versiones anteriores)
        const { platform, ...configSinPlatform } = parsedConfig;
        setConfig(configSinPlatform);
        onConfigChange(configSinPlatform);
      } catch (error) {
        console.error('Error al cargar configuración:', error);
        onConfigChange(config);
      }
    } else {
      onConfigChange(config);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Estado temporal para inputs (permite valores vacíos durante la edición)
  const [tempValues, setTempValues] = useState<Partial<Record<keyof SmartShipConfigValues, string>>>({});

  // Guardar configuración cuando cambie (solo actualiza tempValues durante edición)
  const handleInputChange = (field: keyof SmartShipConfigValues, value: string) => {
    setTempValues({ ...tempValues, [field]: value });
  };
  
  // Aplicar configuración al cerrar el modal
  const handleApply = () => {
    // Usar valores temporales si existen, sino usar los de config
    const finalConfig: SmartShipConfigValues = {
      peso: tempValues.peso !== undefined && tempValues.peso !== '' ? parseInt(tempValues.peso) || 400 : (config.peso || 400),
      alto: tempValues.alto !== undefined && tempValues.alto !== '' ? parseInt(tempValues.alto) || 10 : (config.alto || 10),
      ancho: tempValues.ancho !== undefined && tempValues.ancho !== '' ? parseInt(tempValues.ancho) || 10 : (config.ancho || 10),
      profundidad: tempValues.profundidad !== undefined && tempValues.profundidad !== '' ? parseInt(tempValues.profundidad) || 10 : (config.profundidad || 10),
      valorDeclarado: tempValues.valorDeclarado !== undefined && tempValues.valorDeclarado !== '' ? parseInt(tempValues.valorDeclarado) || 6000 : (config.valorDeclarado || 6000),
    };
    setConfig(finalConfig);
    setTempValues({}); // Limpiar valores temporales
    localStorage.setItem('smartship-config', JSON.stringify(finalConfig));
    onConfigChange(finalConfig);
    setIsOpen(false);
  };
  
  // Obtener valor mostrado en el input (tempValues tiene prioridad)
  const getInputValue = (field: keyof SmartShipConfigValues): string => {
    if (tempValues[field] !== undefined) {
      return tempValues[field] || '';
    }
    return config[field] ? String(config[field]) : '';
  };

  return (
    <>
      {/* Botón compacto de configuración - Ruedita */}
      <button
        onClick={() => {
          setIsOpen(true);
          setTempValues({}); // Resetear valores temporales al abrir
        }}
        className="absolute top-4 right-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-2.5 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl group"
        title="Configurar medidas y peso del paquete"
      >
        <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Modal de configuración */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-gray-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 border-2 border-gray-200 dark:border-gray-700">
            {/* Encabezado */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración de Valores</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Define los valores predeterminados para el procesamiento</p>
              </div>
              <button
                onClick={() => {
                  setTempValues({});
                  setIsOpen(false);
                }}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido */}
            <div className="space-y-4">
              {/* Valor Declarado */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor Declarado ($ C/IVA) *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={getInputValue('valorDeclarado')}
                    onChange={(e) => handleInputChange('valorDeclarado', e.target.value)}
                    className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    placeholder="6000"
                  />
                  <span className="text-gray-600 dark:text-gray-400 text-sm">$</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Valor asegurado del paquete</p>
              </div>

              {/* Peso */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Peso (gramos)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={getInputValue('peso')}
                    onChange={(e) => handleInputChange('peso', e.target.value)}
                    className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    placeholder="400"
                  />
                  <span className="text-gray-600 dark:text-gray-400 text-sm">g</span>
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
                      value={getInputValue('alto')}
                      onChange={(e) => handleInputChange('alto', e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="0"
                      placeholder="10"
                    />
                    <span className="text-gray-600 dark:text-gray-400 text-sm">cm</span>
                  </div>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ancho (cm)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={getInputValue('ancho')}
                      onChange={(e) => handleInputChange('ancho', e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="0"
                      placeholder="10"
                    />
                    <span className="text-gray-600 dark:text-gray-400 text-sm">cm</span>
                  </div>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Profundidad (cm)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={getInputValue('profundidad')}
                      onChange={(e) => handleInputChange('profundidad', e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="0"
                      placeholder="10"
                    />
                    <span className="text-gray-600 dark:text-gray-400 text-sm">cm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-between items-center gap-3">
              {/* Ícono de información */}
              <div className="group relative">
                <div className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-all duration-300 cursor-help shadow-lg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                {/* Tooltip */}
                <div className="hidden group-hover:block absolute left-0 bottom-full mb-2 z-50 w-80 bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 text-sm rounded-lg shadow-xl p-4 border border-gray-700 dark:border-gray-600">
                  <strong className="text-blue-400 dark:text-blue-300">ℹ️ Configuración de Valores Predeterminados</strong>
                  <div className="mt-3 space-y-2 text-gray-300 dark:text-gray-400">
                    <p><strong>Valor Declarado:</strong> Valor asegurado del paquete que Andreani usará para calcular el costo del seguro (incluye IVA).</p>
                    <p><strong>Peso:</strong> Peso total del paquete en gramos. Andreani cobra según el peso del paquete.</p>
                    <p><strong>Dimensiones:</strong> Alto, ancho y profundidad del paquete en centímetros. Importantes para calcular el volumen del envío.</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Estos valores se aplicarán automáticamente a todos los paquetes procesados.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setTempValues({});
                    setIsOpen(false);
                  }}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApply}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SmartShipConfig;

