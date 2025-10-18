-- Script simple para migrar usuarios restantes
-- Ejecutar en SQL Editor de Supabase

-- Migrar matimdz@gmail.com
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"username": "matimdz", "nivel": 3, "email": "matimdz@gmail.com"}'::jsonb
WHERE email = 'matimdz@gmail.com';

-- Migrar yaelamallo02@gmail.com  
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"username": "yaelamallo02", "nivel": 3, "email": "yaelamallo02@gmail.com"}'::jsonb
WHERE email = 'yaelamallo02@gmail.com';

-- Verificar resultado
SELECT 
    email,
    raw_user_meta_data->>'username' as username,
    (raw_user_meta_data->>'nivel')::integer as nivel
FROM auth.users
ORDER BY (raw_user_meta_data->>'nivel')::integer DESC;
