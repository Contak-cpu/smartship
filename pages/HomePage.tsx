import React, { useState, useCallback } from 'react';
import { ProcessStatus, ProcessingInfo, SucursalSugerencia } from '../types';
import { processOrders, processVentasOrders, fixEncoding, combineCSVs } from '../services/csvProcessor';
import { FileUploader } from '../components/FileUploader';
import { StatusDisplay } from '../components/StatusDisplay';
import { ResultsDisplay } from '../components/ResultsDisplay';
import { SugerenciasSucursalModal } from '../components/SugerenciasSucursalModal';
import DashboardLayout from '../components/layout/DashboardLayout';
import { guardarEnHistorialSmartShip } from '../src/utils/historialStorage';
import { useAuth } from '../hooks/useAuth';
import { guardarPedidosDesdeCSV, PedidoProcesado } from '../services/informacionService';
import SmartShipConfig, { SmartShipConfigValues } from '../components/SmartShipConfig';
import { agregarSugerenciasAceptadasAlCSV } from '../services/sugerenciasProcessor';

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
  const { username, userId } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessStatus>(ProcessStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ domicilioCSV: string; sucursalCSV: string; processingInfo: ProcessingInfo } | null>(null);
  const [sugerenciasPendientes, setSugerenciasPendientes] = useState<SucursalSugerencia[] | null>(null);
  const [mostrarModalSugerencias, setMostrarModalSugerencias] = useState(false);
  const [config, setConfig] = useState<SmartShipConfigValues>({
    peso: 400,
    alto: 10,
    ancho: 10,
    profundidad: 10,
    valorDeclarado: 6000,
  });

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    setStatus(ProcessStatus.IDLE);
    setResults(null);
    setError(null);
    setSugerenciasPendientes(null);
    setMostrarModalSugerencias(false);
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
        
        // Detectar archivo de ventas (Tiendanube) - normalizar para manejar caracteres especiales
        const normalizedCsv = csvText.replace(/[àáâãäå]/gi, 'a').replace(/[èéêë]/gi, 'e').replace(/[ìíîï]/gi, 'i').replace(/[òóôõö]/gi, 'o').replace(/[ùúûü]/gi, 'u').replace(/[ñ]/gi, 'n');
        const isVentasFile = normalizedCsv.includes('Número de orden') && normalizedCsv.includes('Email') && normalizedCsv.includes('Estado de la orden');
        
        let processedData;
        if (isVentasFile) {
          console.log('Detectado archivo de ventas, usando processVentasOrders...');
          processedData = await processVentasOrders(csvText, config);
        } else {
          console.log('Detectado archivo de pedidos Andreani, usando processOrders...');
          processedData = await processOrders(csvText, config);
        }
        
        console.log('Processing completed:', processedData);
        
        // Verificar si hay sugerencias pendientes
        if (processedData.processingInfo.sugerenciasSucursal && processedData.processingInfo.sugerenciasSucursal.length > 0) {
          // Hay sugerencias, mostrar modal antes de permitir descargar
          setSugerenciasPendientes(processedData.processingInfo.sugerenciasSucursal);
          setMostrarModalSugerencias(true);
          // Guardar resultados temporalmente (sin sugerencias aceptadas aún)
          setResults(processedData);
          setStatus(ProcessStatus.SUCCESS);
          
          // NO guardar en historial ni Supabase todavía - esperar a que se procesen las sugerencias
          console.log(`💡 ${processedData.processingInfo.sugerenciasSucursal.length} sugerencia(s) pendiente(s). Esperando decisión del usuario...`);
        } else {
          // No hay sugerencias, mostrar resultados directamente y guardar inmediatamente
          setResults(processedData);
          setStatus(ProcessStatus.SUCCESS);
          
          // Guardar en historial solo si no hay sugerencias pendientes
          try {
            const datosDomicilio = csvToArray(processedData.domicilioCSV);
            const datosSucursal = csvToArray(processedData.sucursalCSV);
            await guardarEnHistorialSmartShip(selectedFile.name, datosDomicilio, datosSucursal, username);
          } catch (historialError) {
            console.error('Error al guardar en historial:', historialError);
            // No interrumpir el flujo si falla el guardado del historial
          }

          // Guardar pedidos en Supabase para la sección Información
          try {
            console.log('Guardando pedidos en Supabase...');
            const pedidosParaGuardar: PedidoProcesado[] = [];
            const hoy = new Date().toISOString().split('T')[0];
            
            // Procesar pedidos de domicilio
            const datosDomicilio = csvToArray(processedData.domicilioCSV);
            datosDomicilio.forEach((item: any) => {
              const numeroPedido = item['Numero Interno Ej: '] || item['Numero Interno'] || '';
              const nombreCompleto = item['Nombre * Ej: '] || item['Nombre'] || '';
              const apellidoCompleto = item['Apellido * Ej: '] || item['Apellido'] || '';
              const emailCliente = item['Email * Ej: '] || item['Email'] || '';
              const telefono = `${item['Celular código * Ej: '] || ''}${item['Celular número * Ej: '] || ''}`;
              const calle = item['Calle * Ej: '] || '';
              const numero = item['Número * Ej: '] || '';
              const piso = item['Piso Ej: '] || '';
              const depto = item['Departamento Ej: '] || '';
              const direccion = `${calle} ${numero}${piso ? ' Piso ' + piso : ''}${depto ? ' Depto ' + depto : ''}`.trim();
              const provinciaLocalidadCP = item['Provincia / Localidad / CP * Ej: BUENOS AIRES / 11 DE SEPTIEMBRE / 1657'] || item['Provincia / Localidad / CP *'] || '';
              
              const partes = provinciaLocalidadCP.split('/').map((p: string) => p.trim());
              const provincia = partes[0] || '';
              const localidad = partes[1] || '';
              const codigoPostal = partes[2] || '';
              
              if (numeroPedido && emailCliente) {
                pedidosParaGuardar.push({
                  user_id: userId,
                  username,
                  numeroPedido,
                  emailCliente,
                  nombreCliente: nombreCompleto,
                  apellidoCliente: apellidoCompleto,
                  telefono,
                  direccion,
                  provincia,
                  localidad,
                  codigoPostal,
                  tipoEnvio: 'domicilio',
                  fechaProcesamiento: hoy,
                  archivoOrigen: selectedFile.name,
                });
              }
            });

            // Procesar pedidos de sucursal
            const datosSucursal = csvToArray(processedData.sucursalCSV);
            datosSucursal.forEach((item: any) => {
              const numeroPedido = item['Numero Interno Ej: '] || item['Numero Interno'] || '';
              const nombreCompleto = item['Nombre * Ej: '] || item['Nombre *'] || '';
              const apellidoCompleto = item['Apellido * Ej: '] || item['Apellido *'] || '';
              const emailCliente = item['Email * Ej: '] || item['Email *'] || '';
              const telefono = `${item['Celular código * Ej: '] || item['Celular código *'] || ''}${item['Celular número * Ej: '] || item['Celular número *'] || ''}`;
              const sucursal = item['Sucursal * Ej: 9 DE JULIO'] || item['Sucursal *'] || '';
              
              if (numeroPedido && emailCliente) {
                pedidosParaGuardar.push({
                  user_id: userId,
                  username,
                  numeroPedido,
                  emailCliente,
                  nombreCliente: nombreCompleto,
                  apellidoCliente: apellidoCompleto,
                  telefono,
                  direccion: `Sucursal: ${sucursal}`,
                  provincia: '',
                  localidad: sucursal,
                  codigoPostal: '',
                  tipoEnvio: 'sucursal',
                  fechaProcesamiento: hoy,
                  archivoOrigen: selectedFile.name,
                });
              }
            });

            if (pedidosParaGuardar.length > 0) {
              const resultado = await guardarPedidosDesdeCSV(pedidosParaGuardar);
              console.log(`✅ Pedidos procesados: ${resultado.guardados} guardados, ${resultado.duplicados} duplicados, ${resultado.errores} errores`);
            }
          } catch (infoError) {
            console.error('Error al guardar pedidos para Información:', infoError);
            // No interrumpir el flujo si falla
          }
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
  }, [selectedFile, config]);
  
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

  const handleConfigChange = (newConfig: SmartShipConfigValues) => {
    setConfig(newConfig);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative">
        <div className="w-full max-w-2xl mx-auto bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6 relative">
          {/* Componente de configuración */}
          <SmartShipConfig onConfigChange={handleConfigChange} />
          
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
        
        {/* Modal de sugerencias - aparece antes de ResultsDisplay si hay sugerencias */}
        {mostrarModalSugerencias && sugerenciasPendientes && (
          <SugerenciasSucursalModal
            sugerencias={sugerenciasPendientes}
            onCompletar={(sugerenciasActualizadas) => {
              // Procesar sugerencias aceptadas y rechazadas
              const sugerenciasAceptadas = sugerenciasActualizadas.filter(s => s.decision === 'aceptada');
              const sugerenciasRechazadas = sugerenciasActualizadas.filter(s => s.decision === 'rechazada');
              
              console.log(`📊 Procesando sugerencias: ${sugerenciasAceptadas.length} aceptadas, ${sugerenciasRechazadas.length} rechazadas`);
              
              // Actualizar CSV de sucursales con sugerencias aceptadas
              let sucursalCSVActualizado = results?.sucursalCSV || '';
              if (sugerenciasAceptadas.length > 0 && results) {
                sucursalCSVActualizado = agregarSugerenciasAceptadasAlCSV(
                  results.sucursalCSV,
                  sugerenciasAceptadas,
                  results.domicilioCSV
                );
              }
              
              // Actualizar processingInfo
              const processingInfoActualizado: ProcessingInfo = {
                ...results.processingInfo,
                sugerenciasSucursal: sugerenciasActualizadas,
                sucursalesProcessed: (results.processingInfo.sucursalesProcessed || 0) + sugerenciasAceptadas.length
              };
              
              // Actualizar resultados con CSV actualizado
              setResults({
                ...results,
                sucursalCSV: sucursalCSVActualizado,
                processingInfo: processingInfoActualizado
              });
              
              // Cerrar modal y permitir descargar
              setMostrarModalSugerencias(false);
              setSugerenciasPendientes(null);
              
              // Guardar en historial con CSV actualizado
              try {
                const datosDomicilio = csvToArray(results.domicilioCSV);
                const datosSucursal = csvToArray(sucursalCSVActualizado);
                await guardarEnHistorialSmartShip(selectedFile?.name || 'archivo.csv', datosDomicilio, datosSucursal, username);
              } catch (historialError) {
                console.error('Error al guardar en historial:', historialError);
              }
              
              // Guardar pedidos en Supabase (incluyendo sugerencias aceptadas)
              try {
                const pedidosParaGuardar: PedidoProcesado[] = [];
                const hoy = new Date().toISOString().split('T')[0];
                
                // Procesar pedidos de domicilio
                const datosDomicilio = csvToArray(results.domicilioCSV);
                datosDomicilio.forEach((item: any) => {
                  const numeroPedido = item['Numero Interno Ej: '] || item['Numero Interno'] || '';
                  const nombreCompleto = item['Nombre * Ej: '] || item['Nombre'] || '';
                  const apellidoCompleto = item['Apellido * Ej: '] || item['Apellido'] || '';
                  const emailCliente = item['Email * Ej: '] || item['Email'] || '';
                  const telefono = `${item['Celular código * Ej: '] || ''}${item['Celular número * Ej: '] || ''}`;
                  const calle = item['Calle * Ej: '] || '';
                  const numero = item['Número * Ej: '] || '';
                  const piso = item['Piso Ej: '] || '';
                  const depto = item['Departamento Ej: '] || '';
                  const direccion = `${calle} ${numero}${piso ? ' Piso ' + piso : ''}${depto ? ' Depto ' + depto : ''}`.trim();
                  const provinciaLocalidadCP = item['Provincia / Localidad / CP * Ej: BUENOS AIRES / 11 DE SEPTIEMBRE / 1657'] || item['Provincia / Localidad / CP *'] || '';
                  
                  const partes = provinciaLocalidadCP.split('/').map((p: string) => p.trim());
                  const provincia = partes[0] || '';
                  const localidad = partes[1] || '';
                  const codigoPostal = partes[2] || '';
                  
                  if (numeroPedido && emailCliente) {
                    pedidosParaGuardar.push({
                      user_id: userId,
                      username,
                      numeroPedido,
                      emailCliente,
                      nombreCliente: nombreCompleto,
                      apellidoCliente: apellidoCompleto,
                      telefono,
                      direccion,
                      provincia,
                      localidad,
                      codigoPostal,
                      tipoEnvio: 'domicilio',
                      fechaProcesamiento: hoy,
                      archivoOrigen: selectedFile?.name || 'archivo.csv',
                    });
                  }
                });

                // Procesar pedidos de sucursal (incluyendo sugerencias aceptadas)
                const datosSucursal = csvToArray(sucursalCSVActualizado);
                datosSucursal.forEach((item: any) => {
                  const numeroPedido = item['Numero Interno Ej: '] || item['Numero Interno'] || '';
                  const nombreCompleto = item['Nombre * Ej: '] || item['Nombre *'] || '';
                  const apellidoCompleto = item['Apellido * Ej: '] || item['Apellido *'] || '';
                  const emailCliente = item['Email * Ej: '] || item['Email *'] || '';
                  const telefono = `${item['Celular código * Ej: '] || item['Celular código *'] || ''}${item['Celular número * Ej: '] || item['Celular número *'] || ''}`;
                  const sucursal = item['Sucursal * Ej: 9 DE JULIO'] || item['Sucursal *'] || '';
                  
                  if (numeroPedido && emailCliente) {
                    pedidosParaGuardar.push({
                      user_id: userId,
                      username,
                      numeroPedido,
                      emailCliente,
                      nombreCliente: nombreCompleto,
                      apellidoCliente: apellidoCompleto,
                      telefono,
                      direccion: `Sucursal: ${sucursal}`,
                      provincia: '',
                      localidad: sucursal,
                      codigoPostal: '',
                      tipoEnvio: 'sucursal',
                      fechaProcesamiento: hoy,
                      archivoOrigen: selectedFile?.name || 'archivo.csv',
                    });
                  }
                });

                if (pedidosParaGuardar.length > 0) {
                  const resultado = await guardarPedidosDesdeCSV(pedidosParaGuardar);
                  console.log(`✅ Pedidos procesados: ${resultado.guardados} guardados, ${resultado.duplicados} duplicados, ${resultado.errores} errores`);
                }
              } catch (infoError) {
                console.error('Error al guardar pedidos para Información:', infoError);
              }
            }}
            onCancelar={() => {
              // Si cancela, cerrar modal pero mantener resultados originales
              setMostrarModalSugerencias(false);
              setSugerenciasPendientes(null);
            }}
          />
        )}
        
        {/* Mostrar ResultsDisplay solo si no hay modal de sugerencias abierto */}
        {status === ProcessStatus.SUCCESS && results && !mostrarModalSugerencias && (
          <ResultsDisplay 
            domicilioCSV={results.domicilioCSV} 
            sucursalCSV={results.sucursalCSV}
            processingInfo={results.processingInfo}
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

