
export enum ProcessStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

// Represents a row from the input Tiendanube CSV
export interface TiendanubeOrder {
  'Número de orden': string;
  'Email': string;
  'Nombre del comprador': string;
  'DNI / CUIT': string;
  'Teléfono': string;
  'Dirección': string;
  'Número': string;
  'Piso': string; // Also used for 'Departamento'
  'Provincia o estado': string;
  'Localidad': string;
  'Código postal': string;
  'Medio de envío': string;
  [key: string]: string; // Allow other properties
}

// Represents a row in the Andreani 'sucursales.csv' file
export interface AndreaniSucursalInfo {
  nombre_sucursal: string;
  direccion: string;
}

// Represents a row for the output Andreani Domicilio CSV
export interface AndreaniDomicilioOutput {
  'Paquete Guardado Ej:': string;
  'Peso (grs)': number;
  'Alto (cm)': number;
  'Ancho (cm)': number;
  'Profundidad (cm)': number;
  'Valor declarado ($ C/IVA) *': number;
  'Numero Interno': string;
  'Nombre *': string;
  'Apellido *': string;
  'DNI *': string;
  'Email *': string;
  'Celular código *': string;
  'Celular número *': string;
  'Calle *': string;
  'Número *': string;
  'Piso': string;
  'Departamento': string;
  'Provincia / Localidad / CP *': string;
}

// Represents a row for the output Andreani Sucursal CSV
export interface AndreaniSucursalOutput {
  'Paquete Guardado Ej:': string;
  'Peso (grs)': number;
  'Alto (cm)': number;
  'Ancho (cm)': number;
  'Profundidad (cm)': number;
  'Valor declarado ($ C/IVA) *': number;
  'Numero Interno': string;
  'Nombre *': string;
  'Apellido *': string;
  'DNI *': string;
  'Email *': string;
  'Celular código *': string;
  'Celular número *': string;
  'Sucursal *': string;
}
