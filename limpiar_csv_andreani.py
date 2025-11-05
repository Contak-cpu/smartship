#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para limpiar CSV de Tiendanube y dejar solo pedidos de Andreani a domicilio
- Corrige encoding de Windows-1252 a UTF-8
- Filtra "Andreani Estándar Envío a domicilio" y "Envío Gratis"
- Elimina líneas duplicadas/incompletas
"""

import csv
import sys

def limpiar_csv_andreani(archivo_entrada, archivo_salida):
    """
    Limpia el CSV dejando solo pedidos válidos de Andreani
    """
    # Leer con encoding correcto
    with open(archivo_entrada, 'r', encoding='windows-1252', errors='replace') as f:
        contenido = f.read()
    
    # Escribir en UTF-8
    lineas = contenido.split('\n')
    
    lineas_validas = []
    contador_andreani = 0
    contador_total = 0
    lineas_vacias_consecutivas = 0
    
    for i, linea in enumerate(lineas):
        # Línea 1 es el header, siempre incluir
        if i == 0:
            lineas_validas.append(linea)
            continue
        
        # Saltar si la línea está vacía
        if not linea.strip():
            continue
            
        # Detectar líneas incompletas (pedidos con múltiples productos)
        # Estas líneas empiezan con número de orden pero no tienen email/fecha
        campos = linea.split(';')
        
        # Si tiene menos de 10 campos o el campo de fecha está vacío, es línea incompleta
        if len(campos) < 10 or not campos[2].strip():
            print(f"ADVERTENCIA: Linea {i+1} incompleta - OMITIDA (Pedido duplicado/multi-producto)")
            continue
        
        contador_total += 1
        
        # Filtrar solo Andreani Estándar "Envío a domicilio" o "Envío Gratis"
        # Normalizar la línea para buscar sin problemas de encoding
        linea_normalizada = linea.replace('ó', 'o').replace('í', 'i').replace('á', 'a').replace('é', 'e').replace('ú', 'u')
        es_andreani_domicilio = 'Andreani Estandar' in linea_normalizada and 'Envo' in linea_normalizada and 'a domicilio' in linea_normalizada
        es_envio_gratis = 'Envo Gratis' in linea_normalizada or 'Envio Gratis' in linea_normalizada
        
        if es_andreani_domicilio or es_envio_gratis:
            lineas_validas.append(linea)
            contador_andreani += 1
        
    # Escribir archivo limpio en UTF-8
    with open(archivo_salida, 'w', encoding='utf-8', newline='') as f:
        f.write('\n'.join(lineas_validas))
    
    return contador_total, contador_andreani, len(lineas_validas) - 1  # -1 por el header

if __name__ == '__main__':
    archivo_entrada = r'c:\Users\pictoN\Downloads\ventas-80b66204-2903-414c-ac4d-891464dbaa06.csv'
    archivo_salida = r'c:\Users\pictoN\Downloads\ventas-ANDREANI-LIMPIO.csv'
    
    print("Procesando archivo CSV...")
    print(f"Entrada: {archivo_entrada}")
    print(f"Salida: {archivo_salida}\n")
    
    try:
        total, andreani, escritos = limpiar_csv_andreani(archivo_entrada, archivo_salida)
        
        print(f"\nPROCESO COMPLETADO")
        print(f"=====================================")
        print(f"Pedidos totales procesados: {total}")
        print(f"Pedidos Andreani domicilio + Envío Gratis: {andreani}")
        print(f"Pedidos omitidos (otros medios): {total - andreani}")
        print(f"Lineas escritas (con header): {escritos + 1}")
        print(f"\nArchivo limpio guardado en:")
        print(f"   {archivo_salida}")
        print(f"\nEste archivo ya esta listo para subir a Andreani")
        
    except FileNotFoundError:
        print(f"ERROR: No se encontro el archivo {archivo_entrada}")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)

