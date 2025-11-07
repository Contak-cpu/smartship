-- Query para verificar el estado real de los usuarios en Supabase
-- Compara auth.users con user_profiles para identificar inconsistencias

SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  au.created_at as auth_created_at,
  up.username,
  up.nivel as nivel_en_perfil,
  up.paid as paid_en_perfil,
  up.created_at as perfil_created_at,
  up.updated_at as perfil_updated_at,
  -- Verificar si el usuario está en ambos lugares
  CASE 
    WHEN up.id IS NULL THEN '❌ SIN PERFIL'
    WHEN up.nivel IS NULL THEN '⚠️ NIVEL NULL'
    WHEN up.paid IS NULL THEN '⚠️ PAID NULL'
    ELSE '✅ OK'
  END as estado,
  -- Mostrar metadata de auth si existe
  au.raw_user_meta_data,
  au.raw_app_meta_data
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'tomjosenoto@gmail.com'  -- Reemplaza con el email que quieras verificar
   OR au.email LIKE '%tomjosenoto%'        -- O busca por coincidencia
ORDER BY au.created_at DESC;

-- Query para ver TODOS los usuarios con sus niveles
SELECT 
  au.email,
  au.id,
  up.username,
  up.nivel,
  up.paid,
  up.created_at,
  up.updated_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
ORDER BY up.nivel DESC, au.created_at DESC;

-- Query para encontrar usuarios con inconsistencias
SELECT 
  au.email,
  au.id,
  up.username,
  up.nivel,
  up.paid,
  CASE 
    WHEN up.nivel = 0 AND up.paid = true THEN '⚠️ PROBLEMA: Nivel 0 pero Paid = true'
    WHEN up.nivel > 0 AND up.paid = false THEN '⚠️ PROBLEMA: Nivel > 0 pero Paid = false'
    ELSE '✅ OK'
  END as problema
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NOT NULL
  AND (
    (up.nivel = 0 AND up.paid = true) OR
    (up.nivel > 0 AND up.paid = false)
  )
ORDER BY up.nivel DESC;









