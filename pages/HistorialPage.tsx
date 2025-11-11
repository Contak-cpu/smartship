import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import * as ExcelJS from 'exceljs';
import { obtenerHistorialSmartShip, obtenerHistorialSKU, HistorialSmartShip as HistorialSmartShipType, HistorialSKU as HistorialSKUType } from '../src/utils/historialStorage';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface HistorialItem {
  id: string;
  fecha: string;
  hora: string;
  nombreArchivo: string;
  cantidadRegistros: number;
  tipo: 'domicilio' | 'sucursal' | 'sku';
  datos: any;
}

interface HistorialSmartShip {
  id: string;
  fecha: string;
  hora: string;
  nombreArchivo: string;
  totalRegistros: number;
  domicilio: {
    cantidad: number;
    datos: any[];
  };
  sucursal: {
    cantidad: number;
    datos: any[];
  };
}

interface HistorialSKU {
  id: string;
  fecha: string;
  hora: string;
  nombreArchivo: string;
  cantidadRegistros: number;
  pdfData: string; // Base64 del PDF
}

type TabType = 'smartship' | 'sku';

// Función para exportar a Excel (copiada de ResultsDisplay para mantener exactamente la misma funcionalidad)
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
    
    // Extraer opciones para los desplegables
    const sucursalesOptions: string[] = [];
    const provinciaLocalidadOptions: string[] = [];
    const itemNoGenericoOptions: string[] = [];
    
    if (configData.length > 1) {
      for (let i = 1; i < configData.length; i++) {
        const sucursal = configData[i][0];
        const itemNoGenerico = configData[i][2];
        const provinciaLocalidad = configData[i][4];
        
        if (sucursal && sucursal.trim()) {
          sucursalesOptions.push(sucursal);
        }
        if (itemNoGenerico && itemNoGenerico.trim()) {
          itemNoGenericoOptions.push(itemNoGenerico);
        }
        if (provinciaLocalidad && provinciaLocalidad.trim()) {
          provinciaLocalidadOptions.push(provinciaLocalidad);
        }
      }
    }
    
    // Crear hoja de domicilios si existe contenido
    if (domicilioCSV && domicilioCSV.trim()) {
      const domicilioData = csvToDataArray(domicilioCSV);
      if (domicilioData.length > 0) {
        const ws = workbook.addWorksheet('A domicilio');
        
        // FILA 1: Encabezados combinados
        ws.getCell('A1').value = 'Características';
        ws.getCell('H1').value = 'Destinatario';
        ws.getCell('N1').value = 'Domicilio destino';
        
        ws.mergeCells('A1:G1');
        ws.mergeCells('H1:M1');
        ws.mergeCells('N1:S1');
        
        // FILA 2: Encabezados detallados
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
        
        // DATOS desde fila 3
        const columnasNumericasDomicilio = [1, 2, 3, 4, 5, 9, 11, 12, 14, 15];
        
        domicilioData.forEach((rowData, rowIndex) => {
          const row = ws.getRow(rowIndex + 3);
          
          rowData.forEach((value, colIndex) => {
            const cell = row.getCell(colIndex + 1);
            
            if (value && typeof value === 'string') {
              const trimmedValue = value.trim();
              
              // Limpiar DNI/CUIT
              if (colIndex === 9 && trimmedValue.length === 11) {
                const cleanedDNI = trimmedValue.substring(2, 10);
                cell.value = Number(cleanedDNI);
                return;
              }
              
              if (columnasNumericasDomicilio.includes(colIndex)) {
                const numValue = Number(trimmedValue);
                cell.value = !isNaN(numValue) ? numValue : trimmedValue;
              } else {
                cell.value = trimmedValue;
              }
            } else {
              cell.value = value || '';
            }
          });
        });
        
        // Agregar validaciones
        if (provinciaLocalidadOptions.length > 0) {
          const lastRow = Math.max(domicilioData.length + 2, 100);
          for (let rowNum = 3; rowNum <= lastRow; rowNum++) {
            const cell = ws.getCell(`R${rowNum}`);
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
        }
        
        if (itemNoGenericoOptions.length > 0) {
          const lastRow = Math.max(domicilioData.length + 2, 100);
          for (let rowNum = 3; rowNum <= lastRow; rowNum++) {
            const cell = ws.getCell(`A${rowNum}`);
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
            cell.value = '';
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
        
        ws.mergeCells('A1:G1');
        ws.mergeCells('H1:M1');
        
        // FILA 2: Encabezados detallados
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
        
        // DATOS desde fila 3
        const columnasNumericasSucursal = [1, 2, 3, 4, 5, 6, 9, 11, 12];
        
        sucursalData.forEach((rowData, rowIndex) => {
          const row = ws.getRow(rowIndex + 3);
          
          rowData.forEach((value, colIndex) => {
            const cell = row.getCell(colIndex + 1);
            
            if (value && typeof value === 'string') {
              const trimmedValue = value.trim();
              
              // Limpiar DNI/CUIT
              if (colIndex === 9 && trimmedValue.length === 11) {
                const cleanedDNI = trimmedValue.substring(2, 10);
                cell.value = Number(cleanedDNI);
                return;
              }
              
              if (columnasNumericasSucursal.includes(colIndex)) {
                const numValue = Number(trimmedValue);
                cell.value = !isNaN(numValue) ? numValue : trimmedValue;
              } else {
                cell.value = trimmedValue;
              }
            } else {
              cell.value = value || '';
            }
          });
        });
        
        // Agregar validaciones
        if (sucursalesOptions.length > 0) {
          const lastRow = Math.max(sucursalData.length + 2, 100);
          for (let rowNum = 3; rowNum <= lastRow; rowNum++) {
            const cell = ws.getCell(`N${rowNum}`);
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
        }
        
        if (itemNoGenericoOptions.length > 0) {
          const lastRow = Math.max(sucursalData.length + 2, 100);
          for (let rowNum = 3; rowNum <= lastRow; rowNum++) {
            const cell = ws.getCell(`A${rowNum}`);
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
            cell.value = '';
          }
        }
      }
    }
    
    // Crear hoja de Configuración
    const configSheet = workbook.addWorksheet('Configuracion');
    
    if (configData.length > 0) {
      configData.forEach((rowData, rowIndex) => {
        const row = configSheet.getRow(rowIndex + 1);
        row.values = rowData;
      });
    } else {
      configSheet.getCell('A1').value = 'Sucursal';
      configSheet.getCell('C1').value = 'ItemNoGenerico';
      configSheet.getCell('E1').value = 'ProvinciaLocalidaCodigosPostales';
    }
    
    configSheet.state = 'hidden';
    
    if (workbook.worksheets.length === 0) {
      alert('No hay datos para exportar a Excel');
      return;
    }
    
    // Generar archivo
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const fileName = `EnvioMasivoExcelPaquetes_${dateString}.xlsx`;
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Archivo Excel exportado exitosamente:', fileName);
  } catch (error) {
    console.error('❌ Error al exportar a Excel:', error);
    alert('Error al exportar el archivo Excel. Por favor, inténtalo de nuevo.');
  }
};

const HistorialPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('smartship');
  const [historialSmartShip, setHistorialSmartShip] = useState<HistorialSmartShip[]>([]);
  const [historialSKU, setHistorialSKU] = useState<HistorialSKU[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { username, isAuthenticated } = useAuth();

  // Cargar historial desde Supabase/localStorage al iniciar
  useEffect(() => {
    const loadHistorial = async () => {
      // Solo cargar si hay usuario autenticado y no se ha cargado antes
      if (!username || !isAuthenticated || hasLoaded) {
        if (!isAuthenticated) {
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        console.log('🔄 [HistorialPage] Cargando historial para usuario:', username);
        
        const [smartshipData, skuData] = await Promise.all([
          obtenerHistorialSmartShip(username),
          obtenerHistorialSKU(username)
        ]);
        
        console.log('✅ [HistorialPage] Historial cargado:', {
          smartship: smartshipData.length,
          sku: skuData.length
        });
        
        setHistorialSmartShip(smartshipData);
        setHistorialSKU(skuData);
        setHasLoaded(true);
      } catch (error) {
        console.error('❌ [HistorialPage] Error al cargar historial:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistorial();
  }, [username, isAuthenticated, hasLoaded]);

  // Función para recargar el historial manualmente
  const recargarHistorial = async () => {
    if (!username || !isAuthenticated) return;
    
    try {
      setLoading(true);
      setHasLoaded(false); // Resetear para permitir recarga
      console.log('🔄 [HistorialPage] Recargando historial manualmente...');
      
      const [smartshipData, skuData] = await Promise.all([
        obtenerHistorialSmartShip(username),
        obtenerHistorialSKU(username)
      ]);
      
      console.log('✅ [HistorialPage] Historial recargado:', {
        smartship: smartshipData.length,
        sku: skuData.length
      });
      
      setHistorialSmartShip(smartshipData);
      setHistorialSKU(skuData);
      setHasLoaded(true);
    } catch (error) {
      console.error('❌ [HistorialPage] Error al recargar historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarExcel = async (item: HistorialSmartShip) => {
    try {
      // Convertir datos almacenados de vuelta a CSV
      const arrayToCsv = (data: any[]): string => {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvLines = [
          headers.join(';'),
          ...data.map(row => headers.map(header => row[header] || '').join(';'))
        ];
        
        return csvLines.join('\n');
      };
      
      const domicilioCSV = arrayToCsv(item.domicilio.datos);
      const sucursalCSV = arrayToCsv(item.sucursal.datos);
      
      // Usar la misma función que HomePage para generar el Excel
      await exportToExcel(domicilioCSV, sucursalCSV);
    } catch (error) {
      console.error('Error al descargar Excel:', error);
      alert('Error al generar el archivo Excel');
    }
  };

  const handleDescargarSKU = (item: HistorialSKU) => {
    try {
      // Convertir base64 a blob
      const byteCharacters = atob(item.pdfData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Descargar archivo
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${item.nombreArchivo}_SKU_${Date.now()}.pdf`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      alert('Error al descargar el archivo PDF');
    }
  };

  const handleEliminarSmartShip = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este elemento del historial?')) {
      try {
        // Intentar eliminar de Supabase primero
        const { error } = await supabase
          .from('historial_smartship')
          .delete()
          .eq('id', id);

        if (error) {
          console.warn('No se pudo eliminar de Supabase, eliminando solo del estado local:', error);
        }

        // Actualizar estado local
        const nuevoHistorial = historialSmartShip.filter(item => item.id !== id);
        setHistorialSmartShip(nuevoHistorial);
        
        // También actualizar localStorage como fallback
        if (username) {
          localStorage.setItem(`historial_smartship_${username}`, JSON.stringify(nuevoHistorial));
        }
      } catch (error) {
        console.error('Error al eliminar elemento:', error);
        // Fallback: solo actualizar estado local
        const nuevoHistorial = historialSmartShip.filter(item => item.id !== id);
        setHistorialSmartShip(nuevoHistorial);
      }
    }
  };

  const handleEliminarSKU = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este elemento del historial?')) {
      try {
        // Intentar eliminar de Supabase primero
        const { error } = await supabase
          .from('historial_sku')
          .delete()
          .eq('id', id);

        if (error) {
          console.warn('No se pudo eliminar de Supabase, eliminando solo del estado local:', error);
        }

        // Actualizar estado local
        const nuevoHistorial = historialSKU.filter(item => item.id !== id);
        setHistorialSKU(nuevoHistorial);
        
        // También actualizar localStorage como fallback
        if (username) {
          localStorage.setItem(`historial_sku_${username}`, JSON.stringify(nuevoHistorial));
        }
      } catch (error) {
        console.error('Error al eliminar elemento:', error);
        // Fallback: solo actualizar estado local
        const nuevoHistorial = historialSKU.filter(item => item.id !== id);
        setHistorialSKU(nuevoHistorial);
      }
    }
  };

  const handleLimpiarHistorial = async () => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar todo el historial de ${activeTab === 'smartship' ? 'SmartShip' : 'SKU en Rótulos'}?`)) {
      try {
        if (activeTab === 'smartship') {
          // Intentar eliminar de Supabase
          if (username) {
            const { error } = await supabase
              .from('historial_smartship')
              .delete()
              .eq('username', username);
            
            if (error) {
              console.warn('No se pudo limpiar historial de Supabase:', error);
            }
          }
          
          setHistorialSmartShip([]);
          if (username) {
            localStorage.removeItem(`historial_smartship_${username}`);
          }
        } else {
          // Intentar eliminar de Supabase
          if (username) {
            const { error } = await supabase
              .from('historial_sku')
              .delete()
              .eq('username', username);
            
            if (error) {
              console.warn('No se pudo limpiar historial de Supabase:', error);
            }
          }
          
          setHistorialSKU([]);
          if (username) {
            localStorage.removeItem(`historial_sku_${username}`);
          }
        }
      } catch (error) {
        console.error('Error al limpiar historial:', error);
        // Fallback: solo limpiar estado local
        if (activeTab === 'smartship') {
          setHistorialSmartShip([]);
        } else {
          setHistorialSKU([]);
        }
      }
    }
  };

  const formatFecha = (fecha: string, hora: string) => {
    return `${fecha} - ${hora}`;
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="text-blue-500">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                  Historial de Archivos
                </h1>
              </div>
              <button
                onClick={recargarHistorial}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-300"
              >
                <svg 
                  className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Cargando...' : 'Recargar'}
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              Accede a todos tus archivos procesados sin necesidad de volver a cargarlos
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-gray-200 dark:border-gray-700/50 overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-gray-700/50">
              <button
                onClick={() => setActiveTab('smartship')}
                className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === 'smartship'
                    ? 'bg-blue-600 dark:bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700/50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                SmartShip
                {historialSmartShip.length > 0 && (
                  <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {historialSmartShip.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('sku')}
                className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === 'sku'
                    ? 'bg-blue-600 dark:bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700/50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                SKU en Rótulos
                {historialSKU.length > 0 && (
                  <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {historialSKU.length}
                  </span>
                )}
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {loading && !hasLoaded ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Cargando historial...</p>
                </div>
              ) : (
                <>
                  {/* SmartShip Content */}
                  {activeTab === 'smartship' && (
                    <div className="space-y-4">
                      {loading && hasLoaded && (
                        <div className="text-center py-2">
                          <div className="inline-flex items-center gap-2 text-blue-400 text-sm">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                            Actualizando historial...
                          </div>
                        </div>
                      )}
                      {historialSmartShip.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-500 dark:text-gray-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        No hay archivos en el historial
                      </h3>
                      <p className="text-gray-500 dark:text-gray-500 text-sm">
                        Los archivos procesados en SmartShip aparecerán aquí
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          Total: <span className="text-gray-900 dark:text-white font-semibold">{historialSmartShip.length}</span> archivo(s)
                        </p>
                        <button
                          onClick={handleLimpiarHistorial}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Limpiar Todo
                        </button>
                      </div>
                      
                      {historialSmartShip.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white dark:bg-gray-800/50 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-700/50 hover:border-blue-500 dark:hover:border-blue-500/50 transition-all duration-300"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                {item.nombreArchivo}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {formatFecha(item.fecha, item.hora)}
                              </p>
                            </div>
                            <button
                              onClick={() => handleEliminarSmartShip(item.id)}
                              className="text-gray-600 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2"
                              title="Eliminar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Domicilio */}
                            <div className="bg-gray-100 dark:bg-gray-700/30 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-600/50">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">A Domicilio</h4>
                              </div>
                              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {item.domicilio.cantidad}
                              </p>
                            </div>

                            {/* Sucursal */}
                            <div className="bg-gray-100 dark:bg-gray-700/30 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-600/50">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">A Sucursal</h4>
                              </div>
                              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {item.sucursal.cantidad}
                              </p>
                            </div>

                            {/* Botón Excel */}
                            <div className="bg-gray-100 dark:bg-gray-700/30 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-600/50 flex items-center justify-center">
                              <button
                                onClick={() => handleDescargarExcel(item)}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Descargar Excel
                              </button>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Total de registros: <span className="text-gray-900 dark:text-white font-semibold">{item.totalRegistros}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* SKU Content */}
              {activeTab === 'sku' && (
                <div className="space-y-4">
                  {loading && hasLoaded && (
                    <div className="text-center py-2">
                      <div className="inline-flex items-center gap-2 text-blue-400 text-sm">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                        Actualizando historial...
                      </div>
                    </div>
                  )}
                  {historialSKU.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-500 dark:text-gray-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        No hay archivos en el historial
                      </h3>
                      <p className="text-gray-500 dark:text-gray-500 text-sm">
                        Los PDFs generados con SKU aparecerán aquí
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          Total: <span className="text-gray-900 dark:text-white font-semibold">{historialSKU.length}</span> archivo(s)
                        </p>
                        <button
                          onClick={handleLimpiarHistorial}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Limpiar Todo
                        </button>
                      </div>

                      {historialSKU.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white dark:bg-gray-800/50 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-700/50 hover:border-blue-500 dark:hover:border-blue-500/50 transition-all duration-300"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                {item.nombreArchivo}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {formatFecha(item.fecha, item.hora)}
                              </p>
                              <div className="flex items-center gap-4 text-sm mb-4">
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    <span className="text-gray-900 dark:text-white font-semibold">{item.cantidadRegistros}</span> registros
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDescargarSKU(item)}
                                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Descargar PDF
                              </button>
                            </div>
                            <button
                              onClick={() => handleEliminarSKU(item.id)}
                              className="text-gray-600 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2"
                              title="Eliminar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HistorialPage;

