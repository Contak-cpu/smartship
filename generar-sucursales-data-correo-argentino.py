#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para generar sucursalesDataCorreoARG.ts con los datos embebidos
"""

import csv
import json
import os

def escape_string(text):
    """Escape strings para TypeScript"""
    return text.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')

def parse_csv():
    """Parsear el CSV y generar el archivo TypeScript"""
    
    sucursales = []
    
    # Usar el nuevo archivo proporcionado por el usuario
    csv_file = 'codigos_sucursales_y_provincias_MiCorreo (1).csv'
    
    if not os.path.exists(csv_file):
        print(f"ERROR: No se encuentra el archivo {csv_file}")
        return []
        
    try:
        # Intentar con utf-8-sig para manejar BOM si existe
        with open(csv_file, 'r', encoding='utf-8-sig') as f:
            # Detectar delimitador (parece ser punto y coma)
            reader = csv.DictReader(f, delimiter=';', skipinitialspace=True)
            
            # Imprimir headers detectados para debug
            print(f"Headers originales: {reader.fieldnames}")
            
            # Normalizar nombres de headers (quitar espacios extra y normalizar mayúsculas)
            if reader.fieldnames:
                reader.fieldnames = [name.strip() for name in reader.fieldnames]
                print(f"Headers normalizados: {reader.fieldnames}")
            
            for row in reader:
                # Buscar por nombre exacto después de normalizar
                # Si falla, intentar imprimir las claves disponibles en la primera fila
                
                codigo = (row.get('CÓDIGO', '')).strip()
                calle = (row.get('CALLE', '')).strip()
                numero = (row.get('NÚMERO', '')).strip()
                localidad = (row.get('LOCALIDAD', '')).strip()
                provincia = (row.get('PROVINCIA', '')).strip()
                
                # Si no encuentra con tildes, intentar sin tildes o con variantes comunes
                if not codigo:
                     codigo = (row.get('CODIGO', '')).strip()
                if not numero:
                     numero = (row.get('NUMERO', '')).strip()
                
                if codigo and localidad and provincia:
                    sucursales.append({
                        'codigo': codigo,
                        'calle': calle,
                        'numero': numero,
                        'localidad': localidad,
                        'provincia': provincia
                    })
                else:
                     # Debug para primeras filas fallidas
                     if len(sucursales) < 3:
                         print(f"Fila ignorada (faltan datos): {row}")
                         
    except Exception as e:
        print(f"Error leyendo CSV: {e}")
    
    return sucursales

def generate_typescript(sucursales):
    """Generar el archivo TypeScript"""
    
    output = """// Datos embebidos de sucursales de Correo Argentino
// Extraídos de codigos_sucursales_y_provincias_MiCorreo (1).csv
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
    
    # Agregar las funciones estáticas al final
    output += """
// ============================================
// FUNCIONES DE NORMALIZACIÓN Y BÚSQUEDA
// ============================================

/**
 * Función para normalizar texto para búsqueda - debe funcionar con y sin tildes
 * Corrige problemas de codificación UTF-8 y normaliza caracteres especiales
 */
export const normalizarTexto = (texto: string): string => {
  if (!texto) return '';
  
  let normalizado = texto.trim();
  
  // Primero corregir caracteres mal codificados comunes (UTF-8 mal interpretado)
  normalizado = normalizado
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã/g, 'Á')
    .replace(/Ã‰/g, 'É')
    .replace(/Ã/g, 'Í')
    .replace(/Ã"/g, 'Ó')
    .replace(/Ãš/g, 'Ú')
    .replace(/Ã'/g, 'Ñ')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã¼/g, 'ü')
    .replace(/Ã¶/g, 'ö');
  
  // Convertir a mayúsculas
  normalizado = normalizado.toUpperCase();
  
  // Normalizar TODOS los acentos y caracteres especiales a su versión sin acento
  normalizado = normalizado
    .replace(/[ÁÀÄÂ]/g, 'A')
    .replace(/[ÉÈËÊ]/g, 'E')
    .replace(/[ÍÌÏÎ]/g, 'I')
    .replace(/[ÓÒÖÔ]/g, 'O')
    .replace(/[ÚÙÜÛ]/g, 'U')
    .replace(/[Ñ]/g, 'N')
    .replace(/[Ç]/g, 'C');
  
  return normalizado;
};

/**
 * Función para normalizar nombres de provincias (mapear variantes comunes y normalizar texto)
 */
export const normalizarProvincia = (provincia: string): string => {
  if (!provincia) return '';
  
  // Primero normalizar el texto (quitar acentos, etc.)
  let provinciaNormalizada = normalizarTexto(provincia);
  
  // Mapear variantes comunes de provincias (después de normalizar)
  const mapeoProvincias: Record<string, string> = {
    'GRAN BUENOS AIRES': 'BUENOS AIRES',
    'CAPITAL FEDERAL': 'BUENOS AIRES',
    'CABA': 'BUENOS AIRES',
    'CIUDAD AUTONOMA BUENOS AIRES': 'BUENOS AIRES',
    'CIUDAD AUTONOMA DE BUENOS AIRES': 'BUENOS AIRES',
    'LA PAMPA': 'LA PAMPA',
  };
  
  // Si hay un mapeo específico, usarlo, sino devolver el normalizado
  return mapeoProvincias[provinciaNormalizada] || provinciaNormalizada;
};

/**
 * Función para cargar sucursales de Correo Argentino desde datos embebidos
 */
export const loadCorreoArgentinoSucursales = async (): Promise<CorreoArgentinoSucursalInfo[]> => {
  try {
    // Retornar datos embebidos directamente
    console.log(`✅ Cargadas ${CORREO_ARGENTINO_SUCURSALES_DATA.length} sucursales de Correo Argentino (desde datos embebidos)`);
    return CORREO_ARGENTINO_SUCURSALES_DATA;
  } catch (error) {
    console.error('Error cargando sucursales de Correo Argentino:', error);
    // Retornar array vacío si falla la carga
    return [];
  }
};

/**
 * Función para buscar código de sucursal por localidad y provincia
 * Implementa múltiples estrategias de búsqueda:
 * 1. Caso especial para Córdoba Capital (XFZ)
 * 2. Coincidencia exacta por localidad y provincia
 * 3. Coincidencia parcial de localidad (una palabra)
 * 4. Coincidencia por palabra base de localidad
 * 5. Coincidencia solo por provincia (último recurso)
 */
export const findCodigoSucursalCorreoArgentino = (
  localidad: string,
  provincia: string,
  codigoPostal?: string,
  direccion?: string,
  sucursales: CorreoArgentinoSucursalInfo[] = CORREO_ARGENTINO_SUCURSALES_DATA
): string => {
  if (!sucursales || sucursales.length === 0) {
    console.warn('No hay sucursales cargadas para buscar');
    return '';
  }
  
  const localidadNormalizada = normalizarTexto(localidad);
  let provinciaNormalizada = normalizarProvincia(provincia);
  const direccionNormalizada = direccion ? normalizarTexto(direccion) : '';
  
  console.log(`🔍 Buscando sucursal:`);
  console.log(`   Input - localidad="${localidad}", provincia="${provincia}"`);
  console.log(`   Normalizado - localidad="${localidadNormalizada}", provincia="${provinciaNormalizada}"`);
  
  // BÚSQUEDA ESPECÍFICA PARA CÓRDOBA CAPITAL (caso especial)
  // Detectar Córdoba de múltiples formas posibles
  const esCordobaLocalidad = localidadNormalizada === 'CORDOBA' || 
                             localidadNormalizada.includes('CORDOBA') ||
                             localidad.toLowerCase().includes('cordoba') ||
                             localidad.toLowerCase().includes('córdoba');
  
  const esCordobaProvincia = provinciaNormalizada === 'CORDOBA' || 
                             provinciaNormalizada.includes('CORDOBA') ||
                             provincia.toLowerCase().includes('cordoba') ||
                             provincia.toLowerCase().includes('córdoba');
  
  // Si tanto localidad como provincia son Córdoba (en cualquier formato), usar XFZ
  if ((esCordobaLocalidad && esCordobaProvincia) || 
      (localidadNormalizada === 'CORDOBA' && provinciaNormalizada === 'CORDOBA')) {
    console.log(`✅ ✅ ✅ Caso Córdoba Capital detectado -> usando código XFZ`);
    console.log(`   Razón: localidad "${localidad}" (${localidadNormalizada}) y provincia "${provincia}" (${provinciaNormalizada})`);
    return 'XFZ';
  }
  
  // Primera búsqueda: coincidencia exacta por localidad y provincia
  let matches = sucursales.filter(suc => {
    const sucLocalidadNormalizada = normalizarTexto(suc.localidad);
    const sucProvinciaNormalizada = normalizarTexto(suc.provincia);
    
    const coincide = sucLocalidadNormalizada === localidadNormalizada && 
                     sucProvinciaNormalizada === provinciaNormalizada;
    
    if (coincide) {
      console.log(`✅ Coincidencia exacta encontrada: ${suc.codigo} - ${suc.localidad}, ${suc.provincia}`);
    }
    
    return coincide;
  });
  
  // Si no hay coincidencias exactas, intentar coincidencia parcial de localidad (Lanus vs Lanus Este/Oeste)
  // SOLO si la localidad del pedido es una sola palabra (para evitar falsos positivos)
  if (matches.length === 0 && localidadNormalizada.split(' ').length === 1) {
    matches = sucursales.filter(suc => {
      const sucLocalidadNormalizada = normalizarTexto(suc.localidad);
      const sucProvinciaNormalizada = normalizarTexto(suc.provincia);
      
      // Verificar si la localidad de la sucursal contiene la localidad del pedido o viceversa
      // Ej: "LANUS ESTE" contiene "LANUS" o "LANUS" es parte de "LANUS ESTE"
      const localidadCoincide = sucLocalidadNormalizada.includes(localidadNormalizada) || 
                                localidadNormalizada.includes(sucLocalidadNormalizada.split(' ')[0]);
      
      return localidadCoincide && sucProvinciaNormalizada === provinciaNormalizada;
    });
    
    if (matches.length > 0) {
      console.log(`✅ Coincidencias parciales encontradas: ${matches.length}`);
    }
  }
  
  if (matches.length > 0) {
    // Si hay múltiples matches, intentar elegir por dirección
    if (matches.length > 1 && direccionNormalizada) {
      const matchesConDireccion = matches.filter(suc => {
        const sucCalleNormalizada = normalizarTexto(suc.calle);
        // Verificar si la dirección contiene parte de la calle de la sucursal o viceversa
        return direccionNormalizada.includes(sucCalleNormalizada) || 
               sucCalleNormalizada.includes(direccionNormalizada);
      });
      
      if (matchesConDireccion.length > 0) {
        console.log(`✅ Código sucursal encontrado por localidad/provincia/dirección: ${matchesConDireccion[0].codigo}`);
        return matchesConDireccion[0].codigo;
      }
    }

    // Si hay múltiples matches, intentar evitar códigos problemáticos conocidos (como MLF)
    // Preferir WMI si existe para La Dormida
    const preferidos = matches.filter(suc => suc.codigo === 'WMI');
    if (preferidos.length > 0) {
       console.log(`✅ Código sucursal PREFERIDO encontrado: ${preferidos[0].codigo}`);
       return preferidos[0].codigo;
    }
    
    // Evitar MLF si hay otras opciones
    const noProblematicos = matches.filter(suc => suc.codigo !== 'MLF');
    if (noProblematicos.length > 0) {
        console.log(`✅ Código sucursal alternativo encontrado (evitando MLF): ${noProblematicos[0].codigo}`);
        return noProblematicos[0].codigo;
    }
    
    console.log(`✅ Código sucursal encontrado por localidad/provincia: ${matches[0].codigo}`);
    return matches[0].codigo;
  }
  
  // Segunda búsqueda: coincidencia parcial más flexible por localidad (por palabra base)
  if (matches.length === 0) {
    matches = sucursales.filter(suc => {
      const sucLocalidadNormalizada = normalizarTexto(suc.localidad);
      const sucProvinciaNormalizada = normalizarTexto(suc.provincia);
      
      // Extraer palabra base de la localidad (primera palabra)
      const palabrasLocalidadPedido = localidadNormalizada.split(' ');
      const palabraBasePedido = palabrasLocalidadPedido[0];
      const palabrasLocalidadSucursal = sucLocalidadNormalizada.split(' ');
      const palabraBaseSucursal = palabrasLocalidadSucursal[0];
      
      // Verificar si las palabras base coinciden
      const palabrasBaseCoinciden = palabraBasePedido === palabraBaseSucursal && palabraBasePedido.length > 3; // Solo si la palabra base tiene más de 3 caracteres para evitar falsos positivos
      
      return palabrasBaseCoinciden && sucProvinciaNormalizada === provinciaNormalizada;
    });
    
    console.log(`🔍 Coincidencias por palabra base encontradas: ${matches.length}`);
    
    if (matches.length > 0) {
      console.log(`✅ Código sucursal encontrado por coincidencia parcial: ${matches[0].codigo}`);
      return matches[0].codigo;
    }
  }
  
  // Tercera búsqueda: solo por provincia (último recurso)
  if (matches.length === 0) {
    matches = sucursales.filter(suc => {
      const sucProvinciaNormalizada = normalizarTexto(suc.provincia);
      return sucProvinciaNormalizada === provinciaNormalizada;
    });
    
    if (matches.length > 0) {
      console.log(`⚠️ Código sucursal encontrado solo por provincia (puede no ser exacto): ${matches[0].codigo}`);
      return matches[0].codigo;
    }
  }
  
  console.warn(`❌ No se encontró código de sucursal para: ${localidad}, ${provincia}`);
  return '';
};
"""
    
    return output

def main():
    print("Generando sucursalesDataCorreoARG.ts...")
    sucursales = parse_csv()
    print(f"[OK] Parseadas {len(sucursales)} sucursales")
    
    if len(sucursales) > 0:
        typescript_content = generate_typescript(sucursales)
        
        output_file = 'services/sucursalesDataCorreoARG.ts'
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(typescript_content)
        
        print(f"[OK] Archivo generado: {output_file}")
        print(f"[OK] Total de sucursales embebidas: {len(sucursales)}")
    else:
        print("ERROR: No se generó el archivo porque no se encontraron sucursales.")

if __name__ == '__main__':
    main()
