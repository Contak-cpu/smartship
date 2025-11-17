import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { TiendaCliente, StockDescontadoPDF } from '../types';
import {
  obtenerTiendasActivas,
  isProPlusUser,
} from '../services/tiendasClientesService';
import { descontarStockMultiple, obtenerStock, crearClaveSku } from '../services/stockService';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import LockedOverlay from '../components/common/LockedOverlay';

const DescontarStockPDFPage: React.FC = () => {
  const { username, userId, userLevel } = useAuth();
  const [tiendas, setTiendas] = useState<TiendaCliente[]>([]);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [stockExtraido, setStockExtraido] = useState<StockDescontadoPDF[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [pdfjsWorkerReady, setPdfjsWorkerReady] = useState(false);

  const canAccess = isProPlusUser(userLevel, username);

  // Configurar PDF.js worker
  useEffect(() => {
    const initializePDFWorker = async () => {
      try {
        if (pdfjsWorker) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
          setPdfjsWorkerReady(true);
          return;
        }
      } catch (error) {
        console.warn('⚠️ No se pudo usar worker del paquete:', error);
      }

      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        setPdfjsWorkerReady(true);
      } catch (error) {
        console.warn('⚠️ No se pudo usar worker local:', error);
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';
        setPdfjsWorkerReady(true);
      }
    };

    initializePDFWorker();
  }, []);

  useEffect(() => {
    if (userId && canAccess) {
      cargarTiendas();
    }
  }, [userId, canAccess]);

  const cargarTiendas = async () => {
    if (!userId) return;
    
    try {
      const data = await obtenerTiendasActivas(userId);
      setTiendas(data);
      if (data.length > 0 && !tiendaSeleccionada) {
        setTiendaSeleccionada(data[0].id);
      }
    } catch (error) {
      console.error('Error cargando tiendas:', error);
      showMessage('error', 'No se pudo cargar las tiendas');
    }
  };

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setStockExtraido([]);
    } else {
      showMessage('error', 'Por favor selecciona un archivo PDF válido');
    }
  };

  const extraerStockDePDF = async (file: File): Promise<StockDescontadoPDF[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          if (!arrayBuffer) {
            reject(new Error('No se pudo leer el archivo PDF'));
            return;
          }

          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const numPages = pdf.numPages;
          
          // Extraer la última página (donde está el stock descontado)
          const lastPage = await pdf.getPage(numPages);
          const textContent = await lastPage.getTextContent();
          
          // Extraer texto de la última página
          const lines: string[] = [];
          let currentLine = '';
          
          textContent.items.forEach((item: any) => {
            if (item.str) {
              currentLine += item.str + ' ';
              if (item.hasEOL) {
                lines.push(currentLine.trim());
                currentLine = '';
              }
            }
          });
          
          if (currentLine) {
            lines.push(currentLine.trim());
          }

          // Buscar la tabla de stock descontado
          // El formato típico es: SKU | Cantidad | Nombre Producto
          const stock: StockDescontadoPDF[] = [];
          let encontroTabla = false;
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Buscar encabezado de tabla (ej: "Stock Descontado", "Resumen", etc.)
            if (line.toLowerCase().includes('stock') || 
                line.toLowerCase().includes('descontado') ||
                line.toLowerCase().includes('resumen')) {
              encontroTabla = true;
              continue;
            }
            
            if (encontroTabla) {
              // Intentar parsear línea como: SKU cantidad nombre
              // Formato puede variar, intentamos varios patrones
              const patterns = [
                /^([A-Z0-9\-_]+)\s+(\d+)\s+(.+)$/i, // SKU cantidad nombre
                /^([A-Z0-9\-_]+)\s+(\d+)$/i, // SKU cantidad
                /^([^\s]+)\s+(\d+)\s+(.+)$/i, // Cualquier SKU cantidad nombre
              ];
              
              for (const pattern of patterns) {
                const match = line.match(pattern);
                if (match) {
                  const sku = match[1].trim();
                  const cantidad = parseInt(match[2], 10);
                  const nombreProducto = match[3]?.trim() || '';
                  
                  if (sku && !isNaN(cantidad) && cantidad > 0) {
                    stock.push({
                      sku,
                      cantidad,
                      nombreProducto: nombreProducto || undefined,
                    });
                    break;
                  }
                }
              }
            }
          }

          // Si no encontramos tabla estructurada, intentar buscar patrones más flexibles
          if (stock.length === 0) {
            const allText = lines.join(' ');
            // Buscar patrones como "SKU: XXX, Cantidad: YYY"
            const flexiblePattern = /(?:sku|codigo)[\s:]*([A-Z0-9\-_]+)[\s,;]*(?:cantidad|cant)[\s:]*(\d+)/gi;
            let match;
            while ((match = flexiblePattern.exec(allText)) !== null) {
              const sku = match[1].trim();
              const cantidad = parseInt(match[2], 10);
              if (sku && !isNaN(cantidad) && cantidad > 0) {
                stock.push({
                  sku,
                  cantidad,
                });
              }
            }
          }

          resolve(stock);
        } catch (error) {
          console.error('Error extrayendo stock del PDF:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error al leer el archivo PDF'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  const handleProcesarPDF = async () => {
    if (!pdfFile) {
      showMessage('error', 'Por favor selecciona un archivo PDF');
      return;
    }

    if (!tiendaSeleccionada) {
      showMessage('error', 'Por favor selecciona una tienda');
      return;
    }

    if (!userId) {
      showMessage('error', 'Usuario no identificado');
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      showMessage('info', 'Procesando PDF...');
      const stock = await extraerStockDePDF(pdfFile);
      
      if (stock.length === 0) {
        showMessage('error', 'No se pudo extraer stock del PDF. Verifica que el PDF tenga la hoja de stock descontado al final.');
        setIsProcessing(false);
        return;
      }

      setStockExtraido(stock);
      showMessage('success', `Se encontraron ${stock.length} SKU(s) en el PDF`);
    } catch (error: any) {
      console.error('Error procesando PDF:', error);
      showMessage('error', `Error al procesar PDF: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDescontarStock = async () => {
    if (!userId || !tiendaSeleccionada || stockExtraido.length === 0) {
      showMessage('error', 'Faltan datos para descontar stock');
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      // Obtener stock actual del usuario para verificar equivalencias
      const stockUsuario = await obtenerStock(userId);
      const mapaEquivalencias = new Map(
        stockUsuario.map(item => [crearClaveSku(item.sku), item.equivalencia ?? 1])
      );

      // Preparar items para descontar
      const itemsParaDescontar = stockExtraido.map(item => {
        const claveSku = crearClaveSku(item.sku);
        const equivalencia = mapaEquivalencias.get(claveSku) ?? 1;
        return {
          sku: item.sku,
          cantidad: item.cantidad * equivalencia, // Aplicar equivalencia
        };
      });

      showMessage('info', 'Descontando stock...');
      const resultado = await descontarStockMultiple(userId, itemsParaDescontar);

      if (resultado.errores.length > 0) {
        const erroresMsg = resultado.errores.map(e => `${e.sku}: ${e.motivo}`).join(', ');
        showMessage('error', `Se descontaron ${resultado.exitosos} SKU(s). Errores: ${erroresMsg}`);
      } else {
        showMessage('success', `Stock descontado correctamente: ${resultado.exitosos} SKU(s)`);
        setStockExtraido([]);
        setPdfFile(null);
        // Resetear input de archivo
        const fileInput = document.getElementById('pdf-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (error: any) {
      console.error('Error descontando stock:', error);
      showMessage('error', `Error al descontar stock: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!canAccess) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <LockedOverlay requiredLevel={4} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-blue-500">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                  Descontar Stock desde PDF
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                  Sube un PDF de Andreani con stock descontado para actualizar tu inventario
                </p>
              </div>
            </div>
          </div>

          {/* Mensaje de estado */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg border-2 ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/50 border-green-300 dark:border-green-500' 
                : message.type === 'error'
                ? 'bg-red-50 dark:bg-red-900/50 border-red-300 dark:border-red-500'
                : 'bg-blue-50 dark:bg-blue-900/50 border-blue-300 dark:border-blue-500'
            }`}>
              <p className={`font-medium ${
                message.type === 'success' 
                  ? 'text-green-700 dark:text-green-400' 
                  : message.type === 'error'
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-blue-700 dark:text-blue-400'
              }`}>
                {message.text}
              </p>
            </div>
          )}

          {/* Formulario */}
          <div className="bg-white dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-gray-200 dark:border-gray-700/50 p-6 space-y-6">
            {/* Selección de tienda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tienda de Cliente *
              </label>
              <select
                value={tiendaSeleccionada}
                onChange={(e) => setTiendaSeleccionada(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                disabled={tiendas.length === 0 || isProcessing}
              >
                {tiendas.length === 0 ? (
                  <option value="">No hay tiendas configuradas</option>
                ) : (
                  <>
                    <option value="">Selecciona una tienda</option>
                    {tiendas.map((tienda) => (
                      <option key={tienda.id} value={tienda.id}>
                        {tienda.nombre_tienda}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {tiendas.length === 0 && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <a href="/tiendas-clientes" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Configura una tienda de cliente primero
                  </a>
                </p>
              )}
            </div>

            {/* Upload PDF */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                PDF de Andreani *
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <input
                  id="pdf-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isProcessing}
                />
                <label
                  htmlFor="pdf-input"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-400">
                    {pdfFile ? pdfFile.name : 'Haz clic para seleccionar PDF'}
                  </span>
                </label>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={handleProcesarPDF}
                disabled={!pdfFile || !tiendaSeleccionada || isProcessing || !pdfjsWorkerReady}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                {isProcessing ? 'Procesando...' : 'Procesar PDF'}
              </button>
            </div>

            {/* Stock extraído */}
            {stockExtraido.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Stock encontrado en el PDF ({stockExtraido.length} SKU(s))
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300 dark:border-gray-600">
                        <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-white">SKU</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-white">Cantidad</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-white">Producto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockExtraido.map((item, index) => (
                        <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">{item.sku}</td>
                          <td className="py-2 px-3">{item.cantidad}</td>
                          <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{item.nombreProducto || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={handleDescontarStock}
                  disabled={isProcessing}
                  className="mt-4 w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                >
                  {isProcessing ? 'Descontando...' : 'Descontar Stock'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DescontarStockPDFPage;

