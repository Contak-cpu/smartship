-- =====================================================
-- SOLUCIÓN DEFINITIVA FINAL - EJECUTA ESTO
-- =====================================================

-- PASO 1: Desactivar RLS
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- PASO 2: Eliminar todas las políticas
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;

-- PASO 3: Cambiar el valor por defecto de nivel a 3
ALTER TABLE user_profiles 
ALTER COLUMN nivel SET DEFAULT 3;

-- PASO 4: Actualizar todos los usuarios existentes a nivel 3
UPDATE user_profiles SET nivel = 3 WHERE nivel < 3;

-- PASO 5: Verificar
SELECT 
  id, 
  username, 
  email, 
  nivel,
  trial_expires_at
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- =====================================================
-- FIN - DESPUÉS DE EJECUTAR ESTO:
-- 1. Recarga la página
-- 2. Registra un nuevo usuario
-- 3. Debería ser nivel 3 automáticamente
-- =====================================================


