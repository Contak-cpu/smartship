-- Migración: Crear tabla de tiendas de clientes para usuarios Pro+
-- Fecha: 2025
-- Descripción: Permite a usuarios Pro+ configurar múltiples tiendas de clientes para descontar stock

-- Crear tabla de tiendas de clientes
CREATE TABLE IF NOT EXISTS tiendas_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  nombre_tienda TEXT NOT NULL,
  descripcion TEXT,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evitar duplicados de nombre de tienda por usuario
  UNIQUE(user_id, nombre_tienda)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_tiendas_clientes_user_id ON tiendas_clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_tiendas_clientes_activa ON tiendas_clientes(activa);

-- RLS (Row Level Security)
ALTER TABLE tiendas_clientes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Los usuarios solo pueden ver sus propias tiendas"
  ON tiendas_clientes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios solo pueden insertar sus propias tiendas"
  ON tiendas_clientes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios solo pueden actualizar sus propias tiendas"
  ON tiendas_clientes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios solo pueden eliminar sus propias tiendas"
  ON tiendas_clientes FOR DELETE
  USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_tiendas_clientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_tiendas_clientes_updated_at
  BEFORE UPDATE ON tiendas_clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_tiendas_clientes_updated_at();

COMMENT ON TABLE tiendas_clientes IS 'Tabla para gestionar tiendas de clientes por usuario Pro+';

