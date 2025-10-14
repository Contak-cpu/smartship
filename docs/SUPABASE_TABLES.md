# 📋 Esquema de Tablas de Supabase - FACIL.UNO

Este documento describe las tablas necesarias en Supabase para almacenar los historiales de la aplicación.

## 🗄️ Tablas Requeridas

### 1. historial_smartship

Almacena el historial de archivos procesados en SmartShip (transformador de pedidos Andreani).

```sql
CREATE TABLE historial_smartship (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  nombreArchivo TEXT NOT NULL,
  totalRegistros INTEGER NOT NULL DEFAULT 0,
  domicilioData JSONB NOT NULL,
  sucursalData JSONB NOT NULL,
  fecha TEXT NOT NULL,
  hora TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para mejorar el rendimiento de consultas por usuario
CREATE INDEX idx_historial_smartship_username ON historial_smartship(username);
CREATE INDEX idx_historial_smartship_created_at ON historial_smartship(created_at DESC);

-- RLS (Row Level Security) - Los usuarios solo pueden ver sus propios datos
ALTER TABLE historial_smartship ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver su propio historial"
  ON historial_smartship FOR SELECT
  USING (auth.jwt() ->> 'username' = username);

CREATE POLICY "Los usuarios pueden insertar su propio historial"
  ON historial_smartship FOR INSERT
  WITH CHECK (auth.jwt() ->> 'username' = username);

CREATE POLICY "Los usuarios pueden eliminar su propio historial"
  ON historial_smartship FOR DELETE
  USING (auth.jwt() ->> 'username' = username);
```

**Estructura de datos JSON:**

- `domicilioData`: `{ cantidad: number, datos: array }`
- `sucursalData`: `{ cantidad: number, datos: array }`

---

### 2. historial_sku

Almacena el historial de PDFs generados con SKU integrado en rótulos Andreani.

```sql
CREATE TABLE historial_sku (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  nombreArchivo TEXT NOT NULL,
  cantidadRegistros INTEGER NOT NULL DEFAULT 0,
  pdfData TEXT NOT NULL, -- Base64 del PDF
  fecha TEXT NOT NULL,
  hora TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_historial_sku_username ON historial_sku(username);
CREATE INDEX idx_historial_sku_created_at ON historial_sku(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE historial_sku ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver su propio historial SKU"
  ON historial_sku FOR SELECT
  USING (auth.jwt() ->> 'username' = username);

CREATE POLICY "Los usuarios pueden insertar su propio historial SKU"
  ON historial_sku FOR INSERT
  WITH CHECK (auth.jwt() ->> 'username' = username);

CREATE POLICY "Los usuarios pueden eliminar su propio historial SKU"
  ON historial_sku FOR DELETE
  USING (auth.jwt() ->> 'username' = username);
```

---

### 3. historial_rentabilidad

Almacena el historial de cálculos de rentabilidad de los usuarios.

```sql
CREATE TABLE historial_rentabilidad (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  fecha TEXT NOT NULL,
  hora TEXT NOT NULL,
  facturacion NUMERIC NOT NULL,
  ingresoReal NUMERIC NOT NULL,
  totalGastos NUMERIC NOT NULL,
  totalAlBolsillo NUMERIC NOT NULL,
  rentabilidadPorcentaje NUMERIC NOT NULL,
  cantidadVentas INTEGER DEFAULT 0,
  cantidadProductos INTEGER DEFAULT 0,
  gastosPersonalizados JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_historial_rentabilidad_username ON historial_rentabilidad(username);
CREATE INDEX idx_historial_rentabilidad_created_at ON historial_rentabilidad(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE historial_rentabilidad ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver su propio historial de rentabilidad"
  ON historial_rentabilidad FOR SELECT
  USING (auth.jwt() ->> 'username' = username);

CREATE POLICY "Los usuarios pueden insertar su propio historial de rentabilidad"
  ON historial_rentabilidad FOR INSERT
  WITH CHECK (auth.jwt() ->> 'username' = username);

CREATE POLICY "Los usuarios pueden eliminar su propio historial de rentabilidad"
  ON historial_rentabilidad FOR DELETE
  USING (auth.jwt() ->> 'username' = username);
```

---

## 🚀 Pasos para Configurar

### 1. Acceder a Supabase SQL Editor

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor** en el menú lateral
3. Crea un nuevo query

### 2. Ejecutar el Script SQL

Copia y pega cada bloque SQL de las tablas anteriores en el editor y ejecútalos en orden.

### 3. Verificar las Tablas

En el menú **Table Editor**, deberías ver las tres tablas creadas:
- ✅ `historial_smartship`
- ✅ `historial_sku`
- ✅ `historial_rentabilidad`

### 4. Verificar RLS

En cada tabla, verifica que:
- 🔒 **RLS está habilitado** (Row Level Security)
- 📋 **Las políticas están activas**

## 📊 Límites y Consideraciones

### Tamaño de Datos

- **historial_smartship**: Puede almacenar arrays grandes de datos de pedidos
- **historial_sku**: Los PDFs en base64 ocupan ~33% más espacio que el archivo original
- **historial_rentabilidad**: Datos numéricos compactos

### Límites de Supabase (Plan Free)

- **Base de datos**: 500 MB
- **Ancho de banda**: 5 GB/mes
- **Almacenamiento**: 1 GB

💡 **Recomendación**: Limitar el número de registros por usuario y limpiar datos antiguos periódicamente.

### Auto-limpieza (Opcional)

Puedes crear una función para limpiar datos antiguos automáticamente:

```sql
-- Función para limpiar registros antiguos (más de 6 meses)
CREATE OR REPLACE FUNCTION cleanup_old_records()
RETURNS void AS $$
BEGIN
  DELETE FROM historial_smartship WHERE created_at < NOW() - INTERVAL '6 months';
  DELETE FROM historial_sku WHERE created_at < NOW() - INTERVAL '6 months';
  DELETE FROM historial_rentabilidad WHERE created_at < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Programar limpieza automática (requiere extensión pg_cron)
-- SELECT cron.schedule('cleanup-old-records', '0 0 * * 0', $$SELECT cleanup_old_records()$$);
```

## 🔐 Seguridad

- ✅ RLS está habilitado en todas las tablas
- ✅ Los usuarios solo pueden acceder a sus propios datos
- ✅ Las políticas previenen el acceso no autorizado
- ⚠️ Nunca expongas la `service_role_key` en el frontend

---

**FACIL.UNO - Desarrollado por pictoN** 🚀

