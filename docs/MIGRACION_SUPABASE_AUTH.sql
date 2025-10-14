-- ========================================
-- MIGRACIÓN A SUPABASE AUTH CON RLS
-- ========================================

-- PASO 1: Crear tabla de perfiles de usuario
-- ========================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  nivel INTEGER NOT NULL DEFAULT 0,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por username
CREATE INDEX idx_user_profiles_username ON user_profiles(username);

-- RLS para user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver su propio perfil"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, email, nivel)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'nivel')::INTEGER, 0)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- PASO 2: Agregar columna user_id a todas las tablas existentes
-- ========================================

-- pedidos_procesados
ALTER TABLE pedidos_procesados 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_pedidos_procesados_user_id ON pedidos_procesados(user_id);

-- productos_pedidos
ALTER TABLE productos_pedidos 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_productos_pedidos_user_id ON productos_pedidos(user_id);

-- stock_despachado
ALTER TABLE stock_despachado 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_stock_despachado_user_id ON stock_despachado(user_id);

-- historial_smartship
ALTER TABLE historial_smartship 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_historial_smartship_user_id ON historial_smartship(user_id);

-- historial_sku
ALTER TABLE historial_sku 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_historial_sku_user_id ON historial_sku(user_id);

-- historial_rentabilidad
ALTER TABLE historial_rentabilidad 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_historial_rentabilidad_user_id ON historial_rentabilidad(user_id);

-- ========================================
-- PASO 3: Eliminar políticas antiguas
-- ========================================

-- pedidos_procesados
DROP POLICY IF EXISTS "Permitir todo acceso a pedidos_procesados" ON pedidos_procesados;
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios pedidos" ON pedidos_procesados;
DROP POLICY IF EXISTS "Los usuarios pueden insertar sus propios pedidos" ON pedidos_procesados;

-- productos_pedidos
DROP POLICY IF EXISTS "Permitir todo acceso a productos_pedidos" ON productos_pedidos;
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios productos" ON productos_pedidos;
DROP POLICY IF EXISTS "Los usuarios pueden insertar sus propios productos" ON productos_pedidos;

-- stock_despachado
DROP POLICY IF EXISTS "Permitir todo acceso a stock_despachado" ON stock_despachado;
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio stock despachado" ON stock_despachado;
DROP POLICY IF EXISTS "Los usuarios pueden insertar su propio stock despachado" ON stock_despachado;

-- historial_smartship
DROP POLICY IF EXISTS "Permitir todo acceso a historial_smartship" ON historial_smartship;
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio historial" ON historial_smartship;
DROP POLICY IF EXISTS "Los usuarios pueden insertar su propio historial" ON historial_smartship;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar su propio historial" ON historial_smartship;

-- historial_sku
DROP POLICY IF EXISTS "Permitir todo acceso a historial_sku" ON historial_sku;
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio historial SKU" ON historial_sku;
DROP POLICY IF EXISTS "Los usuarios pueden insertar su propio historial SKU" ON historial_sku;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar su propio historial SKU" ON historial_sku;

-- historial_rentabilidad
DROP POLICY IF EXISTS "Permitir todo acceso a historial_rentabilidad" ON historial_rentabilidad;
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio historial de rentabilidad" ON historial_rentabilidad;
DROP POLICY IF EXISTS "Los usuarios pueden insertar su propio historial de rentabilidad" ON historial_rentabilidad;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar su propio historial de rentabilidad" ON historial_rentabilidad;

-- ========================================
-- PASO 4: Crear nuevas políticas RLS con auth.uid()
-- ========================================

-- pedidos_procesados
CREATE POLICY "Usuarios pueden ver sus propios pedidos"
  ON pedidos_procesados FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propios pedidos"
  ON pedidos_procesados FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios pedidos"
  ON pedidos_procesados FOR DELETE
  USING (auth.uid() = user_id);

-- productos_pedidos
CREATE POLICY "Usuarios pueden ver sus propios productos"
  ON productos_pedidos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propios productos"
  ON productos_pedidos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- stock_despachado
CREATE POLICY "Usuarios pueden ver su propio stock"
  ON stock_despachado FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar su propio stock"
  ON stock_despachado FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- historial_smartship
CREATE POLICY "Usuarios pueden ver su historial smartship"
  ON historial_smartship FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar en historial smartship"
  ON historial_smartship FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar su historial smartship"
  ON historial_smartship FOR DELETE
  USING (auth.uid() = user_id);

-- historial_sku
CREATE POLICY "Usuarios pueden ver su historial sku"
  ON historial_sku FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar en historial sku"
  ON historial_sku FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar su historial sku"
  ON historial_sku FOR DELETE
  USING (auth.uid() = user_id);

-- historial_rentabilidad
CREATE POLICY "Usuarios pueden ver su historial rentabilidad"
  ON historial_rentabilidad FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar en historial rentabilidad"
  ON historial_rentabilidad FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar su historial rentabilidad"
  ON historial_rentabilidad FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- PASO 5: Actualizar funciones para usar user_id
-- ========================================

-- Función actualizada: obtener_estadisticas_usuario
CREATE OR REPLACE FUNCTION obtener_estadisticas_usuario(p_user_id UUID)
RETURNS TABLE(
  total_pedidos BIGINT,
  clientes_unicos BIGINT,
  pedidos_domicilio BIGINT,
  pedidos_sucursal BIGINT,
  total_productos BIGINT,
  skus_diferentes BIGINT,
  stock_total_despachado BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT pp.id)::BIGINT,
    COUNT(DISTINCT pp.emailCliente)::BIGINT,
    COUNT(CASE WHEN pp.tipoEnvio = 'domicilio' THEN 1 END)::BIGINT,
    COUNT(CASE WHEN pp.tipoEnvio = 'sucursal' THEN 1 END)::BIGINT,
    COUNT(DISTINCT prod.id)::BIGINT,
    COUNT(DISTINCT sd.sku)::BIGINT,
    COALESCE(SUM(sd.cantidad), 0)::BIGINT
  FROM pedidos_procesados pp
  LEFT JOIN productos_pedidos prod ON prod.pedido_id = pp.id
  LEFT JOIN stock_despachado sd ON sd.user_id = pp.user_id
  WHERE pp.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función actualizada: verificar_pedido_duplicado
CREATE OR REPLACE FUNCTION verificar_pedido_duplicado(
  p_user_id UUID,
  p_numero_pedido TEXT,
  p_email_cliente TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM pedidos_procesados 
    WHERE user_id = p_user_id 
    AND numeroPedido = p_numero_pedido 
    AND emailCliente = p_email_cliente
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PASO 6: Vista actualizada para stock por SKU
-- ========================================

DROP VIEW IF EXISTS stock_por_sku;

CREATE OR REPLACE VIEW stock_por_sku AS
SELECT 
  user_id,
  sku,
  nombreProducto,
  SUM(cantidad) as cantidad_total_despachada,
  COUNT(DISTINCT numeroPedido) as pedidos_con_este_sku,
  MIN(fechaDespacho) as primer_despacho,
  MAX(fechaDespacho) as ultimo_despacho
FROM stock_despachado
GROUP BY user_id, sku, nombreProducto;

-- ========================================
-- PASO 7: Vista actualizada para resumen de pedidos
-- ========================================

DROP VIEW IF EXISTS resumen_pedidos;

CREATE OR REPLACE VIEW resumen_pedidos AS
SELECT 
  user_id,
  COUNT(DISTINCT id) as total_pedidos,
  COUNT(DISTINCT emailCliente) as clientes_unicos,
  COUNT(DISTINCT numeroPedido) as pedidos_unicos,
  COUNT(CASE WHEN tipoEnvio = 'domicilio' THEN 1 END) as pedidos_domicilio,
  COUNT(CASE WHEN tipoEnvio = 'sucursal' THEN 1 END) as pedidos_sucursal,
  MIN(fechaProcesamiento) as primera_fecha,
  MAX(fechaProcesamiento) as ultima_fecha
FROM pedidos_procesados
GROUP BY user_id;

-- ========================================
-- NOTA: MIGRACIÓN DE DATOS EXISTENTES
-- ========================================
-- Si ya tienes datos con 'username', necesitarás migrarlos.
-- Ejemplo (ajusta según tus necesidades):
/*
UPDATE pedidos_procesados pp
SET user_id = up.id
FROM user_profiles up
WHERE pp.username = up.username;
*/

-- ========================================
-- VERIFICACIÓN
-- ========================================
-- Para verificar que todo está correcto:
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

