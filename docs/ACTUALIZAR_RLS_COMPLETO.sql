-- =====================================================
-- CONFIRMAR QUE RLS ESTÁ DESACTIVADO
-- =====================================================

-- Verificar estado actual de RLS
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- Si rowsecurity = true, desactivarlo:
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Verificar que se desactivó
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- Resultado esperado: rowsecurity = false

-- =====================================================
-- LIMPIAR POLÍTICAS ANTIGUAS (por si acaso)
-- =====================================================

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON user_profiles;

-- =====================================================
-- CONFIRMACIÓN FINAL
-- =====================================================

-- Ver políticas restantes (debe estar vacío)
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- =====================================================
-- FIN
-- =====================================================


