-- Migración: Crear tabla de stock
-- Fecha: 2025
-- Descripción: Tabla para gestionar el stock de productos por usuario

-- Crear tabla de stock
CREATE TABLE IF NOT EXISTS stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  sku TEXT NOT NULL,
  nombreproducto TEXT,
  cantidad INTEGER NOT NULL DEFAULT 0,
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evitar duplicados de SKU por usuario
  UNIQUE(user_id, sku)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_stock_user_id ON stock(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_sku ON stock(sku);

-- RLS (Row Level Security)
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Los usuarios solo pueden ver su propio stock"
  ON stock FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios solo pueden insertar su propio stock"
  ON stock FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios solo pueden actualizar su propio stock"
  ON stock FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios solo pueden eliminar su propio stock"
  ON stock FOR DELETE
  USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_stock_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_stock_updated_at
  BEFORE UPDATE ON stock
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_updated_at();

COMMENT ON TABLE stock IS 'Tabla para gestionar el stock de productos por usuario';


