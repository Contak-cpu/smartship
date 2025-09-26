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
      console.log('Cargando plantilla interna...');
      const response = await fetch('/templates/EnvioMasivoExcelPaquetes (10).xlsx');
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`Error al cargar plantilla: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('Plantilla interna cargada exitosamente, tamaño:', arrayBuffer.byteLength, 'bytes');
      return arrayBuffer;
    } catch (error) {
      console.error('Error cargando plantilla interna:', error);
      throw new Error(`No se pudo cargar la plantilla interna de Andreani: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  async generateExcelWithTemplate(
    processedData: ProcessedData,
    templateData: TemplateData
  ): Promise<ArrayBuffer> {
    const { workbook, domicilioSheet, sucursalSheet } = templateData;
    
    // Crear una copia del workbook para no modificar la plantilla original
    const newWorkbook = new ExcelJS.Workbook();
    
    // Copiar estilos y estructura de la plantilla
    if (domicilioSheet) {
      const newDomicilioSheet = newWorkbook.addWorksheet('A domicilio');
      await this.copySheetStructure(domicilioSheet, newDomicilioSheet);
      await this.populateData(newDomicilioSheet, processedData.domicilioData);
    }
    
    if (sucursalSheet) {
      const newSucursalSheet = newWorkbook.addWorksheet('A sucursal');
      await this.copySheetStructure(sucursalSheet, newSucursalSheet);
      await this.populateData(newSucursalSheet, processedData.sucursalData);
    }

    // Generar el buffer del archivo
    const buffer = await newWorkbook.xlsx.writeBuffer();
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
    console.log('Iniciando generación de Excel con plantilla interna...');
    console.log('Datos domicilio:', domicilioData.length, 'registros');
    console.log('Datos sucursal:', sucursalData.length, 'registros');
    
    // Cargar la plantilla interna
    const templateData = await this.loadTemplate();
    console.log('Plantilla cargada:', templateData);
    
    // Generar Excel con los datos
    const processedData: ProcessedData = {
      domicilioData,
      sucursalData
    };
    
    console.log('Generando Excel con template...');
    const result = await this.generateExcelWithTemplate(processedData, templateData);
    console.log('Excel generado exitosamente, tamaño:', result.byteLength, 'bytes');
    
    return result;
  } catch (error) {
    console.error('Error generando Excel con plantilla interna:', error);
    throw new Error(`Error generando Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}
}

export const excelTemplateProcessor = new ExcelTemplateProcessor();
