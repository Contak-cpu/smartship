-- Consulta simple para verificar acceso a cupones de cualquier usuario
-- Reemplaza 'marceloerossi@gmail.com' con el email del usuario a verificar

SELECT 
  u.email,
  -- Verificar ambos formatos (texto y booleano)
  u.raw_user_meta_data->>'is_paid' as is_paid_texto,
  u.raw_user_meta_data->'is_paid' as is_paid_jsonb,
  (u.raw_user_meta_data->>'is_paid')::boolean as is_paid_boolean,
  u.raw_user_meta_data->>'nivel' as nivel,
  u.raw_user_meta_data->>'paid_until' as paid_until,
  u.raw_user_meta_data->>'trial_expires_at' as trial_expires_at,
  NOW() as fecha_actual,
  
  -- Resultado final (verificando múltiples formatos)
  CASE 
    WHEN (u.raw_user_meta_data->>'is_paid')::boolean = true THEN '✅ TIENE ACCESO (is_paid = true)'
    WHEN u.raw_user_meta_data->>'is_paid' = 'true' THEN '✅ TIENE ACCESO (is_paid = "true" como texto)'
    WHEN u.raw_user_meta_data->'is_paid' = 'true'::jsonb THEN '✅ TIENE ACCESO (is_paid = true como JSONB)'
    WHEN u.raw_user_meta_data->>'is_paid' = 'false' THEN '❌ NO TIENE ACCESO (is_paid = false)'
    WHEN u.raw_user_meta_data->>'is_paid' IS NULL THEN '❌ NO TIENE ACCESO (is_paid = NULL)'
    ELSE '⚠️ Estado desconocido: ' || COALESCE(u.raw_user_meta_data->>'is_paid', 'NULL')
  END as acceso_cupones,
  
  -- Recomendación
  CASE 
    WHEN (u.raw_user_meta_data->>'is_paid')::boolean != true 
         AND u.raw_user_meta_data->>'is_paid' != 'true' 
         AND u.raw_user_meta_data->'is_paid' != 'true'::jsonb THEN 
      '⚠️ ACCIÓN REQUERIDA: Ejecutar UPDATE para establecer is_paid = true'
    ELSE '✅ No requiere acción'
  END as recomendacion
  
FROM auth.users u
WHERE u.email = 'marceloerossi@gmail.com';

