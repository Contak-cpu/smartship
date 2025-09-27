const fs = require('fs');

// Leer el archivo
let content = fs.readFileSync('services/sucursalesData.ts', 'utf8');

// Reemplazar caracteres problemáticos
const replacements = {
  'Ã¡': 'á',
  'Ã©': 'é', 
  'Ã­': 'í',
  'Ã³': 'ó',
  'Ãº': 'ú',
  'Ã±': 'ñ',
  'Ã': 'Ñ',
  'Ã"': 'Ó',
  'Ã%': 'Í',
  'Ãs': 'Ú',
  'Ã': 'Á',
  'Ã': 'É',
  'Ã': 'Í',
  'Ã': 'Ó',
  'Ã': 'Ú',
  'Ã': 'Ñ'
};

// Aplicar reemplazos
for (const [bad, good] of Object.entries(replacements)) {
  content = content.replace(new RegExp(bad, 'g'), good);
}

// Escribir el archivo corregido
fs.writeFileSync('services/sucursalesData.ts', content);

console.log('Archivo sucursalesData.ts corregido - caracteres de codificación arreglados');


