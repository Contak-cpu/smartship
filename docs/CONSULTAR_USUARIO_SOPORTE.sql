-- Consultar atributos del usuario soporte ecommerce
-- Este script muestra todos los metadatos y atributos asignados al usuario

-- Opción 1: Buscar por email exacto
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data->>'username' as username,
  raw_user_meta_data->>'nivel' as nivel,
  raw_user_meta_data->>'is_paid' as is_paid,
  raw_user_meta_data->>'pagos_empresa' as pagos_empresa,
  raw_user_meta_data->>'paid_until' as paid_until,
  raw_user_meta_data->>'trial_expires_at' as trial_expires_at,
  raw_user_meta_data->>'payment_status' as payment_status,
  raw_user_meta_data as metadata_completo
FROM auth.users
WHERE email = 'soporte.ecommerce123@gmail.com';

-- Opción 2: Buscar por cualquier email que contenga "soporte" y "ecommerce"
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data->>'username' as username,
  raw_user_meta_data->>'nivel' as nivel,
  raw_user_meta_data->>'is_paid' as is_paid,
  raw_user_meta_data->>'pagos_empresa' as pagos_empresa,
  raw_user_meta_data->>'paid_until' as paid_until,
  raw_user_meta_data->>'trial_expires_at' as trial_expires_at,
  raw_user_meta_data->>'payment_status' as payment_status,
  raw_user_meta_data as metadata_completo
FROM auth.users
WHERE email ILIKE '%soporte%' AND email ILIKE '%ecommerce%';

-- Opción 3: Buscar por username en metadata
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data->>'username' as username,
  raw_user_meta_data->>'nivel' as nivel,
  raw_user_meta_data->>'is_paid' as is_paid,
  raw_user_meta_data->>'pagos_empresa' as pagos_empresa,
  raw_user_meta_data->>'paid_until' as paid_until,
  raw_user_meta_data->>'trial_expires_at' as trial_expires_at,
  raw_user_meta_data->>'payment_status' as payment_status,
  raw_user_meta_data as metadata_completo
FROM auth.users
WHERE raw_user_meta_data->>'username' ILIKE '%soporte%' 
   OR raw_user_meta_data->>'username' ILIKE '%ecommerce%';

-- Opción 4: Ver TODOS los atributos en formato JSON legible
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data as todos_los_atributos
FROM auth.users
WHERE email ILIKE '%soporte%' AND email ILIKE '%ecommerce%';





