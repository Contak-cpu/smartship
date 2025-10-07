
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { DataPreview } from './DataPreview';

interface ResultsDisplayProps {
  domicilioCSV: string;
  sucursalCSV: string;
  onDownload: (content: string, fileName: string) => void;
  onDownloadCombined?: (domicilioCSV: string, sucursalCSV: string, fileName: string) => void;
  onDownloadExcel?: (domicilioCSV: string, sucursalCSV: string) => void;
}

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const ExcelIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

// Función para agregar encabezados combinados (versión simple que no mueve datos)
const addCombinedHeadersSimple = (sheet: any, type: 'domicilio' | 'sucursal') => {
    // Insertar fila vacía al inicio para los encabezados combinados
    XLSX.utils.sheet_add_aoa(sheet, [['']], { origin: 'A1' });
    
    // Configurar los encabezados combinados según el tipo
    if (type === 'domicilio') {
        // Domicilios: A-G = Características, H-M = Destinatario, N-S = Domicilio Destino
        sheet['A1'] = { v: 'Características', t: 's' };
        sheet['H1'] = { v: 'Destinatario', t: 's' };
        sheet['N1'] = { v: 'Domicilio Destino', t: 's' };
        
        // Combinar celdas A1:G1
        if (!sheet['!merges']) sheet['!merges'] = [];
        sheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } });
        
        // Combinar celdas H1:M1
        sheet['!merges'].push({ s: { r: 0, c: 7 }, e: { r: 0, c: 12 } });
        
        // Combinar celdas N1:S1
        sheet['!merges'].push({ s: { r: 0, c: 13 }, e: { r: 0, c: 18 } });
        
    } else if (type === 'sucursal') {
        // Sucursales: A-G = Datos de envío, H-M = Destinatario, N = Destino
        sheet['A1'] = { v: 'Datos de envío', t: 's' };
        sheet['H1'] = { v: 'Destinatario', t: 's' };
        sheet['N1'] = { v: 'Destino', t: 's' };
        
        // Combinar celdas A1:G1
        if (!sheet['!merges']) sheet['!merges'] = [];
        sheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } });
        
        // Combinar celdas H1:M1
        sheet['!merges'].push({ s: { r: 0, c: 7 }, e: { r: 0, c: 12 } });
        
        // La celda N1 no se combina (solo una celda)
    }
    
    // Aplicar formato a los encabezados combinados
    const headerCells = ['A1', 'H1', 'N1'];
    headerCells.forEach(cellRef => {
        if (sheet[cellRef]) {
            sheet[cellRef].s = {
                font: { bold: true, sz: 11 },
                alignment: { horizontal: 'center', vertical: 'center' }
            };
        }
    });
    
    // Actualizar el rango de la hoja para incluir la nueva fila
    if (sheet['!ref']) {
        const range = XLSX.utils.decode_range(sheet['!ref']);
        range.e.r += 1; // Agregar una fila más
        sheet['!ref'] = XLSX.utils.encode_range(range);
    }
};

// Función para restaurar los encabezados originales con formato completo
const restoreOriginalHeaders = (sheet: any, type: 'domicilio' | 'sucursal') => {
    if (type === 'domicilio') {
        // Encabezados originales para domicilios
        const domicilioHeaders = [
            'Paquete Guardado Ej: 1',
            'Peso (grs) Ej: ',
            'Alto (cm) Ej: ',
            'Ancho (cm) Ej: ',
            'Profundidad (cm) Ej: ',
            'Valor declarado ($ C/IVA) * Ej: ',
            'Numero Interno Ej: ',
            'Nombre * Ej: ',
            'Apellido * Ej: ',
            'DNI * Ej: ',
            'Email * Ej: ',
            'Celular código * Ej: ',
            'Celular número * Ej: ',
            'Calle * Ej: ',
            'Número * Ej: ',
            'Piso Ej: ',
            'Departamento Ej: ',
            'Provincia / Localidad / CP * Ej: BUENOS AIRES / 11 DE SEPTIEMBRE / 1657',
            'Observaciones Ej: '
        ];
        
        // Aplicar encabezados en la fila 2
        domicilioHeaders.forEach((header, index) => {
            const cellRef = XLSX.utils.encode_cell({ r: 1, c: index }); // Fila 2 (índice 1)
            sheet[cellRef] = { v: header, t: 's' };
        });
        
    } else if (type === 'sucursal') {
        // Encabezados originales para sucursales
        const sucursalHeaders = [
            'Paquete Guardado Ej: 1',
            'Peso (grs) Ej: ',
            'Alto (cm) Ej: ',
            'Ancho (cm) Ej: ',
            'Profundidad (cm) Ej: ',
            'Valor declarado ($ C/IVA) * Ej: ',
            'Numero Interno Ej: ',
            'Nombre * Ej: ',
            'Apellido * Ej: ',
            'DNI * Ej: ',
            'Email * Ej: ',
            'Celular código * Ej: ',
            'Celular número * Ej: ',
            'Sucursal * Ej: 9 DE JULIO'
        ];
        
        // Aplicar encabezados en la fila 2
        sucursalHeaders.forEach((header, index) => {
            const cellRef = XLSX.utils.encode_cell({ r: 1, c: index }); // Fila 2 (índice 1)
            sheet[cellRef] = { v: header, t: 's' };
        });
    }
};

// Función para crear hoja con estructura de Andreani (encabezados + ejemplo + datos)
const createAndreaniSheet = (data: any[], type: 'domicilio' | 'sucursal') => {
  const worksheet = XLSX.utils.aoa_to_sheet([]);
  
  // Definir encabezados según el tipo
  let headers: string[];
  
  if (type === 'domicilio') {
    headers = [
      'Paquete Guardado\nEj: Mistery',
      'Peso (grs)\nEj: ',
      'Alto (cm)\nEj: ',
      'Ancho (cm)\nEj: ',
      'Profundidad (cm)\nEj: ',
      'Valor declarado ($ C/IVA) *\nEj: ',
      'Numero Interno\nEj: ',
      'Nombre *\nEj: ',
      'Apellido *\nEj: ',
      'DNI *\nEj: ',
      'Email *\nEj: ',
      'Celular código *\nEj: ',
      'Celular número *\nEj: ',
      'Calle *\nEj: ',
      'Número *\nEj: ',
      'Piso\nEj: ',
      'Departamento\nEj: ',
      'Provincia / Localidad / CP *\nEj: BUENOS AIRES / 11 DE SEPTIEMBRE / 1657',
      'Observaciones\nEj: '
    ];
  } else {
    headers = [
      'Paquete Guardado\nEj: Mistery',
      'Peso (grs)\nEj: ',
      'Alto (cm)\nEj: ',
      'Ancho (cm)\nEj: ',
      'Profundidad (cm)\nEj: ',
      'Valor declarado ($ C/IVA) *\nEj: ',
      'Numero Interno\nEj: ',
      'Nombre *\nEj: ',
      'Apellido *\nEj: ',
      'DNI *\nEj: ',
      'Email *\nEj: ',
      'Celular código *\nEj: ',
      'Celular número *\nEj: ',
      'Sucursal *\nEj: 9 DE JULIO'
    ];
  }
  
  // Crear encabezados combinados para la fila 1
  const combinedHeadersRow = [];
  if (type === 'domicilio') {
    // A-G: Características, H-M: Destinatario, N-S: Domicilio Destino
    combinedHeadersRow.push('Características', '', '', '', '', '', '', 'Destinatario', '', '', '', '', '', 'Domicilio Destino', '', '', '', '', '');
  } else {
    // A-G: Datos de envío, H-M: Destinatario, N: Destino
    combinedHeadersRow.push('Datos de envío', '', '', '', '', '', '', 'Destinatario', '', '', '', '', '', 'Destino');
  }
  
  // Agregar encabezados combinados en la fila 1
  XLSX.utils.sheet_add_aoa(worksheet, [combinedHeadersRow], { origin: 'A1' });
  
  // Agregar encabezados detallados en la fila 2
  XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A2' });
  
  // Agregar datos reales a partir de la fila 3
  if (data.length > 0) {
    // Crear encabezados sin "Ej:" para el mapeo
    const cleanHeaders = headers.map(header => header.split('\n')[0]);
    
    const dataRows = data.map(row => {
      const values: any[] = [];
      cleanHeaders.forEach(header => {
        // Buscar el valor correspondiente en el objeto de datos
        const key = Object.keys(row).find(k => 
          header.includes(k.split(' ')[0]) || 
          k.includes(header.split(' ')[0])
        );
        values.push(key ? row[key] : '');
      });
      return values;
    });
    
    XLSX.utils.sheet_add_aoa(worksheet, dataRows, { origin: 'A3' });
  }
  
  // Aplicar formato de celdas combinadas
  if (!worksheet['!merges']) worksheet['!merges'] = [];
  
  if (type === 'domicilio') {
    // Combinar A1:G1 para "Características"
    worksheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } });
    // Combinar H1:M1 para "Destinatario"
    worksheet['!merges'].push({ s: { r: 0, c: 7 }, e: { r: 0, c: 12 } });
    // Combinar N1:S1 para "Domicilio Destino"
    worksheet['!merges'].push({ s: { r: 0, c: 13 }, e: { r: 0, c: 18 } });
  } else {
    // Combinar A1:G1 para "Datos de envío"
    worksheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } });
    // Combinar H1:M1 para "Destinatario"
    worksheet['!merges'].push({ s: { r: 0, c: 7 }, e: { r: 0, c: 12 } });
    // La celda N1 no se combina (solo una celda para "Destino")
  }
  
  return worksheet;
};

// Función para exportar a Excel desde datos ya convertidos
const exportToExcelFromData = (domicilioData: any[], sucursalData: any[]) => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Crear hoja de domicilios si existe contenido
    if (domicilioData.length > 0) {
      const domicilioSheet = createAndreaniSheet(domicilioData, 'domicilio');
      XLSX.utils.book_append_sheet(workbook, domicilioSheet, 'A domicilio');
    }
    
    // Crear hoja de sucursales si existe contenido
    if (sucursalData.length > 0) {
      const sucursalSheet = createAndreaniSheet(sucursalData, 'sucursal');
      XLSX.utils.book_append_sheet(workbook, sucursalSheet, 'A sucursal');
    }
    
    // Verificar que al menos una hoja fue creada
    if (workbook.SheetNames.length === 0) {
      alert('No hay datos para exportar a Excel');
      return;
    }
    
    // Generar nombre de archivo con fecha
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const fileName = `Pedidos_Andreani_${dateString}.xlsx`;
    
    // Descargar el archivo Excel
    XLSX.writeFile(workbook, fileName);
    
    console.log('Archivo Excel exportado exitosamente:', fileName);
    
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    alert('Error al exportar el archivo Excel. Por favor, inténtalo de nuevo.');
  }
};

// Función independiente para exportar a Excel
const exportToExcel = (domicilioCSV: string, sucursalCSV: string) => {
    try {
        const workbook = XLSX.utils.book_new();
        
        // Función interna para convertir CSV a JSON (solo para Excel)
        const csvToJsonForExcel = (csvText: string): any[] => {
            const lines = csvText.split('\n').filter(line => line.trim());
            if (lines.length === 0) return [];
            
            const headers = lines[0].split(';');
            const data = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(';');
                const row: any = {};
                headers.forEach((header, index) => {
                    // Eliminar comillas dobles de encabezados y datos
                    const cleanHeader = header.replace(/"/g, '');
                    const cleanValue = (values[index] || '').replace(/"/g, '');
                    row[cleanHeader] = cleanValue;
                });
                data.push(row);
            }
            
            return data;
        };
        
        // Crear hoja de domicilios si existe contenido
        if (domicilioCSV && domicilioCSV.trim()) {
            const domicilioData = csvToJsonForExcel(domicilioCSV);
            if (domicilioData.length > 0) {
                // Crear hoja directamente sin modificar encabezados
                const domicilioSheet = XLSX.utils.json_to_sheet(domicilioData);
                
                // Agregar encabezados combinados para domicilios (sin mover datos)
                addCombinedHeadersSimple(domicilioSheet, 'domicilio');
                
                XLSX.utils.book_append_sheet(workbook, domicilioSheet, 'Domicilios');
            }
        }
        
        // Crear hoja de sucursales si existe contenido
        if (sucursalCSV && sucursalCSV.trim()) {
            const sucursalData = csvToJsonForExcel(sucursalCSV);
            if (sucursalData.length > 0) {
                // Crear hoja directamente sin modificar encabezados
                const sucursalSheet = XLSX.utils.json_to_sheet(sucursalData);
                
                // Agregar encabezados combinados para sucursales (sin mover datos)
                addCombinedHeadersSimple(sucursalSheet, 'sucursal');
                
                XLSX.utils.book_append_sheet(workbook, sucursalSheet, 'Sucursales');
            }
        }
        
        // Verificar que al menos una hoja fue creada
        if (workbook.SheetNames.length === 0) {
            alert('No hay datos para exportar a Excel');
            return;
        }
        
        // Generar nombre de archivo con fecha
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        const fileName = `Pedidos_Andreani_${dateString}.xlsx`;
        
        // Descargar el archivo Excel
        XLSX.writeFile(workbook, fileName);
        
        console.log('Archivo Excel exportado exitosamente:', fileName);
        
    } catch (error) {
        console.error('Error al exportar a Excel:', error);
        alert('Error al exportar el archivo Excel. Por favor, inténtalo de nuevo.');
    }
};


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ domicilioCSV, sucursalCSV, onDownload, onDownloadCombined, onDownloadExcel }) => {
  const [showPreview, setShowPreview] = useState(false);
  
  // Función para convertir CSV a JSON para Excel
  const csvToJsonForExcel = (csvContent: string): any[] => {
    if (!csvContent || csvContent.trim() === '') return [];
    
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(';').map(h => h.trim());
    const data: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';');
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }
    
    return data;
  };

  // Convertir CSV a arrays de objetos para la vista previa
  const domicilioData = csvToJsonForExcel(domicilioCSV);
  const sucursalData = csvToJsonForExcel(sucursalCSV);

  // Función para convertir datos de vuelta a CSV con estructura Andreani
  const dataToCSV = (data: any[], type: 'domicilio' | 'sucursal'): string => {
    if (data.length === 0) return '';
    
    // Definir encabezados según el tipo
    let headers: string[];
    let exampleRow: string[];
    
    if (type === 'domicilio') {
      headers = [
        'Paquete Guardado\nEj: Mistery',
        'Peso (grs)\nEj: ',
        'Alto (cm)\nEj: ',
        'Ancho (cm)\nEj: ',
        'Profundidad (cm)\nEj: ',
        'Valor declarado ($ C/IVA) *\nEj: ',
        'Numero Interno\nEj: ',
        'Nombre *\nEj: ',
        'Apellido *\nEj: ',
        'DNI *\nEj: ',
        'Email *\nEj: ',
        'Celular código *\nEj: ',
        'Celular número *\nEj: ',
        'Calle *\nEj: ',
        'Número *\nEj: ',
        'Piso\nEj: ',
        'Departamento\nEj: ',
        'Provincia / Localidad / CP *\nEj: BUENOS AIRES / 11 DE SEPTIEMBRE / 1657',
        'Observaciones\nEj: '
      ];
      
      exampleRow = [
        'Mistery', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'BUENOS AIRES / 11 DE SEPTIEMBRE / 1657', ''
      ];
    } else {
      headers = [
        'Paquete Guardado\nEj: Mistery',
        'Peso (grs)\nEj: ',
        'Alto (cm)\nEj: ',
        'Ancho (cm)\nEj: ',
        'Profundidad (cm)\nEj: ',
        'Valor declarado ($ C/IVA) *\nEj: ',
        'Numero Interno\nEj: ',
        'Nombre *\nEj: ',
        'Apellido *\nEj: ',
        'DNI *\nEj: ',
        'Email *\nEj: ',
        'Celular código *\nEj: ',
        'Celular número *\nEj: ',
        'Sucursal *\nEj: 9 DE JULIO'
      ];
      
      exampleRow = [
        'Mistery', '', '', '', '', '', '', '', '', '', '', '', '', '9 DE JULIO'
      ];
    }
    
    // Crear encabezados combinados para la fila 1
    let combinedHeadersRow: string[];
    if (type === 'domicilio') {
      // A-G: Características, H-M: Destinatario, N-S: Domicilio Destino
      combinedHeadersRow = ['Características', '', '', '', '', '', '', 'Destinatario', '', '', '', '', '', 'Domicilio Destino', '', '', '', '', ''];
    } else {
      // A-G: Datos de envío, H-M: Destinatario, N: Destino
      combinedHeadersRow = ['Datos de envío', '', '', '', '', '', '', 'Destinatario', '', '', '', '', '', 'Destino'];
    }
    
    const originalHeaders = headers.map(header => header.split('\n')[0]);
    
    const csvLines = [
      combinedHeadersRow.join(';'), // Fila 1: Encabezados combinados
      headers.join(';') // Fila 2: Encabezados detallados con "Ej:"
    ];
    
    // Agregar datos reales a partir de la fila 3
    data.forEach(row => {
      const values = originalHeaders.map(header => {
        // Buscar el valor correspondiente en el objeto de datos
        const key = Object.keys(row).find(k => 
          header.includes(k.split(' ')[0]) || 
          k.includes(header.split(' ')[0])
        );
        return key ? (row[key] || '') : '';
      });
      csvLines.push(values.join(';'));
    });
    
    return csvLines.join('\n');
  };

  // Generar CSV desde los datos transformados
  const domicilioCSVFromData = dataToCSV(domicilioData, 'domicilio');
  const sucursalCSVFromData = dataToCSV(sucursalData, 'sucursal');
  
  return (
    <>
      <div className="bg-gray-900/50 p-4 sm:p-6 rounded-lg animate-fade-in border border-gray-700/50 shadow-xl">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-white">📥 Descargar Archivos Procesados</h3>
          <button
            onClick={() => setShowPreview(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Vista Previa
          </button>
        </div>
        
        {/* Primera fila - Archivos individuales */}
        <div className="mb-4">
            <h4 className="text-xs sm:text-sm font-medium text-gray-300 mb-3 text-center">Archivos Individuales</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                    onClick={() => onDownload(domicilioCSVFromData, 'Domicilios.csv')}
                    disabled={!domicilioData.length}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-900/50 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center transform hover:scale-105 disabled:hover:scale-100 text-sm sm:text-base"
                >
                   <DownloadIcon />
                   <span className="ml-2">Domicilios.csv</span>
                </button>
                <button
                    onClick={() => onDownload(sucursalCSVFromData, 'Sucursales.csv')}
                    disabled={!sucursalData.length}
                    className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-900/50 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center transform hover:scale-105 disabled:hover:scale-100 text-sm sm:text-base"
                >
                    <DownloadIcon />
                    <span className="ml-2">Sucursales.csv</span>
                </button>
            </div>
        </div>

        {/* Segunda fila - Archivos combinados */}
        <div>
            <h4 className="text-xs sm:text-sm font-medium text-gray-300 mb-3 text-center">Archivos Combinados</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {onDownloadCombined && (
                    <button
                        onClick={() => onDownloadCombined(domicilioCSVFromData, sucursalCSVFromData, 'Domicilios_y_Sucursales_Combinado.csv')}
                        disabled={!domicilioData.length && !sucursalData.length}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900/50 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center transform hover:scale-105 disabled:hover:scale-100 text-sm sm:text-base"
                    >
                        <DownloadIcon />
                        <span className="ml-2">Combinado.csv</span>
                    </button>
                )}
                <button
                    onClick={() => exportToExcelFromData(domicilioData, sucursalData)}
                    disabled={!domicilioData.length && !sucursalData.length}
                    className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-900/50 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center transform hover:scale-105 disabled:hover:scale-100 text-sm sm:text-base"
                >
                    <ExcelIcon />
                    <span className="ml-2">Excel.xlsx</span>
                </button>
            </div>
        </div>

        <style>{`
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in {
                animation: fade-in 0.5s ease-out forwards;
            }
        `}</style>
      </div>

      {/* Modal de Vista Previa */}
      {showPreview && (
        <DataPreview
          domicilioData={domicilioData}
          sucursalData={sucursalData}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
};
