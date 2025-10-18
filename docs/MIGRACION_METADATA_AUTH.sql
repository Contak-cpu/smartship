-- MIGRACIÓN: Mover niveles de usuario al metadata de autenticación
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Actualizar el metadata de todos los usuarios existentes
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
        'username', up.username,
        'nivel', up.nivel,
        'email', up.email
    )
FROM user_profiles up 
WHERE auth.users.id = up.id;

-- 2. Verificar que la migración funcionó
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data->>'username' as username,
    au.raw_user_meta_data->>'nivel' as nivel,
    au.raw_user_meta_data->>'email' as email_metadata
FROM auth.users au
WHERE au.email = 'erick@gmail.com';

-- 3. Crear función para actualizar niveles en el futuro
CREATE OR REPLACE FUNCTION update_user_level(user_id uuid, new_level integer)
RETURNS void AS $$
BEGIN
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object('nivel', new_level)
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Crear función para obtener nivel de usuario
CREATE OR REPLACE FUNCTION get_user_level(user_id uuid)
RETURNS integer AS $$
BEGIN
    RETURN COALESCE(
        (SELECT (raw_user_meta_data->>'nivel')::integer 
         FROM auth.users 
         WHERE id = user_id), 
        0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
