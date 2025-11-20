
const fs = require('fs');
const path = require('path');

const tsFilePath = 'services/sucursalesData.ts';
const csvFilePath = 'sucursalescsv.csv';

// 1. Parse TS file
const tsContent = fs.readFileSync(tsFilePath, 'utf8');
const tsNames = new Set();
const regex = /nombre_sucursal:\s*"([^"]+)"/g;
let match;
while ((match = regex.exec(tsContent)) !== null) {
    tsNames.add(match[1].trim());
}

console.log(`Total branches in TS: ${tsNames.size}`);

// 2. Parse CSV file
const csvContent = fs.readFileSync(csvFilePath, 'utf8');
const lines = csvContent.split('\n');
const csvNames = new Set();

// Skip header (line 0)
for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Split by semicolon
    const parts = line.split(';');
    if (parts.length > 0) {
        const name = parts[0].trim();
        if (name) {
            csvNames.add(name);
        }
    }
}

console.log(`Total unique branches in CSV: ${csvNames.size}`);

// 3. Compare
const inTsNotInCsv = [];
for (const name of tsNames) {
    if (!csvNames.has(name)) {
        inTsNotInCsv.push(name);
    }
}

const inCsvNotInTs = [];
for (const name of csvNames) {
    if (!tsNames.has(name)) {
        inCsvNotInTs.push(name);
    }
}

console.log(`\nBranches in TS but NOT in CSV (Possibly closed/renamed/removed): ${inTsNotInCsv.length}`);
if (inTsNotInCsv.length > 0) {
    console.log('Examples (first 10):', inTsNotInCsv.slice(0, 10));
}

console.log(`\nBranches in CSV but NOT in TS (Possibly new): ${inCsvNotInTs.length}`);
if (inCsvNotInTs.length > 0) {
    console.log('Examples (first 10):', inCsvNotInTs.slice(0, 10));
}

// Check for slight discrepancies (normalization issues)
// e.g. "CORDOBA (CENTRO)" vs "CORDOBA ( CENTRO )" or casing
// We used trim() already.


