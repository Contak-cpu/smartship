const fs = require('fs');

// Leer el archivo
let content = fs.readFileSync('services/sucursalesData.ts', 'utf8');

// Reemplazar caracteres problemáticos específicos
content = content.replace(/Ã"/g, 'Ó');
content = content.replace(/Ã%/g, 'Í');
content = content.replace(/Ãs/g, 'Ú');
content = content.replace(/Ã±/g, 'ñ');
content = content.replace(/Ã¡/g, 'á');
content = content.replace(/Ã©/g, 'é');
content = content.replace(/Ã­/g, 'í');
content = content.replace(/Ã³/g, 'ó');
content = content.replace(/Ãº/g, 'ú');
content = content.replace(/Ã/g, 'Ñ');
content = content.replace(/Ã/g, 'Á');
content = content.replace(/Ã/g, 'É');
content = content.replace(/Ã/g, 'Í');
content = content.replace(/Ã/g, 'Ó');
content = content.replace(/Ã/g, 'Ú');
content = content.replace(/Ã/g, 'Ñ');

// Escribir el archivo corregido
fs.writeFileSync('services/sucursalesData.ts', content);

console.log('Archivo sucursalesData.ts corregido - caracteres de codificación arreglados');


