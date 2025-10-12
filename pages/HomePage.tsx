import React, { useState, useCallback } from 'react';
import { ProcessStatus, ProcessingInfo } from '../types';
import { processOrders, processVentasOrders, fixEncoding, combineCSVs } from '../services/csvProcessor';
import { FileUploader } from '../components/FileUploader';
import { StatusDisplay } from '../components/StatusDisplay';
import { ResultsDisplay } from '../components/ResultsDisplay';
import DashboardLayout from '../components/layout/DashboardLayout';
import { guardarEnHistorialSmartShip } from '../src/utils/historialStorage';

// Función para normalizar caracteres problemáticos en el CSV final
const normalizarCSVFinal = (content: string): string => {
  const lines = content.split('\n');
  const processedLines = lines.map(line => {
    if (line.includes('Provincia / Localidad / CP') || line.includes('BUENOS AIRES /') || line.includes('CÓRDOBA /') || line.includes('ENTRE RÍOS /') || line.includes('CHUBUT /') || line.includes('TUCUMÁN /')) {
      const fields = line.split(';');
      if (fields.length >= 19) {
        const normalizedFields = fields.map((field, index) => {
          if (index === 18) {
            return field;
          } else {
            return field
              .replace(/[áàäâ]/g, 'a')
              .replace(/[éèëê]/g, 'e')
              .replace(/[íìïî]/g, 'i')
              .replace(/[óòöô]/g, 'o')
              .replace(/[úùüû]/g, 'u')
              .replace(/[ñ]/g, 'n')
              .replace(/[ÁÀÄÂ]/g, 'A')
              .replace(/[ÉÈËÊ]/g, 'E')
              .replace(/[ÍÌÏÎ]/g, 'I')
              .replace(/[ÓÒÖÔ]/g, 'O')
              .replace(/[ÚÙÜÛ]/g, 'U')
              .replace(/[Ñ]/g, 'N')
              .replace(/[ç]/g, 'c')
              .replace(/[Ç]/g, 'C')
              .replace(/['']/g, '')
              .replace(/[""]/g, '"')
              .replace(/[–—]/g, '-')
              .replace(/[…]/g, '...')
              .replace(/[]/g, '')
              .replace(/[^\x00-\x7F]/g, (char) => {
                const charCode = char.charCodeAt(0);
                switch (charCode) {
                  case 225: return 'a'; case 233: return 'e'; case 237: return 'i'; case 243: return 'o'; case 250: return 'u'; case 241: return 'n';
                  case 193: return 'A'; case 201: return 'E'; case 205: return 'I'; case 211: return 'O'; case 218: return 'U'; case 209: return 'N';
                  case 8217: case 8216: case 8218: case 8219: return '';
                  case 8220: case 8221: return '"';
                  case 8211: case 8212: return '-';
                  case 8230: return '...';
                  default: return '';
                }
              });
          }
        });
        return normalizedFields.join(';');
      }
    }
    
    return line
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[ÁÀÄÂ]/g, 'A')
      .replace(/[ÉÈËÊ]/g, 'E')
      .replace(/[ÍÌÏÎ]/g, 'I')
      .replace(/[ÓÒÖÔ]/g, 'O')
      .replace(/[ÚÙÜÛ]/g, 'U')
      .replace(/[Ñ]/g, 'N')
      .replace(/[ç]/g, 'c')
      .replace(/[Ç]/g, 'C')
      .replace(/['']/g, '')
      .replace(/[""]/g, '"')
      .replace(/[–—]/g, '-')
      .replace(/[…]/g, '...')
      .replace(/[]/g, '')
      .replace(/[^\x00-\x7F]/g, (char) => {
        const charCode = char.charCodeAt(0);
        switch (charCode) {
          case 225: return 'a'; case 233: return 'e'; case 237: return 'i'; case 243: return 'o'; case 250: return 'u'; case 241: return 'n';
          case 193: return 'A'; case 201: return 'E'; case 205: return 'I'; case 211: return 'O'; case 218: return 'U'; case 209: return 'N';
          case 8217: case 8216: case 8218: case 8219: return '';
          case 8220: case 8221: return '"';
          case 8211: case 8212: return '-';
          case 8230: return '...';
          default: return '';
        }
      });
  });
  
  return processedLines.join('\n');
};

const limpiarSeparacionFilas = (content: string): string => {
  const lines = content.split('\n');
  const cleanedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    if (!line) continue;
    
    const fields = line.split(';');
    if (fields.length > 19) {
      let currentPedido = '';
      let fieldCount = 0;
      
      for (let j = 0; j < fields.length; j++) {
        currentPedido += fields[j];
        fieldCount++;
        
        if (fieldCount === 19 || j === fields.length - 1) {
          if (currentPedido.trim()) {
            cleanedLines.push(currentPedido);
          }
          currentPedido = '';
          fieldCount = 0;
        } else {
          currentPedido += ';';
        }
      }
    } else {
      cleanedLines.push(line);
    }
  }
  
  return cleanedLines.join('\n');
};

// Función para convertir CSV a array de objetos
const csvToArray = (csvContent: string): any[] => {
  const lines = csvContent.trim().split('\n');
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(';').map(h => h.trim());
  const data: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';');
    if (values.length === headers.length) {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index]?.trim() || '';
      });
      data.push(obj);
    }
  }
  
  return data;
};

const HomePage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessStatus>(ProcessStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ domicilioCSV: string; sucursalCSV: string; processingInfo: ProcessingInfo } | null>(null);

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    setStatus(ProcessStatus.IDLE);
    setResults(null);
    setError(null);
  };

  const handleProcessClick = useCallback(async () => {
    if (!selectedFile) return;

    setStatus(ProcessStatus.PROCESSING);
    setError(null);
    setResults(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvText = event.target?.result as string;
        if (!csvText) {
          throw new Error('El archivo está vacío o no se pudo leer.');
        }
        console.log('Starting to process CSV...');
        
        const isVentasFile = csvText.includes('Número de orden') && csvText.includes('Email') && csvText.includes('Estado de la orden');
        
        let processedData;
        if (isVentasFile) {
          console.log('Detectado archivo de ventas, usando processVentasOrders...');
          processedData = await processVentasOrders(csvText);
        } else {
          console.log('Detectado archivo de pedidos Andreani, usando processOrders...');
          processedData = await processOrders(csvText);
        }
        
        console.log('Processing completed:', processedData);
        setResults(processedData);
        setStatus(ProcessStatus.SUCCESS);
        
        // Guardar en historial
        try {
          const datosDomicilio = csvToArray(processedData.domicilioCSV);
          const datosSucursal = csvToArray(processedData.sucursalCSV);
          guardarEnHistorialSmartShip(selectedFile.name, datosDomicilio, datosSucursal);
        } catch (historialError) {
          console.error('Error al guardar en historial:', historialError);
          // No interrumpir el flujo si falla el guardado del historial
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
        console.error('Processing error:', err);
        setError(errorMessage);
        setStatus(ProcessStatus.ERROR);
      }
    };
    reader.onerror = () => {
      setError('Error al leer el archivo.');
      setStatus(ProcessStatus.ERROR);
    };
    reader.readAsText(selectedFile, 'UTF-8');
  }, [selectedFile]);
  
  const downloadCSV = (csvContent: string, fileName: string) => {
    let cleanContent = fixEncoding(csvContent);
    cleanContent = limpiarSeparacionFilas(cleanContent);
    cleanContent = normalizarCSVFinal(cleanContent);
    
    const blob = new Blob([`\uFEFF${cleanContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadCombinedCSV = (domicilioCSV: string, sucursalCSV: string, fileName: string) => {
    const combinedContent = combineCSVs(domicilioCSV, sucursalCSV);
    let cleanContent = fixEncoding(combinedContent);
    cleanContent = limpiarSeparacionFilas(cleanContent);
    cleanContent = normalizarCSVFinal(cleanContent);
    
    const blob = new Blob([`\uFEFF${cleanContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl mx-auto bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="text-green-500 size-8 sm:size-10">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_6_535)">
                    <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
                  </g>
                  <defs>
                    <clipPath id="clip0_6_535">
                      <rect fill="white" height="48" width="48"></rect>
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">SmartShip</h1>
            </div>
            <p className="text-green-400 font-medium text-sm sm:text-base">Transformador de Pedidos Andreani</p>
          </div>

        <div className="space-y-4">
          <FileUploader onFileSelect={handleFileChange} disabled={status === ProcessStatus.PROCESSING} />
          
          <button
            onClick={handleProcessClick}
            disabled={!selectedFile || status === ProcessStatus.PROCESSING}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-sm sm:text-base"
          >
            {status === ProcessStatus.PROCESSING ? 'Procesando...' : 'Procesar Archivo'}
          </button>
        </div>

        <StatusDisplay status={status} error={error} processingInfo={results?.processingInfo} />
        
        {status === ProcessStatus.SUCCESS && results && (
          <ResultsDisplay 
            domicilioCSV={results.domicilioCSV} 
            sucursalCSV={results.sucursalCSV}
            onDownload={downloadCSV}
            onDownloadCombined={downloadCombinedCSV}
          />
        )}
        </div>
        <footer className="text-center mt-6 sm:mt-8 text-gray-500 text-xs sm:text-sm">
          <p>Creado para automatizar la logística de envíos.</p>
          <p className="mt-1 text-gray-600">by pictoN</p>
        </footer>
      </div>
    </DashboardLayout>
  );
};

export default HomePage;

