const fs = require('fs');

// Leer el archivo
let content = fs.readFileSync('services/sucursalesData.ts', 'utf8');

// Reemplazar todas las líneas que terminan con } por }, excepto la última
const lines = content.split('\n');
const newLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Si la línea contiene un objeto de sucursal y no termina con coma
  if (line.includes('{ nombre_sucursal:') && line.includes('direccion:') && line.trim().endsWith('}')) {
    // Verificar si es la última línea del array (antes del cierre del array)
    const nextLine = lines[i + 1];
    if (nextLine && nextLine.trim() === '];') {
      // Es la última línea, no agregar coma
      newLines.push(line);
    } else {
      // No es la última línea, agregar coma
      newLines.push(line + ',');
    }
  } else {
    newLines.push(line);
  }
}

// Escribir el archivo corregido
const newContent = newLines.join('\n');
fs.writeFileSync('services/sucursalesData.ts', newContent);

console.log('Archivo sucursalesData.ts corregido - comas agregadas');


