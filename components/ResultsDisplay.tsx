
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';

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

// Función independiente para exportar a Excel con desplegables correctos (una opción por fila)
const exportToExcel = async (domicilioCSV: string, sucursalCSV: string) => {
    try {
        const workbook = new ExcelJS.Workbook();
        
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
        
        // Extraer opciones para los desplegables - CORRECTAMENTE (una opción por fila)
        const sucursalesOptions: string[] = [];
        const provinciaLocalidadOptions: string[] = [];
        const itemNoGenericoOptions: string[] = [];
        
        if (configData.length > 1) { // Saltar encabezado
            for (let i = 1; i < configData.length; i++) {
                const sucursal = configData[i][0]; // Columna A
                const itemNoGenerico = configData[i][2]; // Columna C
                const provinciaLocalidad = configData[i][4]; // Columna E
                
                if (sucursal && sucursal.trim()) {
                    sucursalesOptions.push(sucursal); // Copiar exactamente tal como está
                }
                if (itemNoGenerico && itemNoGenerico.trim()) {
                    itemNoGenericoOptions.push(itemNoGenerico); // Copiar exactamente tal como está
                }
                if (provinciaLocalidad && provinciaLocalidad.trim()) {
                    provinciaLocalidadOptions.push(provinciaLocalidad); // Copiar exactamente tal como está
                }
            }
        }
        
        console.log('📋 Opciones de Sucursales (individuales):', sucursalesOptions.length);
        console.log('📋 Opciones de ItemNoGenerico (individuales):', itemNoGenericoOptions.length);
        console.log('📋 Opciones de Provincia/Localidad (individuales):', provinciaLocalidadOptions.length);
        console.log('📋 Primeras 3 opciones de sucursales:', sucursalesOptions.slice(0, 3));
        console.log('📋 Primeras 3 opciones de ItemNoGenerico:', itemNoGenericoOptions.slice(0, 3));
        console.log('📋 Primeras 3 opciones de provincia/localidad:', provinciaLocalidadOptions.slice(0, 3));
        
        // Crear hoja de domicilios si existe contenido
        if (domicilioCSV && domicilioCSV.trim()) {
            const domicilioData = csvToDataArray(domicilioCSV);
            if (domicilioData.length > 0) {
                const ws = workbook.addWorksheet('A domicilio');
                
                // FILA 1: Encabezados combinados
                ws.getCell('A1').value = 'Características';
                ws.getCell('H1').value = 'Destinatario';
                ws.getCell('N1').value = 'Domicilio destino';
                
                // Combinar celdas de la fila 1
                ws.mergeCells('A1:G1');
                ws.mergeCells('H1:M1');
                ws.mergeCells('N1:S1');
                
                // FILA 2: Encabezados detallados (CORREGIDOS según plantilla Andreani)
                const headers = [
                    'Paquete Guardado Ej: Mistery',
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
                
                ws.getRow(2).values = headers;
                
                // DATOS desde fila 3 (CORREGIDO: columnas numéricas específicas)
                // Columnas numéricas en A DOMICILIO: B C D E F J L M O P (índices: 1 2 3 4 5 9 11 12 14 15)
                const columnasNumericasDomicilio = [1, 2, 3, 4, 5, 9, 11, 12, 14, 15];
                
                domicilioData.forEach((rowData, rowIndex) => {
                    try {
                        const row = ws.getRow(rowIndex + 3);
                        
                        // Procesar cada valor según su tipo de columna
                        rowData.forEach((value, colIndex) => {
                            try {
                                const cell = row.getCell(colIndex + 1);
                                
                                if (value && typeof value === 'string') {
                                    const trimmedValue = value.trim();
                                    
                                    // Limpiar DNI/CUIT en la columna J (índice 9) - "DNI * Ej: "
                                    if (colIndex === 9 && trimmedValue.length === 11) {
                                        // Si tiene 11 dígitos (formato CUIT), extraer los 8 centrales
                                        const cleanedDNI = trimmedValue.substring(2, 10);
                                        console.log(`🔄 DNI limpiado: ${value} → ${cleanedDNI}`);
                                        cell.value = Number(cleanedDNI);
                                        return;
                                    }
                                    
                                    // Si es una columna numérica, convertir a número
                                    if (columnasNumericasDomicilio.includes(colIndex)) {
                                        const numValue = Number(trimmedValue);
                                        if (!isNaN(numValue)) {
                                            cell.value = numValue;
                                        } else {
                                            cell.value = trimmedValue;
                                        }
                                    } else {
                                        // Columnas de texto
                                        cell.value = trimmedValue;
                                    }
                                } else if (value !== null && value !== undefined) {
                                    cell.value = value;
                                } else {
                                    cell.value = '';
                                }
                            } catch (cellError) {
                                console.warn(`⚠️ Error procesando celda ${rowIndex + 3},${colIndex + 1}:`, cellError);
                                const cell = row.getCell(colIndex + 1);
                                cell.value = value;
                            }
                        });
                    } catch (rowError) {
                        console.warn(`⚠️ Error procesando fila ${rowIndex + 3}:`, rowError);
                        const row = ws.getRow(rowIndex + 3);
                        row.values = rowData;
                    }
                });
                
                // AGREGAR VALIDACIÓN DE DATOS (DESPLEGABLE) en columna R (índice 18)
                // CORRECTO: Una opción por cada fila de configuración
                if (provinciaLocalidadOptions.length > 0) {
                    try {
                        const lastRow = domicilioData.length + 2; // +2 para headers (filas 1-2), datos desde fila 3
                        
                        // Crear validación usando la sintaxis correcta de ExcelJS
                        for (let rowNum = 3; rowNum <= lastRow; rowNum++) {
                            const cell = ws.getCell(`R${rowNum}`);
                            // Usar referencia a la hoja de configuración para las opciones
                            const configRange = `Configuracion!E2:E${provinciaLocalidadOptions.length + 1}`;
                            cell.dataValidation = {
                                type: 'list',
                                allowBlank: true,
                                formulae: [configRange],
                                showErrorMessage: true,
                                errorStyle: 'error',
                                errorTitle: 'Valor inválido',
                                error: 'Por favor seleccione una opción de la lista'
                            };
                        }
                        
                        console.log(`✅ Validación agregada en columna R (filas 3-${lastRow}) de "A domicilio" con ${provinciaLocalidadOptions.length} opciones individuales`);
                    } catch (validationError) {
                        console.warn('⚠️ Error agregando validación a domicilio:', validationError);
                    }
                }
                
                // AGREGAR VALIDACIÓN DE DATOS (DESPLEGABLE) en columna A - SIEMPRE VACÍA
                if (itemNoGenericoOptions.length > 0) {
                    try {
                        const lastRow = domicilioData.length + 2; // +2 para headers (filas 1-2), datos desde fila 3
                        
                        for (let rowNum = 3; rowNum <= lastRow; rowNum++) {
                            const cell = ws.getCell(`A${rowNum}`);
                            // Usar referencia a la hoja de configuración para las opciones (columna C)
                            const configRange = `Configuracion!C2:C${itemNoGenericoOptions.length + 1}`;
                            cell.dataValidation = {
                                type: 'list',
                                allowBlank: true,
                                formulae: [configRange],
                                showErrorMessage: true,
                                errorStyle: 'error',
                                errorTitle: 'Valor inválido',
                                error: 'Por favor seleccione una opción de la lista'
                            };
                            // Asegurar que la celda quede vacía
                            cell.value = '';
                        }
                        
                        console.log(`✅ Validación agregada en columna A (filas 3-${lastRow}) de "A domicilio" - SIEMPRE VACÍA`);
                    } catch (validationError) {
                        console.warn('⚠️ Error agregando validación a columna A domicilio:', validationError);
                    }
                }
            }
        }
        
        // Crear hoja de sucursales si existe contenido
        if (sucursalCSV && sucursalCSV.trim()) {
            const sucursalData = csvToDataArray(sucursalCSV);
            if (sucursalData.length > 0) {
                const ws = workbook.addWorksheet('A sucursal');
                
                // FILA 1: Encabezados combinados
                ws.getCell('A1').value = 'Características';
                ws.getCell('H1').value = 'Destinatario';
                ws.getCell('N1').value = 'Destino';
                
                // Combinar celdas de la fila 1
                ws.mergeCells('A1:G1');
                ws.mergeCells('H1:M1');
                
                // FILA 2: Encabezados detallados (CORREGIDOS según plantilla Andreani)
                const headers = [
                    'Paquete Guardado Ej: Mistery',
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
                
                ws.getRow(2).values = headers;
                
                // DATOS desde fila 3 (CORREGIDO: columnas numéricas específicas)
                // Columnas numéricas en A SUCURSAL: B C D E F G J L M (índices: 1 2 3 4 5 6 9 11 12)
                const columnasNumericasSucursal = [1, 2, 3, 4, 5, 6, 9, 11, 12];
                
                sucursalData.forEach((rowData, rowIndex) => {
                    try {
                        const row = ws.getRow(rowIndex + 3);
                        
                        // Procesar cada valor según su tipo de columna
                        rowData.forEach((value, colIndex) => {
                            try {
                                const cell = row.getCell(colIndex + 1);
                                
                                if (value && typeof value === 'string') {
                                    const trimmedValue = value.trim();
                                    
                                    // Limpiar DNI/CUIT en la columna J (índice 9) - "DNI * Ej: "
                                    if (colIndex === 9 && trimmedValue.length === 11) {
                                        // Si tiene 11 dígitos (formato CUIT), extraer los 8 centrales
                                        const cleanedDNI = trimmedValue.substring(2, 10);
                                        console.log(`🔄 DNI limpiado: ${value} → ${cleanedDNI}`);
                                        cell.value = Number(cleanedDNI);
                                        return;
                                    }
                                    
                                    // Si es una columna numérica, convertir a número
                                    if (columnasNumericasSucursal.includes(colIndex)) {
                                        const numValue = Number(trimmedValue);
                                        if (!isNaN(numValue)) {
                                            cell.value = numValue;
                                        } else {
                                            cell.value = trimmedValue;
                                        }
                                    } else {
                                        // Columnas de texto
                                        cell.value = trimmedValue;
                                    }
                                } else if (value !== null && value !== undefined) {
                                    cell.value = value;
                                } else {
                                    cell.value = '';
                                }
                            } catch (cellError) {
                                console.warn(`⚠️ Error procesando celda ${rowIndex + 3},${colIndex + 1}:`, cellError);
                                const cell = row.getCell(colIndex + 1);
                                cell.value = value;
                            }
                        });
                    } catch (rowError) {
                        console.warn(`⚠️ Error procesando fila ${rowIndex + 3}:`, rowError);
                        const row = ws.getRow(rowIndex + 3);
                        row.values = rowData;
                    }
                });
                
                // AGREGAR VALIDACIÓN DE DATOS (DESPLEGABLE) en columna N (índice 14)
                // CORRECTO: Una opción por cada fila de configuración
                if (sucursalesOptions.length > 0) {
                    try {
                        const lastRow = sucursalData.length + 2; // +2 para headers (filas 1-2), datos desde fila 3
                        
                        // Crear validación usando la sintaxis correcta de ExcelJS
                        for (let rowNum = 3; rowNum <= lastRow; rowNum++) {
                            const cell = ws.getCell(`N${rowNum}`);
                            // Usar referencia a la hoja de configuración para las opciones
                            const configRange = `Configuracion!A2:A${sucursalesOptions.length + 1}`;
                            cell.dataValidation = {
                                type: 'list',
                                allowBlank: true,
                                formulae: [configRange],
                                showErrorMessage: true,
                                errorStyle: 'error',
                                errorTitle: 'Valor inválido',
                                error: 'Por favor seleccione una sucursal de la lista'
                            };
                        }
                        
                        console.log(`✅ Validación agregada en columna N (filas 3-${lastRow}) de "A sucursal" con ${sucursalesOptions.length} opciones individuales`);
                    } catch (validationError) {
                        console.warn('⚠️ Error agregando validación a sucursal:', validationError);
                    }
                }
                
                // AGREGAR VALIDACIÓN DE DATOS (DESPLEGABLE) en columna A - SIEMPRE VACÍA
                if (itemNoGenericoOptions.length > 0) {
                    try {
                        const lastRow = sucursalData.length + 2; // +2 para headers (filas 1-2), datos desde fila 3
                        
                        for (let rowNum = 3; rowNum <= lastRow; rowNum++) {
                            const cell = ws.getCell(`A${rowNum}`);
                            // Usar referencia a la hoja de configuración para las opciones (columna C)
                            const configRange = `Configuracion!C2:C${itemNoGenericoOptions.length + 1}`;
                            cell.dataValidation = {
                                type: 'list',
                                allowBlank: true,
                                formulae: [configRange],
                                showErrorMessage: true,
                                errorStyle: 'error',
                                errorTitle: 'Valor inválido',
                                error: 'Por favor seleccione una opción de la lista'
                            };
                            // Asegurar que la celda quede vacía
                            cell.value = '';
                        }
                        
                        console.log(`✅ Validación agregada en columna A (filas 3-${lastRow}) de "A sucursal" - SIEMPRE VACÍA`);
                    } catch (validationError) {
                        console.warn('⚠️ Error agregando validación a columna A sucursal:', validationError);
                    }
                }
            }
        }
        
        // Crear hoja de Configuración con datos reales de Andreani
        const configSheet = workbook.addWorksheet('Configuracion');
        
        if (configData.length > 0) {
            // Agregar todos los datos de configuración
            configData.forEach((rowData, rowIndex) => {
                const row = configSheet.getRow(rowIndex + 1);
                row.values = rowData;
            });
        } else {
            // Si no hay datos, crear hoja vacía mínima
            configSheet.getCell('A1').value = 'Sucursal';
            configSheet.getCell('C1').value = 'ItemNoGenerico';
            configSheet.getCell('E1').value = 'ProvinciaLocalidaCodigosPostales';
        }
        
        // Ocultar la hoja de configuración
        configSheet.state = 'hidden';
        
        // Verificar que al menos una hoja fue creada
        if (workbook.worksheets.length === 0) {
            alert('No hay datos para exportar a Excel');
            return;
        }
        
        // Generar nombre de archivo con fecha (formato Andreani)
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        const fileName = `EnvioMasivoExcelPaquetes_${dateString}.xlsx`;
        
        // Generar y descargar el archivo Excel
        console.log('🔄 Generando buffer del archivo Excel...');
        console.log('📊 Workbook info:', {
            sheetCount: workbook.worksheets.length,
            sheetNames: workbook.worksheets.map(ws => ws.name)
        });
        
        try {
            const buffer = await workbook.xlsx.writeBuffer();
            console.log('✅ Buffer generado, tamaño:', buffer.byteLength, 'bytes');
            
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.click();
            window.URL.revokeObjectURL(url);
            
            console.log('✅ Archivo Excel exportado exitosamente con desplegables CORRECTOS:', fileName);
        } catch (bufferError) {
            console.error('❌ Error generando buffer:', bufferError);
            throw bufferError;
        }
        
    } catch (error) {
        console.error('❌ Error al exportar a Excel:', error);
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
