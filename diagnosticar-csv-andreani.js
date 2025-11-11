#!/usr/bin/env node
/**
 * Script para diagnosticar problemas en CSV generado para Andreani
 * Detecta problemas comunes que Andreani rechaza
 */

const fs = require('fs');
const path = require('path');

// Función para escapar valores CSV correctamente
function escapeCSVValue(value) {
  if (value === null || value === undefined) return '';
  
  const str = String(value);
  
  // Si contiene comillas, punto y coma, o saltos de línea, necesita estar entre comillas
  if (str.includes('"') || str.includes(';') || str.includes('\n') || str.includes('\r')) {
    // Escapar comillas duplicándolas
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

// Función para parsear CSV manualmente
function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  
  // Parsear headers
  const headers = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < lines[0].length; i++) {
    const char = lines[0][i];
    
    if (char === '"') {
      if (inQuotes && lines[0][i + 1] === '"') {
        // Comilla escapada
        current += '"';
        i++; // Saltar la siguiente comilla
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ';' && !inQuotes) {
      headers.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  headers.push(current.trim());
  
  // Parsear filas
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    current = '';
    inQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      
      if (char === '"') {
        if (inQuotes && lines[i][j + 1] === '"') {
          current += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ';' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    // Crear objeto con los valores
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }
  
  return { headers, rows };
}

// Función para validar email
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Función para validar que un valor es numérico
function isNumeric(value) {
  return /^\d+(\.\d+)?$/.test(String(value).trim());
}

// Función para validar DNI
function isValidDNI(dni) {
  const dniStr = String(dni).trim();
  return /^\d{7,8}$/.test(dniStr);
}

// Función para validar teléfono
function isValidPhone(phone) {
  const phoneStr = String(phone).trim();
  return /^\d{6,10}$/.test(phoneStr);
}

// Función para detectar caracteres especiales no permitidos
function hasSpecialCharacters(text) {
  if (!text) return false;
  // Caracteres que pueden causar problemas
  return /[áéíóúñÁÉÍÓÚÑ]/.test(text) || /[^\x20-\x7E\u00A0-\u024F]/g.test(text);
}

function diagnosticarCSV(archivoCSV) {
  console.log(`\n🔍 DIAGNÓSTICO DEL ARCHIVO: ${archivoCSV}\n`);
  console.log('='.repeat(80));
  
  if (!fs.existsSync(archivoCSV)) {
    console.error(`❌ ERROR: No se encuentra el archivo ${archivoCSV}`);
    return;
  }
  
  const contenido = fs.readFileSync(archivoCSV, 'utf-8');
  const { headers, rows } = parseCSV(contenido);
  
  console.log(`\n📊 ESTADÍSTICAS:`);
  console.log(`   - Total de filas: ${rows.length}`);
  console.log(`   - Total de columnas: ${headers.length}`);
  console.log(`   - Columnas: ${headers.join(', ')}\n`);
  
  const problemas = [];
  const advertencias = [];
  
  // Validar cada fila
  rows.forEach((row, index) => {
    const numeroFila = index + 2; // +2 porque la fila 1 es el header y empezamos desde 0
    const numeroInterno = row['Numero Interno'] || row['Numero Interno\nEj: '] || `Fila ${numeroFila}`;
    
    // 1. Validar campos obligatorios
    const camposObligatorios = [
      'Nombre *', 'Apellido *', 'DNI *', 'Email *', 
      'Celular código *', 'Celular número *', 
      'Calle *', 'Número *',
      'Provincia / Localidad / CP *'
    ];
    
    camposObligatorios.forEach(campo => {
      const valor = row[campo] || row[campo + '\nEj: '] || '';
      if (!valor || valor.trim() === '') {
        problemas.push({
          fila: numeroFila,
          orden: numeroInterno,
          tipo: 'CAMPO_OBLIGATORIO_VACIO',
          campo: campo,
          mensaje: `Campo obligatorio "${campo}" está vacío`
        });
      }
    });
    
    // 2. Validar email
    const email = row['Email *'] || row['Email *\nEj: '] || '';
    if (email && !isValidEmail(email)) {
      problemas.push({
        fila: numeroFila,
        orden: numeroInterno,
        tipo: 'EMAIL_INVALIDO',
        campo: 'Email *',
        mensaje: `Email inválido: "${email}"`
      });
    }
    
    // 3. Validar DNI
    const dni = row['DNI *'] || row['DNI *\nEj: '] || '';
    if (dni && !isValidDNI(dni)) {
      problemas.push({
        fila: numeroFila,
        orden: numeroInterno,
        tipo: 'DNI_INVALIDO',
        campo: 'DNI *',
        mensaje: `DNI inválido: "${dni}" (debe tener 7 u 8 dígitos)`
      });
    }
    
    // 4. Validar números (peso, dimensiones, valor declarado)
    const camposNumericos = [
      { nombre: 'Peso (grs)', valor: row['Peso (grs)'] || row['Peso (grs)\nEj: '] || '' },
      { nombre: 'Alto (cm)', valor: row['Alto (cm)'] || row['Alto (cm)\nEj: '] || '' },
      { nombre: 'Ancho (cm)', valor: row['Ancho (cm)'] || row['Ancho (cm)\nEj: '] || '' },
      { nombre: 'Profundidad (cm)', valor: row['Profundidad (cm)'] || row['Profundidad (cm)\nEj: '] || '' },
      { nombre: 'Valor declarado ($ C/IVA) *', valor: row['Valor declarado ($ C/IVA) *'] || row['Valor declarado ($ C/IVA) *\nEj: '] || '' },
      { nombre: 'Número *', valor: row['Número *'] || row['Número *\nEj: '] || '' }
    ];
    
    camposNumericos.forEach(({ nombre, valor }) => {
      if (valor && !isNumeric(valor)) {
        problemas.push({
          fila: numeroFila,
          orden: numeroInterno,
          tipo: 'VALOR_NO_NUMERICO',
          campo: nombre,
          mensaje: `Campo "${nombre}" debe ser numérico, valor encontrado: "${valor}"`
        });
      }
    });
    
    // 5. Validar teléfono
    const codigoArea = row['Celular código *'] || row['Celular código *\nEj: '] || '';
    const numeroTelefono = row['Celular número *'] || row['Celular número *\nEj: '] || '';
    
    if (codigoArea && !isValidPhone(codigoArea)) {
      advertencias.push({
        fila: numeroFila,
        orden: numeroInterno,
        tipo: 'CODIGO_AREA_INVALIDO',
        mensaje: `Código de área puede ser inválido: "${codigoArea}"`
      });
    }
    
    if (numeroTelefono && !isValidPhone(numeroTelefono)) {
      problemas.push({
        fila: numeroFila,
        orden: numeroInterno,
        tipo: 'TELEFONO_INVALIDO',
        campo: 'Celular número *',
        mensaje: `Número de teléfono inválido: "${numeroTelefono}"`
      });
    }
    
    // 6. Detectar caracteres especiales problemáticos
    const camposTexto = [
      'Nombre *', 'Apellido *', 'Calle *', 'Piso', 'Departamento'
    ];
    
    camposTexto.forEach(campo => {
      const valor = row[campo] || row[campo + '\nEj: '] || '';
      if (hasSpecialCharacters(valor)) {
        advertencias.push({
          fila: numeroFila,
          orden: numeroInterno,
          tipo: 'CARACTERES_ESPECIALES',
          campo: campo,
          mensaje: `Campo "${campo}" contiene caracteres especiales (acentos): "${valor.substring(0, 30)}..."`
        });
      }
    });
    
    // 7. Validar formato de Provincia / Localidad / CP
    const provinciaLocalidadCP = row['Provincia / Localidad / CP *'] || 
                                  row['Provincia / Localidad / CP * \nEj: BUENOS AIRES / 11 DE SEPTIEMBRE / 1657'] || '';
    
    if (provinciaLocalidadCP) {
      const partes = provinciaLocalidadCP.split('/').map(p => p.trim());
      if (partes.length !== 3) {
        problemas.push({
          fila: numeroFila,
          orden: numeroInterno,
          tipo: 'FORMATO_PROVINCIA_LOCALIDAD_CP_INVALIDO',
          campo: 'Provincia / Localidad / CP *',
          mensaje: `Formato debe ser "PROVINCIA / LOCALIDAD / CP", encontrado: "${provinciaLocalidadCP}"`
        });
      }
    }
    
    // 8. Detectar valores con punto y coma sin comillas (problema de escape)
    Object.keys(row).forEach(campo => {
      const valor = String(row[campo]);
      if (valor.includes(';') && !valor.startsWith('"') && !valor.endsWith('"')) {
        problemas.push({
          fila: numeroFila,
          orden: numeroInterno,
          tipo: 'VALOR_SIN_ESCAPAR',
          campo: campo,
          mensaje: `Campo "${campo}" contiene punto y coma sin comillas: "${valor.substring(0, 50)}..."`
        });
      }
    });
  });
  
  // Mostrar resultados
  console.log(`\n🔴 PROBLEMAS CRÍTICOS ENCONTRADOS: ${problemas.length}`);
  console.log('='.repeat(80));
  
  if (problemas.length === 0) {
    console.log('✅ No se encontraron problemas críticos.');
  } else {
    // Agrupar por tipo de problema
    const porTipo = {};
    problemas.forEach(p => {
      if (!porTipo[p.tipo]) porTipo[p.tipo] = [];
      porTipo[p.tipo].push(p);
    });
    
    Object.keys(porTipo).forEach(tipo => {
      console.log(`\n📋 ${tipo}: ${porTipo[tipo].length} ocurrencia(s)`);
      porTipo[tipo].slice(0, 10).forEach(p => {
        console.log(`   - Fila ${p.fila} (${p.orden}): ${p.mensaje}`);
      });
      if (porTipo[tipo].length > 10) {
        console.log(`   ... y ${porTipo[tipo].length - 10} más`);
      }
    });
  }
  
  console.log(`\n🟡 ADVERTENCIAS: ${advertencias.length}`);
  console.log('='.repeat(80));
  
  if (advertencias.length === 0) {
    console.log('✅ No se encontraron advertencias.');
  } else {
    advertencias.slice(0, 10).forEach(a => {
      console.log(`   - Fila ${a.fila} (${a.orden}): ${a.mensaje}`);
    });
    if (advertencias.length > 10) {
      console.log(`   ... y ${advertencias.length - 10} más`);
    }
  }
  
  // Recomendaciones
  console.log(`\n💡 RECOMENDACIONES:`);
  console.log('='.repeat(80));
  
  if (problemas.length > 0) {
    console.log('1. Corregir los problemas críticos listados arriba antes de subir a Andreani.');
    console.log('2. Verificar que los valores con punto y coma o comillas estén correctamente escapados.');
    console.log('3. Asegurarse de que todos los campos obligatorios tengan valores.');
  }
  
  if (advertencias.length > 0) {
    console.log('4. Considerar normalizar nombres y direcciones removiendo acentos.');
  }
  
  console.log('\n');
  
  // Guardar reporte
  const reporte = {
    fecha: new Date().toISOString(),
    archivo: archivoCSV,
    totalFilas: rows.length,
    problemas: problemas,
    advertencias: advertencias,
    resumen: {
      problemasCriticos: problemas.length,
      advertencias: advertencias.length
    }
  };
  
  const reportePath = archivoCSV.replace(/\.csv$/i, '_reporte_diagnostico.json');
  fs.writeFileSync(reportePath, JSON.stringify(reporte, null, 2), 'utf-8');
  console.log(`📄 Reporte completo guardado en: ${reportePath}\n`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const archivo = process.argv[2];
  
  if (!archivo) {
    console.error('Uso: node diagnosticar-csv-andreani.js <archivo.csv>');
    console.error('Ejemplo: node diagnosticar-csv-andreani.js Andreani_Domicilio.csv');
    process.exit(1);
  }
  
  diagnosticarCSV(archivo);
}

module.exports = { diagnosticarCSV, parseCSV, escapeCSVValue };






























