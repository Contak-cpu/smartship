
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

// Función independiente para exportar a Excel (formato idéntico a plantilla Andreani)
const exportToExcel = async (domicilioCSV: string, sucursalCSV: string) => {
    try {
        const workbook = XLSX.utils.book_new();
        
        // Cargar datos de configuración desde el archivo
        let configData: any[][] = [];
        try {
            const configResponse = await fetch('/configuracion-data.json');
            if (configResponse.ok) {
                configData = await configResponse.json();
                console.log('✅ Datos de configuración cargados:', configData.length, 'filas');
            } else {
                console.warn('⚠️ No se pudo cargar configuracion-data.json, usando datos vacíos');
            }
        } catch (error) {
            console.warn('⚠️ Error cargando configuración:', error);
        }
        
        // Función interna para convertir CSV a array de datos
        const csvToDataArray = (csvText: string): any[][] => {
            const lines = csvText.split('\n').filter(line => line.trim());
            if (lines.length === 0) return [];
            
            const data: any[][] = [];
            
            for (let i = 1; i < lines.length; i++) { // Saltamos el encabezado del CSV
                const values = lines[i].split(';').map(v => v.replace(/"/g, '').trim());
                data.push(values);
            }
            
            return data;
        };
        
        // Crear hoja de domicilios si existe contenido
        if (domicilioCSV && domicilioCSV.trim()) {
            const domicilioData = csvToDataArray(domicilioCSV);
            if (domicilioData.length > 0) {
                // Crear hoja vacía
                const ws: any = {};
                
                // FILA 1: Encabezados combinados
                ws['A1'] = { v: 'Características', t: 's' };
                ws['H1'] = { v: 'Destinatario', t: 's' };
                ws['N1'] = { v: 'Domicilio destino', t: 's' };
                
                // FILA 2: Encabezados detallados
                const headers = [
                    'Paquete Guardado Ej: Mistery',
                    'Peso (grs)Ej:',
                    'Alto (cm)Ej:',
                    'Ancho (cm)Ej:',
                    'Profundidad (cm)Ej:',
                    'Valor declarado ($ C/IVA) *Ej:',
                    'Numero InternoEj:',
                    'Nombre *Ej:',
                    'Apellido *Ej:',
                    'DNI *Ej:',
                    'Email *Ej:',
                    'Celular código *Ej:',
                    'Celular número *Ej:',
                    'Calle *Ej:',
                    'Número *Ej:',
                    'PisoEj:',
                    'DepartamentoEj:',
                    'Provincia / Localidad / CP * Ej: BUENOS AIRES / 11 DE SEPTIEMBRE / 1657',
                    'ObservacionesEj:'
                ];
                
                headers.forEach((header, index) => {
                    const cellRef = XLSX.utils.encode_cell({ r: 1, c: index });
                    ws[cellRef] = { v: header, t: 's' };
                });
                
                // DATOS desde fila 3
                domicilioData.forEach((rowData, rowIndex) => {
                    rowData.forEach((cellValue, colIndex) => {
                        const cellRef = XLSX.utils.encode_cell({ r: rowIndex + 2, c: colIndex });
                        ws[cellRef] = { v: cellValue || '', t: 's' };
                    });
                });
                
                // Definir el rango de la hoja
                const range = {
                    s: { r: 0, c: 0 },
                    e: { r: domicilioData.length + 1, c: headers.length - 1 }
                };
                ws['!ref'] = XLSX.utils.encode_range(range);
                
                // Combinar celdas de la fila 1
                ws['!merges'] = [
                    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },   // Características (A1:G1)
                    { s: { r: 0, c: 7 }, e: { r: 0, c: 12 } },  // Destinatario (H1:M1)
                    { s: { r: 0, c: 13 }, e: { r: 0, c: 18 } }  // Domicilio destino (N1:S1)
                ];
                
                XLSX.utils.book_append_sheet(workbook, ws, 'A domicilio');
            }
        }
        
        // Crear hoja de sucursales si existe contenido
        if (sucursalCSV && sucursalCSV.trim()) {
            const sucursalData = csvToDataArray(sucursalCSV);
            if (sucursalData.length > 0) {
                // Crear hoja vacía
                const ws: any = {};
                
                // FILA 1: Encabezados combinados
                ws['A1'] = { v: 'Características', t: 's' };
                ws['H1'] = { v: 'Destinatario', t: 's' };
                ws['N1'] = { v: 'Destino', t: 's' };
                
                // FILA 2: Encabezados detallados
                const headers = [
                    'Paquete Guardado Ej: Mistery',
                    'Peso (grs)Ej:',
                    'Alto (cm)Ej:',
                    'Ancho (cm)Ej:',
                    'Profundidad (cm)Ej:',
                    'Valor declarado ($ C/IVA) *Ej:',
                    'Numero InternoEj:',
                    'Nombre *Ej:',
                    'Apellido *Ej:',
                    'DNI *Ej:',
                    'Email *Ej:',
                    'Celular código *Ej:',
                    'Celular número *Ej:',
                    'Sucursal * Ej: 9 DE JULIO'
                ];
                
                headers.forEach((header, index) => {
                    const cellRef = XLSX.utils.encode_cell({ r: 1, c: index });
                    ws[cellRef] = { v: header, t: 's' };
                });
                
                // DATOS desde fila 3
                sucursalData.forEach((rowData, rowIndex) => {
                    rowData.forEach((cellValue, colIndex) => {
                        const cellRef = XLSX.utils.encode_cell({ r: rowIndex + 2, c: colIndex });
                        ws[cellRef] = { v: cellValue || '', t: 's' };
                    });
                });
                
                // Definir el rango de la hoja
                const range = {
                    s: { r: 0, c: 0 },
                    e: { r: sucursalData.length + 1, c: headers.length - 1 }
                };
                ws['!ref'] = XLSX.utils.encode_range(range);
                
                // Combinar celdas de la fila 1
                ws['!merges'] = [
                    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },   // Características (A1:G1)
                    { s: { r: 0, c: 7 }, e: { r: 0, c: 12 } }   // Destinatario (H1:M1)
                ];
                
                XLSX.utils.book_append_sheet(workbook, ws, 'A sucursal');
            }
        }
        
        // Crear hoja de Configuración (oculta) con datos reales de Andreani
        const configSheet: any = {};
        
        if (configData.length > 0) {
            // Agregar todos los datos de configuración
            configData.forEach((rowData, rowIndex) => {
                rowData.forEach((cellValue, colIndex) => {
                    const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
                    configSheet[cellRef] = { v: cellValue || '', t: 's' };
                });
            });
            
            // Definir el rango de la hoja
            const range = {
                s: { r: 0, c: 0 },
                e: { r: configData.length - 1, c: 4 } // 5 columnas (0-4)
            };
            configSheet['!ref'] = XLSX.utils.encode_range(range);
        } else {
            // Si no hay datos, crear hoja vacía mínima
            configSheet['A1'] = { v: 'Sucursal', t: 's' };
            configSheet['C1'] = { v: 'ItemNoGenerico', t: 's' };
            configSheet['E1'] = { v: 'ProvinciaLocalidaCodigosPostales', t: 's' };
            configSheet['!ref'] = 'A1:E1';
        }
        
        XLSX.utils.book_append_sheet(workbook, configSheet, 'Configuracion');
        
        // Ocultar la hoja de configuración
        if (workbook.Workbook) {
            if (!workbook.Workbook.Sheets) workbook.Workbook.Sheets = [];
        } else {
            workbook.Workbook = { Sheets: [] };
        }
        
        const configSheetIndex = workbook.SheetNames.indexOf('Configuracion');
        if (configSheetIndex >= 0) {
            workbook.Workbook.Sheets[configSheetIndex] = { Hidden: 1 };
        }
        
        // Verificar que al menos una hoja fue creada
        if (workbook.SheetNames.length === 0) {
            alert('No hay datos para exportar a Excel');
            return;
        }
        
        // Generar nombre de archivo con fecha (formato Andreani)
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        const fileName = `EnvioMasivoExcelPaquetes_${dateString}.xlsx`;
        
        // Descargar el archivo Excel
        XLSX.writeFile(workbook, fileName);
        
        console.log('Archivo Excel exportado exitosamente:', fileName);
        
    } catch (error) {
        console.error('Error al exportar a Excel:', error);
        alert('Error al exportar el archivo Excel. Por favor, inténtalo de nuevo.');
    }
};


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ domicilioCSV, sucursalCSV, onDownload, onDownloadCombined, onDownloadExcel }) => {
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
                    onClick={() => exportToExcel(domicilioCSV, sucursalCSV)}
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
