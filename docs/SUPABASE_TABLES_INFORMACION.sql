-- ========================================
-- TABLAS PARA SECCIÓN INFORMACIÓN
-- ========================================

-- Tabla: pedidos_procesados
-- Almacena todos los pedidos únicos procesados para evitar duplicados y contar stock
CREATE TABLE pedidos_procesados (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  numeroPedido TEXT NOT NULL,
  emailCliente TEXT NOT NULL,
  nombreCliente TEXT,
  apellidoCliente TEXT,
  telefono TEXT,
  direccion TEXT,
  provincia TEXT,
  localidad TEXT,
  codigoPostal TEXT,
  tipoEnvio TEXT NOT NULL,
  fechaProcesamiento DATE NOT NULL,
  archivoOrigen TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(username, numeroPedido, emailCliente)
);

CREATE INDEX idx_pedidos_procesados_username ON pedidos_procesados(username);
CREATE INDEX idx_pedidos_procesados_email ON pedidos_procesados(emailCliente);
CREATE INDEX idx_pedidos_procesados_numero ON pedidos_procesados(numeroPedido);
CREATE INDEX idx_pedidos_procesados_fecha ON pedidos_procesados(fechaProcesamiento DESC);

ALTER TABLE pedidos_procesados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver sus propios pedidos"
  ON pedidos_procesados FOR SELECT
  USING (auth.jwt() ->> 'username' = username);

CREATE POLICY "Los usuarios pueden insertar sus propios pedidos"
  ON pedidos_procesados FOR INSERT
  WITH CHECK (auth.jwt() ->> 'username' = username);

-- Tabla: productos_pedidos
-- Detalle de productos en cada pedido para control de stock
CREATE TABLE productos_pedidos (
  id BIGSERIAL PRIMARY KEY,
  pedido_id BIGINT REFERENCES pedidos_procesados(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  sku TEXT,
  nombreProducto TEXT,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precioUnitario NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_productos_pedidos_pedido ON productos_pedidos(pedido_id);
CREATE INDEX idx_productos_pedidos_sku ON productos_pedidos(sku);
CREATE INDEX idx_productos_pedidos_username ON productos_pedidos(username);

ALTER TABLE productos_pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver sus propios productos"
  ON productos_pedidos FOR SELECT
  USING (auth.jwt() ->> 'username' = username);

CREATE POLICY "Los usuarios pueden insertar sus propios productos"
  ON productos_pedidos FOR INSERT
  WITH CHECK (auth.jwt() ->> 'username' = username);

-- Tabla: stock_despachado
-- Almacena el stock despachado de los rótulos PDF generados
CREATE TABLE stock_despachado (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  sku TEXT NOT NULL,
  nombreProducto TEXT,
  cantidad INTEGER NOT NULL DEFAULT 1,
  numeroPedido TEXT,
  fechaDespacho DATE NOT NULL,
  archivoRotulo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stock_despachado_username ON stock_despachado(username);
CREATE INDEX idx_stock_despachado_sku ON stock_despachado(sku);
CREATE INDEX idx_stock_despachado_fecha ON stock_despachado(fechaDespacho DESC);

ALTER TABLE stock_despachado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver su propio stock despachado"
  ON stock_despachado FOR SELECT
  USING (auth.jwt() ->> 'username' = username);

CREATE POLICY "Los usuarios pueden insertar su propio stock despachado"
  ON stock_despachado FOR INSERT
  WITH CHECK (auth.jwt() ->> 'username' = username);

-- Vista: resumen_pedidos
-- Vista para obtener estadísticas rápidas
CREATE OR REPLACE VIEW resumen_pedidos AS
SELECT 
  username,
  COUNT(DISTINCT id) as total_pedidos,
  COUNT(DISTINCT emailCliente) as clientes_unicos,
  COUNT(DISTINCT numeroPedido) as pedidos_unicos,
  COUNT(CASE WHEN tipoEnvio = 'domicilio' THEN 1 END) as pedidos_domicilio,
  COUNT(CASE WHEN tipoEnvio = 'sucursal' THEN 1 END) as pedidos_sucursal,
  MIN(fechaProcesamiento) as primera_fecha,
  MAX(fechaProcesamiento) as ultima_fecha
FROM pedidos_procesados
GROUP BY username;

-- Vista: stock_por_sku
-- Vista para obtener stock despachado por SKU
CREATE OR REPLACE VIEW stock_por_sku AS
SELECT 
  username,
  sku,
  nombreProducto,
  SUM(cantidad) as cantidad_total_despachada,
  COUNT(DISTINCT numeroPedido) as pedidos_con_este_sku,
  MIN(fechaDespacho) as primer_despacho,
  MAX(fechaDespacho) as ultimo_despacho
FROM stock_despachado
GROUP BY username, sku, nombreProducto;

-- Función: verificar_pedido_duplicado
-- Verifica si un pedido ya existe antes de insertarlo
CREATE OR REPLACE FUNCTION verificar_pedido_duplicado(
  p_username TEXT,
  p_numero_pedido TEXT,
  p_email_cliente TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM pedidos_procesados 
    WHERE username = p_username 
    AND numeroPedido = p_numero_pedido 
    AND emailCliente = p_email_cliente
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: obtener_estadisticas_usuario
-- Obtiene estadísticas completas del usuario
CREATE OR REPLACE FUNCTION obtener_estadisticas_usuario(p_username TEXT)
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
  LEFT JOIN stock_despachado sd ON sd.username = pp.username
  WHERE pp.username = p_username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

