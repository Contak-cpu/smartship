
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
  totalRowsWithData?: number;
  actualSalesProcessed?: number;
  shipmentsToDomicilio?: number;
  shipmentsToSucursal?: number;
  noProcessedReason?: string;
  hasShopifySucursalWarnings?: boolean;
  shopifySucursalOrders?: number;
  erroresSucursal?: string[]; // Lista de pedidos con errores de sucursal
  erroresSucursalDetallados?: Array<{
    numeroOrden: string;
    direccion: string;
    numero: string;
    localidad: string;
    ciudad: string;
    codigoPostal: string;
    provincia: string;
    motivo: string;
  }>; // Detalles completos de errores de sucursal
  tasaEfectividad?: number; // Porcentaje de pedidos procesados exitosamente
  sugerenciasSucursal?: SucursalSugerencia[]; // Sugerencias de sucursales para pedidos sin coincidencias exactas
  droppedOrders?: string[]; // Lista de pedidos que no se procesaron con el motivo
}

// Sugerencia de sucursal para pedidos sin coincidencias exactas
export interface SucursalSugerencia {
  numeroOrden: string;
  direccionPedido: string;
  numero: string;
  localidad: string;
  ciudad: string;
  codigoPostal: string;
  provincia: string;
  sucursalSugerida: AndreaniSucursalInfo;
  razon: string; // Por qué se sugiere esta sucursal
  score?: number; // Puntuación de confianza (0-100)
  decision?: 'aceptada' | 'rechazada' | 'pendiente'; // Decisión del usuario
  // Datos del pedido para reconstruir el CSV si se acepta
  pedidoData?: {
    peso?: number;
    alto?: number;
    ancho?: number;
    profundidad?: number;
    valorDeclarado?: number;
    nombre?: string;
    apellido?: string;
    dni?: string;
    email?: string;
    celularCodigo?: string;
    celularNumero?: string;
  };
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

// Tipos para Stock (si no están definidos en otro lugar)
export interface Stock {
  id: string;
  user_id: string;
  username: string;
  sku: string;
  nombreproducto?: string;
  cantidad: number;
  equivalencia?: number;
  fecha_actualizacion: string;
  created_at: string;
  updated_at: string;
}

export interface StockInput {
  sku: string;
  nombreproducto?: string;
  cantidad: number;
  equivalencia?: number;
}

// Tipos para Tiendas de Clientes (Pro+)
export interface TiendaCliente {
  id: string;
  user_id: string;
  username: string;
  nombre_tienda: string;
  descripcion?: string;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface TiendaClienteInput {
  nombre_tienda: string;
  descripcion?: string;
  activa?: boolean;
}

// Stock descontado desde PDF de Andreani
export interface StockDescontadoPDF {
  sku: string;
  cantidad: number;
  nombreProducto?: string;
}

// Tipos para Stock de Tiendas de Clientes (Pro+)
export interface StockTiendaCliente {
  id: string;
  user_id: string;
  tienda_cliente_id: string;
  username: string;
  sku: string;
  nombreproducto?: string;
  cantidad: number;
  equivalencia?: number;
  fecha_actualizacion: string;
  created_at: string;
  updated_at: string;
}

export interface StockTiendaClienteInput {
  sku: string;
  nombreproducto?: string;
  cantidad: number;
  equivalencia?: number;
}