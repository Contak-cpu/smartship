#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para generar sucursalesDataCorreoARG.ts con los datos embebidos
"""

import csv
import json

def escape_string(text):
    """Escape strings para TypeScript"""
    return text.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')

def parse_csv():
    """Parsear el CSV y generar el archivo TypeScript"""
    
    sucursales = []
    
    with open('public/codigos_sucursales_correo_argentino.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, skipinitialspace=True)
        for row in reader:
            # Los headers tienen espacios al final, necesitamos manejar eso
            codigo = (row.get('CÓDIGO ', row.get('CÓDIGO', ''))).strip()
            calle = (row.get('CALLE ', row.get('CALLE', ''))).strip()
            numero = (row.get('NÚMERO ', row.get('NÚMERO', ''))).strip()
            localidad = (row.get('LOCALIDAD ', row.get('LOCALIDAD', ''))).strip()
            provincia = (row.get('PROVINCIA ', row.get('PROVINCIA', ''))).strip()
            
            if codigo and localidad and provincia:
                sucursales.append({
                    'codigo': codigo,
                    'calle': calle,
                    'numero': numero,
                    'localidad': localidad,
                    'provincia': provincia
                })
    
    return sucursales

def generate_typescript(sucursales):
    """Generar el archivo TypeScript"""
    
    output = """// Datos embebidos de sucursales de Correo Argentino
// Extraídos de public/codigos_sucursales_correo_argentino.csv
// GENERADO AUTOMÁTICAMENTE - NO EDITAR MANUALMENTE

export interface CorreoArgentinoSucursalInfo {
  codigo: string;
  calle: string;
  numero: string;
  localidad: string;
  provincia: string;
}

export const CORREO_ARGENTINO_SUCURSALES_DATA: CorreoArgentinoSucursalInfo[] = [
"""
    
    for suc in sucursales:
        output += f"""  {{ codigo: "{escape_string(suc['codigo'])}", calle: "{escape_string(suc['calle'])}", numero: "{escape_string(suc['numero'])}", localidad: "{escape_string(suc['localidad'])}", provincia: "{escape_string(suc['provincia'])}" }},
"""
    
    output += "];\n"
    
    return output

def main():
    print("Generando sucursalesDataCorreoARG.ts...")
    sucursales = parse_csv()
    print(f"[OK] Parseadas {len(sucursales)} sucursales")
    
    typescript_content = generate_typescript(sucursales)
    
    output_file = 'services/sucursalesDataCorreoARG.ts'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(typescript_content)
    
    print(f"[OK] Archivo generado: {output_file}")
    print(f"[OK] Total de sucursales embebidas: {len(sucursales)}")

if __name__ == '__main__':
    main()

