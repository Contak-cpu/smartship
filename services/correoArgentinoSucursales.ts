// Re-exportación de datos y funciones de sucursales de Correo Argentino
// Toda la lógica está centralizada en sucursalesDataCorreoARG.ts

// Re-exportar interface (compatibilidad hacia atrás)
export type { CorreoArgentinoSucursalInfo as CorreoArgentinoSucursal };

// Re-exportar datos y funciones
export {
  CORREO_ARGENTINO_SUCURSALES_DATA,
  normalizarTexto,
  normalizarProvincia,
  loadCorreoArgentinoSucursales,
  findCodigoSucursalCorreoArgentino,
} from './sucursalesDataCorreoARG';

