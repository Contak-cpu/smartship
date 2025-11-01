import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { guardarEnHistorialSKU } from '../../src/utils/historialStorage';
import { useAuth } from '../../hooks/useAuth';
import { guardarStockDespachado, StockDespachado } from '../../services/informacionService';
import { descontarStockMultiple } from '../../services/stockService';

const PDFGenerator = () => {
  const { username, userId } = useAuth();
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [pdfTemplate, setPdfTemplate] = useState<ArrayBuffer | null>(null);
  const [pdfTemplateBytes, setPdfTemplateBytes] = useState<Uint8Array | null>(null);
  const [originalPdfDoc, setOriginalPdfDoc] = useState<any>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [selectedColumn, setSelectedColumn] = useState<number>(0);
  const [selectedOrderColumn, setSelectedOrderColumn] = useState<number>(0);
  const [selectedQuantityColumn, setSelectedQuantityColumn] = useState<number>(0);
  const [posX, setPosX] = useState<number>(20);
  const [posY, setPosY] = useState<number>(706);
  const [fontSize, setFontSize] = useState<number>(9);
  const [pdfPagesData, setPdfPagesData] = useState<Array<{pageNumber: number, orderNumber: string | null}>>([]);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
  const [showPdfPages, setShowPdfPages] = useState(false);
  const [showPositionConfig, setShowPositionConfig] = useState(false);
  const [isEditingPosition, setIsEditingPosition] = useState(false);
  const [showDescontarStockModal, setShowDescontarStockModal] = useState(false);
  const [stockParaDescontar, setStockParaDescontar] = useState<Array<{sku: string, cantidad: number}>>([]);
  const [pdfjsWorkerReady, setPdfjsWorkerReady] = useState(false);

  // Configurar el worker de PDF.js una vez al montar el componente
  useEffect(() => {
    const initializePDFWorker = () => {
      try {
        // Versión de pdfjs-dist instalada: 5.4.296
        const pdfjsVersion = '5.4.296';
        
        // Prioridad: CDN confiable primero (más probable que funcione en producción)
        // Luego intentar local como fallback
        const preferredWorker = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.mjs`;
        const fallbackWorker = '/pdf.worker.min.mjs';
        
        // Usar CDN como predeterminado (más confiable en producción)
        pdfjsLib.GlobalWorkerOptions.workerSrc = preferredWorker;
        console.log('✅ PDF.js worker configurado:', preferredWorker);
        setPdfjsWorkerReady(true);
      } catch (error) {
        console.error('❌ Error inicializando PDF.js worker:', error);
        // Fallback a CDN alternativo
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs';
        setPdfjsWorkerReady(true);
      }
    };

    initializePDFWorker();
  }, []);

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCSVUpload = (file: File) => {
    setCsvFileName(file.name);
    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as string[][];
        setCsvData(data);
        
        // Auto-seleccionar columna SKU si existe
        const headers = data[0];
        const skuIndex = headers.findIndex(header => 
          header.toLowerCase().includes('sku')
        );
        if (skuIndex !== -1) {
          setSelectedColumn(skuIndex);
        }
        
        // Auto-seleccionar columna Número de orden si existe
        const orderIndex = headers.findIndex(header => 
          header.toLowerCase().includes('número de orden') || 
          header.toLowerCase().includes('numero de orden') ||
          header.toLowerCase().includes('orden')
        );
        if (orderIndex !== -1) {
          setSelectedOrderColumn(orderIndex);
        }
        
        // Auto-seleccionar columna Cantidad del producto si existe
        const quantityIndex = headers.findIndex(header => 
          header.toLowerCase().includes('cantidad del producto') ||
          header.toLowerCase().includes('cantidad')
        );
        if (quantityIndex !== -1) {
          setSelectedQuantityColumn(quantityIndex);
        }
        
        showMessage('success', `CSV cargado: ${data.length - 1} filas detectadas`);
      },
      error: () => {
        showMessage('error', 'No se pudo leer el archivo CSV');
      },
    });
  };

  const handlePDFUpload = async (file: File) => {
    setPdfFileName(file.name);
    const arrayBuffer = await file.arrayBuffer();
    
    // Crear una copia independiente para pdf-lib
    const pdfBytesForLib = new Uint8Array(arrayBuffer.slice());
    
    setPdfTemplate(arrayBuffer);
    setPdfTemplateBytes(new Uint8Array(arrayBuffer));
    
    // Primero intentar cargar con pdf-lib (más importante para generar el PDF)
    try {
      showMessage('info', 'Cargando PDF...');
      const pdfDoc = await PDFDocument.load(pdfBytesForLib);
      setOriginalPdfDoc(pdfDoc);
      console.log('✅ PDF cargado con pdf-lib para manipulación');
      console.log('📄 Estado después de cargar PDF:', {
        originalPdfDoc: pdfDoc !== null,
        pdfPages: pdfDoc.getPageCount(),
        canGenerate: csvData.length > 1 && pdfDoc !== null
      });
      
      // Mostrar mensaje de éxito básico
      showMessage('success', `PDF cargado correctamente: ${pdfDoc.getPageCount()} páginas`);
    } catch (pdfLibError) {
      console.error('❌ Error cargando PDF con pdf-lib:', pdfLibError);
      showMessage('error', 'No se pudo cargar el archivo PDF. Verifica que sea un PDF válido.');
      setOriginalPdfDoc(null);
      return;
    }
    
    // Analizar el PDF con PDF.js para extraer números de orden (CRÍTICO para la funcionalidad)
    try {
      if (!pdfjsWorkerReady) {
        // Esperar un momento a que el worker se inicialice
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      showMessage('info', 'Analizando PDF para extraer números de orden...');
      
      // Asegurarse de que el worker esté configurado
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc || pdfjsLib.GlobalWorkerOptions.workerSrc === '') {
        // Si no está configurado, configurarlo ahora
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.296/pdf.worker.min.mjs';
        console.log('🔧 Configurando PDF.js worker sobre la marcha');
      }

      console.log('🔍 Worker configurado:', pdfjsLib.GlobalWorkerOptions.workerSrc);
      
      // Cargar el PDF con PDF.js para análisis
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0 // Reducir logs
      }).promise;
      const numPages = pdf.numPages;
      const pagesData = [];
      
      console.log(`Analizando PDF con ${numPages} páginas...`);
      
      // Extraer texto de cada página
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Concatenar todo el texto de la página
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          
          // Buscar el patrón "N° Interno: #XXXX"
          const orderNumber = extractOrderNumber(pageText);
          
          pagesData.push({
            pageNumber: pageNum,
            orderNumber: orderNumber
          });
          
          console.log(`Página ${pageNum}: ${orderNumber || 'Sin número encontrado'}`);
          
        } catch (pageError) {
          console.error(`Error en página ${pageNum}:`, pageError);
          pagesData.push({
            pageNumber: pageNum,
            orderNumber: null
          });
        }
      }
      
      setPdfPagesData(pagesData);
      const foundNumbers = pagesData.filter(page => page.orderNumber).length;
      
      if (foundNumbers > 0) {
        showMessage('success', `PDF analizado: ${numPages} páginas, ${foundNumbers} números de orden encontrados`);
      } else {
        showMessage('info', `PDF cargado: ${numPages} páginas. No se encontraron números de orden automáticamente, pero puedes generar el PDF manualmente.`);
      }
      
    } catch (pdfjsError: any) {
      console.error('❌ Error crítico al analizar PDF con PDF.js:', pdfjsError);
      
      // Intentar con diferentes workers como último recurso
      const fallbackWorkers = [
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.296/pdf.worker.min.mjs',
        'https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs',
        'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs'
      ];

      let pdfAnalysisSuccess = false;
      for (const workerUrl of fallbackWorkers) {
        try {
          console.log(`🔄 Intentando con worker alternativo: ${workerUrl}`);
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const numPages = pdf.numPages;
          const pagesData = [];

          for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            try {
              const page = await pdf.getPage(pageNum);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item: any) => item.str).join(' ');
              const orderNumber = extractOrderNumber(pageText);
              pagesData.push({
                pageNumber: pageNum,
                orderNumber: orderNumber
              });
            } catch (pageError) {
              pagesData.push({
                pageNumber: pageNum,
                orderNumber: null
              });
            }
          }

          setPdfPagesData(pagesData);
          const foundNumbers = pagesData.filter(page => page.orderNumber).length;
          showMessage('success', `PDF analizado: ${numPages} páginas, ${foundNumbers} números de orden encontrados`);
          pdfAnalysisSuccess = true;
          break;
        } catch (fallbackError) {
          console.warn(`⚠️ Worker fallback falló: ${workerUrl}`, fallbackError);
          continue;
        }
      }

      if (!pdfAnalysisSuccess) {
        // Si todos los workers fallan, crear páginas vacías pero mostrar advertencia
        if (originalPdfDoc) {
          const numPages = originalPdfDoc.getPageCount();
          const pagesData = Array.from({ length: numPages }, (_, i) => ({
            pageNumber: i + 1,
            orderNumber: null
          }));
          setPdfPagesData(pagesData);
        }
        showMessage('error', 'No se pudo analizar el PDF. Los números de orden no se detectaron automáticamente. Verifica tu conexión a internet o intenta recargar la página.');
        console.error('❌ Todos los intentos de análisis fallaron:', pdfjsError);
      }
    }
  };

  // Función para extraer número de orden del texto
  const extractOrderNumber = (text: string) => {
    const patterns = [
      /N°\s*Interno:\s*#?(\d{4})/gi,
      /N\s*Interno:\s*#?(\d{4})/gi,
      /Interno:\s*#?(\d{4})/gi,
      /#(\d{4})/g
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const numberMatch = match[0].match(/(\d{4})/);
        if (numberMatch) {
          return numberMatch[1];
        }
      }
    }
    
    return null;
  };

  const generatePDFs = async () => {
    if (!originalPdfDoc || csvData.length < 2) {
      showMessage('error', 'Carga el CSV y el PDF antes de continuar');
      return;
    }

    setProcessing(true);
    const headers = csvData[0];
    const rows = csvData.slice(1);

    try {
      console.log('Iniciando generación de PDF combinado...');

      const originalPages = originalPdfDoc.getPages();
      const finalPdfDoc = await PDFDocument.create();
      
      const copiedPages = await finalPdfDoc.copyPages(originalPdfDoc, 
        originalPages.map((_: any, index: number) => index)
      );
      
      copiedPages.forEach((page: any) => finalPdfDoc.addPage(page));

      // Array para almacenar stock despachado
      const stockDespachado: StockDespachado[] = [];
      const hoy = new Date().toISOString().split('T')[0];

      for (let i = 0; i < pdfPagesData.length; i++) {
        const pageData = pdfPagesData[i];
        const orderNumber = pageData.orderNumber;
        
        if (!orderNumber) continue;

        const matchingRows = rows.filter(row => {
          const rowOrderNumber = row[selectedOrderColumn];
          return rowOrderNumber && rowOrderNumber.trim() === orderNumber.trim();
        });

        if (matchingRows.length === 0) continue;

        // Procesar cada fila y separar productos que vengan unidos con " + "
        const allProducts: string[] = [];
        
        matchingRows.forEach(row => {
          const sku = row[selectedColumn] || '';
          const quantity = row[selectedQuantityColumn] || '';
          
          if (sku.trim() !== '') {
            // Separar SKUs que contengan " + " (productos múltiples en un solo SKU)
            const skuParts = sku.split('+').map(part => part.trim());
            
            skuParts.forEach(skuPart => {
              if (skuPart) {
                // Agregar cantidad solo si existe y no está ya incluida en el SKU
                const productText = quantity.trim() !== '' && !skuPart.includes('(x') 
                  ? `${skuPart} (x${quantity})` 
                  : skuPart;
                allProducts.push(productText);

                // Registrar para stock despachado
                const cantidadNumerica = parseInt(quantity) || 1;
                stockDespachado.push({
                  user_id: userId,
                  username,
                  sku: skuPart,
                  nombreproducto: skuPart, // Usar nombre en minúsculas para coincidir con la BD
                  cantidad: cantidadNumerica,
                  numeropedido: orderNumber || '', // Usar nombre en minúsculas
                  fechadespacho: hoy, // Usar nombre en minúsculas
                  archivorotulo: csvFileName || 'documento', // Usar nombre en minúsculas
                });
              }
            });
          }
        });

        if (allProducts.length === 0) continue;

        const pageIndex = pageData.pageNumber - 1;
        if (pageIndex < finalPdfDoc.getPageCount()) {
          const page = finalPdfDoc.getPage(pageIndex);
          
          // Agrupar productos de 2 en 2 y crear líneas
          const lines: string[] = [];
          for (let i = 0; i < allProducts.length; i += 2) {
            const line = allProducts.slice(i, i + 2).join(', ');
            lines.push(line);
          }
          
          // Si hay más de 2 líneas, reducir el tamaño de fuente a 8
          const dynamicFontSize = lines.length > 2 ? 8 : fontSize;
          
          console.log(`Orden ${orderNumber}: ${allProducts.length} productos en ${lines.length} líneas`);
          console.log('Productos individuales:', allProducts);
          console.log('Líneas agrupadas:', lines);
          console.log(`Tamaño de fuente: ${dynamicFontSize}pt`);
          
          // Dibujar cada línea: la primera línea arriba (Y=714), las siguientes bajan
          // Espaciado de 8px entre líneas para que línea 2 quede en Y=706
          const lineSpacing = 8;
          lines.forEach((line, lineIndex) => {
            // La línea 1 está en la posición más alta, las siguientes bajan
            const yPosition = posY + (lineSpacing * (lines.length - 1 - lineIndex));
            console.log(`Dibujando línea ${lineIndex + 1} en Y=${yPosition}: "${line}"`);
            page.drawText(line, {
              x: posX,
              y: yPosition,
              size: dynamicFontSize,
              color: rgb(0, 0, 0),
            });
          });
        }
      }

      // Agregar página de resumen al final
      const summaryPage = finalPdfDoc.addPage([595, 842]); // A4 size
      const { width, height } = summaryPage.getSize();
      
      // Título del resumen
      summaryPage.drawText('RESUMEN DE PRODUCTOS DESPACHADOS', {
        x: 50,
        y: height - 50,
        size: 16,
        color: rgb(0, 0, 0),
      });
      
      // Información general
      const fechaActual = new Date().toLocaleDateString('es-ES');
      summaryPage.drawText(`Fecha: ${fechaActual}`, {
        x: 50,
        y: height - 80,
        size: 12,
        color: rgb(0, 0, 0),
      });
      
      summaryPage.drawText(`Total de productos únicos: ${stockDespachado.length}`, {
        x: 50,
        y: height - 100,
        size: 12,
        color: rgb(0, 0, 0),
      });
      
      // Crear resumen por SKU
      const skuSummary = new Map<string, number>();
      
      stockDespachado.forEach(item => {
        if (skuSummary.has(item.sku)) {
          skuSummary.set(item.sku, skuSummary.get(item.sku)! + item.cantidad);
        } else {
          skuSummary.set(item.sku, item.cantidad);
        }
      });
      
      // Ordenar SKUs por cantidad descendente
      const sortedSkus = Array.from(skuSummary.entries())
        .sort((a, b) => b[1] - a[1]);
      
      // Dibujar tabla de resumen
      let yPosition = height - 140;
      const lineHeight = 20;
      
      // Encabezados de la tabla
      summaryPage.drawText('SKU', {
        x: 50,
        y: yPosition,
        size: 10,
        color: rgb(0, 0, 0),
      });
      
      summaryPage.drawText('Cantidad Total', {
        x: 300,
        y: yPosition,
        size: 10,
        color: rgb(0, 0, 0),
      });
      
      yPosition -= lineHeight;
      
      // Línea separadora
      summaryPage.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: width - 50, y: yPosition },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      
      yPosition -= 10;
      
      // Datos de la tabla
      sortedSkus.forEach(([sku, cantidad]) => {
        if (yPosition < 100) {
          // Si no hay espacio, crear nueva página
          const newPage = finalPdfDoc.addPage([595, 842]);
          yPosition = newPage.getSize().height - 50;
        }
        
        // SKU
        summaryPage.drawText(sku, {
          x: 50,
          y: yPosition,
          size: 9,
          color: rgb(0, 0, 0),
        });
        
        // Cantidad
        summaryPage.drawText(cantidad.toString(), {
          x: 300,
          y: yPosition,
          size: 9,
          color: rgb(0, 0, 0),
        });
        
        yPosition -= lineHeight;
      });
      
      // Pie de página
      const finalY = Math.max(yPosition - 20, 50);
      summaryPage.drawText(`Generado por: ${username || 'Usuario'}`, {
        x: 50,
        y: finalY,
        size: 8,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      summaryPage.drawText(`Archivo fuente: ${csvFileName || 'documento'}`, {
        x: 50,
        y: finalY - 15,
        size: 8,
        color: rgb(0.5, 0.5, 0.5),
      });

      const pdfBytes = await finalPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'documentos_combinados.pdf';
      a.click();
      URL.revokeObjectURL(url);

      // Guardar en historial
      try {
        console.log('🔄 [PDFGenerator] Iniciando guardado en historial SKU...');
        console.log('📊 [PDFGenerator] Datos del PDF:', {
          nombreArchivo: csvFileName || 'documento',
          cantidadRegistros: csvData.length - 1,
          username,
          userId,
          pdfSize: pdfBytes.length
        });
        
        console.log('Tamaño del PDF:', pdfBytes.length, 'bytes');
        
        // Convertir pdfBytes a base64 en chunks para evitar problemas con PDFs grandes
        let binary = '';
        const bytes = new Uint8Array(pdfBytes);
        const chunkSize = 0x8000; // 32KB chunks
        
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
          binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        
        const base64 = btoa(binary);
        console.log('PDF convertido a base64. Tamaño base64:', base64.length, 'caracteres');
        
        const nombreArchivo = csvFileName || 'documento';
        const cantidadRegistros = csvData.length - 1; // -1 para no contar el header
        
        await guardarEnHistorialSKU(nombreArchivo, cantidadRegistros, base64, username, userId);
        console.log('✅ [PDFGenerator] PDF guardado exitosamente en historial');
        showMessage('success', `PDF guardado en historial`);
      } catch (historialError) {
        console.error('❌ [PDFGenerator] Error al guardar en historial:', historialError);
        if (historialError instanceof Error) {
          console.error('Detalle del error:', historialError.message);
          if (historialError.name === 'QuotaExceededError') {
            showMessage('error', 'El PDF es muy grande para guardar en historial. Intenta con un archivo más pequeño.');
          } else {
            showMessage('error', `No se pudo guardar en historial: ${historialError.message}`);
          }
        } else {
          showMessage('error', 'Error desconocido al guardar en historial');
        }
        // No interrumpir el flujo si falla el guardado del historial
      }

      // Guardar stock despachado en Supabase
      if (stockDespachado.length > 0) {
        try {
          console.log(`Guardando ${stockDespachado.length} items de stock despachado en Supabase...`);
          await guardarStockDespachado(stockDespachado);
          console.log(`✅ Stock despachado guardado: ${stockDespachado.length} items`);
        } catch (stockError) {
          console.error('Error al guardar stock despachado:', stockError);
          // No interrumpir el flujo si falla
        }
      }

      // Crear resumen de stock para descontar
      const stockSummaryMap = new Map<string, number>();
      stockDespachado.forEach(item => {
        const current = stockSummaryMap.get(item.sku) || 0;
        stockSummaryMap.set(item.sku, current + item.cantidad);
      });
      
      const stockArray = Array.from(stockSummaryMap.entries()).map(([sku, cantidad]) => ({
        sku,
        cantidad
      }));
      
      setStockParaDescontar(stockArray);
      setShowDescontarStockModal(true);
      showMessage('success', `PDF generado con ${finalPdfDoc.getPageCount()} páginas (incluye resumen de productos)`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showMessage('error', `Error al generar el PDF: ${errorMessage}`);
    } finally {
      setProcessing(false);
    }
  };

  const canGenerate = csvData.length > 1 && originalPdfDoc !== null;

  // Debug: Log estado de archivos cargados
  useEffect(() => {
    console.log('🔍 [PDFGenerator] Estado de archivos:', {
      csvLoaded: csvData.length > 1,
      csvRows: csvData.length,
      pdfLoaded: originalPdfDoc !== null,
      canGenerate
    });
  }, [csvData.length, originalPdfDoc, canGenerate]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <header className="text-center mb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-green-500 size-10">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              PDF Generator
            </h1>
          </div>
          <p className="text-green-400 font-medium text-sm sm:text-base">
            Generador de PDFs desde CSV
          </p>
        </header>

        {/* Mensaje de estado */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-900/50 border border-green-500' :
            message.type === 'error' ? 'bg-red-900/50 border border-red-500' :
            'bg-blue-900/50 border border-blue-500'
          }`}>
            <p className={`font-medium ${
              message.type === 'success' ? 'text-green-400' :
              message.type === 'error' ? 'text-red-400' : 'text-blue-400'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Sección de carga de archivos */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload CSV */}
          <div className="bg-gray-700 p-6 rounded-lg border-2 border-dashed border-gray-600 hover:border-green-500 transition-colors cursor-pointer"
               onClick={() => document.getElementById('csv-input')?.click()}>
            <div className="flex flex-col items-center justify-center space-y-3">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="text-center">
                <h3 className="font-semibold text-white">Archivo CSV</h3>
                <p className="text-sm mt-1 text-gray-400">Arrastra o haz clic para cargar tu CSV</p>
                {csvFileName && (
                  <p className="text-sm font-medium mt-2 text-green-400">📄 {csvFileName}</p>
                )}
              </div>
              <input
                id="csv-input"
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCSVUpload(file);
                }}
                className="hidden"
              />
            </div>
          </div>

          {/* Upload PDF */}
          <div className="bg-gray-700 p-6 rounded-lg border-2 border-dashed border-gray-600 hover:border-green-500 transition-colors cursor-pointer"
               onClick={() => document.getElementById('pdf-input')?.click()}>
            <div className="flex flex-col items-center justify-center space-y-3">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="text-center">
                <h3 className="font-semibold text-white">PDF Plantilla</h3>
                <p className="text-sm mt-1 text-gray-400">Tu documento base donde se insertará el texto</p>
                {pdfFileName && (
                  <p className="text-sm font-medium mt-2 text-green-400">📄 {pdfFileName}</p>
                )}
              </div>
              <input
                id="pdf-input"
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePDFUpload(file);
                }}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* CSV Preview */}
        {csvData.length > 0 && (
          <div className="bg-gray-700 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-white">Vista previa del CSV</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-300">
                    Columna con el texto a insertar (SKU)
                  </label>
                  <select 
                    value={selectedColumn} 
                    onChange={(e) => setSelectedColumn(parseInt(e.target.value))}
                    className="w-full p-2 border rounded-lg bg-gray-600 text-white border-gray-500 focus:border-green-500 focus:outline-none">
                    {csvData[0].map((header, index) => (
                      <option key={index} value={index}>
                        {header || `Columna ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-300">
                    Columna con el número de orden
                  </label>
                  <select 
                    value={selectedOrderColumn} 
                    onChange={(e) => setSelectedOrderColumn(parseInt(e.target.value))}
                    className="w-full p-2 border rounded-lg bg-gray-600 text-white border-gray-500 focus:border-green-500 focus:outline-none">
                    {csvData[0].map((header, index) => (
                      <option key={index} value={index}>
                        {header || `Columna ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-300">
                    Columna con la cantidad
                  </label>
                  <select 
                    value={selectedQuantityColumn} 
                    onChange={(e) => setSelectedQuantityColumn(parseInt(e.target.value))}
                    className="w-full p-2 border rounded-lg bg-gray-600 text-white border-gray-500 focus:border-green-500 focus:outline-none">
                    {csvData[0].map((header, index) => (
                      <option key={index} value={index}>
                        {header || `Columna ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-600 rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-600">
                      {csvData[0].map((header, index) => (
                        <th 
                          key={index}
                          className={`p-3 text-left text-sm font-medium text-white ${
                            selectedColumn === index || selectedOrderColumn === index || selectedQuantityColumn === index
                              ? 'bg-green-900/50'
                              : ''
                          }`}>
                          {header || `Col ${index + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(1, 6).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-gray-600">
                        {row.map((cell, cellIndex) => (
                          <td 
                            key={cellIndex}
                            className={`p-3 text-sm text-gray-300 ${
                              selectedColumn === cellIndex || selectedOrderColumn === cellIndex || selectedQuantityColumn === cellIndex
                                ? 'bg-green-900/30 font-medium'
                                : ''
                            }`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-xs text-gray-400">
                <p>Mostrando 5 de {csvData.length - 1} filas</p>
                <p className="mt-1">💡 Si un pedido aparece varias veces, se concatenarán todos los SKUs con cantidades</p>
              </div>
            </div>
          </div>
        )}

        {/* PDF Pages Info - Colapsable */}
        {pdfTemplate && pdfPagesData.length > 0 && (
          <div className="bg-gray-700 rounded-lg overflow-hidden border border-gray-600">
            <button
              onClick={() => setShowPdfPages(!showPdfPages)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${showPdfPages ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <h3 className="text-lg font-bold text-white">Páginas del PDF detectadas</h3>
              </div>
              <span className="text-sm text-gray-400">
                {pdfPagesData.filter(p => p.orderNumber).length} de {pdfPagesData.length} con número de orden
              </span>
            </button>
            
            {showPdfPages && (
              <div className="p-6 pt-2 border-t border-gray-600">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {pdfPagesData.map((page) => (
                    <div 
                      key={page.pageNumber}
                      className={`p-3 rounded-lg text-xs ${
                        page.orderNumber ? 'bg-green-900/50 border border-green-500' : 'bg-gray-600 border border-gray-500'
                      }`}>
                      <div className="font-medium text-white">Página {page.pageNumber}</div>
                      <div className={`text-xs ${page.orderNumber ? 'text-green-400' : 'text-gray-400'}`}>
                        {page.orderNumber || 'Sin orden'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Position Config - Colapsable con botón de edición */}
        {pdfTemplate && (
          <div className="bg-gray-700 rounded-lg overflow-hidden border border-gray-600">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white">Configuración de posición</h3>
                <button
                  onClick={() => {
                    setIsEditingPosition(!isEditingPosition);
                    if (!isEditingPosition) {
                      setShowPositionConfig(true);
                    }
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    isEditingPosition 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                  title={isEditingPosition ? 'Guardar cambios' : 'Editar posición'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isEditingPosition ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    )}
                  </svg>
                </button>
              </div>
              
              {!isEditingPosition && (
                <div className="text-sm text-gray-400">
                  X: {posX}px, Y: {posY}px, Tamaño: {fontSize}pt
                </div>
              )}
              
              <button
                onClick={() => setShowPositionConfig(!showPositionConfig)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className={`w-5 h-5 transition-transform ${showPositionConfig ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {showPositionConfig && (
              <div className="p-6 pt-2 border-t border-gray-600">
                {isEditingPosition ? (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Posición X (px)</label>
                        <input
                          type="number"
                          value={posX}
                          onChange={(e) => setPosX(parseInt(e.target.value) || 0)}
                          min={0}
                          className="w-full p-2 border rounded-lg bg-gray-600 text-white border-gray-500 focus:border-green-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Posición Y (px)</label>
                        <input
                          type="number"
                          value={posY}
                          onChange={(e) => setPosY(parseInt(e.target.value) || 0)}
                          min={0}
                          className="w-full p-2 border rounded-lg bg-gray-600 text-white border-gray-500 focus:border-green-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Tamaño fuente</label>
                        <input
                          type="number"
                          value={fontSize}
                          onChange={(e) => setFontSize(parseInt(e.target.value) || 6)}
                          min={6}
                          max={72}
                          className="w-full p-2 border rounded-lg bg-gray-600 text-white border-gray-500 focus:border-green-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <p className="text-xs mt-3 text-gray-400">
                      💡 El punto (0,0) está en la esquina inferior izquierda del PDF
                    </p>
                  </>
                ) : (
                  <div className="bg-gray-600 p-4 rounded-lg">
                    <p className="text-sm text-gray-300 mb-2">
                      <strong>Posición configurada:</strong>
                    </p>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• Coordenada X: <span className="text-white font-medium">{posX}px</span></li>
                      <li>• Coordenada Y: <span className="text-white font-medium">{posY}px</span></li>
                      <li>• Tamaño de fuente: <span className="text-white font-medium">{fontSize}pt</span></li>
                      <li className="mt-2 text-xs">• Los productos se organizan en pares (2 por línea)</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Generate Button - Siempre mostrar si hay archivos cargados */}
        {(csvData.length > 1 || pdfTemplate) && (
          <div className="space-y-3">
            {!canGenerate && (
              <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-yellow-400 font-medium mb-1">Faltan archivos para generar el PDF</p>
                    <ul className="text-sm text-yellow-300 space-y-1">
                      {csvData.length <= 1 && <li>• Carga un archivo CSV con datos</li>}
                      {!originalPdfDoc && <li>• Carga un archivo PDF plantilla</li>}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={generatePDFs}
              disabled={!canGenerate || processing}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generar y Descargar PDF
                </>
              )}
            </button>
          </div>
        )}
        
        <footer className="text-center mt-6 text-gray-500 text-xs sm:text-sm">
          <p>Creado para automatizar la generación de PDFs desde CSV.</p>
          <p className="mt-1 text-gray-600">by pictoN</p>
        </footer>
      </div>

      {/* Modal de confirmación para descontar stock */}
      {showDescontarStockModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="text-orange-500 flex-shrink-0">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    ¿Descontar del Stock?
                  </h3>
                  <p className="text-gray-400">
                    Se han generado PDFs y registros de despacho. ¿Deseas descontar estos productos de tu stock?
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDescontarStockModal(false);
                    setStockParaDescontar([]);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Lista de productos */}
              <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
                <h4 className="text-white font-semibold mb-3">Productos a descontar:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {stockParaDescontar.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-800 rounded-lg p-3"
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium">{item.sku}</p>
                      </div>
                      <div className="bg-orange-900/30 text-orange-400 px-3 py-1 rounded-full text-sm font-bold border border-orange-500/30">
                        -{item.cantidad} unidades
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (!userId) {
                      showMessage('error', 'Usuario no identificado');
                      return;
                    }

                    try {
                      const exitosos = await descontarStockMultiple(userId, stockParaDescontar);
                      showMessage('success', `Stock actualizado: ${exitosos} productos descontados`);
                      setShowDescontarStockModal(false);
                      setStockParaDescontar([]);
                    } catch (error) {
                      console.error('Error al descontar stock:', error);
                      showMessage('error', 'No se pudo descontar el stock');
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sí, Descontar del Stock
                </button>
                <button
                  onClick={() => {
                    setShowDescontarStockModal(false);
                    setStockParaDescontar([]);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                  No, No descontar
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                💡 Siempre se te preguntará para evitar descuentos duplicados al procesar archivos múltiples veces
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFGenerator;

