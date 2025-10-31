-- Actualizar fecha de expiración del plan para soporte.ecommerce123@gmail.com
-- Fecha de expiración: 30 de noviembre de 2024

UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{paid_until}', 
  '"2024-11-30T23:59:59.000Z"'::jsonb
)
WHERE email = 'soporte.ecommerce123@gmail.com';

-- Verificar que se actualizó correctamente
SELECT 
  id,
  email,
  raw_user_meta_data->>'username' as username,
  raw_user_meta_data->>'nivel' as nivel,
  raw_user_meta_data->>'is_paid' as is_paid,
  raw_user_meta_data->>'pagos_empresa' as pagos_empresa,
  raw_user_meta_data->>'paid_until' as paid_until,
  created_at
FROM auth.users
WHERE email = 'soporte.ecommerce123@gmail.com';

