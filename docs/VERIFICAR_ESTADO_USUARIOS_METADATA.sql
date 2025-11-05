-- Query para verificar el estado real de los usuarios en Supabase
-- Lee desde auth.users.raw_user_meta_data (fuente de verdad)

-- Query 1: Verificar un usuario específico (ejemplo: tomjosenoto@gmail.com)
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at as fecha_registro,
  raw_user_meta_data->>'username' as username,
  (raw_user_meta_data->>'nivel')::integer as nivel,
  raw_user_meta_data->>'is_paid' as is_paid,
  raw_user_meta_data->>'payment_status' as payment_status,
  raw_user_meta_data->>'paid_until' as paid_until,
  raw_user_meta_data->>'trial_expires_at' as trial_expires_at,
  raw_user_meta_data as metadata_completo,
  -- Verificar estado
  CASE 
    WHEN (raw_user_meta_data->>'nivel')::integer IS NULL THEN '⚠️ NIVEL NULL'
    WHEN (raw_user_meta_data->>'nivel')::integer = 0 THEN '⚠️ NIVEL 0 (Invitado)'
    WHEN (raw_user_meta_data->>'nivel')::integer > 0 AND (raw_user_meta_data->>'is_paid')::boolean = true THEN '✅ PAGADO - Nivel activo'
    WHEN (raw_user_meta_data->>'nivel')::integer > 0 AND (raw_user_meta_data->>'is_paid')::boolean IS NULL THEN '⚠️ NIVEL > 0 pero is_paid NULL'
    ELSE '✅ OK'
  END as estado
FROM auth.users
WHERE email = 'tomjosenoto@gmail.com'  -- Reemplaza con el email que quieras verificar
   OR email LIKE '%tomjosenoto%'        -- O busca por coincidencia
ORDER BY created_at DESC;

-- Query 2: Ver TODOS los usuarios con sus niveles desde metadata
SELECT 
  email,
  id,
  raw_user_meta_data->>'username' as username,
  (raw_user_meta_data->>'nivel')::integer as nivel,
  (raw_user_meta_data->>'is_paid')::boolean as is_paid,
  raw_user_meta_data->>'payment_status' as payment_status,
  raw_user_meta_data->>'paid_until' as paid_until,
  created_at,
  email_confirmed_at
FROM auth.users
ORDER BY (raw_user_meta_data->>'nivel')::integer DESC NULLS LAST, created_at DESC;

-- Query 3: Encontrar usuarios con nivel 0 pero que deberían tener nivel mayor
-- (útil para identificar usuarios que se registraron pero no se actualizó su nivel)
SELECT 
  email,
  id,
  raw_user_meta_data->>'username' as username,
  (raw_user_meta_data->>'nivel')::integer as nivel,
  (raw_user_meta_data->>'is_paid')::boolean as is_paid,
  CASE 
    WHEN (raw_user_meta_data->>'nivel')::integer = 0 THEN '⚠️ Usuario con nivel 0 (Invitado)'
    WHEN (raw_user_meta_data->>'nivel')::integer IS NULL THEN '❌ SIN NIVEL EN METADATA'
    ELSE '✅ OK'
  END as estado
FROM auth.users
WHERE (raw_user_meta_data->>'nivel')::integer = 0 
   OR (raw_user_meta_data->>'nivel') IS NULL
ORDER BY created_at DESC;

-- Query 4: Actualizar nivel de un usuario específico (ejemplo: tomjosenoto@gmail.com a nivel 2)
-- IMPORTANTE: Reemplaza 'USER_ID_AQUI' con el ID real del usuario
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
        'nivel', 2,
        'is_paid', true,
        'payment_status', 'approved'
    )
WHERE email = 'tomjosenoto@gmail.com'
RETURNING id, email, raw_user_meta_data->>'nivel' as nuevo_nivel;

