
export enum ProcessStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

// Información de procesamiento para mostrar en el frontend
export interface ProcessingInfo {
  totalOrders: number;
  domiciliosProcessed: number;
  sucursalesProcessed: number;
  noProcessed: number;
  processingLogs: string[];
  // Información detallada para el nuevo resumen
  totalRowsWithData?: number;
  actualSalesProcessed?: number;
  shipmentsToDomicilio?: number;
  shipmentsToSucursal?: number;
  noProcessedReason?: string;
  // Para Shopify: advertencia sobre pedidos a sucursal
  hasShopifySucursalWarnings?: boolean;
  shopifySucursalOrders?: number;
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

// Represents a row from the input Shopify CSV
export interface ShopifyOrder {
  'Name': string;
  'Email': string;
  'Financial Status': string;
  'Shipping Method': string;
  'Shipping Name': string;
  'Shipping Address1': string;
  'Shipping Address2': string;
  'Shipping City': string;
  'Shipping Zip': string;
  'Shipping Province': string;
  'Shipping Country': string;
  'Shipping Phone': string;
  'Billing Name': string;
  'Billing Phone': string;
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

// Stock interface
export interface Stock {
  id: string;
  user_id: string;
  username: string;
  sku: string;
  nombreproducto: string | null;
  cantidad: number;
  fecha_actualizacion: string;
  created_at: string;
  updated_at: string;
}

export interface StockInput {
  sku: string;
  nombreproducto?: string;
  cantidad: number;
}