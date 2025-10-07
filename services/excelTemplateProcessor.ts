import * as ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';

export interface TemplateData {
  workbook: ExcelJS.Workbook;
  domicilioSheet?: ExcelJS.Worksheet;
  sucursalSheet?: ExcelJS.Worksheet;
}

export interface ProcessedData {
  domicilioData: any[];
  sucursalData: any[];
}

export class ExcelTemplateProcessor {
  private templateData: TemplateData | null = null;

  async loadTemplate(templateBuffer?: ArrayBuffer): Promise<TemplateData> {
    try {
      console.log('=== CARGANDO TEMPLATE ===');
      
      // Si no se proporciona buffer, cargar la plantilla interna
      if (!templateBuffer) {
        console.log('Cargando plantilla interna...');
        templateBuffer = await this.loadInternalTemplate();
      }
      
      console.log('Buffer del template recibido, tamaño:', templateBuffer.byteLength, 'bytes');
      
      const workbook = new ExcelJS.Workbook();
      console.log('Cargando workbook desde buffer...');
      await workbook.xlsx.load(templateBuffer);
      
      console.log('Workbook cargado exitosamente');
      console.log('Nombres de hojas disponibles:', workbook.worksheets.map(ws => ws.name));
      
      // Buscar las hojas de domicilio y sucursal
      const domicilioSheet = workbook.getWorksheet('A domicilio') || 
                            workbook.getWorksheet('domicilio') || 
                            workbook.getWorksheet(0);
      
      const sucursalSheet = workbook.getWorksheet('A sucursal') || 
                           workbook.getWorksheet('sucursal') || 
                           workbook.getWorksheet(1);

      console.log('Hoja de domicilio encontrada:', domicilioSheet ? domicilioSheet.name : 'NO ENCONTRADA');
      console.log('Hoja de sucursal encontrada:', sucursalSheet ? sucursalSheet.name : 'NO ENCONTRADA');
      
      if (domicilioSheet) {
        console.log(`Hoja domicilio - Filas: ${domicilioSheet.rowCount}, Columnas: ${domicilioSheet.columnCount}`);
      }
      
      if (sucursalSheet) {
        console.log(`Hoja sucursal - Filas: ${sucursalSheet.rowCount}, Columnas: ${sucursalSheet.columnCount}`);
      }

      this.templateData = {
        workbook,
        domicilioSheet,
        sucursalSheet
      };

      console.log('=== TEMPLATE CARGADO EXITOSAMENTE ===');
      return this.templateData;
    } catch (error) {
      console.error('❌ Error cargando template:', error);
      throw error;
    }
  }

  private async loadInternalTemplate(): Promise<ArrayBuffer> {
    try {
      console.log('Cargando plantilla template.xlsx...');
      
      // Verificar que el archivo existe
      const response = await fetch('/templates/template.xlsx');
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.error('Error en la respuesta:', response.status, response.statusText);
        throw new Error(`Error al cargar plantilla: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('Plantilla template.xlsx cargada exitosamente, tamaño:', arrayBuffer.byteLength, 'bytes');
      
      // Verificar que el buffer no esté vacío
      if (arrayBuffer.byteLength === 0) {
        throw new Error('El archivo template.xlsx está vacío');
      }
      
      return arrayBuffer;
    } catch (error) {
      console.error('Error cargando plantilla template.xlsx:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
      throw new Error(`No se pudo cargar la plantilla template.xlsx: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  async generateExcelWithTemplate(
    processedData: ProcessedData,
    templateData: TemplateData
  ): Promise<ArrayBuffer> {
    try {
      console.log('=== INICIANDO GENERACIÓN DE EXCEL CON TEMPLATE ===');
      const { workbook } = templateData;
      
      console.log('Nombres de hojas en el template:', workbook.worksheets.map(ws => ws.name));
      
      // Usar directamente el workbook de la plantilla para mantener toda la estructura
      const templateWorkbook = workbook;
      
      // Buscar las hojas en la plantilla
      const domicilioSheet = templateWorkbook.getWorksheet('A domicilio') || 
                            templateWorkbook.getWorksheet('domicilio') || 
                            templateWorkbook.getWorksheet(0);
      
      const sucursalSheet = templateWorkbook.getWorksheet('A sucursal') || 
                           templateWorkbook.getWorksheet('sucursal') || 
                           templateWorkbook.getWorksheet(1);
      
      console.log('Hoja de domicilio encontrada:', domicilioSheet ? domicilioSheet.name : 'NO ENCONTRADA');
      console.log('Hoja de sucursal encontrada:', sucursalSheet ? sucursalSheet.name : 'NO ENCONTRADA');
      console.log('Datos domicilio:', processedData.domicilioData.length, 'registros');
      console.log('Datos sucursal:', processedData.sucursalData.length, 'registros');
      
      // Agregar datos a las hojas existentes
      if (domicilioSheet && processedData.domicilioData.length > 0) {
        console.log('Procesando datos de domicilio...');
        await this.populateDataInExistingSheet(domicilioSheet, processedData.domicilioData);
      } else {
        console.log('⚠️ No se procesaron datos de domicilio');
      }
      
      if (sucursalSheet && processedData.sucursalData.length > 0) {
        console.log('Procesando datos de sucursal...');
        await this.populateDataInExistingSheet(sucursalSheet, processedData.sucursalData);
      } else {
        console.log('⚠️ No se procesaron datos de sucursal');
      }

      console.log('Generando buffer del archivo...');
      // Generar el buffer del archivo
      const buffer = await templateWorkbook.xlsx.writeBuffer();
      console.log('Buffer generado exitosamente, tamaño:', buffer.byteLength, 'bytes');
      
      return buffer as ArrayBuffer;
    } catch (error) {
      console.error('❌ Error en generateExcelWithTemplate:', error);
      throw error;
    }
  }

  private async copySheetStructure(sourceSheet: ExcelJS.Worksheet, targetSheet: ExcelJS.Worksheet) {
    // Copiar propiedades de la hoja
    targetSheet.properties = { ...sourceSheet.properties };
    
    // Copiar columnas
    sourceSheet.columns.forEach((column, index) => {
      if (column) {
        targetSheet.getColumn(index + 1).width = column.width;
        targetSheet.getColumn(index + 1).hidden = column.hidden;
      }
    });

    // Copiar estilos de las primeras filas (headers y formato)
    const headerRowCount = 2; // Asumiendo 2 filas de headers
    for (let row = 1; row <= headerRowCount; row++) {
      const sourceRow = sourceSheet.getRow(row);
      const targetRow = targetSheet.getRow(row);
      
      sourceRow.eachCell((cell, colNumber) => {
        const targetCell = targetRow.getCell(colNumber);
        
        // Copiar valor
        targetCell.value = cell.value;
        
        // Copiar estilo
        if (cell.style) {
          targetCell.style = { ...cell.style };
        }
        
        // Copiar formato
        if (cell.numFmt) {
          targetCell.numFmt = cell.numFmt;
        }
      });
    }
  }

  private async populateData(sheet: ExcelJS.Worksheet, data: any[]) {
    // Encontrar la fila donde empezar a insertar datos (después de los headers)
    const startRow = 3; // Asumiendo que los datos empiezan en la fila 3
    
    data.forEach((rowData, index) => {
      const row = sheet.getRow(startRow + index);
      
      // Mapear los datos a las columnas correctas
      Object.values(rowData).forEach((value, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        cell.value = value;
      });
    });
  }

  private async populateDataInExistingSheet(sheet: ExcelJS.Worksheet, data: any[]) {
    try {
      console.log(`=== POBLANDO DATOS EN HOJA: ${sheet.name} ===`);
      console.log(`Datos a insertar: ${data.length} registros`);
      console.log(`Total de filas en la hoja: ${sheet.rowCount}`);
      console.log(`Total de columnas en la hoja: ${sheet.columnCount}`);
      
      if (!data || data.length === 0) {
        console.log('No hay datos para insertar');
        return;
      }
      
      // Mostrar estructura de la hoja para debugging
      console.log('=== ESTRUCTURA DE LA HOJA ===');
      for (let row = 1; row <= Math.min(10, sheet.rowCount); row++) {
        const currentRow = sheet.getRow(row);
        const rowData = [];
        currentRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          rowData.push(`Col${colNumber}: "${cell.value || ''}"`);
        });
        console.log(`Fila ${row}:`, rowData.join(' | '));
      }
      
      // Buscar la primera fila vacía después de los encabezados
      let startRow = 1;
      let foundEmptyRow = false;
      
      // Buscar desde la fila 1 hacia abajo para encontrar la primera fila vacía
      for (let row = 1; row <= Math.min(100, sheet.rowCount + 10); row++) {
        const currentRow = sheet.getRow(row);
        let isEmpty = true;
        
        // Verificar si la fila está vacía
        currentRow.eachCell({ includeEmpty: true }, (cell) => {
          if (cell.value !== null && cell.value !== undefined && cell.value.toString().trim() !== '') {
            isEmpty = false;
          }
        });
        
        console.log(`Fila ${row} está vacía:`, isEmpty);
        
        if (isEmpty) {
          startRow = row;
          foundEmptyRow = true;
          console.log(`✅ Primera fila vacía encontrada: ${row}`);
          break;
        }
      }
      
      if (!foundEmptyRow) {
        // Si no encontramos fila vacía, usar la última fila + 1
        startRow = Math.max(sheet.rowCount + 1, 1);
        console.log(`⚠️ No se encontró fila vacía, usando fila: ${startRow}`);
      }
      
      console.log(`=== INSERTANDO DATOS DESDE FILA ${startRow} ===`);
      
      // Insertar los datos
      data.forEach((rowData, index) => {
        try {
          const targetRow = startRow + index;
          const row = sheet.getRow(targetRow);
          
          console.log(`Insertando datos en fila ${targetRow}:`, rowData);
          
          // Mapear los datos a las columnas
          const values = Object.values(rowData);
          console.log(`Valores a insertar:`, values);
          
          values.forEach((value, colIndex) => {
            try {
              const cell = row.getCell(colIndex + 1);
              const oldValue = cell.value;
              cell.value = value;
              console.log(`Celda ${targetRow},${colIndex + 1}: "${oldValue}" -> "${value}"`);
            } catch (cellError) {
              console.error(`❌ Error insertando en celda ${targetRow}, ${colIndex + 1}:`, cellError);
            }
          });
          
          // Verificar que los datos se insertaron
          console.log(`✅ Fila ${targetRow} completada`);
        } catch (rowError) {
          console.error(`❌ Error insertando fila ${startRow + index}:`, rowError);
        }
      });
      
      console.log(`=== DATOS INSERTADOS EXITOSAMENTE DESDE FILA ${startRow} ===`);
      
      // Verificar los datos insertados
      console.log('=== VERIFICANDO DATOS INSERTADOS ===');
      for (let i = 0; i < Math.min(3, data.length); i++) {
        const checkRow = startRow + i;
        const row = sheet.getRow(checkRow);
        const rowData = [];
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          rowData.push(`Col${colNumber}: "${cell.value || ''}"`);
        });
        console.log(`Fila ${checkRow} después de inserción:`, rowData.join(' | '));
      }
      
    } catch (error) {
      console.error('❌ Error en populateDataInExistingSheet:', error);
      throw error;
    }
  }

  // Método para detectar automáticamente las columnas en la plantilla
  detectColumns(sheet: ExcelJS.Worksheet): string[] {
    const columns: string[] = [];
    const headerRow = sheet.getRow(2); // Asumiendo que los headers están en la fila 2
    
    headerRow.eachCell((cell, colNumber) => {
      if (cell.value) {
        columns.push(cell.value.toString());
      }
    });
    
    return columns;
  }

  // Método para mapear datos a las columnas de la plantilla
  mapDataToTemplate(data: any[], templateColumns: string[]): any[] {
    return data.map(row => {
      const mappedRow: any = {};
      
      // Mapear cada columna de la plantilla
      templateColumns.forEach((templateCol, index) => {
        // Buscar el valor correspondiente en los datos
        const dataValue = Object.values(row)[index] || '';
        mappedRow[templateCol] = dataValue;
      });
      
    return mappedRow;
  });
}

// Método simplificado para generar Excel con plantilla interna
async generateExcelWithInternalTemplate(domicilioData: any[], sucursalData: any[]): Promise<ArrayBuffer> {
  try {
    console.log('Iniciando generación de Excel con template.xlsx...');
    console.log('Datos domicilio:', domicilioData.length, 'registros');
    console.log('Datos sucursal:', sucursalData.length, 'registros');
    
    // Intentar primero con XLSX (más simple y confiable)
    try {
      console.log('Intentando con XLSX...');
      return await this.generateExcelWithXLSX(domicilioData, sucursalData);
    } catch (xlsxError) {
      console.warn('Error con XLSX, intentando con ExcelJS:', xlsxError);
      
      // Fallback con ExcelJS
      const templateData = await this.loadTemplate();
      console.log('Template.xlsx cargada:', templateData);
      
      const processedData: ProcessedData = {
        domicilioData,
        sucursalData
      };
      
      console.log('Generando Excel con template.xlsx...');
      const result = await this.generateExcelWithTemplate(processedData, templateData);
      console.log('Excel generado exitosamente con template.xlsx, tamaño:', result.byteLength, 'bytes');
      
      return result;
    }
  } catch (error) {
    console.error('Error generando Excel con template.xlsx:', error);
    throw new Error(`Error generando Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Método alternativo usando solo XLSX
private async generateExcelWithXLSX(domicilioData: any[], sucursalData: any[]): Promise<ArrayBuffer> {
  try {
    console.log('=== GENERANDO EXCEL CON XLSX ===');
    
    // Cargar el template usando XLSX
    const templateResponse = await fetch('/templates/template.xlsx');
    if (!templateResponse.ok) {
      throw new Error(`Error cargando template: ${templateResponse.status}`);
    }
    
    const templateBuffer = await templateResponse.arrayBuffer();
    console.log('Template cargado con XLSX, tamaño:', templateBuffer.byteLength, 'bytes');
    
    // Leer el template
    const templateWorkbook = XLSX.read(templateBuffer, { type: 'array' });
    console.log('Hojas en template:', templateWorkbook.SheetNames);
    
    // Buscar las hojas de domicilio y sucursal
    const domicilioSheetName = templateWorkbook.SheetNames.find(name => 
      name.toLowerCase().includes('domicilio') || name.toLowerCase().includes('a domicilio')
    );
    const sucursalSheetName = templateWorkbook.SheetNames.find(name => 
      name.toLowerCase().includes('sucursal') || name.toLowerCase().includes('a sucursal')
    );
    
    console.log('Hoja domicilio encontrada:', domicilioSheetName || 'NO ENCONTRADA');
    console.log('Hoja sucursal encontrada:', sucursalSheetName || 'NO ENCONTRADA');
    
    // Insertar datos en domicilios
    if (domicilioSheetName && domicilioData.length > 0) {
      const domicilioSheet = templateWorkbook.Sheets[domicilioSheetName];
      console.log('Insertando datos de domicilio...');
      await this.insertDataIntoXLSXSheet(domicilioSheet, domicilioData);
    }
    
    // Insertar datos en sucursales
    if (sucursalSheetName && sucursalData.length > 0) {
      const sucursalSheet = templateWorkbook.Sheets[sucursalSheetName];
      console.log('Insertando datos de sucursal...');
      await this.insertDataIntoXLSXSheet(sucursalSheet, sucursalData);
    }
    
    // Convertir a buffer
    const outputBuffer = XLSX.write(templateWorkbook, { 
      bookType: 'xlsx', 
      type: 'array',
      compression: true 
    });
    
    console.log('Excel generado con XLSX exitosamente, tamaño:', outputBuffer.byteLength, 'bytes');
    return new Uint8Array(outputBuffer).buffer;
    
  } catch (error) {
    console.error('Error generando Excel con XLSX:', error);
    throw error;
  }
}

// Método para insertar datos en una hoja XLSX
private async insertDataIntoXLSXSheet(sheet: XLSX.WorkSheet, data: any[]): Promise<void> {
  try {
    console.log(`Insertando ${data.length} registros en hoja XLSX`);
    
    // Encontrar la primera fila vacía
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    console.log('Rango de la hoja:', sheet['!ref']);
    console.log('Última fila:', range.e.r);
    
    // Buscar la primera fila vacía
    let startRow = range.e.r + 1; // Empezar después de la última fila
    
    // Verificar si hay filas vacías en el medio
    for (let row = 1; row <= range.e.r; row++) {
      let isEmpty = true;
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (sheet[cellRef] && sheet[cellRef].v) {
          isEmpty = false;
          break;
        }
      }
      if (isEmpty) {
        startRow = row;
        console.log(`Fila vacía encontrada en posición ${row}`);
        break;
      }
    }
    
    console.log(`Insertando datos desde fila ${startRow}`);
    
    // Insertar los datos
    data.forEach((rowData, index) => {
      const targetRow = startRow + index;
      const values = Object.values(rowData);
      
      values.forEach((value, colIndex) => {
        const cellRef = XLSX.utils.encode_cell({ r: targetRow, c: colIndex });
        sheet[cellRef] = { v: value };
      });
      
      console.log(`Fila ${targetRow} insertada:`, values.slice(0, 3)); // Mostrar solo los primeros 3 valores
    });
    
    // Actualizar el rango de la hoja
    const newRange = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    newRange.e.r = Math.max(newRange.e.r, startRow + data.length - 1);
    sheet['!ref'] = XLSX.utils.encode_range(newRange);
    
    console.log(`Datos insertados exitosamente. Nuevo rango: ${sheet['!ref']}`);
    
  } catch (error) {
    console.error('Error insertando datos en hoja XLSX:', error);
    throw error;
  }
}
}

export const excelTemplateProcessor = new ExcelTemplateProcessor();
