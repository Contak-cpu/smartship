import React, { useState } from 'react';
import { TiendanubeOrder } from '../types';
import * as pdfParse from 'pdf-parse';

interface PdfData {
  pagina: number;
  numeroInterno: string;
  tracking: string;
  contenido: string;
}

interface MatchResult {
  numeroInterno: string;
  numeroOrden: string;
  sku: string;
  tracking: string;
  pagina: number;
  encontrado: boolean;
  nombreCliente?: string;
  email?: string;
  direccion?: string;
}

interface CsvStats {
  totalOrdenes: number;
  ordenesConSkus: number;
  ordenesSinSkus: number;
  totalProductos: number;
}

const CsvPdfMatcher: React.FC = () => {
  // Estados necesarios
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [ordenToSku, setOrdenToSku] = useState<Record<string, string>>({});
  const [pdfData, setPdfData] = useState<PdfData[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [csvStats, setCsvStats] = useState<CsvStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Función helper para validar archivos
  const validateFile = (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type);
  };

  // Función para procesar CSV usando la misma estructura que el procesador principal
  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFile(file, ['text/csv', 'application/vnd.ms-excel', 'text/plain'])) {
      setError('Por favor, selecciona un archivo CSV válido.');
      return;
    }

    setCsvFile(file);
    setError(null);
    setLoading(true);

    try {
      const text = await file.text();
      
      // Función mejorada para parsear CSV con mejor manejo de errores
      const parseCSV = (csvText: string): TiendanubeOrder[] => {
        console.log('Iniciando parseo de CSV...');
        console.log('Primeras 500 caracteres del CSV:', csvText.substring(0, 500));
        
        const lines = csvText.split('\n').filter(line => line.trim());
        console.log('Total de líneas encontradas:', lines.length);
        
        if (lines.length < 2) {
          console.log('No hay suficientes líneas en el CSV');
          return [];
        }
        
        const headers = lines[0].split(';').map(h => h.trim());
        console.log('Headers encontrados:', headers);
        
        const data: TiendanubeOrder[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(';');
          if (values.length < headers.length) {
            console.log(`Línea ${i} tiene menos columnas que headers:`, values);
            continue;
          }
          
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          // Solo agregar si tiene número de orden
          if (row['Número de orden'] && row['Número de orden'].trim()) {
            data.push(row as TiendanubeOrder);
          }
        }
        
        console.log('Órdenes parseadas:', data.length);
        if (data.length > 0) {
          console.log('Primera orden de ejemplo:', data[0]);
        }
        
        return data;
      };

      const orders = parseCSV(text);
      
      if (orders.length === 0) {
        throw new Error('No se encontraron órdenes válidas en el CSV.');
      }

      // Crear mapeo de número de orden a SKU y datos del cliente
      const ordenDataMap: Record<string, { sku: string; nombre: string; email: string; direccion: string }> = {};
      let totalOrdenes = 0;
      let ordenesConSkus = 0;
      let ordenesSinSkus = 0;
      let totalProductos = 0;

      orders.forEach(order => {
        const numeroOrden = order['Número de orden'];
        if (!numeroOrden) return;

        totalOrdenes++;
        
        // Buscar SKU en las columnas del CSV (más flexible)
        let sku = '';
        const possibleSkuColumns = [
          'SKU', 'Producto', 'Código', 'Código de producto', 'Item',
          'Producto/SKU', 'Código del producto', 'Referencia', 'Modelo'
        ];
        
        // Buscar en todas las columnas posibles
        for (const col of possibleSkuColumns) {
          if (order[col] && order[col].trim()) {
            sku = order[col].trim();
            break;
          }
        }
        
        // Si no encontramos SKU en las columnas conocidas, buscar en cualquier columna que contenga "sku" o "producto"
        if (!sku) {
          Object.keys(order).forEach(key => {
            if (key.toLowerCase().includes('sku') || 
                key.toLowerCase().includes('producto') || 
                key.toLowerCase().includes('codigo') ||
                key.toLowerCase().includes('item')) {
              if (order[key] && order[key].trim()) {
                sku = order[key].trim();
              }
            }
          });
        }
        
        console.log(`Orden ${numeroOrden}: SKU encontrado = "${sku}"`);

        if (sku) {
          ordenesConSkus++;
          totalProductos++;
        } else {
          ordenesSinSkus++;
        }

        ordenDataMap[numeroOrden] = {
          sku: sku || 'No especificado',
          nombre: order['Nombre del comprador'] || '',
          email: order['Email'] || '',
          direccion: `${order['Dirección'] || ''} ${order['Número'] || ''}`.trim()
        };
      });

      // Crear mapeo simple para compatibilidad con el resto del código
      const ordenSkuMap: Record<string, string> = {};
      Object.keys(ordenDataMap).forEach(orden => {
        ordenSkuMap[orden] = ordenDataMap[orden].sku;
      });

      setOrdenToSku(ordenSkuMap);
      setCsvStats({
        totalOrdenes,
        ordenesConSkus,
        ordenesSinSkus,
        totalProductos
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo CSV.');
    } finally {
      setLoading(false);
    }
  };

  // Función para procesar PDF real
  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFile(file, ['application/pdf'])) {
      setError('Por favor, selecciona un archivo PDF válido.');
      return;
    }

    setPdfFile(file);
    setError(null);
    setLoading(true);

    try {
      console.log('Iniciando procesamiento de PDF...');
      const arrayBuffer = await file.arrayBuffer();
      const pdfData = await pdfParse(arrayBuffer);
      
      console.log('PDF procesado, texto extraído:', pdfData.text.substring(0, 500));
      
      // Buscar números internos en el texto del PDF
      const numeroInternoRegex = /N°\s*Interno:\s*#?(\d+)/gi;
      const trackingRegex = /(AR\d{9,})/gi;
      
      const matches = [...pdfData.text.matchAll(numeroInternoRegex)];
      const trackingMatches = [...pdfData.text.matchAll(trackingRegex)];
      
      console.log('Números internos encontrados:', matches.map(m => m[1]));
      console.log('Tracking encontrados:', trackingMatches.map(m => m[1]));
      
      const pdfDataArray: PdfData[] = [];
      
      // Crear un array de datos del PDF
      matches.forEach((match, index) => {
        const numeroInterno = match[1];
        const tracking = trackingMatches[index] ? trackingMatches[index][1] : `AR${numeroInterno.padStart(9, '0')}`;
        
        pdfDataArray.push({
          pagina: index + 1,
          numeroInterno: numeroInterno,
          tracking: tracking,
          contenido: match[0]
        });
      });
      
      console.log('Datos del PDF procesados:', pdfDataArray);
      setPdfData(pdfDataArray);
      
    } catch (err) {
      console.error('Error procesando PDF:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo PDF.');
    } finally {
      setLoading(false);
    }
  };

  // Función de matching automático mejorada
  const procesarMatching = () => {
    if (Object.keys(ordenToSku).length === 0 || pdfData.length === 0) {
      setError('Por favor, carga tanto el archivo CSV como el PDF antes de procesar.');
      return;
    }

    console.log('Iniciando matching...');
    console.log('Órdenes disponibles en CSV:', Object.keys(ordenToSku));
    console.log('Números internos del PDF:', pdfData.map(p => p.numeroInterno));

    const results: MatchResult[] = [];

    pdfData.forEach(pdfItem => {
      const numeroInterno = pdfItem.numeroInterno;
      let sku = 'No encontrado';
      let encontrado = false;
      
      // Intentar matching exacto primero
      if (ordenToSku[numeroInterno]) {
        sku = ordenToSku[numeroInterno];
        encontrado = true;
      } else {
        // Intentar matching parcial - buscar si el número interno está contenido en alguna orden
        const ordenEncontrada = Object.keys(ordenToSku).find(orden => 
          orden.includes(numeroInterno) || numeroInterno.includes(orden)
        );
        
        if (ordenEncontrada) {
          sku = ordenToSku[ordenEncontrada];
          encontrado = true;
          console.log(`Match parcial encontrado: ${numeroInterno} -> ${ordenEncontrada}`);
        }
      }
      
      console.log(`PDF ${numeroInterno}: SKU = "${sku}", Encontrado = ${encontrado}`);
      
      results.push({
        numeroInterno: pdfItem.numeroInterno,
        numeroOrden: numeroInterno, // Usar el número interno como orden por ahora
        sku: sku,
        tracking: pdfItem.tracking,
        pagina: pdfItem.pagina,
        encontrado: encontrado,
        nombreCliente: 'Cliente de la orden',
        email: 'cliente@email.com',
        direccion: 'Dirección del cliente'
      });
    });

    console.log('Total matches procesados:', results.length);
    console.log('Matches encontrados:', results.filter(r => r.encontrado).length);
    
    setMatches(results);
    setError(null);
  };

  // Función para generar HTML descargable
  const generarEtiquetasHtml = () => {
    if (matches.length === 0) {
      setError('No hay matches para generar etiquetas.');
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Etiquetas Andreani - Matching Automático</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5;
        }
        .etiqueta { 
            page-break-after: always; 
            border: 2px solid #000; 
            padding: 20px; 
            width: 500px;
            height: 700px;
            margin: 20px auto;
            background: white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .etiqueta:last-child {
            page-break-after: auto;
        }
        .sku-box { 
            background: #ffeeee; 
            border: 3px solid #ff0000; 
            padding: 15px; 
            font-size: 18px;
            font-weight: bold;
            color: #ff0000;
            text-align: center;
            margin: 20px 0;
            border-radius: 8px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px;
            background: #f8f8f8;
            border-radius: 4px;
        }
        .label {
            font-weight: bold;
            color: #333;
        }
        .value {
            color: #666;
        }
        .status {
            text-align: center;
            padding: 10px;
            margin: 20px 0;
            border-radius: 4px;
            font-weight: bold;
        }
        .status.encontrado {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .status.no-encontrado {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .remitente {
            margin-top: 30px;
            padding: 15px;
            background: #e9ecef;
            border-radius: 4px;
        }
        @media print {
            body { background: white; }
            .etiqueta { box-shadow: none; margin: 0; }
        }
    </style>
</head>
<body>
    <h1 style="text-align: center; color: #333; margin-bottom: 30px;">
        Etiquetas Andreani - Matching Automático
    </h1>
    
    ${matches.map(match => `
        <div class="etiqueta">
            <div class="header">
                <h2>ETIQUETA DE ENVÍO</h2>
                <p>Andreani - Servicio de Paquetería</p>
            </div>
            
            <div class="sku-box">
                SKU: ${match.sku}
            </div>
            
            <div class="info-row">
                <span class="label">N° Interno:</span>
                <span class="value">${match.numeroInterno}</span>
            </div>
            
            <div class="info-row">
                <span class="label">N° de Orden:</span>
                <span class="value">${match.numeroOrden}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Tracking:</span>
                <span class="value">${match.tracking}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Página PDF:</span>
                <span class="value">${match.pagina}</span>
            </div>
            
            <div class="status ${match.encontrado ? 'encontrado' : 'no-encontrado'}">
                ${match.encontrado ? '✓ SKU ENCONTRADO' : '✗ SKU NO ENCONTRADO'}
            </div>
            
            <div class="remitente">
                <h3>Información del Remitente</h3>
                <p><strong>Empresa:</strong> Tu Empresa</p>
                <p><strong>Dirección:</strong> Tu Dirección</p>
                <p><strong>Teléfono:</strong> Tu Teléfono</p>
                <p><strong>Email:</strong> tu@email.com</p>
            </div>
        </div>
    `).join('')}
</body>
</html>`;

    // Crear y descargar archivo
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `etiquetas_andreani_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    setCsvFile(null);
    setPdfFile(null);
    setOrdenToSku({});
    setPdfData([]);
    setMatches([]);
    setCsvStats(null);
    setError(null);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">🔄 CSV-PDF Matcher</h1>
            <p className="text-indigo-400 font-medium text-sm sm:text-base">
              Matching automático entre CSV de ventas y PDF de etiquetas Andreani
            </p>
          </div>

          {/* Sección de carga de archivos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Carga CSV */}
            <div className="bg-gray-700/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">📊 Archivo CSV de Ventas</h3>
              <div className="space-y-4">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleCsvUpload}
                  className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
                />
                {csvFile && (
                  <div className="text-green-400 text-sm">
                    ✓ {csvFile.name} cargado
                  </div>
                )}
                {csvStats && (
                  <div className="bg-gray-600/50 rounded p-3 text-sm text-gray-300">
                    <div>Total órdenes: {csvStats.totalOrdenes}</div>
                    <div>Total productos: {csvStats.totalProductos}</div>
                    <div>Órdenes con SKUs: {csvStats.ordenesConSkus}</div>
                    <div>Órdenes sin SKUs: {csvStats.ordenesSinSkus}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Carga PDF */}
            <div className="bg-gray-700/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">📄 Archivo PDF de Etiquetas</h3>
              <div className="space-y-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
                />
                {pdfFile && (
                  <div className="text-green-400 text-sm">
                    ✓ {pdfFile.name} cargado
                  </div>
                )}
                {pdfData.length > 0 && (
                  <div className="bg-gray-600/50 rounded p-3 text-sm text-gray-300">
                    <div>Páginas procesadas: {pdfData.length}</div>
                    <div>Números internos: {pdfData.map(p => p.numeroInterno).join(', ')}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <button
              onClick={procesarMatching}
              disabled={loading || Object.keys(ordenToSku).length === 0 || pdfData.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center"
            >
              {loading ? '⏳ Procesando...' : '🔄 Procesar Matching'}
            </button>
            
            <button
              onClick={generarEtiquetasHtml}
              disabled={matches.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-900/50 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center"
            >
              📥 Descargar Etiquetas HTML
            </button>
            
            <button
              onClick={() => {
                console.log('=== DEBUG INFO ===');
                console.log('CSV Stats:', csvStats);
                console.log('Órdenes mapeadas:', Object.keys(ordenToSku));
                console.log('Primeras 5 órdenes con SKUs:', Object.entries(ordenToSku).slice(0, 5));
                console.log('PDF Data:', pdfData);
                console.log('Matches actuales:', matches);
                console.log('Total órdenes en CSV:', Object.keys(ordenToSku).length);
                console.log('Total números internos en PDF:', pdfData.length);
                
                // Mostrar información detallada
                const debugInfo = `
DEBUG INFO:
- Total órdenes en CSV: ${Object.keys(ordenToSku).length}
- Total números internos en PDF: ${pdfData.length}
- Órdenes con SKUs: ${csvStats?.ordenesConSkus || 0}
- Órdenes sin SKUs: ${csvStats?.ordenesSinSkus || 0}
- Matches encontrados: ${matches.filter(m => m.encontrado).length}

Primeras 5 órdenes: ${Object.keys(ordenToSku).slice(0, 5).join(', ')}
Números internos PDF: ${pdfData.map(p => p.numeroInterno).join(', ')}
                `;
                
                alert(debugInfo);
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center"
            >
              🐛 Debug Info
            </button>
            
            <button
              onClick={resetAll}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center"
            >
              🗑️ Limpiar Todo
            </button>
          </div>

          {/* Mensajes de error */}
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Tabla de resultados */}
          {matches.length > 0 && (
            <div className="bg-gray-700/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">📋 Resultados del Matching</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-300">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left py-2">N° Interno</th>
                      <th className="text-left py-2">N° Orden</th>
                      <th className="text-left py-2">SKU</th>
                      <th className="text-left py-2">Tracking</th>
                      <th className="text-left py-2">Página</th>
                      <th className="text-left py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((match, index) => (
                      <tr key={index} className="border-b border-gray-600/50">
                        <td className="py-2">{match.numeroInterno}</td>
                        <td className="py-2">{match.numeroOrden}</td>
                        <td className="py-2">{match.sku}</td>
                        <td className="py-2">{match.tracking}</td>
                        <td className="py-2">{match.pagina}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            match.encontrado 
                              ? 'bg-green-900/50 text-green-300' 
                              : 'bg-red-900/50 text-red-300'
                          }`}>
                            {match.encontrado ? 'Encontrado' : 'No encontrado'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 text-sm text-gray-400">
                Total matches: {matches.length} | 
                Encontrados: {matches.filter(m => m.encontrado).length} | 
                No encontrados: {matches.filter(m => !m.encontrado).length}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CsvPdfMatcher;
