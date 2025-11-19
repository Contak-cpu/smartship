-- Migración: Actualizar políticas RLS para permitir acceso compartido a tiendas
-- Fecha: 2025
-- Descripción: Actualiza las políticas RLS de tiendas_clientes y stock_tiendas_clientes 
--              para permitir que usuarios compartidos puedan ver las tiendas

-- ============================================
-- ACTUALIZAR POLÍTICAS DE tiendas_clientes
-- ============================================

-- Eliminar políticas antiguas de SELECT
DROP POLICY IF EXISTS "Los usuarios solo pueden ver sus propias tiendas" ON tiendas_clientes;

-- Crear nueva política que incluye tiendas compartidas
CREATE POLICY "Los usuarios pueden ver sus propias tiendas y las compartidas"
  ON tiendas_clientes FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM tiendas_clientes_compartidas
      WHERE tienda_cliente_id = tiendas_clientes.id
      AND usuario_compartido_id = auth.uid()
    )
  );

-- Las políticas de INSERT, UPDATE y DELETE se mantienen igual (solo el propietario)

-- ============================================
-- ACTUALIZAR POLÍTICAS DE stock_tiendas_clientes
-- ============================================

-- Eliminar políticas antiguas de SELECT
DROP POLICY IF EXISTS "Los usuarios solo pueden ver su propio stock de tiendas" ON stock_tiendas_clientes;

-- Crear nueva política que incluye stock de tiendas compartidas
CREATE POLICY "Los usuarios pueden ver su propio stock y el de tiendas compartidas"
  ON stock_tiendas_clientes FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM tiendas_clientes_compartidas
      WHERE tienda_cliente_id = stock_tiendas_clientes.tienda_cliente_id
      AND usuario_compartido_id = auth.uid()
    )
  );

-- Actualizar política de UPDATE para permitir edición si tiene permisos
DROP POLICY IF EXISTS "Los usuarios solo pueden actualizar su propio stock de tiendas" ON stock_tiendas_clientes;

CREATE POLICY "Los usuarios pueden actualizar su propio stock y el de tiendas compartidas con permisos"
  ON stock_tiendas_clientes FOR UPDATE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM tiendas_clientes_compartidas
      WHERE tienda_cliente_id = stock_tiendas_clientes.tienda_cliente_id
      AND usuario_compartido_id = auth.uid()
      AND puede_editar = true
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM tiendas_clientes_compartidas
      WHERE tienda_cliente_id = stock_tiendas_clientes.tienda_cliente_id
      AND usuario_compartido_id = auth.uid()
      AND puede_editar = true
    )
  );

-- Actualizar política de INSERT para permitir agregar stock si tiene permisos
DROP POLICY IF EXISTS "Los usuarios solo pueden insertar su propio stock de tiendas" ON stock_tiendas_clientes;

CREATE POLICY "Los usuarios pueden insertar stock en sus tiendas y en las compartidas con permisos"
  ON stock_tiendas_clientes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM tiendas_clientes_compartidas
      WHERE tienda_cliente_id = stock_tiendas_clientes.tienda_cliente_id
      AND usuario_compartido_id = auth.uid()
      AND puede_editar = true
    )
  );

-- La política de DELETE se mantiene igual (solo el propietario puede eliminar)

COMMENT ON POLICY "Los usuarios pueden ver sus propias tiendas y las compartidas" ON tiendas_clientes IS 
  'Permite a los usuarios ver sus propias tiendas y las que otros usuarios les han compartido';

COMMENT ON POLICY "Los usuarios pueden ver su propio stock y el de tiendas compartidas" ON stock_tiendas_clientes IS 
  'Permite a los usuarios ver el stock de sus tiendas y el de las tiendas compartidas con ellos';


