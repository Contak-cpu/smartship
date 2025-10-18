-- Script final para migrar usuarios restantes
-- Ejecutar en SQL Editor de Supabase

-- 1. Verificar estado actual
SELECT 
    email,
    raw_user_meta_data->>'username' as username,
    (raw_user_meta_data->>'nivel')::integer as nivel
FROM auth.users
ORDER BY (raw_user_meta_data->>'nivel')::integer DESC NULLS LAST;

-- 2. Migrar matimdz@gmail.com (nivel 3)
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"username": "matimdz", "nivel": 3, "email": "matimdz@gmail.com"}'::jsonb
WHERE email = 'matimdz@gmail.com';

-- 3. Migrar yaelamallo02@gmail.com (nivel 3)
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"username": "yaelamallo02", "nivel": 3, "email": "yaelamallo02@gmail.com"}'::jsonb
WHERE email = 'yaelamallo02@gmail.com';

-- 4. Verificar migración exitosa
SELECT 
    email,
    raw_user_meta_data->>'username' as username,
    (raw_user_meta_data->>'nivel')::integer as nivel,
    raw_user_meta_data
FROM auth.users
ORDER BY (raw_user_meta_data->>'nivel')::integer DESC;
