-- =====================================================
-- POLÍTICAS RLS (Row Level Security) PARA user_profiles
-- =====================================================
-- Ejecuta esto para configurar las políticas de seguridad
-- que permiten a los usuarios acceder a sus propios perfiles
-- =====================================================

-- PASO 1: Habilitar RLS si no está habilitado
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- PASO 2: Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON user_profiles;

-- PASO 3: Crear nueva política simplificada - LOS USUARIOS PUEDEN VER SU PROPIO PERFIL
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- PASO 4: Permitir que los usuarios creen su propio perfil
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- PASO 5: Permitir que los usuarios actualicen su propio perfil
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- PASO 6: También crear una política más permisiva para desarrollo
-- (Comentar esto en producción)
CREATE POLICY "Enable read access for authenticated users" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- PASO 7: Verificar las políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- =====================================================
-- FIN
-- =====================================================


