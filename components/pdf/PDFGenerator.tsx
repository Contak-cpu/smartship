import { useState } from 'react';
import Papa from 'papaparse';
import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import Navigation from '../layout/Navigation';

const PDFGenerator = () => {
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [pdfTemplate, setPdfTemplate] = useState<ArrayBuffer | null>(null);
  const [pdfTemplateBytes, setPdfTemplateBytes] = useState<Uint8Array | null>(null);
  const [originalPdfDoc, setOriginalPdfDoc] = useState<any>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [selectedColumn, setSelectedColumn] = useState<number>(0);
  const [selectedOrderColumn, setSelectedOrderColumn] = useState<number>(0);
  const [selectedQuantityColumn, setSelectedQuantityColumn] = useState<number>(0);
  const [posX, setPosX] = useState<number>(100);
  const [posY, setPosY] = useState<number>(700);
  const [fontSize, setFontSize] = useState<number>(12);
  const [pdfPagesData, setPdfPagesData] = useState<Array<{pageNumber: number, orderNumber: string | null}>>([]);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);

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
    
    // Analizar el PDF para extraer números de orden automáticamente
    try {
      showMessage('info', 'Analizando PDF...');

      // Configurar PDF.js con worker local
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      
      // Cargar el PDF con PDF.js para análisis
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
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
      
      // Ahora cargar con pdf-lib para uso posterior
      try {
        const pdfDoc = await PDFDocument.load(pdfBytesForLib);
        setOriginalPdfDoc(pdfDoc);
        console.log('PDF cargado con pdf-lib para manipulación');
      } catch (pdfLibError) {
        console.error('Error cargando PDF con pdf-lib:', pdfLibError);
        showMessage('error', 'PDF analizado pero puede haber problemas al generar el PDF final');
        return;
      }
      
      const foundNumbers = pagesData.filter(page => page.orderNumber).length;
      showMessage('success', `PDF analizado: ${numPages} páginas, ${foundNumbers} números de orden encontrados`);
      
    } catch (error) {
      console.error('Error al analizar PDF:', error);
      showMessage('error', 'No se pudo analizar el archivo PDF');
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

      for (let i = 0; i < pdfPagesData.length; i++) {
        const pageData = pdfPagesData[i];
        const orderNumber = pageData.orderNumber;
        
        if (!orderNumber) continue;

        const matchingRows = rows.filter(row => {
          const rowOrderNumber = row[selectedOrderColumn];
          return rowOrderNumber && rowOrderNumber.trim() === orderNumber.trim();
        });

        if (matchingRows.length === 0) continue;

        const skusWithQuantity = matchingRows
          .map(row => {
            const sku = row[selectedColumn] || '';
            const quantity = row[selectedQuantityColumn] || '';
            if (sku.trim() !== '') {
              return quantity.trim() !== '' ? `${sku} (x${quantity})` : sku;
            }
            return '';
          })
          .filter(item => item.trim() !== '')
          .join(', ');

        if (!skusWithQuantity.trim()) continue;

        const pageIndex = pageData.pageNumber - 1;
        if (pageIndex < finalPdfDoc.getPageCount()) {
          const page = finalPdfDoc.getPage(pageIndex);
          
          page.drawText(skusWithQuantity, {
            x: posX,
            y: posY,
            size: fontSize,
            color: rgb(0, 0, 0),
          });
        }
      }

      const pdfBytes = await finalPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'documentos_combinados.pdf';
      a.click();
      URL.revokeObjectURL(url);

      showMessage('success', `PDF generado con ${finalPdfDoc.getPageCount()} páginas`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showMessage('error', `Error al generar el PDF: ${errorMessage}`);
    } finally {
      setProcessing(false);
    }
  };

  const canGenerate = csvData.length > 1 && originalPdfDoc !== null;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
        {/* Header with Navigation */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-4 gap-4">
          <header className="text-center lg:text-left flex-1">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
              <div className="text-green-500 size-10">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                PDF Generator
              </h1>
            </div>
            <p className="text-indigo-400 font-medium text-sm sm:text-base">
              Generador de PDFs desde CSV
            </p>
            <p className="text-gray-500 text-xs mt-2">by pictoN</p>
          </header>
          <div>
            <Navigation />
          </div>
        </div>

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

        {/* PDF Pages Info */}
        {pdfTemplate && pdfPagesData.length > 0 && (
          <div className="bg-gray-700 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-white">Páginas del PDF detectadas</h3>
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

        {/* Position Config */}
        {pdfTemplate && (
          <div className="bg-gray-700 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-white">Configuración de posición en el PDF</h3>
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
                  onChange={(e) => setFontSize(parseInt(e.target.value) || 12)}
                  min={6}
                  max={72}
                  className="w-full p-2 border rounded-lg bg-gray-600 text-white border-gray-500 focus:border-green-500 focus:outline-none"
                />
              </div>
            </div>
            <p className="text-xs mt-3 text-gray-400">
              💡 El punto (0,0) está en la esquina inferior izquierda del PDF
            </p>
          </div>
        )}

        {/* Generate Button */}
        {canGenerate && (
          <button
            onClick={generatePDFs}
            disabled={processing}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
          >
            {processing ? 'Procesando...' : 'Generar PDF'}
          </button>
        )}
      </div>
      <footer className="text-center mt-6 sm:mt-8 text-gray-500 text-xs sm:text-sm">
        <p>Creado para automatizar la generación de PDFs desde CSV.</p>
        <p className="mt-1">by pictoN</p>
      </footer>
    </div>
  );
};

export default PDFGenerator;

