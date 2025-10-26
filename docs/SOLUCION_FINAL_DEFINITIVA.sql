-- =====================================================
-- SOLUCIÓN FINAL DEFINITIVA
-- =====================================================

-- PASO 1: Asegurar que RLS está DESACTIVADO
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- PASO 2: Eliminar TODAS las políticas
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;

-- PASO 3: Verificar que RLS está desactivado
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'user_profiles';
-- Debe mostrar: rowsecurity = false

-- PASO 4: Actualizar usuario nuevo a nivel 3
UPDATE user_profiles 
SET nivel = 3 
WHERE id = 'ed669529-4b20-418f-8ca9-94527ad85ef6';

-- PASO 5: Verificar
SELECT username, email, nivel, created_at
FROM user_profiles 
WHERE id = 'ed669529-4b20-418f-8ca9-94527ad85ef6';

-- =====================================================
-- FIN - AHORA DEBERÍA FUNCIONAR SIN ERRORES
-- =====================================================


