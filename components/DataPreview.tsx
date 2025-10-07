import React, { useState } from 'react';

interface DataPreviewProps {
  domicilioData: any[];
  sucursalData: any[];
  onClose: () => void;
}

export const DataPreview: React.FC<DataPreviewProps> = ({ 
  domicilioData, 
  sucursalData, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'domicilio' | 'sucursal'>('domicilio');
  const [showAllColumns, setShowAllColumns] = useState(false);

  const currentData = activeTab === 'domicilio' ? domicilioData : sucursalData;
  const dataType = activeTab === 'domicilio' ? 'Domicilio' : 'Sucursal';

  // Obtener las columnas principales para mostrar
  const getMainColumns = (data: any[]) => {
    if (data.length === 0) return [];
    
    const allColumns = Object.keys(data[0]);
    const mainColumns = [
      'Numero Interno',
      'Nombre *',
      'Apellido *',
      'Email *',
      'Celular código *',
      'Celular número *',
      'DNI *',
      'Valor declarado ($ C/IVA) *'
    ];

    // Agregar columnas específicas según el tipo
    if (activeTab === 'domicilio') {
      mainColumns.push('Calle *', 'Número *', 'Provincia / Localidad / CP *');
    } else {
      mainColumns.push('Sucursal *');
    }

    // Filtrar solo las columnas que existen en los datos
    return mainColumns.filter(col => allColumns.some(key => key.includes(col.split(' ')[0])));
  };

  const mainColumns = getMainColumns(currentData);
  const allColumns = currentData.length > 0 ? Object.keys(currentData[0]) : [];

  const displayColumns = showAllColumns ? allColumns : mainColumns;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Vista Previa de Datos</h2>
            <p className="text-gray-400 text-sm mt-1">
              Cómo se verán tus datos en el archivo XLSX de Andreani
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('domicilio')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'domicilio'
                ? 'text-green-400 border-b-2 border-green-400 bg-gray-700'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Envíos a Domicilio ({domicilioData.length})
          </button>
          <button
            onClick={() => setActiveTab('sucursal')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'sucursal'
                ? 'text-green-400 border-b-2 border-green-400 bg-gray-700'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Envíos a Sucursal ({sucursalData.length})
          </button>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center p-4 bg-gray-700">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300">
              Mostrando {displayColumns.length} de {allColumns.length} columnas
            </span>
            <button
              onClick={() => setShowAllColumns(!showAllColumns)}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {showAllColumns ? 'Mostrar principales' : 'Mostrar todas'}
            </button>
          </div>
          <div className="text-sm text-gray-300">
            {currentData.length} registros de {dataType.toLowerCase()}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {currentData.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-gray-400 text-lg mb-2">No hay datos</div>
                <div className="text-gray-500 text-sm">
                  No se encontraron registros de {dataType.toLowerCase()}
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-700 sticky top-0">
                  <tr>
                    {displayColumns.map((column, index) => (
                      <th
                        key={index}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-r border-gray-600 last:border-r-0"
                      >
                        <div className="max-w-32 truncate" title={column}>
                          {column}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {currentData.slice(0, 50).map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-700 transition-colors">
                      {displayColumns.map((column, colIndex) => {
                        const originalKey = Object.keys(row).find(key => 
                          key.includes(column.split(' ')[0])
                        );
                        const value = originalKey ? row[originalKey] : '';
                        
                        return (
                          <td
                            key={colIndex}
                            className="px-4 py-3 text-gray-300 border-r border-gray-600 last:border-r-0"
                          >
                            <div className="max-w-32 truncate" title={String(value)}>
                              {String(value || '')}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {currentData.length > 50 && (
                <div className="bg-gray-700 px-4 py-3 text-center text-sm text-gray-400">
                  Mostrando los primeros 50 registros de {currentData.length} total
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 bg-gray-700 border-t border-gray-600">
          <div className="text-sm text-gray-400">
            <div className="font-medium text-white mb-1">Resumen de datos:</div>
            <div>• Domicilios: {domicilioData.length} registros</div>
            <div>• Sucursales: {sucursalData.length} registros</div>
            <div>• Total: {domicilioData.length + sucursalData.length} registros</div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
            >
              Cerrar Vista Previa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
