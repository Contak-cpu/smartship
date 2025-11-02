-- Forzar refresh de sesión para un usuario específico
-- Este script actualiza los metadatos y luego "revoca" la sesión actual
-- Haciendo que el usuario tenga que volver a iniciar sesión

-- PASO 1: Actualizar metadatos (ya lo hiciste con el otro script)
-- Este SQL ya está ejecutado, solo lo dejamos como referencia

-- PASO 2: Opción A - Invalidar la sesión actual cambiando la clave de seguridad del usuario
-- NOTA: Esto forzará al usuario a hacer logout y login nuevamente
-- Descomenta la siguiente línea y ejecuta para forzar refresh:

-- UPDATE auth.users SET encrypted_password = encrypted_password WHERE email = 'qiowe@gmail.com';

-- PASO 3: Opción B - El usuario debe cerrar sesión y volver a iniciar manualmente
-- Esta es la forma más segura y recomendada

-- Para verificar que los metadatos están actualizados:
SELECT 
  id,
  email,
  raw_user_meta_data->>'username' as username,
  raw_user_meta_data->>'nivel' as nivel,
  raw_user_meta_data->>'is_paid' as is_paid,
  raw_user_meta_data->>'paid_until' as paid_until,
  raw_user_meta_data->>'trial_expires_at' as trial_expires_at,
  last_sign_in_at,
  updated_at,
  NOW() as fecha_actual
FROM auth.users
WHERE email = 'qiowe@gmail.com';

-- IMPORTANTE: El usuario debe hacer lo siguiente:
-- 1. Cerrar sesión completamente de la aplicación
-- 2. Limpiar caché del navegador (Ctrl+Shift+Delete o Cmd+Shift+Delete)
-- 3. Volver a iniciar sesión




