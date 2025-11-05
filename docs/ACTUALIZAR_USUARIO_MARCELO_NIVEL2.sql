-- Actualizar usuario marceloerossi@gmail.com
-- Configuración: Nivel 2 (Básico), usuario pagado, expira 04/12/2025

-- Marcar como usuario pagado de nivel 2 hasta 04/12/2025
-- ⚠️ IMPORTANTE: Usar to_jsonb(true) para guardar como BOOLEAN, no como STRING
-- Si usas 'true'::jsonb, se guarda como string "true" y el código TypeScript no lo reconoce
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
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
    '"2025-12-04T23:59:59.999Z"'::jsonb
  ),
  '{trial_expires_at}',
  '"2025-12-04T23:59:59.999Z"'::jsonb
)
WHERE email = 'marceloerossi@gmail.com';

-- Actualizar también la tabla user_profiles para mantener consistencia
UPDATE user_profiles
SET 
  nivel = 2,
  trial_expires_at = '2025-12-04T23:59:59.999Z'::timestamptz,
  updated_at = NOW()
WHERE email = 'marceloerossi@gmail.com';

-- Verificar que se actualizó correctamente
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'username' as username,
  u.raw_user_meta_data->>'nivel' as nivel_metadata,
  u.raw_user_meta_data->>'is_paid' as is_paid,
  u.raw_user_meta_data->>'trial_expires_at' as trial_expires_at,
  u.raw_user_meta_data->>'paid_until' as paid_until,
  up.nivel as nivel_profile,
  up.trial_expires_at as trial_expires_at_profile,
  NOW() as fecha_actual,
  CASE 
    WHEN (u.raw_user_meta_data->>'paid_until')::timestamp > NOW() THEN '✅ Activo'
    ELSE '❌ Expirado'
  END as estado
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.email = 'marceloerossi@gmail.com';

