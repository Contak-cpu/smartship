-- Migración completa de todos los usuarios al sistema de metadata
-- Ejecutar en SQL Editor de Supabase

-- 1. Verificar usuarios actuales
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data,
    p.username,
    p.nivel
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
ORDER BY p.nivel DESC;

-- 2. Migrar todos los usuarios
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
        'username', up.username,
        'nivel', up.nivel,
        'email', up.email
    )
FROM user_profiles up 
WHERE auth.users.id = up.id;

-- 3. Verificar migración exitosa
SELECT 
    id,
    email,
    raw_user_meta_data->>'username' as username,
    (raw_user_meta_data->>'nivel')::integer as nivel
FROM auth.users
ORDER BY (raw_user_meta_data->>'nivel')::integer DESC;

-- 4. Crear función para futuros usuarios
CREATE OR REPLACE FUNCTION sync_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
            'username', NEW.username,
            'nivel', NEW.nivel
        )
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger para sincronización automática
DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON user_profiles;
CREATE TRIGGER sync_user_metadata_trigger
    AFTER INSERT OR UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_metadata();
