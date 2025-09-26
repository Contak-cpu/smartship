
import React, { useState, useCallback } from 'react';
import { ProcessStatus } from './types';
import { processOrders, fixEncoding, combineCSVs } from './services/csvProcessor';
import { FileUploader } from './components/FileUploader';
import { StatusDisplay } from './components/StatusDisplay';
import { ResultsDisplay } from './components/ResultsDisplay';

// Función para normalizar caracteres problemáticos en el CSV final
const normalizarCSVFinal = (content: string): string => {
  return content
    // Normalizar acentos comunes
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
    // Otros caracteres especiales
    .replace(/[ç]/g, 'c')
    .replace(/[Ç]/g, 'C')
    // Manejar apóstrofes y caracteres especiales comunes
    .replace(/['']/g, '') // Remover apóstrofes curvos y rectos
    .replace(/[""]/g, '"') // Normalizar comillas
    .replace(/[–—]/g, '-') // Normalizar guiones
    .replace(/[…]/g, '...') // Normalizar puntos suspensivos
    // Remover caracteres de reemplazo inválidos
    .replace(/[]/g, '')
    .replace(/[^\x00-\x7F]/g, (char) => {
      const charCode = char.charCodeAt(0);
      switch (charCode) {
        case 225: return 'a'; // á
        case 233: return 'e'; // é
        case 237: return 'i'; // í
        case 243: return 'o'; // ó
        case 250: return 'u'; // ú
        case 241: return 'n'; // ñ
        case 193: return 'A'; // Á
        case 201: return 'E'; // É
        case 205: return 'I'; // Í
        case 211: return 'O'; // Ó
        case 218: return 'U'; // Ú
        case 209: return 'N'; // Ñ
        case 8217: return ''; // ' (apóstrofe curvo derecho)
        case 8216: return ''; // ' (apóstrofe curvo izquierdo)
        case 8218: return ''; // ‚ (comilla simple baja)
        case 8219: return ''; // ' (comilla simple alta)
        case 8220: return '"'; // " (comilla doble izquierda)
        case 8221: return '"'; // " (comilla doble derecha)
        case 8211: return '-'; // – (guión en)
        case 8212: return '-'; // — (guión em)
        case 8230: return '...'; // … (puntos suspensivos)
        default: return ''; // Remover otros caracteres no ASCII
      }
    });
};

// Función para limpiar problemas de separación de filas en el CSV
const limpiarSeparacionFilas = (content: string): string => {
  // Dividir en líneas
  const lines = content.split('\n');
  const cleanedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    if (!line) continue;
    
    // Si la línea contiene múltiples pedidos (más de 19 campos), separarlos
    const fields = line.split(';');
    if (fields.length > 19) {
      // Separar en pedidos individuales
      let currentPedido = '';
      let fieldCount = 0;
      
      for (let j = 0; j < fields.length; j++) {
        currentPedido += fields[j];
        fieldCount++;
        
        // Si hemos completado un pedido (19 campos) o es el último campo
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
      // Línea normal, agregarla tal como está
      cleanedLines.push(line);
    }
  }
  
  return cleanedLines.join('\n');
};




const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessStatus>(ProcessStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ domicilioCSV: string; sucursalCSV: string } | null>(null);

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
        const processedData = await processOrders(csvText);
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
  }, [selectedFile]);
  
  const downloadCSV = (csvContent: string, fileName: string) => {
    // Asegurar que el contenido esté limpio de caracteres mal codificados
    let cleanContent = fixEncoding(csvContent);
    
    // Limpiar problemas de separación de filas
    cleanContent = limpiarSeparacionFilas(cleanContent);
    
    // Aplicar normalización completa para nombres y apellidos
    cleanContent = normalizarCSVFinal(cleanContent);
    
    // Crear el blob con BOM UTF-8 para Excel
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
    // Combinar ambos CSV
    const combinedContent = combineCSVs(domicilioCSV, sucursalCSV);
    
    // Asegurar que el contenido esté limpio de caracteres mal codificados
    let cleanContent = fixEncoding(combinedContent);
    
    // Limpiar problemas de separación de filas
    cleanContent = limpiarSeparacionFilas(cleanContent);
    
    // Aplicar normalización completa para nombres y apellidos
    cleanContent = normalizarCSVFinal(cleanContent);
    
    // Crear el blob con BOM UTF-8 para Excel
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
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Transformador de Pedidos</h1>
          <p className="text-indigo-400 font-medium">Tiendanube a Andreani</p>
        </div>

        <div className="space-y-4">
          <FileUploader onFileSelect={handleFileChange} disabled={status === ProcessStatus.PROCESSING} />
          
          <button
            onClick={handleProcessClick}
            disabled={!selectedFile || status === ProcessStatus.PROCESSING}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
          >
            {status === ProcessStatus.PROCESSING ? 'Procesando...' : 'Procesar Archivo'}
          </button>
        </div>

        <StatusDisplay status={status} error={error} />
        
        {status === ProcessStatus.SUCCESS && results && (
          <ResultsDisplay 
            domicilioCSV={results.domicilioCSV} 
            sucursalCSV={results.sucursalCSV}
            onDownload={downloadCSV}
            onDownloadCombined={downloadCombinedCSV}
          />
        )}
      </div>
       <footer className="text-center mt-8 text-gray-500 text-sm">
        <p>Creado para automatizar la logística de envíos.</p>
      </footer>
    </div>
  );
};

export default App;
