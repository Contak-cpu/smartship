-- Script para crear usuario soporte.ecommerce123@gmail.com con Plan Empresa
-- Ejecuta este SQL en el SQL Editor de Supabase

-- Primero, insertamos el usuario en auth.users usando auth.create_user()
-- Nota: Esto requiere permisos de administrador o usar la función de Supabase

-- OPCIÓN 1: Usar función de Supabase para crear usuario (recomendado)
-- Si tienes la función auth.create_user() disponible:
SELECT auth.create_user(
  '{
    "email": "soporte.ecommerce123@gmail.com",
    "password": "ecom333",
    "email_confirm": true,
    "user_metadata": {
      "username": "Soporte Ecommerce",
      "nivel": 3,
      "is_paid": true,
      "pagos_empresa": true,
      "trial_expires_at": null
    }
  }'::jsonb
);

-- OPCIÓN 2: Si la opción 1 no funciona, usa el panel de Supabase:
-- 1. Ve a Authentication > Users > Add user
-- 2. Email: soporte.ecommerce123@gmail.com
-- 3. Password: ecom333
-- 4. Auto Confirm User: ✅ Activar
-- 5. User Metadata:
-- {
--   "username": "Soporte Ecommerce",
--   "nivel": 3,
--   "is_paid": true,
--   "pagos_empresa": true,
--   "trial_expires_at": null
-- }
-- 6. Click Create user

-- OPCIÓN 3: Si el usuario ya existe, actualizar sus metadatos
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb), 
        '{username}', 
        '"Soporte Ecommerce"'::jsonb
      ),
      '{nivel}',
      '3'::jsonb
    ),
    '{is_paid}',
    'true'::jsonb
  ),
  '{pagos_empresa}',
  'true'::jsonb
)
WHERE email = 'soporte.ecommerce123@gmail.com';

-- Verificar que se creó/actualizó correctamente
SELECT 
  id,
  email,
  raw_user_meta_data->>'username' as username,
  raw_user_meta_data->>'nivel' as nivel,
  raw_user_meta_data->>'is_paid' as is_paid,
  raw_user_meta_data->>'pagos_empresa' as pagos_empresa,
  raw_user_meta_data->>'paid_until' as paid_until,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'soporte.ecommerce123@gmail.com';

