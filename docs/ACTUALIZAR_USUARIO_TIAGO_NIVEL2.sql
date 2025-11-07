-- Actualizar usuario Tiago.vas.mar@gmail.com
-- Configuración: Nivel 2 (Básico), usuario pagado, expira 05/11/2025

-- Marcar como usuario pagado de nivel 2 hasta 05/11/2025
-- ⚠️ IMPORTANTE: Usar to_jsonb(true) para guardar como BOOLEAN, no como STRING
-- Si usas 'true'::jsonb, se guarda como string "true" y el código TypeScript no lo reconoce
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          COALESCE(raw_user_meta_data, '{}'::jsonb), 
          '{nivel}', 
          '2'::jsonb
        ),
        '{is_paid}', 
        to_jsonb(true)  -- ✅ to_jsonb(true) guarda como boolean true, no como string
      ),
      '{paid_until}',
      '"2025-11-05T23:59:59.999Z"'::jsonb
    ),
    '{payment_status}',
    '"approved"'::jsonb
  ),
  '{trial_expires_at}',
  '"2025-11-05T23:59:59.999Z"'::jsonb
)
WHERE email = 'Tiago.vas.mar@gmail.com';

-- Verificar que se actualizó correctamente
SELECT 
  id,
  email,
  raw_user_meta_data->>'username' as username,
  raw_user_meta_data->>'nivel' as nivel,
  raw_user_meta_data->>'is_paid' as is_paid,
  raw_user_meta_data->>'payment_status' as payment_status,
  raw_user_meta_data->>'trial_expires_at' as trial_expires_at,
  raw_user_meta_data->>'paid_until' as paid_until,
  NOW() as fecha_actual,
  CASE 
    WHEN (raw_user_meta_data->>'paid_until')::timestamp > NOW() THEN '✅ Activo'
    ELSE '❌ Expirado'
  END as estado
FROM auth.users
WHERE email = 'Tiago.vas.mar@gmail.com';

-- ============================================
-- QUERY DE VERIFICACIÓN COMPLETA
-- Ejecuta esta query para corroborar todos los datos
-- ============================================
SELECT 
  u.id,
  u.email,
  u.created_at as fecha_creacion,
  u.raw_user_meta_data->>'username' as username,
  (u.raw_user_meta_data->>'nivel')::integer as nivel,
  CASE 
    WHEN (u.raw_user_meta_data->>'nivel')::integer = 0 THEN '❌ Sin acceso'
    WHEN (u.raw_user_meta_data->>'nivel')::integer = 1 THEN '🟡 Básico'
    WHEN (u.raw_user_meta_data->>'nivel')::integer = 2 THEN '🟢 Intermedio'
    WHEN (u.raw_user_meta_data->>'nivel')::integer = 3 THEN '🔵 VIP'
    ELSE '❓ Desconocido'
  END as nivel_descripcion,
  u.raw_user_meta_data->'is_paid' as is_paid_json,
  CASE 
    WHEN u.raw_user_meta_data->'is_paid' = 'true'::jsonb THEN '✅ Sí (boolean)'
    WHEN u.raw_user_meta_data->>'is_paid' = 'true' THEN '✅ Sí (string)'
    WHEN u.raw_user_meta_data->'is_paid' = 'false'::jsonb THEN '❌ No'
    ELSE '❓ No definido'
  END as estado_pago,
  u.raw_user_meta_data->>'payment_status' as payment_status,
  u.raw_user_meta_data->>'paid_until' as paid_until,
  u.raw_user_meta_data->>'trial_expires_at' as trial_expires_at,
  NOW() as fecha_actual,
  CASE 
    WHEN (u.raw_user_meta_data->>'paid_until')::timestamp > NOW() THEN '✅ Activo (pago vigente)'
    WHEN (u.raw_user_meta_data->>'paid_until')::timestamp IS NULL THEN '⚠️ Sin fecha de expiración'
    ELSE '❌ Expirado'
  END as estado_pago_detalle,
  CASE 
    WHEN (u.raw_user_meta_data->>'paid_until')::timestamp > NOW() 
    THEN EXTRACT(EPOCH FROM ((u.raw_user_meta_data->>'paid_until')::timestamp - NOW())) / 86400
    ELSE NULL
  END as dias_restantes,
  u.raw_user_meta_data as metadata_completa
FROM auth.users u
WHERE u.email = 'Tiago.vas.mar@gmail.com';

