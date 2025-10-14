-- ========================================
-- FIX: Agregar WITH CHECK a políticas de INSERT
-- ========================================
-- Las políticas INSERT deben verificar que user_id = auth.uid()

-- Eliminar políticas de INSERT antiguas
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios pedidos" ON pedidos_procesados;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios productos" ON productos_pedidos;
DROP POLICY IF EXISTS "Usuarios pueden insertar su propio stock" ON stock_despachado;
DROP POLICY IF EXISTS "Usuarios pueden insertar en historial smartship" ON historial_smartship;
DROP POLICY IF EXISTS "Usuarios pueden insertar en historial sku" ON historial_sku;
DROP POLICY IF EXISTS "Usuarios pueden insertar en historial rentabilidad" ON historial_rentabilidad;

-- Crear políticas de INSERT con WITH CHECK
CREATE POLICY "Usuarios pueden insertar sus propios pedidos"
  ON pedidos_procesados FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propios productos"
  ON productos_pedidos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar su propio stock"
  ON stock_despachado FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar en historial smartship"
  ON historial_smartship FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar en historial sku"
  ON historial_sku FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar en historial rentabilidad"
  ON historial_rentabilidad FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Verificar políticas
SELECT 
  tablename,
  policyname,
  cmd,
  qual as "USING",
  with_check as "WITH CHECK"
FROM pg_policies
WHERE schemaname = 'public' AND cmd = 'INSERT'
ORDER BY tablename;

