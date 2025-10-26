-- SOLUCIÓN COMPLETA PARA REGISTRO AUTOMÁTICO NIVEL 3 CON 7 DÍAS DE PRUEBA
-- Ejecutar en SQL Editor de Supabase

-- 1. CREAR TABLA user_profiles SI NO EXISTE
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  nivel INTEGER DEFAULT 3, -- Nivel 3 por defecto para modo test
  trial_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. DESHABILITAR RLS TEMPORALMENTE PARA MODO TEST
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 3. ELIMINAR POLÍTICAS EXISTENTES QUE CAUSAN ERROR 406
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio historial" ON user_profiles;
DROP POLICY IF EXISTS "Los usuarios pueden insertar su propio historial" ON user_profiles;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar su propio historial" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- 4. FUNCIÓN PARA CREAR PERFIL AUTOMÁTICAMENTE AL REGISTRARSE
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_from_email TEXT;
BEGIN
  -- Extraer username del email (parte antes del @)
  username_from_email := split_part(NEW.email, '@', 1);
  
  -- Insertar perfil con nivel 3 y 7 días de prueba
  INSERT INTO user_profiles (
    id,
    username,
    email,
    nivel,
    trial_expires_at,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', username_from_email),
    NEW.email,
    3, -- Nivel 3 automático
    NOW() + INTERVAL '7 days', -- 7 días de prueba
    NOW(),
    NOW()
  );

  -- Actualizar metadata del usuario en auth.users
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
          'username', COALESCE(NEW.raw_user_meta_data->>'username', username_from_email),
          'nivel', 3,
          'email', NEW.email,
          'trial_expires_at', (NOW() + INTERVAL '7 days')::text
      )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CREAR TRIGGER PARA NUEVOS USUARIOS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 6. FUNCIÓN PARA SINCRONIZAR CAMBIOS EN user_profiles CON auth.users
CREATE OR REPLACE FUNCTION sync_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
            'username', NEW.username,
            'nivel', NEW.nivel,
            'email', NEW.email,
            'trial_expires_at', NEW.trial_expires_at::text
        )
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. TRIGGER PARA SINCRONIZACIÓN AUTOMÁTICA
DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON user_profiles;
CREATE TRIGGER sync_user_metadata_trigger
    AFTER INSERT OR UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_metadata();

-- 8. MIGRAR USUARIOS EXISTENTES A NIVEL 3 CON 7 DÍAS
-- Actualizar usuarios existentes sin perfil
INSERT INTO user_profiles (id, username, email, nivel, trial_expires_at, created_at, updated_at)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)) as username,
    u.email,
    3 as nivel,
    NOW() + INTERVAL '7 days' as trial_expires_at,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Actualizar usuarios existentes con perfil a nivel 3
UPDATE user_profiles 
SET 
    nivel = 3,
    trial_expires_at = COALESCE(trial_expires_at, NOW() + INTERVAL '7 days'),
    updated_at = NOW()
WHERE nivel < 3 OR trial_expires_at IS NULL;

-- 9. ACTUALIZAR METADATA DE TODOS LOS USUARIOS
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
        'username', up.username,
        'nivel', up.nivel,
        'email', up.email,
        'trial_expires_at', up.trial_expires_at::text
    )
FROM user_profiles up 
WHERE auth.users.id = up.id;

-- 10. VERIFICAR CONFIGURACIÓN
SELECT 
    'Usuarios en auth.users' as tabla,
    COUNT(*) as total
FROM auth.users
UNION ALL
SELECT 
    'Usuarios en user_profiles' as tabla,
    COUNT(*) as total
FROM user_profiles
UNION ALL
SELECT 
    'Usuarios nivel 3' as tabla,
    COUNT(*) as total
FROM user_profiles WHERE nivel = 3;

-- 11. MOSTRAR USUARIOS ACTUALIZADOS
SELECT 
    u.email,
    up.username,
    up.nivel,
    up.trial_expires_at,
    u.raw_user_meta_data->>'nivel' as metadata_nivel
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
ORDER BY up.nivel DESC, u.created_at DESC;

-- NOTA: Para reactivar RLS más tarde (cuando salgas de modo test):
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);