import * as ExcelJS from 'exceljs';

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
    // Si no se proporciona buffer, cargar la plantilla interna
    if (!templateBuffer) {
      templateBuffer = await this.loadInternalTemplate();
    }
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(templateBuffer);
    
    // Buscar las hojas de domicilio y sucursal
    const domicilioSheet = workbook.getWorksheet('A domicilio') || 
                          workbook.getWorksheet('domicilio') || 
                          workbook.getWorksheet(0);
    
    const sucursalSheet = workbook.getWorksheet('A sucursal') || 
                         workbook.getWorksheet('sucursal') || 
                         workbook.getWorksheet(1);

    this.templateData = {
      workbook,
      domicilioSheet,
      sucursalSheet
    };

    return this.templateData;
  }

  private async loadInternalTemplate(): Promise<ArrayBuffer> {
    try {
      console.log('Cargando plantilla template.xlsx...');
      const response = await fetch('/templates/template.xlsx');
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`Error al cargar plantilla: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('Plantilla template.xlsx cargada exitosamente, tamaño:', arrayBuffer.byteLength, 'bytes');
      return arrayBuffer;
    } catch (error) {
      console.error('Error cargando plantilla template.xlsx:', error);
      throw new Error(`No se pudo cargar la plantilla template.xlsx: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  async generateExcelWithTemplate(
    processedData: ProcessedData,
    templateData: TemplateData
  ): Promise<ArrayBuffer> {
    const { workbook } = templateData;
    
    // Usar directamente el workbook de la plantilla para mantener toda la estructura
    const templateWorkbook = workbook;
    
    // Buscar las hojas en la plantilla
    const domicilioSheet = templateWorkbook.getWorksheet('A domicilio') || 
                          templateWorkbook.getWorksheet('domicilio') || 
                          templateWorkbook.getWorksheet(0);
    
    const sucursalSheet = templateWorkbook.getWorksheet('A sucursal') || 
                         templateWorkbook.getWorksheet('sucursal') || 
                         templateWorkbook.getWorksheet(1);
    
    // Agregar datos a las hojas existentes
    if (domicilioSheet && processedData.domicilioData.length > 0) {
      await this.populateDataInExistingSheet(domicilioSheet, processedData.domicilioData);
    }
    
    if (sucursalSheet && processedData.sucursalData.length > 0) {
      await this.populateDataInExistingSheet(sucursalSheet, processedData.sucursalData);
    }

    // Generar el buffer del archivo
    const buffer = await templateWorkbook.xlsx.writeBuffer();
    return buffer as ArrayBuffer;
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
    console.log(`Poblando datos en hoja existente: ${sheet.name}`);
    console.log(`Datos a insertar: ${data.length} registros`);
    
    // Buscar la primera fila vacía después de los encabezados
    let startRow = 1;
    let foundEmptyRow = false;
    
    // Buscar desde la fila 1 hacia abajo para encontrar la primera fila vacía
    for (let row = 1; row <= 100; row++) {
      const currentRow = sheet.getRow(row);
      let isEmpty = true;
      
      // Verificar si la fila está vacía
      currentRow.eachCell((cell) => {
        if (cell.value !== null && cell.value !== undefined && cell.value.toString().trim() !== '') {
          isEmpty = false;
        }
      });
      
      if (isEmpty) {
        startRow = row;
        foundEmptyRow = true;
        console.log(`Primera fila vacía encontrada: ${row}`);
        break;
      }
    }
    
    if (!foundEmptyRow) {
      // Si no encontramos fila vacía, usar la última fila + 1
      startRow = sheet.rowCount + 1;
      console.log(`No se encontró fila vacía, usando fila: ${startRow}`);
    }
    
    // Insertar los datos
    data.forEach((rowData, index) => {
      const targetRow = startRow + index;
      const row = sheet.getRow(targetRow);
      
      console.log(`Insertando datos en fila ${targetRow}:`, rowData);
      
      // Mapear los datos a las columnas
      Object.values(rowData).forEach((value, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        cell.value = value;
      });
    });
    
    console.log(`Datos insertados exitosamente desde fila ${startRow}`);
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
    
    // Cargar la plantilla template.xlsx
    const templateData = await this.loadTemplate();
    console.log('Template.xlsx cargada:', templateData);
    
    // Generar Excel con los datos
    const processedData: ProcessedData = {
      domicilioData,
      sucursalData
    };
    
    console.log('Generando Excel con template.xlsx...');
    const result = await this.generateExcelWithTemplate(processedData, templateData);
    console.log('Excel generado exitosamente con template.xlsx, tamaño:', result.byteLength, 'bytes');
    
    return result;
  } catch (error) {
    console.error('Error generando Excel con template.xlsx:', error);
    throw new Error(`Error generando Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}
}

export const excelTemplateProcessor = new ExcelTemplateProcessor();
