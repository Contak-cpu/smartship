-- Migración: Crear tabla de tiendas compartidas con clientes
-- Fecha: 2025
-- Descripción: Permite compartir tiendas de clientes con otros usuarios para visualización del stock

-- Crear tabla de tiendas compartidas
CREATE TABLE IF NOT EXISTS tiendas_clientes_compartidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tienda_cliente_id UUID NOT NULL REFERENCES tiendas_clientes(id) ON DELETE CASCADE,
  usuario_propietario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usuario_compartido_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puede_editar BOOLEAN DEFAULT false, -- true = puede editar stock, false = solo lectura
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evitar duplicados: un usuario no puede tener acceso compartido duplicado a la misma tienda
  UNIQUE(tienda_cliente_id, usuario_compartido_id),
  
  -- El propietario no puede compartirse a sí mismo
  CHECK (usuario_propietario_id != usuario_compartido_id)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_tiendas_compartidas_tienda_id ON tiendas_clientes_compartidas(tienda_cliente_id);
CREATE INDEX IF NOT EXISTS idx_tiendas_compartidas_propietario_id ON tiendas_clientes_compartidas(usuario_propietario_id);
CREATE INDEX IF NOT EXISTS idx_tiendas_compartidas_compartido_id ON tiendas_clientes_compartidas(usuario_compartido_id);

-- RLS (Row Level Security)
ALTER TABLE tiendas_clientes_compartidas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Los usuarios pueden ver las tiendas que les han compartido o que ellos han compartido
CREATE POLICY "Los usuarios pueden ver tiendas compartidas con ellos"
  ON tiendas_clientes_compartidas FOR SELECT
  USING (
    auth.uid() = usuario_compartido_id OR 
    auth.uid() = usuario_propietario_id
  );

-- Solo el propietario puede compartir su tienda
CREATE POLICY "Solo el propietario puede compartir su tienda"
  ON tiendas_clientes_compartidas FOR INSERT
  WITH CHECK (
    auth.uid() = usuario_propietario_id AND
    EXISTS (
      SELECT 1 FROM tiendas_clientes 
      WHERE id = tienda_cliente_id 
      AND user_id = auth.uid()
    )
  );

-- Solo el propietario puede actualizar los permisos de compartir
CREATE POLICY "Solo el propietario puede actualizar permisos"
  ON tiendas_clientes_compartidas FOR UPDATE
  USING (auth.uid() = usuario_propietario_id)
  WITH CHECK (auth.uid() = usuario_propietario_id);

-- Solo el propietario puede dejar de compartir
CREATE POLICY "Solo el propietario puede dejar de compartir"
  ON tiendas_clientes_compartidas FOR DELETE
  USING (auth.uid() = usuario_propietario_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_tiendas_compartidas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_tiendas_compartidas_updated_at
  BEFORE UPDATE ON tiendas_clientes_compartidas
  FOR EACH ROW
  EXECUTE FUNCTION update_tiendas_compartidas_updated_at();

COMMENT ON TABLE tiendas_clientes_compartidas IS 'Tabla para gestionar el acceso compartido a tiendas de clientes';


