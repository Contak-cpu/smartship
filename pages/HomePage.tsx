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
import { registrarActividad } from '../services/logsService';

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
  const [pedidosUnicosCSV, setPedidosUnicosCSV] = useState<number>(0);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
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
    setDebugLogs([]);
  };

  const handleProcessClick = useCallback(async () => {
    if (!selectedFile) return;

    // No mostrar logs de inicio, solo errores importantes
    setStatus(ProcessStatus.PROCESSING);
    setError(null);
    setResults(null);

    // No usar addDebugLog - los pedidos no procesados se agregarán directamente al estado
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvText = event.target?.result as string;
        if (!csvText) {
          throw new Error('El archivo está vacío o no se pudo leer.');
        }
        
        console.log('Starting to process CSV...');
        
        // Detectar archivo de ventas (Tiendanube) - buscar en el CSV original sin normalizar primero
        // Los archivos de ventas tienen estas características:
        // 1. Tienen "Número de orden" (con o sin tilde)
        // 2. Tienen "Email" 
        // 3. Tienen "Estado de la orden"
        // 4. Usan comas como delimitador (no punto y coma)
        const hasNumeroOrden = csvText.includes('Número de orden') || csvText.includes('Numero de orden') || csvText.toLowerCase().includes('número de orden');
        const hasEmail = csvText.includes('Email');
        const hasEstadoOrden = csvText.includes('Estado de la orden') || csvText.toLowerCase().includes('estado de la orden');
        const usesComma = csvText.split(',').length > csvText.split(';').length;
        
        const isVentasFile = hasNumeroOrden && hasEmail && hasEstadoOrden;
        
        // Contar pedidos únicos del CSV original antes de procesar
        let pedidosUnicosOriginales = 0;
        try {
          const lines = csvText.trim().split('\n');
          if (lines.length > 1) {
            // Detectar delimitador: Shopify usa coma, Tiendanube usa punto y coma
            const firstLine = lines[0];
            const delimiter = firstLine.includes(';') ? ';' : ',';
            console.log(`📊 Delimitador detectado: "${delimiter}"`);
            
            const headers = firstLine.split(delimiter).map(h => h.trim());
            console.log(`📊 Headers encontrados (primeros 5):`, headers.slice(0, 5));
            
            // Buscar columna de número de pedido
            let numeroPedidoIndex = -1;
            
            if (isVentasFile) {
              // Para archivos de ventas, buscar "Número de orden"
              numeroPedidoIndex = headers.findIndex(h => 
                h.toLowerCase().includes('número de orden') || 
                h.toLowerCase().includes('numero de orden')
              );
            } else {
              // Para archivos Shopify, buscar "Name" (primera columna, índice 0)
              numeroPedidoIndex = headers.findIndex((h, idx) => {
                const hLower = h.toLowerCase().trim();
                // Prioridad: "Name" en las primeras columnas
                if (hLower === 'name' && idx < 5) {
                  return true;
                }
                return false;
              });
              
              // Si no se encuentra "Name", buscar alternativas
              if (numeroPedidoIndex === -1) {
                numeroPedidoIndex = headers.findIndex(h => 
                  h.toLowerCase().includes('id') ||
                  h.toLowerCase().includes('número') ||
                  h.toLowerCase().includes('numero') ||
                  h.toLowerCase().includes('orden')
                );
              }
            }
            
            console.log(`📊 Índice de columna de pedido encontrado: ${numeroPedidoIndex} (${headers[numeroPedidoIndex]})`);
            
            if (numeroPedidoIndex !== -1) {
              const pedidosSet = new Set<string>();
              for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue; // Saltar líneas vacías
                
                // Parsear la línea respetando comas dentro de comillas
                const values: string[] = [];
                let currentValue = '';
                let insideQuotes = false;
                
                for (let j = 0; j < line.length; j++) {
                  const char = line[j];
                  if (char === '"') {
                    insideQuotes = !insideQuotes;
                  } else if ((char === delimiter || char === ';') && !insideQuotes) {
                    values.push(currentValue.trim());
                    currentValue = '';
                  } else {
                    currentValue += char;
                  }
                }
                // Agregar el último valor
                if (currentValue) {
                  values.push(currentValue.trim());
                }
                
                if (values[numeroPedidoIndex]) {
                  const pedido = values[numeroPedidoIndex].trim();
                  if (pedido) {
                    // Limpiar formato de pedido (ej: "#17214" -> "17214")
                    const pedidoLimpio = pedido.replace(/^#/, '').trim();
                    if (pedidoLimpio && pedidoLimpio !== '') {
                      pedidosSet.add(pedidoLimpio);
                    }
                  }
                }
              }
              pedidosUnicosOriginales = pedidosSet.size;
              console.log(`📊 Pedidos únicos encontrados en CSV: ${pedidosUnicosOriginales}`);
              console.log(`📊 Primeros 10 pedidos únicos:`, Array.from(pedidosSet).slice(0, 10));
            } else {
              console.warn('⚠️ No se encontró columna de número de pedido');
            }
          }
        } catch (error) {
          console.error('❌ Error contando pedidos únicos del CSV original:', error);
        }
        
        // Guardar en estado para usar después
        setPedidosUnicosCSV(pedidosUnicosOriginales);
        
        let processedData;
        if (isVentasFile) {
          console.log('Detectado archivo de ventas, usando processVentasOrders...');
          
          try {
            processedData = await processVentasOrders(csvText, config);
          } catch (error: any) {
            console.error('Error en processVentasOrders:', error);
            throw error;
          }
        } else {
          console.log('Detectado archivo de pedidos Andreani, usando processOrders...');
          processedData = await processOrders(csvText, config);
        }
        console.log('Processing completed:', processedData);
        
        // 🐛 DEBUG LOCAL: Mostrar pedidos no procesados en consola y en el panel
        if (processedData.processingInfo.droppedOrders && processedData.processingInfo.droppedOrders.length > 0) {
          // Agregar al panel de logs con formato mejorado (sin timestamp)
          const pedidosFormateados: string[] = [];
          processedData.processingInfo.droppedOrders.forEach((pedido) => {
            // Formatear el mensaje: convertir "Pedido 123" o "123 -" a "#123"
            let formattedPedido = pedido;
            // Buscar número de pedido al inicio y reemplazarlo con formato #número
            formattedPedido = formattedPedido.replace(/^(?:Pedido\s+)?(\d+)(?:\s*-\s*|:\s*)/, '#$1 - ');
            pedidosFormateados.push(formattedPedido);
          });
          
          // Agregar todos los pedidos formateados al estado
          setDebugLogs(pedidosFormateados);
          
          // También mostrar en consola
          console.group('🚨 DEBUG LOCAL: PEDIDOS NO PROCESADOS');
          console.log(`Total de pedidos no procesados: ${processedData.processingInfo.droppedOrders.length}`);
          console.log('\n📋 Lista detallada:');
          processedData.processingInfo.droppedOrders.forEach((pedido, idx) => {
            console.log(`${idx + 1}. ${pedido}`);
          });
          console.table(processedData.processingInfo.droppedOrders);
          console.groupEnd();
        }
        
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

          // Registrar log de archivo procesado (separado para que siempre se registre)
          try {
            if (userId) {
              const datosDomicilio = csvToArray(processedData.domicilioCSV);
              const datosSucursal = csvToArray(processedData.sucursalCSV);
              
              // Contar pedidos únicos desde los datos procesados (domicilio + sucursal)
              const pedidosUnicosProcesados = new Set<string>();
              
              // Extraer pedidos únicos de domicilio
              datosDomicilio.forEach((item: any) => {
                const numeroPedido = item['Numero Interno Ej: '] || item['Numero Interno'] || '';
                if (numeroPedido) {
                  // Limpiar formato de pedido (ej: "#17214" -> "17214")
                  const pedidoLimpio = numeroPedido.replace(/^#/, '').trim();
                  if (pedidoLimpio) {
                    pedidosUnicosProcesados.add(pedidoLimpio);
                  }
                }
              });
              
              // Extraer pedidos únicos de sucursal
              datosSucursal.forEach((item: any) => {
                const numeroPedido = item['Numero Interno Ej: '] || item['Numero Interno'] || '';
                if (numeroPedido) {
                  // Limpiar formato de pedido (ej: "#17214" -> "17214")
                  const pedidoLimpio = numeroPedido.replace(/^#/, '').trim();
                  if (pedidoLimpio) {
                    pedidosUnicosProcesados.add(pedidoLimpio);
                  }
                }
              });
              
              const totalPedidosUnicos = pedidosUnicosProcesados.size;
              console.log(`📊 Pedidos únicos procesados (domicilio + sucursal): ${totalPedidosUnicos}`);
              
              const resultado = await registrarActividad(
                userId,
                username,
                'archivo_procesado',
                1, // 1 archivo procesado
                selectedFile.name,
                {
                  total_registros_domicilio: datosDomicilio.length,
                  total_registros_sucursal: datosSucursal.length,
                  pedidos_unicos_csv: totalPedidosUnicos, // Usar pedidos únicos procesados
                  seccion: 'smartship',
                }
              );
              if (!resultado.success) {
                console.error('❌ Error registrando actividad de archivo:', resultado.error);
              } else {
                console.log('✅ Log de archivo procesado registrado correctamente');
              }
            } else {
              console.warn('⚠️ No se puede registrar actividad: userId no disponible');
            }
          } catch (logError) {
            console.error('❌ Excepción registrando actividad de archivo:', logError);
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
              
              // Registrar log de pedidos procesados (total de pedidos procesados: domicilios + sucursales)
              try {
                if (userId) {
                  // Obtener totales de domicilios y sucursales desde los datos procesados
                  const datosDomicilio = csvToArray(processedData.domicilioCSV);
                  const datosSucursal = csvToArray(processedData.sucursalCSV);
                  const totalPedidosProcesados = datosDomicilio.length + datosSucursal.length;
                  
                  // Contar pedidos únicos por número de pedido
                  const pedidosUnicos = new Set(pedidosParaGuardar.map(p => p.numeroPedido));
                  const resultadoLog = await registrarActividad(
                    userId,
                    username,
                    'pedido_procesado',
                    totalPedidosProcesados, // Total de pedidos procesados (domicilios + sucursales)
                    selectedFile.name,
                    {
                      pedidos_unicos: pedidosUnicos.size,
                      total_domicilios: datosDomicilio.length,
                      total_sucursales: datosSucursal.length,
                      guardados: resultado.guardados,
                      duplicados: resultado.duplicados,
                      errores: resultado.errores,
                      seccion: 'smartship',
                    }
                  );
                  if (!resultadoLog.success) {
                    console.error('❌ Error registrando actividad de pedidos:', resultadoLog.error);
                  } else {
                    console.log(`✅ Log de pedidos procesados registrado correctamente: ${totalPedidosProcesados} pedidos totales`);
                  }
                } else {
                  console.warn('⚠️ No se puede registrar actividad de pedidos: userId no disponible');
                }
              } catch (logError) {
                console.error('❌ Excepción registrando actividad de pedidos:', logError);
              }
            }
          } catch (infoError) {
            console.error('Error al guardar pedidos para Información:', infoError);
            // No interrumpir el flujo si falla
          }
        }
      } catch (err: any) {
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 relative transition-colors duration-300">
        <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6 relative border-2 border-gray-200 dark:border-gray-700">
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
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">SmartShip</h1>
            </div>
            <p className="text-green-600 dark:text-green-400 font-medium text-sm sm:text-base">Transformador de Pedidos Andreani</p>
          </div>

        <div className="space-y-4">
          <FileUploader onFileSelect={handleFileChange} disabled={status === ProcessStatus.PROCESSING} />
          
          <button
            onClick={handleProcessClick}
            disabled={!selectedFile || status === ProcessStatus.PROCESSING}
            className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-900/50 disabled:text-gray-300 dark:disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-sm sm:text-base"
          >
            {status === ProcessStatus.PROCESSING ? 'Procesando...' : 'Procesar Archivo'}
          </button>
        </div>

        <StatusDisplay status={status} error={error} processingInfo={results?.processingInfo} />
        
        {/* Panel de logs de debugging - solo mostrar si hay logs importantes */}
        {debugLogs.length > 0 && (
          <div className="mt-4 bg-gray-900 dark:bg-gray-950 rounded-lg p-4 max-h-96 overflow-y-auto border-2 border-green-500/50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-green-400">
                🐛 DEBUG LOCAL
              </h3>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setDebugLogs([])}
                  className="text-xs text-gray-400 hover:text-gray-300 px-2 py-1 rounded border border-gray-600 hover:border-gray-500"
                >
                  Limpiar
                </button>
                <span className="text-xs text-gray-500">
                  {debugLogs.length} logs
                </span>
              </div>
            </div>
            <div className="font-mono text-xs space-y-1">
              {debugLogs.map((log, index) => (
                <div key={index} className="text-gray-300 break-words hover:bg-gray-800 px-1 rounded">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Modal de sugerencias - aparece antes de ResultsDisplay si hay sugerencias */}
        {mostrarModalSugerencias && sugerenciasPendientes && (
          <SugerenciasSucursalModal
            sugerencias={sugerenciasPendientes}
            onCompletar={async (sugerenciasActualizadas) => {
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

              // Registrar log de archivo procesado (después de procesar sugerencias)
              try {
                if (userId) {
                  const datosDomicilio = csvToArray(results.domicilioCSV);
                  const datosSucursal = csvToArray(sucursalCSVActualizado);
                  
                  // Contar pedidos únicos desde los datos procesados (domicilio + sucursal)
                  const pedidosUnicosProcesados = new Set<string>();
                  
                  // Extraer pedidos únicos de domicilio
                  datosDomicilio.forEach((item: any) => {
                    const numeroPedido = item['Numero Interno Ej: '] || item['Numero Interno'] || '';
                    if (numeroPedido) {
                      const pedidoLimpio = numeroPedido.replace(/^#/, '').trim();
                      if (pedidoLimpio) {
                        pedidosUnicosProcesados.add(pedidoLimpio);
                      }
                    }
                  });
                  
                  // Extraer pedidos únicos de sucursal
                  datosSucursal.forEach((item: any) => {
                    const numeroPedido = item['Numero Interno Ej: '] || item['Numero Interno'] || '';
                    if (numeroPedido) {
                      const pedidoLimpio = numeroPedido.replace(/^#/, '').trim();
                      if (pedidoLimpio) {
                        pedidosUnicosProcesados.add(pedidoLimpio);
                      }
                    }
                  });
                  
                  console.log(`📊 Pedidos únicos procesados (con sugerencias): ${pedidosUnicosProcesados.size}`);
                  
                  const resultado = await registrarActividad(
                    userId,
                    username,
                    'archivo_procesado',
                    1,
                    selectedFile?.name || 'archivo.csv',
                    {
                    total_registros_domicilio: datosDomicilio.length,
                    total_registros_sucursal: datosSucursal.length,
                    pedidos_unicos_csv: pedidosUnicosProcesados.size,
                    sugerencias_aceptadas: sugerenciasAceptadas.length,
                    sugerencias_rechazadas: sugerenciasRechazadas.length,
                    seccion: 'smartship',
                  }
                );
                  if (!resultado.success) {
                    console.error('❌ Error registrando actividad de archivo (con sugerencias):', resultado.error);
                  } else {
                    console.log('✅ Log de archivo procesado (con sugerencias) registrado correctamente');
                  }
                } else {
                  console.warn('⚠️ No se puede registrar actividad: userId no disponible');
                }
              } catch (logError) {
                console.error('❌ Excepción registrando actividad de archivo (con sugerencias):', logError);
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
                  
                  // Registrar log de pedidos procesados (total de pedidos procesados: domicilios + sucursales)
                  try {
                    if (userId) {
                      // Obtener totales de domicilios y sucursales desde los datos procesados
                      const datosDomicilio = csvToArray(results.domicilioCSV);
                      const datosSucursal = csvToArray(sucursalCSVActualizado);
                      const totalPedidosProcesados = datosDomicilio.length + datosSucursal.length;
                      
                      const pedidosUnicos = new Set(pedidosParaGuardar.map(p => p.numeroPedido));
                      const resultadoLog = await registrarActividad(
                        userId,
                        username,
                        'pedido_procesado',
                        totalPedidosProcesados, // Total de pedidos procesados (domicilios + sucursales)
                        selectedFile?.name || 'archivo.csv',
                        {
                          pedidos_unicos: pedidosUnicos.size,
                          total_domicilios: datosDomicilio.length,
                          total_sucursales: datosSucursal.length,
                          guardados: resultado.guardados,
                          duplicados: resultado.duplicados,
                          errores: resultado.errores,
                          sugerencias_aceptadas: sugerenciasAceptadas.length,
                          seccion: 'smartship',
                        }
                      );
                      if (!resultadoLog.success) {
                        console.error('❌ Error registrando actividad de pedidos (con sugerencias):', resultadoLog.error);
                      } else {
                        console.log(`✅ Log de pedidos procesados (con sugerencias) registrado correctamente: ${totalPedidosProcesados} pedidos totales`);
                      }
                    } else {
                      console.warn('⚠️ No se puede registrar actividad de pedidos: userId no disponible');
                    }
                  } catch (logError) {
                    console.error('❌ Excepción registrando actividad de pedidos (con sugerencias):', logError);
                  }
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
        <footer className="text-center mt-6 sm:mt-8 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
          <p>Creado para automatizar la logística de envíos.</p>
          <p className="mt-1 text-gray-600 dark:text-gray-500">by pictoN</p>
        </footer>
      </div>
    </DashboardLayout>
  );
};

export default HomePage;

