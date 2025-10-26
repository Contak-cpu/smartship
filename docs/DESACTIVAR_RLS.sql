-- =====================================================
-- DESACTIVAR RLS TEMPORALMENTE
-- =====================================================
-- Esto permite que los usuarios accedan a sus perfiles
-- sin problemas de políticas
-- =====================================================

-- DESACTIVAR RLS en user_profiles
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Verificar que se desactivó
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- Resultado esperado: rowsecurity = false

-- =====================================================
-- AHORA DEBERÍA FUNCIONAR SIN ERRORES 406
-- =====================================================


