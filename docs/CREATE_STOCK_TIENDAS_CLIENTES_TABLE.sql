-- Migración: Crear tabla de stock por tienda de cliente
-- Fecha: 2025
-- Descripción: Permite a usuarios Pro+ gestionar stock separado por cada tienda de cliente

-- Crear tabla de stock de tiendas de clientes
CREATE TABLE IF NOT EXISTS stock_tiendas_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tienda_cliente_id UUID NOT NULL REFERENCES tiendas_clientes(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  sku TEXT NOT NULL,
  nombreproducto TEXT,
  cantidad INTEGER NOT NULL DEFAULT 0,
  equivalencia INTEGER DEFAULT 1,
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evitar duplicados de SKU por tienda
  UNIQUE(tienda_cliente_id, sku)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_stock_tiendas_clientes_user_id ON stock_tiendas_clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_tiendas_clientes_tienda_id ON stock_tiendas_clientes(tienda_cliente_id);
CREATE INDEX IF NOT EXISTS idx_stock_tiendas_clientes_sku ON stock_tiendas_clientes(sku);

-- RLS (Row Level Security)
ALTER TABLE stock_tiendas_clientes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Los usuarios solo pueden ver su propio stock de tiendas"
  ON stock_tiendas_clientes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios solo pueden insertar su propio stock de tiendas"
  ON stock_tiendas_clientes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios solo pueden actualizar su propio stock de tiendas"
  ON stock_tiendas_clientes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios solo pueden eliminar su propio stock de tiendas"
  ON stock_tiendas_clientes FOR DELETE
  USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_stock_tiendas_clientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_stock_tiendas_clientes_updated_at
  BEFORE UPDATE ON stock_tiendas_clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_tiendas_clientes_updated_at();

COMMENT ON TABLE stock_tiendas_clientes IS 'Tabla para gestionar el stock de productos por tienda de cliente (Pro+)';



