-- Migración de usuarios restantes al sistema de metadata
-- Ejecutar en SQL Editor de Supabase

-- 1. Migrar matimdz@gmail.com (nivel 3)
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('username', 'matimdz', 'nivel', 3, 'email', 'matimdz@gmail.com')
WHERE email = 'matimdz@gmail.com';

-- 2. Migrar yaelamallo02@gmail.com (nivel 3)
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('username', 'yaelamallo02', 'nivel', 3, 'email', 'yaelamallo02@gmail.com')
WHERE email = 'yaelamallo02@gmail.com';

-- 3. Verificar migración exitosa
SELECT 
    id,
    email,
    raw_user_meta_data->>'username' as username,
    (raw_user_meta_data->>'nivel')::integer as nivel
FROM auth.users
ORDER BY (raw_user_meta_data->>'nivel')::integer DESC;
