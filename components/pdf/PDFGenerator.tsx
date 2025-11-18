import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
// Importar el worker directamente desde el paquete (Vite lo manejará correctamente)
// @ts-ignore - pdfjs-dist puede no tener tipos completos para el worker
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { guardarEnHistorialSKU } from '../../src/utils/historialStorage';
import { useAuth } from '../../hooks/useAuth';
import { guardarStockDespachado, StockDespachado } from '../../services/informacionService';
import { descontarStockMultiple, obtenerStock, crearClaveSku } from '../../services/stockService';
import { registrarActividad } from '../../services/logsService';

// Tipo para los logs de debug
type DebugLogType = 'info' | 'success' | 'error' | 'warning';
interface DebugLog {
  timestamp: number;
  message: string;
  type?: DebugLogType;
}

const PDFGenerator = () => {
  const { username, userId, userLevel } = useAuth();
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
  const [stockParaDescontar, setStockParaDescontar] = useState<Array<{sku: string; cantidad: number; equivalencia: number; totalReal: number}>>([]);
  const canManageStock = userLevel >= 4;
  const formatNumber = (value: number) => new Intl.NumberFormat('es-AR').format(value);
  const [pdfjsWorkerReady, setPdfjsWorkerReady] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Configurar el worker de PDF.js una vez al montar el componente
  useEffect(() => {
    const initializePDFWorker = async () => {
      try {
        // Prioridad 1: Worker importado directamente desde el paquete (más confiable)
        if (pdfjsWorker) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
          console.log('✅ PDF.js worker configurado desde paquete:', pdfjsWorker);
          setPdfjsWorkerReady(true);
          return;
        }
      } catch (error) {
        console.warn('⚠️ No se pudo usar worker del paquete:', error);
      }

      // Prioridad 2: Worker local en public
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        console.log('✅ PDF.js worker configurado (local):', '/pdf.worker.min.mjs');
        setPdfjsWorkerReady(true);
        return;
      } catch (error) {
        console.warn('⚠️ No se pudo usar worker local:', error);
      }

      // Prioridad 3: CDN como último recurso
      const cdnWorkerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';
      pdfjsLib.GlobalWorkerOptions.workerSrc = cdnWorkerUrl;
      console.log('✅ PDF.js worker configurado (CDN fallback):', cdnWorkerUrl);
      setPdfjsWorkerReady(true);
    };

    initializePDFWorker();
  }, []);

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Función para normalizar texto eliminando TODOS los caracteres inválidos para WinAnsi
  // Elimina acentos, tildes, emojis y cualquier carácter especial - solo deja ASCII básico
  const normalizarTextoWinAnsi = (text: string): string => {
    if (!text) return '';
    
    try {
      // Paso 1: Convertir a string
      let normalized = String(text);
      
      // Paso 2: Normalizar y descomponer TODOS los caracteres (NFKD es más agresivo)
      // Esto separa acentos de letras base (ej: "é" -> "e" + "́")
      normalized = normalized.normalize('NFKD');
      
      // Paso 3: Eliminar TODAS las marcas diacríticas (acentos, tildes, etc.)
      // Esto incluye U+0301 (acento agudo combinado) y todas las demás marcas
      normalized = normalized.replace(/[\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/g, '');
      
      // Paso 4: Eliminar emojis y símbolos especiales
      normalized = normalized.replace(/[\u{1F300}-\u{1F9FF}]/gu, ''); // Emojis (🚚🎁⚡)
      normalized = normalized.replace(/[\u{2600}-\u{26FF}]/gu, ''); // Símbolos varios
      normalized = normalized.replace(/[\u{2700}-\u{27BF}]/gu, ''); // Símbolos decorativos
      
      // Paso 5: Reemplazar caracteres acentuados comunes por sus equivalentes sin acento
      // Esto cubre casos donde la normalización no funcionó correctamente
      normalized = normalized
        .replace(/[áàäâãåăą]/gi, 'a')
        .replace(/[éèëêęě]/gi, 'e')
        .replace(/[íìïîįı]/gi, 'i')
        .replace(/[óòöôõø]/gi, 'o')
        .replace(/[úùüûů]/gi, 'u')
        .replace(/[ýÿ]/gi, 'y')
        .replace(/[ñň]/gi, 'n')
        .replace(/[çč]/gi, 'c');
      
      // Paso 6: Filtrar carácter por carácter - SOLO permitir ASCII básico (0x20-0x7E)
      // Esto asegura compatibilidad total con WinAnsi
      // Permitir: letras (A-Z, a-z), números (0-9), espacios (0x20) y caracteres básicos de puntuación
      let result = '';
      for (let i = 0; i < normalized.length; i++) {
        const char = normalized[i];
        const charCode = char.charCodeAt(0);
        // Solo permitir caracteres ASCII imprimibles (0x20-0x7E) + algunos caracteres extendidos comunes
        // Excluir explícitamente caracteres combinados y fuera del rango seguro
        if (charCode >= 0x20 && charCode <= 0x7E) {
          // ASCII básico imprimible (espacios, letras, números, puntuación básica)
          result += char;
        } else if (charCode === 0x0A || charCode === 0x0D) {
          // Permitir saltos de línea básicos
          result += ' ';
        }
        // Todos los demás caracteres se ignoran (incluyendo 0x0301, emojis, acentos, etc.)
      }
      
      // Paso 7: Limpiar espacios múltiples y espacios al inicio/final
      result = result.replace(/\s+/g, ' ').trim();
      
      return result;
    } catch (error) {
      console.error('Error en normalizarTextoWinAnsi:', error);
      // Fallback: eliminar todo lo que no sea ASCII básico
      return String(text).replace(/[^\x20-\x7E]/g, '').trim().replace(/\s+/g, ' ');
    }
  };

  const parsearSkuConCantidad = (rawSku: string) => {
    let texto = rawSku.trim();

    // Buscar prefijo tipo "3x-" o "2 X "
    const prefijoMatch = texto.match(/^(\d+)\s*x\s*[-_ ]*/i);
    let multiplicador = 1;

    if (prefijoMatch) {
      multiplicador = parseInt(prefijoMatch[1], 10) || 1;
      texto = texto.slice(prefijoMatch[0].length);
    }

    // Buscar sufijo tipo "(x3)" o "x3" al final
    const sufijoMatch = texto.match(/\(x\s*(\d+)\s*\)$/i) || texto.match(/x\s*(\d+)\s*$/i);
    if (sufijoMatch) {
      multiplicador *= parseInt(sufijoMatch[1], 10) || 1;
      texto = texto.replace(sufijoMatch[0], '');
    }

    const skuNormalizado = normalizarTextoWinAnsi(texto.trim());
    return {
      skuLimpio: skuNormalizado,
      multiplicadorDesdeTexto: Math.max(multiplicador, 1),
    };
  };

  const handleCSVUpload = (file: File) => {
    setCsvFileName(file.name);
    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as string[][];
        
        // Normalizar todos los datos del CSV para eliminar caracteres inválidos
        const dataNormalizada = data.map(row => 
          row.map(cell => normalizarTextoWinAnsi(cell || ''))
        );
        
        setCsvData(dataNormalizada);
        
        // Auto-seleccionar columna "Lineitem sku" si existe (usar headers normalizados)
        const headers = dataNormalizada[0];
        // Buscar específicamente "Lineitem sku" primero, luego cualquier columna con "sku"
        const lineitemSkuIndex = headers.findIndex(header => 
          header.toLowerCase().includes('lineitem sku') || 
          header.toLowerCase().includes('lineitem_sku')
        );
        if (lineitemSkuIndex !== -1) {
          setSelectedColumn(lineitemSkuIndex);
        } else {
          // Fallback: buscar cualquier columna con "sku"
          const skuIndex = headers.findIndex(header => 
            header.toLowerCase().includes('sku')
          );
          if (skuIndex !== -1) {
            setSelectedColumn(skuIndex);
          }
        }
        
        // Auto-seleccionar columna Número de orden si existe
        // IMPORTANTE: En CSV de Shopify, "Name" (primera columna, índice 0) contiene números como "#3579"
        console.log('🔍 Buscando columna de número de orden...');
        console.log('📋 Primeras 10 columnas:', headers.slice(0, 10).map((h, i) => `${i}: "${h}"`).join(', '));
        
        let orderIndex = -1;
        
        // Prioridad 1: "Name" (Shopify - primera columna con números de orden)
        const nameIndex = headers.findIndex((header, idx) => {
          const h = header.toLowerCase().trim();
          // Si es "Name" y está en las primeras columnas, probablemente sea la correcta
          return h === 'name' && idx < 5;
        });
        
        if (nameIndex !== -1) {
          orderIndex = nameIndex;
          console.log(`✅ Encontrada columna "Name" en índice ${nameIndex}`);
        }
        
        // Prioridad 2: "Número de orden" o variantes
        if (orderIndex === -1) {
          orderIndex = headers.findIndex(header => {
            const h = header.toLowerCase().trim();
            return h.includes('número de orden') || 
                   h.includes('numero de orden');
          });
          if (orderIndex !== -1) {
            console.log(`✅ Encontrada columna "Número de orden" en índice ${orderIndex}`);
          }
        }
        
        // Prioridad 3: Cualquier columna con "orden", "number" o "id"
        if (orderIndex === -1) {
          orderIndex = headers.findIndex(header => {
            const h = header.toLowerCase().trim();
            return h.includes('orden') ||
                   h.includes('number') ||
                   h === 'id';
          });
          if (orderIndex !== -1) {
            console.log(`⚠️ Encontrada columna genérica en índice ${orderIndex}`);
          }
        }
        
        if (orderIndex !== -1) {
          setSelectedOrderColumn(orderIndex);
          console.log(`✅ Columna de orden seleccionada: "${headers[orderIndex]}" (índice ${orderIndex})`);
          // Mostrar algunas filas de ejemplo de esa columna
          const dataNormalizada = data.map(row => 
            row.map(cell => normalizarTextoWinAnsi(cell || ''))
          );
          const sampleRows = dataNormalizada.slice(1, 4).map(r => r[orderIndex]);
          console.log(`📊 Ejemplo de valores en esa columna (primeras 3 filas):`, sampleRows);
        } else {
          console.warn('⚠️ No se encontró columna de número de orden, usando columna 0 por defecto');
          console.log(`📋 Todas las columnas:`, headers.map((h, i) => `${i}: "${h}"`).join(', '));
          setSelectedOrderColumn(0);
        }
        
        // Auto-seleccionar columna Cantidad del producto si existe
        // Prioridad 1: "Lineitem quantity" (Shopify)
        const lineitemQuantityIndex = headers.findIndex(header => 
          header.toLowerCase().includes('lineitem quantity') ||
          header.toLowerCase().includes('lineitem_quantity')
        );
        if (lineitemQuantityIndex !== -1) {
          setSelectedQuantityColumn(lineitemQuantityIndex);
          console.log(`✅ Columna de cantidad seleccionada: "${headers[lineitemQuantityIndex]}" (índice ${lineitemQuantityIndex})`);
        } else {
          // Prioridad 2: Cualquier columna con "cantidad"
          const quantityIndex = headers.findIndex(header => 
            header.toLowerCase().includes('cantidad del producto') ||
            header.toLowerCase().includes('cantidad')
          );
          if (quantityIndex !== -1) {
            setSelectedQuantityColumn(quantityIndex);
            console.log(`✅ Columna de cantidad seleccionada: "${headers[quantityIndex]}" (índice ${quantityIndex})`);
          } else {
            console.warn('⚠️ No se encontró columna de cantidad, usando índice 0 por defecto');
          }
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
    const pdfBytesForLib = new Uint8Array(arrayBuffer);
    
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
        console.log('⏳ Esperando a que el worker se inicialice...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      showMessage('info', 'Analizando PDF para extraer números de orden...');
      
      // Asegurarse de que el worker esté configurado
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc || pdfjsLib.GlobalWorkerOptions.workerSrc === '') {
        // Si no está configurado, configurarlo ahora con una versión estable
        const fallbackWorkers = [
          '/pdf.worker.min.mjs',
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs',
          'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs'
        ];
        
        pdfjsLib.GlobalWorkerOptions.workerSrc = fallbackWorkers[1]; // Usar CDN estable
        console.log('🔧 Configurando PDF.js worker sobre la marcha:', pdfjsLib.GlobalWorkerOptions.workerSrc);
        // Dar tiempo para que el worker se cargue
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log('🔍 Worker configurado:', pdfjsLib.GlobalWorkerOptions.workerSrc);
      console.log('📦 Versión pdfjs-dist:', pdfjsLib.version || 'desconocida');
      
      // Cargar el PDF con PDF.js para análisis
      console.log('🔄 Iniciando carga del PDF con PDF.js...');
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0 // Reducir logs
      });
      
      console.log('⏳ Esperando promesa del PDF...');
      const pdf = await loadingTask.promise;
      console.log('✅ PDF cargado con PDF.js exitosamente');
      const numPages = pdf.numPages;
      const pagesData = [];
      
      console.log(`Analizando PDF con ${numPages} páginas...`);
      
      // Extraer texto de cada página
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Extraer texto con coordenadas de posición para búsqueda por ubicación
          const pageSize = page.view;
          const viewport = page.getViewport({ scale: 1.0 });
          
          // Extraer items con sus coordenadas
          const textItems = textContent.items.map((item: any) => {
            // Extraer transformación (matriz de transformación)
            const transform = item.transform || [1, 0, 0, 1, 0, 0];
            // Las coordenadas X e Y están en transform[4] y transform[5]
            // Pero en PDF.js, la transformación puede estar en diferentes formatos
            const x = transform[4] || 0;
            const y = transform[5] || 0;
            // En PDF, Y=0 está en la parte inferior, pero viewport.height - y nos da Y desde arriba
            const yFromTop = viewport.height - y;
            
            return {
              text: item.str || '',
              x: x,
              y: y,
              yFromTop: yFromTop,
              width: item.width || 0,
              height: item.height || 0
            };
          });
          
          // Concatenar todo el texto de la página para búsqueda por texto también
          const pageText = textItems
            .map(item => item.text)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          // Log del texto extraído para debugging
          // Para la primera página, mostrar más información
          if (pageNum === 1) {
            console.log(`📄 Página ${pageNum} - Dimensiones: ${viewport.width}x${viewport.height}`);
            console.log(`📄 Página ${pageNum} - Texto completo (primeros 1000 chars):`, pageText.substring(0, 1000));
            // Mostrar algunos items con sus coordenadas
            console.log(`📄 Página ${pageNum} - Primeros 10 items con coordenadas:`, 
              textItems.slice(0, 10).map(item => `"${item.text}" @ (${item.x.toFixed(1)}, ${item.yFromTop.toFixed(1)})`));
          }
          
          // Buscar el número interno usando posición Y coordenadas
          const orderNumber = extractOrderNumberByPosition(pageText, textItems, viewport);
          
          if (!orderNumber) {
            // Si no se encuentra, mostrar más información de diagnóstico solo para la primera página
            if (pageNum === 1) {
              console.warn(`⚠️ Página ${pageNum}: No se encontró número con patrones estándar.`);
              console.warn(`   Buscando variaciones del patrón...`);
              // Intentar buscar manualmente diferentes variaciones
              const variaciones = [
                /interno/gi,
                /numero interno/gi,
                /número interno/gi,
                /n° interno/gi,
                /n\s*°\s*interno/gi,
                /#\d+/g,
                /\d{3,}/g
              ];
              variaciones.forEach((patron, idx) => {
                const matches = pageText.match(patron);
                if (matches) {
                  console.warn(`   Variación ${idx + 1} (${patron}):`, matches.slice(0, 5));
                }
              });
            }
          } else {
            console.log(`✅ Página ${pageNum}: Número encontrado: ${orderNumber}`);
          }
          
          pagesData.push({
            pageNumber: pageNum,
            orderNumber: orderNumber
          });
          
        } catch (pageError) {
          console.error(`❌ Error en página ${pageNum}:`, pageError);
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
      console.error('📋 Detalles del error:', {
        name: pdfjsError?.name,
        message: pdfjsError?.message,
        stack: pdfjsError?.stack,
        workerSrc: pdfjsLib.GlobalWorkerOptions.workerSrc
      });
      
      // Intentar con diferentes workers como último recurso (versiones estables disponibles)
      const fallbackWorkers = [
        '/pdf.worker.min.mjs',
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs',
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.mjs',
        'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs',
        'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs'
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
              
              // Usar el mismo procesamiento mejorado de texto
              const pageText = textContent.items
                .map((item: any) => item.str || '')
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim();
              
              console.log(`📄 [Fallback] Página ${pageNum} - Texto extraído (primeros 200 chars):`, pageText.substring(0, 200));
              
              const orderNumber = extractOrderNumber(pageText);
              
              if (orderNumber) {
                console.log(`✅ [Fallback] Página ${pageNum}: Número encontrado: ${orderNumber}`);
              }
              
              pagesData.push({
                pageNumber: pageNum,
                orderNumber: orderNumber
              });
            } catch (pageError) {
              console.error(`❌ [Fallback] Error en página ${pageNum}:`, pageError);
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

  // Función para extraer número de orden usando posición y coordenadas
  const extractOrderNumberByPosition = (
    text: string, 
    textItems: Array<{text: string, x: number, y: number, yFromTop: number, width: number, height: number}>,
    viewport: any
  ) => {
    // Primero intentar con el método de texto (por si el formato es claro)
    const textoResult = extractOrderNumber(text);
    if (textoResult) {
      return textoResult;
    }
    
    // Si no funciona, buscar por posición: buscar texto "Interno" y luego números cerca
    console.log('🔍 Buscando número interno por posición...');
    
    // Buscar items que contengan "Interno" (NO solo "N°" porque eso también aparece en "N° de seguimiento")
    const itemsConInterno = textItems.filter(item => 
      item.text.toLowerCase().includes('interno')
    );
    
    if (itemsConInterno.length > 0) {
      console.log(`✅ Encontrados ${itemsConInterno.length} items con "interno"`);
      itemsConInterno.forEach((item, idx) => {
        console.log(`   Item ${idx + 1}: "${item.text}" @ Y=${item.yFromTop.toFixed(1)}`);
      });
      
      // Para cada item con "Interno", buscar números que tengan "#" cerca (misma línea o líneas adyacentes)
      for (const itemInterno of itemsConInterno) {
        // Buscar items con "#" en la misma línea (Y similar, tolerancia de 15px)
        const toleranciaY = 15;
        const itemsConHash = textItems.filter(item => {
          const distanciaY = Math.abs(item.yFromTop - itemInterno.yFromTop);
          const tieneHash = item.text.includes('#');
          return distanciaY <= toleranciaY && tieneHash && item.x > itemInterno.x; // Debe estar a la derecha
        });
        
        // De esos items con "#", extraer el número
        const numerosCerca = itemsConHash.map(item => {
          // Extraer número después del "#"
          const match = item.text.match(/#\s*(\d{3,})/);
          if (match && match[1]) {
            return {
              text: match[1],
              x: item.x,
              yFromTop: item.yFromTop,
              originalText: item.text
            };
          }
          return null;
        }).filter(item => item !== null);
        
        if (numerosCerca.length > 0) {
          console.log(`✅ Encontrados ${numerosCerca.length} números con "#" cerca de "${itemInterno.text}":`);
          numerosCerca.forEach((num: any) => {
            console.log(`   Número: "${num.text}" @ Y=${num.yFromTop.toFixed(1)} (distancia: ${Math.abs(num.yFromTop - itemInterno.yFromTop).toFixed(1)}px, texto original: "${num.originalText}")`);
          });
          
          // Tomar el número más cercano en X (a la derecha de "Interno")
          const numeroMasCercano = numerosCerca.reduce((prev: any, curr: any) => 
            (curr.x - itemInterno.x) < (prev.x - itemInterno.x) ? curr : prev
          );
          const numeroLimpio = numeroMasCercano.text.replace(/[#\s]/g, '');
          // Aceptar números de 3, 4 o 5 dígitos completos (sin truncar)
          if (numeroLimpio.length >= 3 && numeroLimpio.length <= 5) {
            const numeroFinal = numeroLimpio; // Usar el número completo sin truncar
            console.log(`✅ Número interno encontrado por posición (después de "#"): "${numeroFinal}" (${numeroFinal.length} dígitos)`);
            return numeroFinal;
          }
        }
      }
    }
    
    // Si no se encontró por posición, intentar buscar números en la parte superior del rótulo
    // (típicamente el número interno está en la parte superior)
    const parteSuperior = viewport.height * 0.3; // Primeros 30% de la página
    const numerosSuperiores = textItems.filter(item => {
      const esNumero = /^\d{3,}$/.test(item.text.trim()) || /^#\d{3,}$/.test(item.text.trim());
      return item.yFromTop <= parteSuperior && esNumero;
    });
    
    if (numerosSuperiores.length > 0) {
      console.log(`⚠️ No se encontró "Interno", pero hay ${numerosSuperiores.length} números en la parte superior`);
      numerosSuperiores.forEach((num, idx) => {
        console.log(`   Número ${idx + 1}: "${num.text}" @ Y=${num.yFromTop.toFixed(1)}`);
      });
      // Tomar el número más arriba (menor Y desde arriba)
      const numeroMasArriba = numerosSuperiores.reduce((prev, curr) => 
        curr.yFromTop < prev.yFromTop ? curr : prev
      );
      const numeroLimpio = numeroMasArriba.text.replace(/[#\s]/g, '');
      // Aceptar números de 3, 4 o 5 dígitos completos (sin truncar)
      if (numeroLimpio.length >= 3 && numeroLimpio.length <= 5) {
        const numeroFinal = numeroLimpio; // Usar el número completo sin truncar
        console.log(`⚠️ Usando número de la parte superior como fallback: "${numeroFinal}" (${numeroFinal.length} dígitos)`);
        return numeroFinal;
      }
    }
    
    console.log('❌ No se encontró número interno ni por texto ni por posición');
    return null;
  };

  // Función para extraer número de orden del texto (método original)
  const extractOrderNumber = (text: string) => {
    if (!text || text.trim().length === 0) {
      return null;
    }

    // Normalizar el texto: eliminar espacios múltiples y normalizar caracteres especiales
    const normalizedText = text
      .replace(/\s+/g, ' ')
      .replace(/[°º]/g, '°')
      .trim();

    console.log('🔍 Buscando número de orden en texto normalizado:', normalizedText.substring(0, 500));

    // Función auxiliar para verificar si un número está cerca de palabras que NO son número interno
    const esNumeroInvalido = (texto: string, posicion: number, numero: string): boolean => {
      // Buscar contexto alrededor del número (80 caracteres antes y después)
      const inicio = Math.max(0, posicion - 80);
      const fin = Math.min(texto.length, posicion + numero.length + 80);
      const contexto = texto.substring(inicio, fin).toLowerCase();
      
      // Palabras clave que indican que NO es el número interno (son otros números)
      const palabrasInvalidas = [
        'seguimiento',
        'tracking',
        'envio',
        'envío',
        'codigo de tracking',
        'código de tracking',
        'codigo de envio',
        'código de envío',
        'numero de seguimiento',
        'número de seguimiento',
        'rastreo',
        'guia',
        'guía',
        'codigo postal',
        'código postal',
        'cp ',
        'postal',
        'codigo post',
        'código post',
        'direccion',
        'dirección',
        'calle',
        'numero de calle',
        'número de calle',
        'altura',
        'piso',
        'dni',
        'cuit',
        'telefono',
        'teléfono',
        'celular',
        'whatsapp',
        'precio',
        'total',
        'subtotal',
        'descuento',
        'cantidad',
        'unidad',
        'kg',
        'litro',
        'metro',
        'fecha',
        'hora',
        'dia',
        'día',
        'mes',
        'año',
        'año'
      ];
      
      return palabrasInvalidas.some(palabra => contexto.includes(palabra));
    };

    // SOLO buscar patrones específicos con "N° Interno" seguido de "#" y número
    // CRÍTICO: Debe tener "#" después de "Interno" para diferenciarlo de "N° de seguimiento"
    const patronesInterno = [
      // Patrón MÁS ESPECÍFICO: "N° Interno: #471" - DEBE tener el "#" después de Interno
      /N°\s*Interno\s*:?\s*#\s*(\d{3,})/gi,
      /N\s*°\s*Interno\s*:?\s*#\s*(\d{3,})/gi,
      // Variación con espacio: "N ° Interno #471"
      /N\s+Interno\s*:?\s*#\s*(\d{3,})/gi,
      // Solo "Interno:" seguido de "#" y número (OBLIGATORIO el #)
      /Interno\s*:?\s*#\s*(\d{3,})/gi,
      // "Interno" seguido de "#" sin dos puntos
      /Interno\s+#\s*(\d{3,})/gi,
      // "Número Interno" o "Numero Interno" seguido de "#"
      /Número\s+Interno\s*:?\s*#\s*(\d{3,})/gi,
      /Numero\s+Interno\s*:?\s*#\s*(\d{3,})/gi,
      // Patrón flexible pero que DEBE tener "#" después de "Interno"
      /Interno[^\d#]*#\s*(\d{3,})/gi,
    ];
    
    // Buscar TODOS los matches de "Interno" primero para verificar contexto
    for (const pattern of patronesInterno) {
      const matches = Array.from(normalizedText.matchAll(pattern));
      for (const match of matches) {
        if (match[1]) {
          const number = match[1].trim();
          // Aceptar números de 3 o más dígitos (como 471, 478, etc.)
          if (number.length >= 3) {
            const posicion = match.index || 0;
            // Verificar que NO sea un número inválido (código postal, seguimiento, etc.)
            if (!esNumeroInvalido(normalizedText, posicion, number)) {
              // Aceptar números de 3, 4 o 5 dígitos completos (sin truncar)
              // El número puede tener 3, 4 o 5 dígitos según el formato del PDF
              const numeroFinal = number; // Usar el número completo sin truncar
              console.log(`✅ Número INTERNO encontrado con patrón específico: "${match[0]}" -> ${numeroFinal} (${numeroFinal.length} dígitos)`);
              console.log(`   Contexto completo: "${normalizedText.substring(Math.max(0, posicion - 100), Math.min(normalizedText.length, posicion + match[0].length + 100))}"`);
              return numeroFinal;
            } else {
              console.log(`⚠️ Número descartado (contexto inválido): "${match[0]}"`);
              console.log(`   Contexto: "${normalizedText.substring(Math.max(0, posicion - 50), Math.min(normalizedText.length, posicion + match[0].length + 50))}"`);
            }
          }
        }
      }
    }
    
    // Si no se encontró con los patrones específicos, NO usar fallbacks genéricos
    // Es mejor devolver null que capturar un número incorrecto
    console.log('❌ No se encontró el patrón "N° Interno" en el PDF. Verifica que el PDF contenga "N° Interno: #XXX"');
    console.log(`   Texto completo extraído (primeros 1000 caracteres): ${normalizedText.substring(0, 1000)}`);
    return null;
  };

  // Función helper para agregar logs al panel de debug
  const addDebugLog = (message: string, type: DebugLogType = 'info') => {
    const timestamp = Date.now();
    setDebugLogs(prev => [...prev, { timestamp, message, type }]);
    // También mantener en consola para debugging completo
    const consoleMethod = type === 'error' ? console.error : type === 'warning' ? console.warn : console.log;
    consoleMethod(`[${type.toUpperCase()}]`, message);
  };

  const generatePDFs = async () => {
    // Limpiar logs anteriores
    setDebugLogs([]);
    setShowDebugPanel(true);
    
    // Usar múltiples métodos de logging para asegurar que se vean
    const log = (...args: any[]) => {
      // Convertir todos los argumentos a string de forma más legible
      const messageParts = args.map(arg => {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        if (typeof arg === 'object') {
          try {
            // Si es un array, mostrar de forma más compacta
            if (Array.isArray(arg)) {
              if (arg.length === 0) return '[]';
              // Si el array tiene objetos complejos, usar JSON
              if (arg.length > 0 && typeof arg[0] === 'object') {
                return JSON.stringify(arg, null, 2);
              }
              // Si son strings simples, mostrar como lista
              return `[${arg.map(item => `"${item}"`).join(', ')}]`;
            }
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      });
      
      const message = messageParts.join(' ');
      
      // Determinar tipo de log basado en el contenido
      let logType: DebugLogType = 'info';
      if (message.includes('❌') || message.includes('ERROR') || message.includes('Error')) {
        logType = 'error';
      } else if (message.includes('⚠️') || message.includes('WARNING') || message.includes('Warning')) {
        logType = 'warning';
      } else if (message.includes('✅') || message.includes('SUCCESS') || message.includes('Success')) {
        logType = 'success';
      }
      
      // Agregar al panel de debug
      addDebugLog(message, logType);
      
      // También mantener logs en consola
      console.log(...args);
      if (logType === 'error') {
        console.error('LOG:', ...args);
      } else if (logType === 'warning') {
        console.warn('LOG:', ...args);
      }
    };
    
    log('🚀 ===== INICIANDO GENERACIÓN DE PDF =====');
    
    // También imprimir directamente en el DOM
    // COMENTADO: Debug visual deshabilitado para producción
    // const debugDiv = document.createElement('div');
    // debugDiv.style.cssText = 'position:fixed;top:10px;right:10px;background:red;color:white;padding:20px;z-index:9999;font-size:14px;max-width:300px;';
    // debugDiv.id = 'pdf-debug-info';
    // document.body.appendChild(debugDiv);
    
    const updateDebug = (text: string) => {
      // COMENTADO: Debug visual deshabilitado para producción
      // const div = document.getElementById('pdf-debug-info');
      // if (div) {
      //   div.innerHTML += '<br>' + text;
      // }
    };
    
    // updateDebug('Función iniciada');
    
    log('📋 Estado inicial:', {
      tienePDF: !!originalPdfDoc,
      tieneCSV: csvData.length > 0,
      filasCSV: csvData.length,
      columnasSeleccionadas: {
        sku: selectedColumn,
        orden: selectedOrderColumn,
        cantidad: selectedQuantityColumn
      },
      paginasPDF: pdfPagesData.length
    });
    
    // updateDebug(`CSV: ${csvData.length} filas, PDF: ${pdfPagesData.length} páginas`);

    if (!originalPdfDoc || csvData.length < 2) {
      log('❌ Faltan archivos necesarios');
      // updateDebug('ERROR: Faltan archivos');
      showMessage('error', 'Carga el CSV y el PDF antes de continuar');
      return;
    }

    // updateDebug('Archivos OK, procesando...');
    setProcessing(true);
    const headers = csvData[0];
    const rows = csvData.slice(1);

    // ✅ Verificar valores de configuración al inicio
    log('📐 CONFIGURACIÓN DE POSICIÓN:', {
      posX: posX,
      posY: posY,
      fontSize: fontSize
    });
    // updateDebug(`Config: X=${posX}px, Y=${posY}px, Tamaño=${fontSize}pt`);

    log('📊 Headers del CSV:', headers);
    log('📊 Columna SKU seleccionada:', selectedColumn, `("${headers[selectedColumn]}")`);
    log('📊 Columna ORDEN seleccionada:', selectedOrderColumn, `("${headers[selectedOrderColumn]}")`);
    log('📊 Columna CANTIDAD seleccionada:', selectedQuantityColumn, `("${headers[selectedQuantityColumn] || 'N/A'}")`);
    
    // updateDebug(`SKU col: ${selectedColumn}, ORDEN col: ${selectedOrderColumn}`);

    try {
      log('🔄 Iniciando generación de PDF combinado...');
      // updateDebug('Creando PDF documento...');

      const originalPages = originalPdfDoc.getPages();
      const finalPdfDoc = await PDFDocument.create();
      
      // Embed una fuente estándar para asegurar que el texto se renderice correctamente
      const helveticaFont = await finalPdfDoc.embedFont(StandardFonts.Helvetica);
      log('✅ Fuente Helvetica embebida correctamente');
      
      const copiedPages = await finalPdfDoc.copyPages(originalPdfDoc, 
        originalPages.map((_: any, index: number) => index)
      );
      
      // Agregar las páginas copiadas al documento final
      copiedPages.forEach((page: any) => finalPdfDoc.addPage(page));
      
      log(`✅ ${copiedPages.length} páginas copiadas al nuevo documento`);
      log(`📊 Páginas en finalPdfDoc después de agregar: ${finalPdfDoc.getPageCount()}`);
      log(`🔗 Usando referencias directas de copiedPages para dibujar texto`);

      // Array para almacenar stock despachado
      const stockDespachado: StockDespachado[] = [];
      const hoy = new Date().toISOString().split('T')[0];

      log(`📄 Procesando ${pdfPagesData.length} páginas del PDF...`);
      // updateDebug(`Procesando ${pdfPagesData.length} páginas...`);
      
      let paginasConTexto = 0;
      
      for (let i = 0; i < pdfPagesData.length; i++) {
        const pageData = pdfPagesData[i];
        const orderNumber = pageData.orderNumber;
        
        log(`\n📄 === PÁGINA ${i + 1}/${pdfPagesData.length} ===`);
        log(`   Número de orden del PDF: "${orderNumber}"`);
        // updateDebug(`Página ${i + 1}: Orden "${orderNumber}"`);
        
        if (!orderNumber) {
          log(`   ⚠️ Sin número de orden, saltando página`);
          continue;
        }

        // Log para debugging - SIEMPRE mostrar para primera página
        if (i === 0) {
          log(`🔍 Buscando orden "${orderNumber}" en columna ${selectedOrderColumn} ("${headers[selectedOrderColumn]}")`);
          log(`📊 Primeras 10 filas de esa columna:`, rows.slice(0, 10).map((r, idx) => `Fila ${idx + 1}: "${r[selectedOrderColumn]}"`));
          log(`📊 Valores únicos en columna ${selectedOrderColumn} (primeros 10):`, 
            [...new Set(rows.slice(0, 20).map(r => r[selectedOrderColumn]).filter(Boolean))].slice(0, 10)
          );
        }
        
        const matchingRows = rows.filter((row, rowIdx) => {
          const rowOrderNumber = row[selectedOrderColumn];
          if (!rowOrderNumber) {
            if (i === 0 && rowIdx < 5) {
              log(`   Fila ${rowIdx + 1}: valor vacío en columna ${selectedOrderColumn}`);
            }
            return false;
          }
          
          // Normalizar el número de orden del CSV: quitar "#", espacios y cualquier carácter no numérico al inicio
          let rowOrderNormalized = String(rowOrderNumber).trim();
          // Quitar "#" si está al inicio
          rowOrderNormalized = rowOrderNormalized.replace(/^#\s*/, '').trim();
          // Extraer solo los números (por si hay texto adicional)
          const rowOrderNumbers = rowOrderNormalized.match(/\d+/);
          const csvOrderClean = rowOrderNumbers ? rowOrderNumbers[0] : rowOrderNormalized;
          
          // Normalizar el número de orden del PDF (solo números)
          const pdfOrderNormalized = orderNumber.trim();
          const pdfOrderNumbers = pdfOrderNormalized.match(/\d+/);
          const pdfOrderClean = pdfOrderNumbers ? pdfOrderNumbers[0] : pdfOrderNormalized;
          
          // Comparar los números limpios
          const match = csvOrderClean === pdfOrderClean;
          
          // Log detallado para TODAS las filas de la primera página
          if (i === 0) {
            log(`   Fila ${rowIdx + 1}: CSV="${rowOrderNumber}" -> "${csvOrderClean}" vs PDF="${pdfOrderNormalized}" -> "${pdfOrderClean}" => ${match ? '✅ MATCH' : '❌ NO MATCH'}`);
          }
          
          return match;
        });

        if (matchingRows.length === 0) {
          log(`❌ No se encontraron filas para orden "${orderNumber}"`);
          const valoresUnicos = [...new Set(rows.slice(0, 20).map(r => r[selectedOrderColumn]).filter(Boolean))].slice(0, 10);
          log(`💡 Valores únicos en columna de orden (primeros 10):`, valoresUnicos);
          log(`💡 ¿Está buscando en la columna correcta? Verifica que "${headers[selectedOrderColumn]}" contenga los números de orden`);
          // updateDebug(`Página ${i + 1}: SIN MATCH para "${orderNumber}"`);
          continue;
        }
        
        log(`✅ Encontradas ${matchingRows.length} fila(s) para orden "${orderNumber}"`);
        // updateDebug(`Página ${i + 1}: ${matchingRows.length} fila(s) encontrada(s)`);

        // Procesar cada fila y separar productos que vengan unidos con " + "
        const allProducts: string[] = [];
        
        // 🔍 DEBUG: Log de configuración de columnas
        log(`🔍 [DEBUG SKU] Configuración de columnas para orden ${orderNumber}:`);
        log(`   - Columna SKU seleccionada: índice ${selectedColumn} ("${headers[selectedColumn]}")`);
        log(`   - Columna Quantity seleccionada: índice ${selectedQuantityColumn} ("${headers[selectedQuantityColumn] || 'N/A'}")`);
        log(`   - Total filas encontradas: ${matchingRows.length}`);
        
        matchingRows.forEach((row, matchIdx) => {
          // 🔍 DEBUG: Leer valores directamente del CSV
          const skuRaw = row[selectedColumn] || '';
          const quantityRaw = row[selectedQuantityColumn] || '';
          
          log(`\n🔍 [DEBUG SKU] === PROCESANDO FILA ${matchIdx + 1}/${matchingRows.length} ===`);
          log(`   📋 Valores RAW del CSV:`);
          log(`      - SKU (columna ${selectedColumn}): "${skuRaw}" (tipo: ${typeof skuRaw}, longitud: ${skuRaw.length})`);
          log(`      - Quantity (columna ${selectedQuantityColumn}): "${quantityRaw}" (tipo: ${typeof quantityRaw}, longitud: ${quantityRaw.length})`);
          log(`   📋 Fila completa (primeras 5 columnas):`, row.slice(0, 5));
          
          // Normalizar valores
          const sku = skuRaw.trim();
          const quantity = quantityRaw.trim();
          
          log(`   📦 Valores normalizados: SKU="${sku}", Quantity="${quantity}"`);
          
          if (sku !== '') {
            // Separar SKUs que contengan " + " (productos múltiples en un solo SKU)
            const skuParts = sku.split('+').map(part => part.trim());
            log(`   🔄 SKU dividido en ${skuParts.length} parte(s):`, skuParts);
            
            skuParts.forEach((skuPart, partIdx) => {
              if (skuPart) {
                log(`   🔍 [DEBUG SKU] Procesando parte ${partIdx + 1}/${skuParts.length}: "${skuPart}"`);
                
                const {
                  skuLimpio,
                  multiplicadorDesdeTexto
                } = parsearSkuConCantidad(skuPart);
                
                log(`   ✅ Resultado del parseo:`);
                log(`      - skuLimpio: "${skuLimpio}"`);
                log(`      - multiplicadorDesdeTexto: ${multiplicadorDesdeTexto}`);

                const cantidadCsv = parseInt(quantity) || 1;
                const cantidadReal = cantidadCsv * multiplicadorDesdeTexto;
                
                log(`   🧮 Cálculo de cantidad:`);
                log(`      - quantity del CSV (parseado): ${cantidadCsv}`);
                log(`      - multiplicadorDesdeTexto: ${multiplicadorDesdeTexto}`);
                log(`      - cantidadReal (cantidadCsv * multiplicador): ${cantidadReal}`);

                // Texto para imprimir en el PDF (mostrar siempre la cantidad real)
                const productText = normalizarTextoWinAnsi(
                  `${skuLimpio} (x${cantidadReal})`
                );
                
                log(`   📝 Texto final generado para PDF: "${productText}"`);
                log(`   ✅ Agregando producto a allProducts`);
                
                allProducts.push(productText);

                // Registrar para stock despachado con la cantidad real
                stockDespachado.push({
                  user_id: userId,
                  username,
                  sku: skuLimpio,
                  nombreproducto: skuLimpio,
                  cantidad: cantidadReal,
                  numeropedido: orderNumber || '',
                  fechadespacho: hoy,
                  archivorotulo: csvFileName || 'documento',
                });
                
                log(`   💾 Registrado en stockDespachado: SKU="${skuLimpio}", cantidad=${cantidadReal}`);
              } else {
                log(`   ⚠️ Parte ${partIdx + 1} está vacía, saltando...`);
              }
            });
          } else {
            log(`   ⚠️ SKU está vacío, saltando esta fila`);
          }
        });
        
        log(`\n🔍 [DEBUG SKU] === RESUMEN PARA ORDEN ${orderNumber} ===`);
        log(`   📊 Total productos en allProducts: ${allProducts.length}`);
        log(`   📋 Lista completa de productos:`, allProducts);

        if (allProducts.length === 0) {
          log(`⚠️ No hay productos para orden ${orderNumber}`);
          // updateDebug(`Página ${i + 1}: Sin productos`);
          continue;
        }

        log(`✅ Total productos para orden ${orderNumber}: ${allProducts.length}`);
        log(`📋 Productos extraídos:`, allProducts);
        // updateDebug(`Página ${i + 1}: ${allProducts.length} productos`);

        const pageIndex = pageData.pageNumber - 1;
        log(`🔍 Verificando página: pageNumber=${pageData.pageNumber}, pageIndex=${pageIndex}, copiedPages=${copiedPages.length}`);
        
        // ✅ USAR LA REFERENCIA DIRECTA DE copiedPages - Esta es la página EN finalPdfDoc
        if (pageIndex < 0 || pageIndex >= copiedPages.length) {
          log(`⚠️ Índice de página ${pageIndex} fuera de rango (copiedPages: ${copiedPages.length})`);
          // updateDebug(`Página ${i + 1}: ERROR - índice fuera de rango`);
          continue;
        }
        
        // ✅ OBTENER LA PÁGINA DIRECTAMENTE DE copiedPages - Esta es la página correcta en finalPdfDoc
        const page = copiedPages[pageIndex];
        log(`📖 Página obtenida directamente de copiedPages[${pageIndex}]: ${page ? 'OK' : 'ERROR'}`);
        
        if (!page) {
          log(`❌ ERROR: No se pudo obtener la página ${pageIndex} de copiedPages`);
          // updateDebug(`Página ${i + 1}: ERROR - no se puede obtener de copiedPages`);
          continue;
        }
        
        // Verificar que la página está en el documento final
        const pageInDoc = finalPdfDoc.getPage(pageIndex);
        if (!pageInDoc) {
          log(`❌ ERROR: La página ${pageIndex} no existe en finalPdfDoc`);
          continue;
        }
        log(`✅ Verificado: página ${pageIndex} existe tanto en copiedPages como en finalPdfDoc`);
        
        const { width, height } = page.getSize();
        log(`📄 Página ${pageData.pageNumber} (índice ${pageIndex}): ${width}x${height}`);
        log(`📏 Dimensiones página: ancho=${width}, alto=${height}`);
        
        // ✅ NUEVO: Dibujar cada producto individualmente, máximo 2 por fila
        // Si el primer producto es muy largo (>70 caracteres), el segundo va abajo directamente
        log(`\n🔍 [DEBUG SKU] === CONFIGURANDO DISPOSICIÓN DE PRODUCTOS ===`);
        log(`   📊 Total productos a dibujar: ${allProducts.length}`);
        log(`   📋 Productos:`, allProducts);
        
        if (allProducts.length === 0) {
          log(`⚠️ No hay productos para dibujar en orden ${orderNumber}`);
          continue;
        }
        
        // ✅ IMPORTANTE: La configuración de formato (posX, posY, fontSize, fuente) se aplica
        // SIEMPRE igual, sin importar qué columna del CSV se haya seleccionado para insertar.
        // La columna seleccionada (selectedColumn) solo determina QUÉ DATOS se insertan,
        // pero CÓMO se insertan (posición, tamaño, fuente) es siempre la misma configuración.
        
        // ✅ Usar siempre el tamaño de fuente seleccionado por el usuario
        const finalFontSize = fontSize;
        
        // Espaciado entre líneas (vertical)
        const lineSpacing = 8; // Espacio vertical entre filas
        const maxCharsForSideBySide = 70; // Si un producto tiene más caracteres, el siguiente va abajo SIEMPRE
        
        // Función auxiliar para calcular el ancho aproximado del texto en puntos
        // Aproximación: en Helvetica, cada carácter ocupa aproximadamente 0.6 * fontSize puntos
        const calcularAnchoTexto = (texto: string, fontSize: number): number => {
          return texto.length * fontSize * 0.6;
        };
        
        log(`✅ Orden ${orderNumber}: ${allProducts.length} productos a dibujar`);
        log(`🔤 Tamaño de fuente (configurado): ${finalFontSize}pt`);
        log(`📍 Posición base configurada: X=${posX}, Y=${posY}`);
        log(`📏 Espaciado vertical: ${lineSpacing}px`);
        log(`📏 Límite de caracteres para lado a lado: ${maxCharsForSideBySide} (si un producto tiene más, el siguiente va abajo SIEMPRE)`);
        
        // Validar que tenemos todo lo necesario
        if (!helveticaFont) {
          log(`❌ ERROR CRÍTICO: helveticaFont no está disponible!`);
          continue;
        }
        
        let productosDibujados = 0;
        
        // Array para rastrear la posición de cada producto (fila, columna, xPosition)
        const posicionesProductos: Array<{fila: number, columna: number, xPosition: number}> = [];
        
        log(`🎨 INICIANDO BUCLE DE DIBUJADO - Total productos: ${allProducts.length}`);
        log(`🎨 Verificando: allProducts.length=${allProducts.length}, pageIndex=${pageIndex}, helveticaFont=${helveticaFont ? 'existe' : 'NO EXISTE'}`);
        
        // Primero, calcular las posiciones de todos los productos
        for (let productIndex = 0; productIndex < allProducts.length; productIndex++) {
          const productText = allProducts[productIndex];
          const productTextNormalizado = normalizarTextoWinAnsi(productText);
          const productLength = productTextNormalizado.length;
          
          let fila = 0;
          let columna = 0;
          let xPosition = posX;
          
          if (productIndex === 0) {
            // Primer producto siempre va en la primera columna
            fila = 0;
            columna = 0;
            xPosition = posX;
          } else {
            // Obtener posición del producto anterior
            const posicionAnterior = posicionesProductos[productIndex - 1];
            const productoAnterior = allProducts[productIndex - 1];
            const productoAnteriorNormalizado = normalizarTextoWinAnsi(productoAnterior);
            const longitudAnterior = productoAnteriorNormalizado.length;
            
            // ✅ REGLA PRINCIPAL: Si el producto anterior tiene más de 70 caracteres, 
            // el siguiente va abajo SIEMPRE (no al lado)
            if (longitudAnterior > maxCharsForSideBySide) {
              // El producto anterior era muy largo, este va abajo
              fila = posicionAnterior.fila + 1;
              columna = 0;
              xPosition = posX;
              log(`   ⬇️ Producto ${productIndex}: Anterior tiene ${longitudAnterior} caracteres (>${maxCharsForSideBySide}), va abajo`);
            } else if (posicionAnterior.columna === 0) {
              // El anterior estaba en columna 0 y no era muy largo
              // Calcular el ancho del texto anterior
              const anchoAnterior = calcularAnchoTexto(productoAnteriorNormalizado, finalFontSize);
              // Posición X del segundo producto: después del primero con un pequeño margen
              const nuevaX = posicionAnterior.xPosition + anchoAnterior + 10; // 10px de margen
              
              // Verificar si cabe en la página
              if (nuevaX + calcularAnchoTexto(productTextNormalizado, finalFontSize) <= width - 20) {
                // Cabe al lado
                fila = posicionAnterior.fila;
                columna = 1;
                xPosition = nuevaX;
                log(`   ➡️ Producto ${productIndex}: Anterior tiene ${longitudAnterior} caracteres (<=${maxCharsForSideBySide}), va al lado en X=${xPosition}`);
              } else {
                // No cabe, va abajo
                fila = posicionAnterior.fila + 1;
                columna = 0;
                xPosition = posX;
                log(`   ⬇️ Producto ${productIndex}: Anterior no muy largo pero no cabe al lado, va abajo`);
              }
            } else {
              // El anterior estaba en columna 1, este va abajo
              fila = posicionAnterior.fila + 1;
              columna = 0;
              xPosition = posX;
              log(`   ⬇️ Producto ${productIndex}: Anterior estaba en columna 1, va abajo`);
            }
          }
          
          posicionesProductos.push({ fila, columna, xPosition });
        }
        
        // Dibujar cada producto individualmente usando las posiciones calculadas
        for (let productIndex = 0; productIndex < allProducts.length; productIndex++) {
          const productText = allProducts[productIndex];
          log(`\n🔍 [DEBUG SKU] === DIBUJANDO PRODUCTO ${productIndex + 1}/${allProducts.length} ===`);
          log(`🔄 [ITERACIÓN ${productIndex}] Procesando producto ${productIndex + 1}/${allProducts.length}: "${productText}"`);
          
          // Normalizar el texto antes de calcular longitud
          const productTextNormalizado = normalizarTextoWinAnsi(productText);
          const productLength = productTextNormalizado.length;
          
          log(`   📏 Longitud del producto: ${productLength} caracteres`);
          
          // Obtener posición calculada
          const posicion = posicionesProductos[productIndex];
          const currentFila = posicion.fila;
          const columna = posicion.columna;
          const xPosition = posicion.xPosition;
          
          // Calcular posición Y: posY base - offset vertical según fila (en PDF, menor Y = más abajo)
          const yPosition = posY - (currentFila * lineSpacing);
          
          log(`   📍 Posición calculada: fila ${currentFila}, columna ${columna}, X=${xPosition}`);
          
          if (productIndex > 0) {
            const productoAnterior = allProducts[productIndex - 1];
            const productoAnteriorNormalizado = normalizarTextoWinAnsi(productoAnterior);
            const longitudAnterior = productoAnteriorNormalizado.length;
            log(`   🔍 Producto anterior: "${productoAnteriorNormalizado.substring(0, 50)}..." (${longitudAnterior} caracteres)`);
            
            if (longitudAnterior > maxCharsForSideBySide) {
              log(`   ⬇️ Producto anterior muy largo (${longitudAnterior} > ${maxCharsForSideBySide}), este va abajo`);
            } else if (columna === 1) {
              log(`   ➡️ Producto anterior no muy largo y en columna 0, este va en columna 1`);
            } else {
              log(`   ⬇️ Producto anterior en columna 1, este va abajo`);
            }
          }
          
          log(`   🔍 Cálculo de posición final:`);
          log(`      - Producto índice: ${productIndex}`);
          log(`      - Fila: ${currentFila}`);
          log(`      - Columna: ${columna} (0=izquierda, 1=derecha)`);
          log(`      - X: ${xPosition} (calculado basado en ancho del texto anterior)`);
          log(`      - Y: ${posY} - (${currentFila} * ${lineSpacing}) = ${yPosition}`);
          
          // Verificar que el producto no esté vacío
          if (!productTextNormalizado || !productTextNormalizado.trim()) {
            log(`   ⚠️ Producto ${productIndex + 1} está vacío después de normalizar, saltando...`);
            continue;
          }
          
          // Verificar si está fuera de rango (solo advertir, pero usar las coordenadas de todas formas)
          const isOutOfBounds = yPosition < 0 || yPosition > height || xPosition < 0 || xPosition > width;
          
          if (isOutOfBounds) {
            log(`⚠️ ADVERTENCIA: Coordenadas están fuera del rango de la página: X=${xPosition}, Y=${yPosition} (página: ${width}x${height})`);
            log(`   ℹ️ Usando coordenadas de todas formas: X=${xPosition}, Y=${yPosition}`);
          } else {
            log(`✅ Coordenadas dentro de rango: X=${xPosition}, Y=${yPosition}`);
          }
          
          log(`✏️ Dibujando producto ${productIndex + 1} en posición (${xPosition}, ${yPosition}): "${productTextNormalizado}"`);
          log(`   Coordenadas: X=${xPosition}, Y=${yPosition}, Tamaño=${finalFontSize}pt, Página=${width}x${height}`);
          
          try {
            // ✅ USAR LA REFERENCIA DIRECTA DE LA PÁGINA COPIADA - Esta es la página correcta
            const targetPage = copiedPages[pageIndex];
            log(`   📄 Usando página copiada directamente copiedPages[${pageIndex}]: ${targetPage ? 'OK' : 'ERROR'}`);
            
            if (!targetPage) {
              log(`   ❌ ERROR: No se pudo obtener la página ${pageIndex} de copiedPages para dibujar`);
              continue;
            }
            
            // Verificar que esta página está realmente en finalPdfDoc
            const pageInDoc = finalPdfDoc.getPage(pageIndex);
            if (!pageInDoc) {
              log(`   ❌ ERROR: La página ${pageIndex} no está en finalPdfDoc`);
              continue;
            }
            log(`   ✅ Confirmado: página ${pageIndex} está en finalPdfDoc`);
            
            // 🔍 DEBUG: Log detallado antes de dibujar
            log(`\n🔍 [DEBUG SKU] === ANTES DE DIBUJAR EN PDF ===`);
            log(`   📄 Página: ${pageIndex + 1} (índice ${pageIndex})`);
            log(`   📝 Texto completo a dibujar: "${productTextNormalizado}"`);
            log(`   📏 Longitud del texto: ${productTextNormalizado.length} caracteres`);
            log(`   📍 Coordenadas: X=${xPosition}, Y=${yPosition}`);
            log(`   🔤 Fuente: Helvetica, Tamaño: ${finalFontSize}pt`);
            log(`   🎨 Color: negro (rgb(0, 0, 0))`);
            log(`   ✅ targetPage existe: ${!!targetPage}`);
            log(`   ✅ helveticaFont existe: ${!!helveticaFont}`);
            
            // ✅ DIBUJAR EN LA PÁGINA COPIADA - Esta es la página que está en finalPdfDoc
            try {
              targetPage.drawText(productTextNormalizado, {
                x: xPosition,
                y: yPosition,
                size: finalFontSize,
                font: helveticaFont,
                color: rgb(0, 0, 0),
              });
              
              // 🔍 DEBUG: Log después de dibujar
              log(`\n🔍 [DEBUG SKU] === DESPUÉS DE DIBUJAR EN PDF ===`);
              log(`   ✅ drawText ejecutado sin errores`);
              log(`   📝 Texto dibujado: "${productTextNormalizado}"`);
              log(`   📍 Posición: X=${xPosition}, Y=${yPosition}`);
            } catch (drawTextError: any) {
              log(`\n❌ [DEBUG SKU] === ERROR AL DIBUJAR ===`);
              log(`   ❌ Error en drawText:`, drawTextError);
              log(`   📝 Texto que intentó dibujar: "${productTextNormalizado}"`);
              log(`   📍 Coordenadas: X=${xPosition}, Y=${yPosition}`);
              log(`   🔤 Fuente: ${helveticaFont ? 'existe' : 'NO EXISTE'}`);
              throw drawTextError;
            }
            
            productosDibujados++;
            log(`✅ Producto ${productIndex + 1} dibujado exitosamente en página ${pageIndex + 1} con fuente Helvetica`);
            log(`   📊 Progreso: ${productIndex + 1}/${allProducts.length} productos procesados, ${productosDibujados} dibujados`);
            
            // Añadir un pequeño delay para asegurar que el proceso no se bloquea
            await new Promise(resolve => setTimeout(resolve, 10));
            
          } catch (drawError: any) {
            log(`❌ Error al dibujar producto ${productIndex + 1}:`, drawError);
            log(`   Error detalle:`, drawError?.message, drawError?.stack);
          }
        }
        
        log(`🏁 FIN DEL BUCLE DE DIBUJADO - Productos dibujados: ${productosDibujados}/${allProducts.length}`);
        
        if (productosDibujados > 0) {
          paginasConTexto++;
          log(`✅ Página ${pageData.pageNumber}: ${productosDibujados} producto(s) dibujado(s) exitosamente`);
        } else {
          log(`⚠️ Página ${pageData.pageNumber}: No se dibujaron productos`);
        }
        
        log(`🔄 Continuando con siguiente página... (${i + 1}/${pdfPagesData.length})`);
      }
      
      log(`✅ TODAS LAS PÁGINAS PROCESADAS: ${paginasConTexto} páginas con texto de ${pdfPagesData.length} totales`);
      // updateDebug(`✅ Procesamiento completo: ${paginasConTexto} páginas con texto`);

      // Agregar página de resumen al final
      const summaryPage = finalPdfDoc.addPage([595, 842]); // A4 size
      const { width, height } = summaryPage.getSize();
      
      // Título del resumen (normalizado) - Valores hardcodeados (no usa configuración)
      summaryPage.drawText(normalizarTextoWinAnsi('RESUMEN DE PRODUCTOS DESPACHADOS'), {
        x: 50,
        y: height - 50,
        size: 16,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      
      // Información general
      const fechaActual = new Date().toLocaleDateString('es-ES');
      summaryPage.drawText(normalizarTextoWinAnsi(`Fecha: ${fechaActual}`), {
        x: 50,
        y: height - 80,
        size: 12,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      
      summaryPage.drawText(normalizarTextoWinAnsi(`Total de productos unicos: ${stockDespachado.length}`), {
        x: 50,
        y: height - 100,
        size: 12,
        font: helveticaFont,
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
      
      // Dibujar tabla de resumen - Valores hardcodeados (no usa configuración)
      let yPosition = height - 140;
      const lineHeight = 20;
      
      // Encabezados de la tabla (normalizados)
      summaryPage.drawText(normalizarTextoWinAnsi('SKU'), {
        x: 50,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      
      summaryPage.drawText(normalizarTextoWinAnsi('Cantidad Total'), {
        x: 300,
        y: yPosition,
        size: 10,
        font: helveticaFont,
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
      let currentSummaryPage = summaryPage; // Mantener referencia a la página actual
      sortedSkus.forEach(([sku, cantidad]) => {
        if (yPosition < 100) {
          // Si no hay espacio, crear nueva página
          currentSummaryPage = finalPdfDoc.addPage([595, 842]);
          yPosition = currentSummaryPage.getSize().height - 50;
        }
        
        // SKU (normalizado para WinAnsi)
        const skuNormalizado = normalizarTextoWinAnsi(sku);
        currentSummaryPage.drawText(skuNormalizado, {
          x: 50,
          y: yPosition,
          size: 9,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        
        // Cantidad
        currentSummaryPage.drawText(cantidad.toString(), {
          x: 300,
          y: yPosition,
          size: 9,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        
        yPosition -= lineHeight;
      });
      
      // Pie de página - Valores hardcodeados (no usa configuración)
      const finalY = Math.max(yPosition - 20, 50);
      const usernameNormalizado = normalizarTextoWinAnsi(username || 'Usuario');
      currentSummaryPage.drawText(normalizarTextoWinAnsi(`Generado por: ${usernameNormalizado}`), {
        x: 50,
        y: finalY,
        size: 8,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      const nombreArchivoNormalizado = normalizarTextoWinAnsi(csvFileName || 'documento');
      currentSummaryPage.drawText(normalizarTextoWinAnsi(`Archivo fuente: ${nombreArchivoNormalizado}`), {
        x: 50,
        y: finalY - 15,
        size: 8,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });

      log(`💾 INICIANDO GUARDADO DE PDF...`);
      log(`📊 Resumen antes de guardar: ${finalPdfDoc.getPageCount()} páginas totales, ${paginasConTexto} con texto`);
      
      // ✅ VERIFICACIÓN CRÍTICA: Asegurar que las modificaciones están en finalPdfDoc
      log(`🔍 VERIFICANDO PÁGINAS ANTES DE GUARDAR:`);
      log(`   - Páginas en finalPdfDoc: ${finalPdfDoc.getPageCount()}`);
      log(`   - Páginas copiadas: ${copiedPages.length}`);
      log(`   - Páginas con texto: ${paginasConTexto}`);
      
      // Verificar que podemos obtener las páginas modificadas
      for (let i = 0; i < Math.min(3, finalPdfDoc.getPageCount()); i++) {
        try {
          const testPage = finalPdfDoc.getPage(i);
          const size = testPage.getSize();
          log(`   - Página ${i}: ${size.width}x${size.height} ✅`);
        } catch (err: any) {
          log(`   - Página ${i}: ERROR - ${err?.message || err}`);
        }
      }
      
      // updateDebug(`Guardando PDF (${paginasConTexto} páginas con texto)...`);
      
      // Forzar actualización antes de guardar
      log(`🔄 Forzando actualización del documento antes de guardar...`);
      // updateDebug(`Convirtiendo a bytes...`);
      
      let pdfBytes: Uint8Array;
      try {
        pdfBytes = await finalPdfDoc.save();
        log(`💾 PDF guardado, tamaño: ${pdfBytes.length} bytes`);
        // updateDebug(`PDF guardado: ${Math.round(pdfBytes.length / 1024)} KB`);
        
        // Verificar que el PDF tiene el tamaño esperado
        if (pdfBytes.length < 1000) {
          log(`⚠️ ADVERTENCIA: PDF muy pequeño (${pdfBytes.length} bytes), podría estar vacío`);
        }
      } catch (saveError: any) {
        log(`❌ ERROR al guardar PDF: ${saveError?.message || saveError}`);
        // updateDebug(`ERROR guardando: ${saveError?.message || 'Error desconocido'}`);
        throw saveError;
      }
      
      log(`📦 Creando blob...`);
      // updateDebug(`Creando blob...`);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      log(`🔗 Creando URL del objeto...`);
      // updateDebug(`Preparando descarga...`);
      const url = URL.createObjectURL(blob);
      
      log(`⬇️ Iniciando descarga...`);
      // updateDebug(`Descargando...`);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'documentos_combinados.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      log(`✅ PDF DESCARGADO EXITOSAMENTE`);
      // updateDebug(`✅ PDF descargado correctamente`);
      
      // updateDebug(`✅ PDF descargado (${paginasConTexto} páginas con texto)`);
      log(`✅ PDF generado y descargado exitosamente. ${paginasConTexto} páginas tuvieron texto insertado.`);
      
      // Mantener el div de debug por más tiempo para ver el resultado final
      // COMENTADO: Debug visual deshabilitado para producción
      // setTimeout(() => {
      //   const div = document.getElementById('pdf-debug-info');
      //   if (div) div.remove();
      // }, 10000);

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
        
        // Registrar log de SKU agregados en rótulos
        if (userId && stockDespachado.length > 0) {
          // Contar SKU únicos
          const skuUnicos = new Set(stockDespachado.map(item => item.sku));
          const totalCantidad = stockDespachado.reduce((sum, item) => sum + item.cantidad, 0);
          
          await registrarActividad(
            userId,
            username,
            'sku_rotulo_agregado',
            skuUnicos.size, // Cantidad de SKU únicos
            nombreArchivo,
            {
              sku_unicos: skuUnicos.size,
              total_cantidad_items: totalCantidad,
              total_registros: stockDespachado.length,
              seccion: 'pdf_generator',
            }
          );
        }
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

      if (stockDespachado.length > 0) {
        if (canManageStock) {
          try {
            console.log(`Guardando ${stockDespachado.length} items de stock despachado en Supabase...`);
            await guardarStockDespachado(stockDespachado);
            console.log(`✅ Stock despachado guardado: ${stockDespachado.length} items`);
          } catch (stockError) {
            console.error('Error al guardar stock despachado:', stockError);
            // No interrumpir el flujo si falla
          }

          const stockSummaryMap = new Map<string, number>();
          stockDespachado.forEach(item => {
            const current = stockSummaryMap.get(item.sku) || 0;
            stockSummaryMap.set(item.sku, current + item.cantidad);
          });

          const stockArray = Array.from(stockSummaryMap.entries()).map(([sku, cantidad]) => ({
            sku,
            cantidad
          }));

          if (stockArray.length > 0) {
            if (!userId) {
              console.warn('⚠️ No se pudo preparar el modal de stock: userId no disponible');
            } else {
              let mapaEquivalencias = new Map<string, number>();
              try {
                const stockUsuario = await obtenerStock(userId);
                mapaEquivalencias = new Map(
                  stockUsuario.map(item => [crearClaveSku(item.sku), item.equivalencia ?? 1])
                );
              } catch (error) {
                console.error('Error obteniendo stock para equivalencias:', error);
              }

              const stockConEquivalencias = stockArray.map(item => {
                const claveSku = crearClaveSku(item.sku);
                const equivalencia = mapaEquivalencias.get(claveSku) ?? 1;
                const totalReal = item.cantidad * equivalencia;
                return { ...item, equivalencia, totalReal };
              });

              setStockParaDescontar(stockConEquivalencias);
              setShowDescontarStockModal(true);
            }
          }
        } else {
          console.log('ℹ️ Requiere plan Pro+ para descontar stock automáticamente.');
        }
      }
      
      const mensajeBase = `PDF generado con ${finalPdfDoc.getPageCount()} páginas (incluye resumen de productos)`;
      if (!canManageStock && stockDespachado.length > 0) {
        showMessage('success', `${mensajeBase}. Requiere pago (Plan Pro+) para descontar stock automáticamente.`);
      } else {
        showMessage('success', mensajeBase);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      log('❌ ERROR al generar PDF:', error);
      log('❌ Stack:', error instanceof Error ? error.stack : 'No disponible');
      // updateDebug(`ERROR: ${errorMessage}`);
      showMessage('error', `Error al generar el PDF: ${errorMessage}`);
      
      // Mantener el div de debug para ver el error
      // COMENTADO: Debug visual deshabilitado para producción
      // setTimeout(() => {
      //   const div = document.getElementById('pdf-debug-info');
      //   if (div) div.remove();
      // }, 15000);
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

  // Auto-scroll del panel de debug cuando se agregan nuevos logs
  useEffect(() => {
    if (showDebugPanel && debugLogs.length > 0) {
      const panel = document.getElementById('debug-panel-content');
      if (panel) {
        panel.scrollTop = panel.scrollHeight;
      }
    }
  }, [debugLogs, showDebugPanel]);

  // Cerrar panel de debug cuando termine el procesamiento
  useEffect(() => {
    if (!processing && showDebugPanel) {
      // Mantener el panel abierto por 5 segundos después de terminar para que el usuario pueda ver los logs
      const timer = setTimeout(() => {
        // No cerrar automáticamente, dejar que el usuario lo cierre manualmente
        // setShowDebugPanel(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [processing, showDebugPanel]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6 border-2 border-gray-200 dark:border-gray-700">
        {/* Header */}
        <header className="text-center mb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-green-500 size-10">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              PDF Generator
            </h1>
          </div>
          <p className="text-green-600 dark:text-green-400 font-medium text-sm sm:text-base">
            Generador de PDFs desde CSV
          </p>
        </header>

        {/* Mensaje de estado */}
        {message && (
          <div className={`p-4 rounded-lg border-2 ${
            message.type === 'success' ? 'bg-green-50 dark:bg-green-900/50 border-green-300 dark:border-green-500' :
            message.type === 'error' ? 'bg-red-50 dark:bg-red-900/50 border-red-300 dark:border-red-500' :
            'bg-blue-50 dark:bg-blue-900/50 border-blue-300 dark:border-blue-500'
          }`}>
            <p className={`font-medium ${
              message.type === 'success' ? 'text-green-700 dark:text-green-400' :
              message.type === 'error' ? 'text-red-700 dark:text-red-400' : 'text-blue-700 dark:text-blue-400'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Sección de carga de archivos */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload CSV */}
          <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500 transition-colors cursor-pointer"
               onClick={() => document.getElementById('csv-input')?.click()}>
            <div className="flex flex-col items-center justify-center space-y-3">
              <svg className="w-12 h-12 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 dark:text-white">Archivo CSV</h3>
                <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">Arrastra o haz clic para cargar tu CSV</p>
                {csvFileName && (
                  <p className="text-sm font-medium mt-2 text-green-600 dark:text-green-400">📄 {csvFileName}</p>
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
          <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500 transition-colors cursor-pointer"
               onClick={() => document.getElementById('pdf-input')?.click()}>
            <div className="flex flex-col items-center justify-center space-y-3">
              <svg className="w-12 h-12 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 dark:text-white">PDF Plantilla</h3>
                <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">Tu documento base donde se insertará el texto</p>
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
          <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-600">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Vista previa del CSV</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
                    Columna con el texto a insertar (SKU)
                  </label>
                  <select 
                    value={selectedColumn} 
                    onChange={(e) => setSelectedColumn(parseInt(e.target.value))}
                    className="w-full p-2 border-2 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500 focus:border-green-500 focus:outline-none">
                    {csvData[0].map((header, index) => (
                      <option key={index} value={index}>
                        {header || `Columna ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
                    Columna con el número de orden
                  </label>
                  <select 
                    value={selectedOrderColumn} 
                    onChange={(e) => setSelectedOrderColumn(parseInt(e.target.value))}
                    className="w-full p-2 border-2 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500 focus:border-green-500 focus:outline-none">
                    {csvData[0].map((header, index) => (
                      <option key={index} value={index}>
                        {header || `Columna ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
                    Columna con la cantidad
                  </label>
                  <select 
                    value={selectedQuantityColumn} 
                    onChange={(e) => setSelectedQuantityColumn(parseInt(e.target.value))}
                    className="w-full p-2 border-2 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500 focus:border-green-500 focus:outline-none">
                    {csvData[0].map((header, index) => (
                      <option key={index} value={index}>
                        {header || `Columna ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto border-2 border-gray-200 dark:border-gray-600 rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-200 dark:bg-gray-600">
                      {csvData[0].map((header, index) => (
                        <th 
                          key={index}
                          className={`p-3 text-left text-sm font-medium text-gray-900 dark:text-white ${
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
                      <tr key={rowIndex} className="border-b border-gray-200 dark:border-gray-600">
                        {row.map((cell, cellIndex) => (
                          <td 
                            key={cellIndex}
                            className={`p-3 text-sm text-gray-700 dark:text-gray-300 ${
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
              <div className="text-xs text-gray-600 dark:text-gray-400">
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
              className="w-full p-4 flex items-center justify-between hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${showPdfPages ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Páginas del PDF detectadas</h3>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {pdfPagesData.filter(p => p.orderNumber).length} de {pdfPagesData.length} con número de orden
              </span>
            </button>
            
            {showPdfPages && (
              <div className="p-6 pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {pdfPagesData.map((page) => (
                    <div 
                      key={page.pageNumber}
                      className={`p-3 rounded-lg text-xs border-2 ${
                        page.orderNumber ? 'bg-green-50 dark:bg-green-900/50 border-green-300 dark:border-green-500' : 'bg-gray-50 dark:bg-gray-600 border-gray-200 dark:border-gray-500'
                      }`}>
                      <div className="font-medium text-gray-900 dark:text-white">Página {page.pageNumber}</div>
                      <div className={`text-xs ${page.orderNumber ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
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
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Configuración de posición</h3>
                <button
                  onClick={() => {
                    setIsEditingPosition(!isEditingPosition);
                    if (!isEditingPosition) {
                      setShowPositionConfig(true);
                    }
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    isEditingPosition 
                      ? 'bg-green-600 dark:bg-green-700 text-white' 
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
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
                <div className="text-sm text-gray-600 dark:text-gray-400">
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
              <div className="p-6 pt-2 border-t border-gray-200 dark:border-gray-600">
                {isEditingPosition ? (
                  <>
                    {/* Selector de perfiles predefinidos */}
                    <div className="mb-4 space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Perfil predefinido</label>
                      <select
                        value={
                          (posX === 14 && posY === 212 && fontSize === 7) ? 'rotulos' :
                          (posX === 20 && posY === 706 && fontSize === 9) ? 'a4' :
                          'personalizado'
                        }
                        onChange={(e) => {
                          const profile = e.target.value;
                          if (profile === 'rotulos') {
                            setPosX(14);
                            setPosY(212);
                            setFontSize(7);
                          } else if (profile === 'a4') {
                            setPosX(20);
                            setPosY(706);
                            setFontSize(9);
                          }
                          // Si es 'personalizado', no hacer nada (dejar valores actuales)
                        }}
                        className="w-full p-2 border-2 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500 focus:border-green-500 focus:outline-none"
                      >
                        <option value="rotulos">Impresora de Rotulos (X=14, Y=212, Tamaño=7pt)</option>
                        <option value="a4">Hoja A4 Comun (X=20, Y=706, Tamaño=9pt)</option>
                        <option value="personalizado">Personalizado (X={posX}, Y={posY}, Tamaño={fontSize}pt)</option>
                      </select>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        💡 Selecciona un perfil para aplicar automáticamente la configuración
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Posición X (px)</label>
                        <input
                          type="number"
                          value={posX}
                          onChange={(e) => setPosX(parseInt(e.target.value) || 0)}
                          min={0}
                          className="w-full p-2 border-2 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500 focus:border-green-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Posición Y (px)</label>
                        <input
                          type="number"
                          value={posY}
                          onChange={(e) => setPosY(parseInt(e.target.value) || 0)}
                          min={0}
                          className="w-full p-2 border-2 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500 focus:border-green-500 focus:outline-none"
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
                          className="w-full p-2 border-2 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500 focus:border-green-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <p className="text-xs mt-3 text-gray-600 dark:text-gray-400">
                      💡 El punto (0,0) está en la esquina inferior izquierda del PDF
                    </p>
                  </>
                ) : (
                  <div className="bg-gray-100 dark:bg-gray-600 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-500">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <strong>Posición configurada:</strong>
                    </p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Coordenada X: <span className="text-gray-900 dark:text-white font-medium">{posX}px</span></li>
                      <li>• Coordenada Y: <span className="text-gray-900 dark:text-white font-medium">{posY}px</span></li>
                      <li>• Tamaño de fuente: <span className="text-gray-900 dark:text-white font-medium">{fontSize}pt</span></li>
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
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-300 dark:border-yellow-500/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-yellow-700 dark:text-yellow-400 font-medium mb-1">Faltan archivos para generar el PDF</p>
                    <ul className="text-sm text-yellow-600 dark:text-yellow-300 space-y-1">
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
              className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-900/50 disabled:text-gray-300 dark:disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2"
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

        {/* Panel de Debug - Visible durante el procesamiento */}
        {/* COMENTADO PARA PRODUCCIÓN - Descomentar para debugging */}
        {false && showDebugPanel && (
          <div className="bg-gray-900 dark:bg-gray-950 rounded-lg border-2 border-gray-700 dark:border-gray-600 overflow-hidden">
            <div className="bg-gray-800 dark:bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h3 className="text-lg font-bold text-white">Panel de Debug - Procesamiento</h3>
                <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                  {debugLogs.length} logs
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDebugLogs([])}
                  className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                  title="Limpiar logs"
                >
                  Limpiar
                </button>
                <button
                  onClick={() => setShowDebugPanel(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Cerrar panel"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div id="debug-panel-content" className="p-4 max-h-96 overflow-y-auto font-mono text-xs">
              {debugLogs.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  Esperando logs de procesamiento...
                </div>
              ) : (
                <div className="space-y-1">
                  {debugLogs.map((log, index) => {
                    const getLogColor = () => {
                      switch (log.type) {
                        case 'error':
                          return 'text-red-400';
                        case 'warning':
                          return 'text-yellow-400';
                        case 'success':
                          return 'text-green-400';
                        default:
                          return 'text-gray-300';
                      }
                    };
                    
                    const getLogBg = () => {
                      switch (log.type) {
                        case 'error':
                          return 'bg-red-900/20';
                        case 'warning':
                          return 'bg-yellow-900/20';
                        case 'success':
                          return 'bg-green-900/20';
                        default:
                          return '';
                      }
                    };

                    const isDebugSKU = log.message.includes('[DEBUG SKU]');
                    const isImportant = isDebugSKU || log.message.includes('RESUMEN') || log.message.includes('PROCESANDO');

                    return (
                      <div
                        key={index}
                        className={`p-2 rounded ${getLogBg()} ${getLogColor()} break-words ${
                          isDebugSKU ? 'font-bold border-l-4 border-blue-500 pl-3' : ''
                        } ${
                          isImportant ? 'bg-opacity-30' : ''
                        }`}
                      >
                        <span className="text-gray-500 mr-2 text-xs">
                          {new Date(log.timestamp).toLocaleTimeString('es-AR', { 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            second: '2-digit',
                            fractionalSecondDigits: 3
                          })}
                        </span>
                        <span className={isDebugSKU ? 'text-blue-300' : ''}>{log.message}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {debugLogs.length > 0 && (
              <div className="bg-gray-800 dark:bg-gray-800 p-2 border-t border-gray-700 text-xs text-gray-400 text-center">
                Última actualización: {new Date().toLocaleTimeString('es-AR')} | 
                Scroll automático activado
              </div>
            )}
          </div>
        )}
        
        <footer className="text-center mt-6 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
          <p>Creado para automatizar la generación de PDFs desde CSV.</p>
          <p className="mt-1 text-gray-600 dark:text-gray-500">by pictoN</p>
        </footer>
      </div>

      {canManageStock && showDescontarStockModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full border-2 border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
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
                        <p className="text-xs text-gray-400 mt-1">
                          {formatNumber(item.cantidad)} pack(s) · Equivalencia {formatNumber(item.equivalencia)} → {formatNumber(item.totalReal)} unidades reales
                        </p>
                      </div>
                      <div className="bg-orange-900/30 text-orange-400 px-3 py-1 rounded-full text-sm font-bold border border-orange-500/30">
                        -{formatNumber(item.totalReal)} unidades
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
                      const payload = stockParaDescontar.map(item => ({
                        sku: item.sku,
                        cantidad: item.cantidad,
                      }));

                      const { exitosos, errores } = await descontarStockMultiple(userId, payload);

                      if (errores.length > 0) {
                        const detalleErrores = errores.map(err => `${err.sku}: ${err.motivo}`).join(' | ');
                        if (exitosos > 0) {
                          showMessage('info', `Stock actualizado parcialmente: ${exitosos} SKU(s) descontados. Revisá los pendientes: ${detalleErrores}`);
                        } else {
                          showMessage('error', `No se descontó ningún SKU. Revisá los pendientes: ${detalleErrores}`);
                        }
                      } else {
                        showMessage('success', `Stock actualizado: ${exitosos} SKU(s) descontados correctamente.`);
                      }

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

