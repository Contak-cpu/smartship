-- Consulta de diagnóstico para verificar acceso a cupones
-- Usuario: marceloerossi@gmail.com
-- Esta consulta verifica todos los campos relevantes para determinar si el usuario puede acceder a la sección de cupones

SELECT 
  -- Información básica del usuario
  u.id,
  u.email,
  u.created_at as fecha_registro,
  u.updated_at as ultima_actualizacion,
  
  -- Metadatos de auth.users (raw_user_meta_data)
  u.raw_user_meta_data->>'username' as username_metadata,
  u.raw_user_meta_data->>'nivel' as nivel_metadata,
  u.raw_user_meta_data->>'is_paid' as is_paid_metadata,
  u.raw_user_meta_data->>'paid_until' as paid_until_metadata,
  u.raw_user_meta_data->>'trial_expires_at' as trial_expires_at_metadata,
  u.raw_user_meta_data->>'pagos_empresa' as pagos_empresa_metadata,
  
  -- Datos de user_profiles
  up.nivel as nivel_profile,
  up.trial_expires_at as trial_expires_at_profile,
  up.created_at as profile_created_at,
  up.updated_at as profile_updated_at,
  
  -- Fechas calculadas
  NOW() as fecha_actual,
  (u.raw_user_meta_data->>'paid_until')::timestamptz as paid_until_parsed,
  (u.raw_user_meta_data->>'trial_expires_at')::timestamptz as trial_expires_at_parsed,
  
  -- Diagnóstico de acceso
  CASE 
    WHEN u.raw_user_meta_data->>'is_paid' = 'true' THEN '✅ is_paid = true (DEBERÍA TENER ACCESO)'
    WHEN u.raw_user_meta_data->>'is_paid' = 'false' THEN '❌ is_paid = false (NO TIENE ACCESO)'
    WHEN u.raw_user_meta_data->>'is_paid' IS NULL THEN '⚠️ is_paid = NULL (NO TIENE ACCESO - Necesita ser marcado como true)'
    ELSE '⚠️ is_paid = ' || COALESCE(u.raw_user_meta_data->>'is_paid', 'NULL') || ' (Estado desconocido)'
  END as diagnostico_is_paid,
  
  CASE 
    WHEN (u.raw_user_meta_data->>'paid_until')::timestamptz > NOW() THEN '✅ paid_until válido (futuro)'
    WHEN (u.raw_user_meta_data->>'paid_until')::timestamptz < NOW() THEN '⚠️ paid_until expirado'
    WHEN u.raw_user_meta_data->>'paid_until' IS NULL THEN 'ℹ️ paid_until no configurado'
    ELSE '⚠️ paid_until inválido'
  END as diagnostico_paid_until,
  
  CASE 
    WHEN (u.raw_user_meta_data->>'trial_expires_at')::timestamptz > NOW() THEN '✅ trial_expires_at válido (futuro)'
    WHEN (u.raw_user_meta_data->>'trial_expires_at')::timestamptz < NOW() THEN '⚠️ trial_expires_at expirado'
    WHEN u.raw_user_meta_data->>'trial_expires_at' IS NULL THEN 'ℹ️ trial_expires_at no configurado'
    ELSE '⚠️ trial_expires_at inválido'
  END as diagnostico_trial_expires_at,
  
  CASE 
    WHEN (u.raw_user_meta_data->>'nivel')::int > 0 THEN '✅ Nivel > 0 (' || (u.raw_user_meta_data->>'nivel') || ')'
    ELSE '⚠️ Nivel = 0 o NULL'
  END as diagnostico_nivel,
  
  -- Verificación final según la lógica de isPaidUser()
  CASE 
    WHEN u.raw_user_meta_data->>'is_paid' = 'true' THEN '✅ ACCESO PERMITIDO (is_paid = true)'
    WHEN u.raw_user_meta_data->>'is_paid' = 'false' THEN '❌ ACCESO DENEGADO (is_paid = false explícito)'
    WHEN u.raw_user_meta_data->>'is_paid' IS NULL AND u.raw_user_meta_data->>'trial_expires_at' IS NULL THEN '❌ ACCESO DENEGADO (is_paid NULL y sin trial_expires_at)'
    WHEN u.raw_user_meta_data->>'is_paid' IS NULL 
         AND (u.raw_user_meta_data->>'trial_expires_at')::timestamptz < NOW() 
         AND (u.raw_user_meta_data->>'nivel')::int > 0 THEN '✅ ACCESO PERMITIDO (trial expirado pero nivel > 0)'
    ELSE '❌ ACCESO DENEGADO (No cumple condiciones)'
  END as resultado_final,
  
  -- Diferencias entre metadata y profile
  CASE 
    WHEN u.raw_user_meta_data->>'nivel' != up.nivel::text THEN '⚠️ DIFERENCIA: nivel_metadata (' || COALESCE(u.raw_user_meta_data->>'nivel', 'NULL') || ') != nivel_profile (' || COALESCE(up.nivel::text, 'NULL') || ')'
    ELSE '✅ Niveles coinciden'
  END as verificacion_sincronizacion

FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.email = 'marceloerossi@gmail.com';

-- Consulta adicional: Verificar si hay problemas de sincronización
SELECT 
  'Verificación de sincronización entre auth.users y user_profiles' as tipo_verificacion,
  u.email,
  u.raw_user_meta_data->>'nivel' as nivel_metadata,
  up.nivel as nivel_profile,
  u.raw_user_meta_data->>'trial_expires_at' as trial_expires_at_metadata,
  up.trial_expires_at as trial_expires_at_profile,
  CASE 
    WHEN u.raw_user_meta_data->>'nivel' != up.nivel::text THEN '❌ Niveles diferentes'
    WHEN u.raw_user_meta_data->>'trial_expires_at' IS NOT NULL 
         AND up.trial_expires_at IS NULL THEN '⚠️ trial_expires_at solo en metadata'
    WHEN u.raw_user_meta_data->>'trial_expires_at' IS NULL 
         AND up.trial_expires_at IS NOT NULL THEN '⚠️ trial_expires_at solo en profile'
    ELSE '✅ Sincronizado'
  END as estado_sincronizacion
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.email = 'marceloerossi@gmail.com';












