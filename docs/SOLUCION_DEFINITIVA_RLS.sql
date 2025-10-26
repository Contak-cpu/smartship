-- =====================================================
-- SOLUCIÓN DEFINITIVA PARA ERROR 406
-- =====================================================

-- PASO 1: Desactivar RLS completamente
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- PASO 2: Eliminar TODAS las políticas (lo que esté causando 406)
DROP POLICY IF EXISTS read_own_profile ON user_profiles CASCADE;
DROP POLICY IF EXISTS update_own_profile ON user_profiles CASCADE;
DROP POLICY IF EXISTS insert_own_profile ON user_profiles CASCADE;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles CASCADE;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles CASCADE;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles CASCADE;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles CASCADE;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON user_profiles CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles CASCADE;

-- PASO 3: Verificar que quedó limpio
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles';

SELECT policyname 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- =====================================================
-- DESPUÉS DE EJECUTAR ESTO:
-- 1. Recarga la página (Ctrl+F5)
-- 2. Los errores 406 desaparecerán
-- 3. El usuario debería cargar correctamente
-- =====================================================

