import React, { useState, useCallback } from 'react';
import { ProcessStatus, ProcessingInfo } from '../types';
import { processOrdersCorreoArgentino } from '../services/correoArgentinoCsvProcessor';
import { FileUploader } from '../components/FileUploader';
import { StatusDisplay } from '../components/StatusDisplay';
import DashboardLayout from '../components/layout/DashboardLayout';
import { fixEncoding } from '../services/csvProcessor';

// Tipo simplificado de ProcessingInfo para Correo Argentino
interface CorreoArgentinoProcessingInfo {
  totalOrders: number;
  procesados: number;
  domicilios: number;
  sucursales: number;
  noProcesados: number;
  processingLogs: string[];
  errores?: string[];
}

const CorreoArgentinoPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessStatus>(ProcessStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ correoArgentinoCSV: string; domicilioCSV: string; sucursalCSV: string; processingInfo: CorreoArgentinoProcessingInfo } | null>(null);
  const [config] = useState({
    peso: 1.0, // KG
    largo: 10, // CM
    ancho: 10, // CM
    altura: 10, // CM
    valorDeclarado: 100, // pesos argentinos
  });

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
        let csvText = event.target?.result as string;
        if (!csvText) {
          throw new Error('El archivo está vacío o no se pudo leer.');
        }
        
        // Si el texto contiene caracteres mal codificados comunes, intentar con ISO-8859-1 (Latin-1)
        if (csvText.includes('Ã') || csvText.includes('Â')) {
          console.log('Detectados caracteres mal codificados, reintentando con ISO-8859-1...');
          // Releer con ISO-8859-1
          const reader2 = new FileReader();
          reader2.onload = async (event2) => {
            try {
              csvText = event2.target?.result as string;
              console.log('Starting to process CSV for Correo Argentino...');
              const processedData = await processOrdersCorreoArgentino(csvText, config);
              console.log('Processing completed:', processedData);
              setResults(processedData);
              setStatus(ProcessStatus.SUCCESS);
            } catch (err2) {
              const errorMessage = err2 instanceof Error ? err2.message : 'Ocurrió un error desconocido.';
              console.error('Processing error:', err2);
              setError(errorMessage);
              setStatus(ProcessStatus.ERROR);
            }
          };
          reader2.onerror = () => {
            setError('Error al leer el archivo.');
            setStatus(ProcessStatus.ERROR);
          };
          reader2.readAsText(selectedFile, 'ISO-8859-1');
          return;
        }
        
        console.log('Starting to process CSV for Correo Argentino...');
        const processedData = await processOrdersCorreoArgentino(csvText, config);
        console.log('Processing completed:', processedData);
        setResults(processedData);
        setStatus(ProcessStatus.SUCCESS);
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
  }, [selectedFile, config]);
  
  const downloadCSV = (csvContent: string, fileName: string) => {
    let cleanContent = fixEncoding(csvContent);
    
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

  // Convertir processingInfo a formato compatible con StatusDisplay
  const adaptProcessingInfo = (info: CorreoArgentinoProcessingInfo): ProcessingInfo => {
    return {
      totalOrders: info.totalOrders,
      domiciliosProcessed: info.domicilios,
      sucursalesProcessed: info.sucursales,
      noProcessed: info.noProcesados,
      processingLogs: info.processingLogs,
      noProcessedReason: info.noProcesados > 0 
        ? `Pedidos descartados: ${info.errores ? info.errores.length : 0} errores`
        : '',
      droppedOrders: info.errores
    };
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl mx-auto bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="text-blue-500 size-8 sm:size-10">
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
              <h1 className="text-3xl sm:text-4xl font-bold text-white">Correo Argentino</h1>
            </div>
            <p className="text-blue-400 font-medium text-sm sm:text-base">Transformador de Pedidos para Correo Argentino</p>
          </div>

        <div className="space-y-4">
          <FileUploader onFileSelect={handleFileChange} disabled={status === ProcessStatus.PROCESSING} />
          
          <button
            onClick={handleProcessClick}
            disabled={!selectedFile || status === ProcessStatus.PROCESSING}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900/50 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-sm sm:text-base"
          >
            {status === ProcessStatus.PROCESSING ? 'Procesando...' : 'Procesar Archivo'}
          </button>
        </div>

        <StatusDisplay 
          status={status} 
          error={error} 
          processingInfo={results ? adaptProcessingInfo(results.processingInfo) : undefined}
          successMessage="Tu archivo está listo para subir en 'Envios Masivos' de Correo Argentino"
        />
        
        {status === ProcessStatus.SUCCESS && results && (
          <div className="bg-gray-900/50 p-4 sm:p-6 rounded-lg animate-fade-in border border-gray-700/50 shadow-xl">
            <h3 className="text-lg sm:text-xl font-bold text-center text-white mb-4 sm:mb-6">📥 Descargar Archivos Procesados</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => downloadCSV(results.domicilioCSV, 'Domicilio.csv')}
                disabled={!results.domicilioCSV || results.domicilioCSV.trim() === ''}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-900/50 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center transform hover:scale-105 disabled:hover:scale-100 text-sm sm:text-base"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="ml-2">Domicilio.csv</span>
              </button>
              
              <button
                onClick={() => downloadCSV(results.sucursalCSV, 'Sucursales.csv')}
                disabled={!results.sucursalCSV || results.sucursalCSV.trim() === ''}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900/50 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center transform hover:scale-105 disabled:hover:scale-100 text-sm sm:text-base"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="ml-2">Sucursales.csv</span>
              </button>
              
              <button
                onClick={() => downloadCSV(results.correoArgentinoCSV, 'CorreoArgentino_CargaMasiva.csv')}
                disabled={!results.correoArgentinoCSV}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900/50 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center transform hover:scale-105 disabled:hover:scale-100 text-sm sm:text-base"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="ml-2">CorreoArgentino_CargaMasiva.csv (Todos)</span>
              </button>
            </div>
          </div>
        )}
        </div>
        <footer className="text-center mt-6 sm:mt-8 text-gray-500 text-xs sm:text-sm">
          <p>Creado para automatizar la logística de envíos con Correo Argentino.</p>
          <p className="mt-1 text-gray-600">by pictoN</p>
        </footer>
      </div>
    </DashboardLayout>
  );
};

export default CorreoArgentinoPage;

