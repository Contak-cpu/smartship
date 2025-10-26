-- Marcar usuarios como pagados hasta 26/11/2025
-- Ejecuta este SQL en el SQL Editor de Supabase

-- Marcar yaelamallo02@gmail.com como pagado hasta 26/11/2025
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb), 
    '{is_paid}', 
    'true'::jsonb
  ),
  '{paid_until}',
  '"2025-11-26T23:59:59.000Z"'::jsonb
)
WHERE email = 'yaelamallo02@gmail.com';

-- Marcar erickkarcher22@gmail.com como pagado hasta 26/11/2025
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb), 
    '{is_paid}', 
    'true'::jsonb
  ),
  '{paid_until}',
  '"2025-11-26T23:59:59.000Z"'::jsonb
)
WHERE email = 'erickkarcher22@gmail.com';

-- Verificar que se aplicaron los cambios
SELECT 
  email,
  raw_user_meta_data->>'is_paid' as is_paid,
  raw_user_meta_data->>'paid_until' as paid_until,
  raw_user_meta_data->>'nivel' as nivel
FROM auth.users
WHERE email IN ('yaelamallo02@gmail.com', 'erickkarcher22@gmail.com');

