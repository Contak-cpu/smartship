-- Query para verificar el estado real de tomjosenoto@gmail.com
-- Lee desde auth.users.raw_user_meta_data (fuente de verdad)

SELECT 
  id,
  email,
  email_confirmed_at,
  created_at as fecha_registro,
  raw_user_meta_data->>'username' as username,
  (raw_user_meta_data->>'nivel')::integer as nivel,
  (raw_user_meta_data->>'is_paid')::boolean as is_paid,
  raw_user_meta_data->>'payment_status' as payment_status,
  raw_user_meta_data->>'paid_until' as paid_until,
  raw_user_meta_data->>'trial_expires_at' as trial_expires_at,
  raw_user_meta_data as metadata_completo,
  -- Verificar estado
  CASE 
    WHEN (raw_user_meta_data->>'nivel')::integer IS NULL THEN '⚠️ NIVEL NULL'
    WHEN (raw_user_meta_data->>'nivel')::integer = 0 THEN '⚠️ NIVEL 0 (Invitado) - PROBLEMA: Debería ser nivel 2'
    WHEN (raw_user_meta_data->>'nivel')::integer = 2 AND (raw_user_meta_data->>'is_paid')::boolean = true THEN '✅ CORRECTO: Nivel 2 y Paid'
    WHEN (raw_user_meta_data->>'nivel')::integer = 2 AND (raw_user_meta_data->>'is_paid')::boolean IS NULL THEN '⚠️ Nivel 2 pero is_paid NULL'
    ELSE '✅ OK'
  END as estado
FROM auth.users
WHERE email = 'tomjosenoto@gmail.com'
   OR email LIKE '%tomjosenoto%';

-- Query para actualizar el nivel a 2 y marcar como pagado
-- IMPORTANTE: Ejecuta primero la query de arriba para verificar el estado actual
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
        'nivel', 2,
        'is_paid', true,
        'payment_status', 'approved'
    )
WHERE email = 'tomjosenoto@gmail.com'
RETURNING 
  id, 
  email, 
  (raw_user_meta_data->>'nivel')::integer as nuevo_nivel,
  (raw_user_meta_data->>'is_paid')::boolean as is_paid;



