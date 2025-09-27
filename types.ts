
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

// Represents a row from Shopify orders export CSV
export interface ShopifyOrder {
  Name: string; // Order number like #1306
  Email: string;
  'Financial Status': string;
  'Paid at': string;
  'Fulfillment Status': string;
  'Fulfilled at': string;
  'Accepts Marketing': string;
  Currency: string;
  Subtotal: string;
  Shipping: string;
  Taxes: string;
  Total: string;
  'Discount Code': string;
  'Discount Amount': string;
  'Shipping Method': string;
  'Created at': string;
  'Lineitem quantity': string;
  'Lineitem name': string;
  'Lineitem price': string;
  'Lineitem compare at price': string;
  'Lineitem sku': string;
  'Lineitem requires shipping': string;
  'Lineitem taxable': string;
  'Lineitem fulfillment status': string;
  'Billing Name': string;
  'Billing Street': string;
  'Billing Address1': string;
  'Billing Address2': string;
  'Billing Company': string;
  'Billing City': string;
  'Billing Zip': string;
  'Billing Province': string;
  'Billing Country': string;
  'Billing Phone': string;
  'Shipping Name': string;
  'Shipping Street': string;
  'Shipping Address1': string;
  'Shipping Address2': string;
  'Shipping Company': string;
  'Shipping City': string;
  'Shipping Zip': string;
  'Shipping Province': string;
  'Shipping Country': string;
  'Shipping Phone': string;
  Notes: string;
  'Note Attributes': string;
  'Cancelled at': string;
  'Payment Method': string;
  'Payment Reference': string;
  'Refunded Amount': string;
  Vendor: string;
  'Outstanding Balance': string;
  Employee: string;
  Location: string;
  'Device ID': string;
  Id: string;
  Tags: string;
  'Risk Level': string;
  Source: string;
  'Lineitem discount': string;
  'Tax 1 Name': string;
  'Tax 1 Value': string;
  'Tax 2 Name': string;
  'Tax 2 Value': string;
  'Tax 3 Name': string;
  'Tax 3 Value': string;
  'Tax 4 Name': string;
  'Tax 4 Value': string;
  'Tax 5 Name': string;
  'Tax 5 Value': string;
  Phone: string;
  'Receipt Number': string;
  Duties: string;
  'Billing Province Name': string;
  'Shipping Province Name': string;
  'Payment ID': string;
  'Payment Terms Name': string;
  'Next Payment Due At': string;
  'Payment References': string;
  [key: string]: string; // Allow other properties
}
