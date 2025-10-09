
import React, { useState } from 'react';
import * as XLSX from 'xlsx';

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


// Función para crear Excel sin template (método original)
const createExcelWithoutTemplate = (domicilioCSV: string, sucursalCSV: string) => {
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
                const domicilioSheet = XLSX.utils.json_to_sheet(domicilioData);
                XLSX.utils.book_append_sheet(workbook, domicilioSheet, 'Domicilios');
            }
        }
        
        // Crear hoja de sucursales si existe contenido
        if (sucursalCSV && sucursalCSV.trim()) {
            const sucursalData = csvToJsonForExcel(sucursalCSV);
            if (sucursalData.length > 0) {
                const sucursalSheet = XLSX.utils.json_to_sheet(sucursalData);
            XLSX.utils.book_append_sheet(workbook, sucursalSheet, 'Sucursales');
        }
    }
    
    return workbook;
};

// Función independiente para exportar a Excel usando template
const exportToExcel = async (domicilioCSV: string, sucursalCSV: string) => {
    try {
        console.log('===== INICIANDO EXPORTACIÓN EXCEL =====');
        console.log('Domicilio CSV length:', domicilioCSV?.length);
        console.log('Sucursal CSV length:', sucursalCSV?.length);
        console.log('Primeros 200 chars de domicilio:', domicilioCSV?.substring(0, 200));
        
        // Cargar el template desde public/templates/template.xlsx
        const templateResponse = await fetch('/templates/template.xlsx');
        if (!templateResponse.ok) {
            throw new Error(`No se pudo cargar el template: ${templateResponse.status}`);
        }
        const templateBuffer = await templateResponse.arrayBuffer();
        const workbook = XLSX.read(templateBuffer, { type: 'array' });
        console.log('Template cargado exitosamente, hojas:', workbook.SheetNames);
        
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
        
        // Procesar domicilios si existe contenido
        if (domicilioCSV && domicilioCSV.trim()) {
            const domicilioData = csvToJsonForExcel(domicilioCSV);
            console.log('Domicilio data:', domicilioData.length, 'registros');
            console.log('Primer registro:', domicilioData[0]);
            
            if (domicilioData.length > 0 && workbook.SheetNames.length > 0) {
                // Seleccionar la primera hoja del template (Domicilios)
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                console.log('Hoja seleccionada:', sheetName);
                console.log('Hojas disponibles:', workbook.SheetNames);
                
                // Convertir datos CSV a formato de hoja
                const newData = XLSX.utils.json_to_sheet(domicilioData);
                const range = XLSX.utils.decode_range(newData['!ref'] || 'A1:A1');
                console.log('Rango de datos:', range);
                console.log('Primera celda de datos:', newData['A1']);
                
                // Copiar los datos nuevos al template existente
                // IMPORTANTE: Comienza desde la fila 3 (índice 2) para respetar 
                // los encabezados del template
                let cellsCopied = 0;
                for (let R = range.s.r; R <= range.e.r; ++R) {
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                        const targetRow = R + 2; // +2 para saltar las 2 filas de encabezado
                        const cellAddress = XLSX.utils.encode_cell({ r: targetRow, c: C });
                        const sourceCellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                        if (newData[sourceCellAddress]) {
                            worksheet[cellAddress] = newData[sourceCellAddress];
                            cellsCopied++;
                        }
                    }
                }
                console.log('Celdas copiadas:', cellsCopied);
            }
        }
        
        // Procesar sucursales si existe contenido y hay segunda hoja
        if (sucursalCSV && sucursalCSV.trim() && workbook.SheetNames.length > 1) {
            const sucursalData = csvToJsonForExcel(sucursalCSV);
            
            if (sucursalData.length > 0) {
                // Seleccionar la segunda hoja del template (Sucursales)
                const sheetName = workbook.SheetNames[1];
                const worksheet = workbook.Sheets[sheetName];
                
                // Convertir datos CSV a formato de hoja
                const newData = XLSX.utils.json_to_sheet(sucursalData);
                const range = XLSX.utils.decode_range(newData['!ref'] || 'A1:A1');
                
                // Copiar los datos nuevos al template existente
                // IMPORTANTE: Comienza desde la fila 3 (índice 2) para respetar 
                // los encabezados del template
                for (let R = range.s.r; R <= range.e.r; ++R) {
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                        const targetRow = R + 2; // +2 para saltar las 2 filas de encabezado
                        const cellAddress = XLSX.utils.encode_cell({ r: targetRow, c: C });
                        const sourceCellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                        if (newData[sourceCellAddress]) {
                            worksheet[cellAddress] = newData[sourceCellAddress];
                        }
                    }
                }
            }
        }
        
        // Generar nombre de archivo con fecha
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        const fileName = `Pedidos_Andreani_${dateString}.xlsx`;
        
        // Genera el archivo Excel final con el template + tus datos
        const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Descargar el archivo Excel
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Error al exportar a Excel:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
        const errorMessage = error instanceof Error ? error.message : String(error);
        alert(`Error al exportar el archivo Excel: ${errorMessage}\n\nPor favor, revisa la consola para más detalles.`);
    }
};


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ domicilioCSV, sucursalCSV, onDownload, onDownloadCombined, onDownloadExcel }) => {
  
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
  
  return (
    <div className="bg-gray-900/50 p-4 sm:p-6 rounded-lg animate-fade-in border border-gray-700/50 shadow-xl">
        <h3 className="text-lg sm:text-xl font-bold text-center text-white mb-4 sm:mb-6">📥 Descargar Archivos Procesados</h3>
        
        {/* Primera fila - Archivos individuales */}
        <div className="mb-4">
            <h4 className="text-xs sm:text-sm font-medium text-gray-300 mb-3 text-center">Archivos Individuales</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                    onClick={() => onDownload(domicilioCSV, 'Domicilios.csv')}
                    disabled={!domicilioCSV}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-900/50 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center transform hover:scale-105 disabled:hover:scale-100 text-sm sm:text-base"
                >
                   <DownloadIcon />
                   <span className="ml-2">Domicilios.csv</span>
                </button>
                <button
                    onClick={() => onDownload(sucursalCSV, 'Sucursales.csv')}
                    disabled={!sucursalCSV}
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
                        onClick={() => onDownloadCombined(domicilioCSV, sucursalCSV, 'Domicilios_y_Sucursales_Combinado.csv')}
                        disabled={!domicilioCSV && !sucursalCSV}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900/50 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center transform hover:scale-105 disabled:hover:scale-100 text-sm sm:text-base"
                    >
                        <DownloadIcon />
                        <span className="ml-2">Combinado.csv</span>
                    </button>
                )}
                <button
                    onClick={async () => await exportToExcel(domicilioCSV, sucursalCSV)}
                    disabled={!domicilioCSV && !sucursalCSV}
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
  );
};
