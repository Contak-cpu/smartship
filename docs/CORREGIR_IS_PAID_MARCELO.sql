-- CORRECCIÓN RÁPIDA: Cambiar is_paid de string "true" a boolean true
-- Usuario: marceloerossi@gmail.com
-- Problema: El valor está guardado como string "true" pero el código necesita boolean true

-- CORRECCIÓN: Actualizar solo el campo is_paid
-- Usar to_jsonb(true) para guardar como boolean true en lugar de string "true"
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{is_paid}', 
  to_jsonb(true)  -- ✅ to_jsonb(true) guarda como boolean true, no como string
)
WHERE email = 'marceloerossi@gmail.com';

-- Verificar corrección
SELECT 
  email,
  raw_user_meta_data->>'is_paid' as is_paid_texto,
  raw_user_meta_data->'is_paid' as is_paid_jsonb,
  pg_typeof(raw_user_meta_data->'is_paid') as tipo_dato,
  CASE 
    WHEN raw_user_meta_data->'is_paid' = to_jsonb(true) THEN '✅ CORRECTO: Boolean true - El usuario debería tener acceso'
    WHEN raw_user_meta_data->'is_paid' = 'true'::jsonb THEN '❌ INCORRECTO: String "true" - No funcionará'
    WHEN raw_user_meta_data->>'is_paid' = 'true' THEN '⚠️ Es string "true" - Necesita corrección'
    ELSE '⚠️ Valor desconocido'
  END as estado
FROM auth.users
WHERE email = 'marceloerossi@gmail.com';

-- IMPORTANTE: Después de ejecutar este query, el usuario debe:
-- 1. Cerrar sesión completamente
-- 2. Limpiar caché del navegador (Ctrl+Shift+Delete)
-- 3. Volver a iniciar sesión
-- Esto asegurará que los nuevos metadatos se carguen correctamente

