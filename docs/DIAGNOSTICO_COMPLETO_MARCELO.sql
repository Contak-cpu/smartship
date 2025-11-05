-- Diagnóstico completo del problema de acceso a cupones
-- Usuario: marceloerossi@gmail.com

-- PROBLEMA IDENTIFICADO:
-- El campo is_paid se está guardando como STRING "true" en lugar de BOOLEAN true
-- El código TypeScript verifica: metadata.is_paid === true (comparación estricta con booleano)
-- Por lo tanto, aunque diga "true" en la BD, el código no lo reconoce

-- VERIFICACIÓN 1: Ver el valor exacto guardado
SELECT 
  email,
  raw_user_meta_data->>'is_paid' as is_paid_texto,
  raw_user_meta_data->'is_paid' as is_paid_jsonb,
  pg_typeof(raw_user_meta_data->'is_paid') as tipo_dato,
  CASE 
    WHEN raw_user_meta_data->'is_paid' = 'true'::jsonb THEN 'String "true"'
    WHEN raw_user_meta_data->'is_paid' = to_jsonb(true) THEN 'Boolean true'
    ELSE 'Otro valor'
  END as tipo_valor
FROM auth.users
WHERE email = 'marceloerossi@gmail.com';

-- VERIFICACIÓN 2: Simular lo que hace el código TypeScript
-- El código hace: metadata.is_paid === true
-- Si Supabase devuelve el string "true", la comparación falla
SELECT 
  email,
  raw_user_meta_data->>'is_paid' as valor_actual,
  CASE 
    WHEN (raw_user_meta_data->>'is_paid')::boolean = true THEN '✅ Funcionaría (se puede convertir a boolean)'
    WHEN raw_user_meta_data->>'is_paid' = 'true' THEN '⚠️ Es string "true" - NO funcionará con === true'
    ELSE '❌ No tiene valor o es false'
  END as diagnostico
FROM auth.users
WHERE email = 'marceloerossi@gmail.com';

-- SOLUCIÓN: Actualizar usando to_jsonb(true) en lugar de 'true'::jsonb
-- Esto guardará el valor como booleano true en lugar de string "true"
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
      to_jsonb(true)  -- ⚠️ CAMBIO: to_jsonb(true) en lugar de 'true'::jsonb
    ),
    '{paid_until}',
    '"2025-12-04T23:59:59.999Z"'::jsonb
  ),
  '{trial_expires_at}',
  '"2025-12-04T23:59:59.999Z"'::jsonb
)
WHERE email = 'marceloerossi@gmail.com';

-- VERIFICACIÓN POST-CORRECCIÓN
SELECT 
  email,
  raw_user_meta_data->>'is_paid' as is_paid_texto,
  raw_user_meta_data->'is_paid' as is_paid_jsonb,
  pg_typeof(raw_user_meta_data->'is_paid') as tipo_dato,
  CASE 
    WHEN raw_user_meta_data->'is_paid' = to_jsonb(true) THEN '✅ CORRECTO: Boolean true'
    WHEN raw_user_meta_data->'is_paid' = 'true'::jsonb THEN '⚠️ INCORRECTO: String "true"'
    ELSE '❌ Valor desconocido'
  END as estado_final,
  CASE 
    WHEN raw_user_meta_data->'is_paid' = to_jsonb(true) THEN '✅ El usuario DEBERÍA tener acceso ahora'
    ELSE '❌ Aún hay problemas'
  END as acceso_cupones
FROM auth.users
WHERE email = 'marceloerossi@gmail.com';

