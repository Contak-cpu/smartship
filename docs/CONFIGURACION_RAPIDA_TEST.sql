-- 🚀 CONFIGURACIÓN RÁPIDA PARA MODO TEST
-- Ejecuta este script completo en SQL Editor de Supabase para solucionar todos los problemas

-- ============================================================================
-- 1. DESHABILITAR RLS EN TODAS LAS TABLAS PROBLEMÁTICAS (MODO TEST)
-- ============================================================================

-- Deshabilitar RLS en user_profiles (esto soluciona el error 406)
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en tablas de historial también
ALTER TABLE IF EXISTS historial_smartship DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS historial_sku DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS historial_rentabilidad DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. ELIMINAR TODAS LAS POLÍTICAS QUE CAUSAN CONFLICTOS
-- ============================================================================

-- Eliminar políticas de user_profiles
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio historial" ON user_profiles;
DROP POLICY IF EXISTS "Los usuarios pueden insertar su propio historial" ON user_profiles;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar su propio historial" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON user_profiles;

-- Eliminar políticas de historial
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio historial" ON historial_smartship;
DROP POLICY IF EXISTS "Los usuarios pueden insertar su propio historial" ON historial_smartship;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar su propio historial" ON historial_smartship;

DROP POLICY IF EXISTS "Los usuarios pueden ver su propio historial SKU" ON historial_sku;
DROP POLICY IF EXISTS "Los usuarios pueden insertar su propio historial SKU" ON historial_sku;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar su propio historial SKU" ON historial_sku;

DROP POLICY IF EXISTS "Los usuarios pueden ver su propio historial de rentabilidad" ON historial_rentabilidad;
DROP POLICY IF EXISTS "Los usuarios pueden insertar su propio historial de rentabilidad" ON historial_rentabilidad;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar su propio historial de rentabilidad" ON historial_rentabilidad;

-- ============================================================================
-- 3. CREAR/RECREAR TABLA user_profiles CON ESTRUCTURA CORRECTA
-- ============================================================================

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  nivel INTEGER DEFAULT 3, -- Nivel 3 por defecto para modo test
  trial_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columnas si no existen (por si la tabla ya existía)
DO $$ 
BEGIN
    -- Agregar trial_expires_at si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'trial_expires_at') THEN
        ALTER TABLE user_profiles ADD COLUMN trial_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days');
    END IF;
    
    -- Agregar created_at si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'created_at') THEN
        ALTER TABLE user_profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Agregar updated_at si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE user_profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- ============================================================================
-- 4. FUNCIÓN PARA CREAR PERFIL AUTOMÁTICAMENTE AL REGISTRARSE
-- ============================================================================

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
  ) ON CONFLICT (id) DO UPDATE SET
    username = COALESCE(NEW.raw_user_meta_data->>'username', username_from_email),
    email = NEW.email,
    nivel = GREATEST(user_profiles.nivel, 3), -- Mantener nivel alto si ya lo tenía
    trial_expires_at = COALESCE(user_profiles.trial_expires_at, NOW() + INTERVAL '7 days'),
    updated_at = NOW();

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

-- ============================================================================
-- 5. CREAR TRIGGER PARA NUEVOS USUARIOS
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 6. FUNCIÓN PARA SINCRONIZAR CAMBIOS EN user_profiles CON auth.users
-- ============================================================================

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

-- ============================================================================
-- 7. TRIGGER PARA SINCRONIZACIÓN AUTOMÁTICA
-- ============================================================================

DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON user_profiles;
CREATE TRIGGER sync_user_metadata_trigger
    AFTER INSERT OR UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_metadata();

-- ============================================================================
-- 8. MIGRAR TODOS LOS USUARIOS EXISTENTES A NIVEL 3 CON 7 DÍAS
-- ============================================================================

-- Insertar perfiles para usuarios que no los tienen
INSERT INTO user_profiles (id, username, email, nivel, trial_expires_at, created_at, updated_at)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)) as username,
    u.email,
    3 as nivel,
    NOW() + INTERVAL '7 days' as trial_expires_at,
    COALESCE(u.created_at, NOW()) as created_at,
    NOW() as updated_at
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Actualizar usuarios existentes con perfil a nivel 3 y agregar trial si no lo tienen
UPDATE user_profiles 
SET 
    nivel = GREATEST(nivel, 3), -- Asegurar que todos tengan al menos nivel 3
    trial_expires_at = COALESCE(trial_expires_at, NOW() + INTERVAL '7 days'),
    updated_at = NOW()
WHERE nivel < 3 OR trial_expires_at IS NULL;

-- ============================================================================
-- 9. ACTUALIZAR METADATA DE TODOS LOS USUARIOS
-- ============================================================================

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

-- ============================================================================
-- 10. VERIFICACIÓN FINAL
-- ============================================================================

-- Mostrar estadísticas
SELECT 
    'Total usuarios en auth.users' as descripcion,
    COUNT(*) as cantidad
FROM auth.users
UNION ALL
SELECT 
    'Total usuarios en user_profiles' as descripcion,
    COUNT(*) as cantidad
FROM user_profiles
UNION ALL
SELECT 
    'Usuarios con nivel 3 o superior' as descripcion,
    COUNT(*) as cantidad
FROM user_profiles WHERE nivel >= 3
UNION ALL
SELECT 
    'Usuarios con trial activo' as descripcion,
    COUNT(*) as cantidad
FROM user_profiles WHERE trial_expires_at > NOW();

-- Mostrar todos los usuarios actualizados
SELECT 
    u.email,
    up.username,
    up.nivel,
    up.trial_expires_at,
    CASE 
        WHEN up.trial_expires_at > NOW() THEN '✅ Activo'
        ELSE '❌ Expirado'
    END as estado_trial,
    u.raw_user_meta_data->>'nivel' as metadata_nivel
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
ORDER BY up.nivel DESC, u.created_at DESC;

-- ============================================================================
-- 🎉 CONFIGURACIÓN COMPLETADA
-- ============================================================================

-- RESUMEN DE CAMBIOS:
-- ✅ RLS deshabilitado en todas las tablas (modo test)
-- ✅ Políticas problemáticas eliminadas
-- ✅ Tabla user_profiles creada/actualizada con columnas de trial
-- ✅ Trigger automático para nuevos registros con nivel 3 y 7 días
-- ✅ Sincronización automática entre user_profiles y auth.users
-- ✅ Todos los usuarios existentes migrados a nivel 3 con 7 días de trial
-- ✅ Metadata actualizado en auth.users

-- NOTA: Para reactivar seguridad más tarde (cuando salgas de modo test):
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);


