-- ========================================
-- FIX: POLÍTICAS RLS PARA USER_PROFILES
-- ========================================
-- Este script arregla las políticas para que los usuarios puedan leer su propio perfil

-- PASO 1: Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON user_profiles;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON user_profiles;
DROP POLICY IF EXISTS "Usuarios Dios pueden ver todos los perfiles" ON user_profiles;
DROP POLICY IF EXISTS "Usuarios Dios pueden actualizar cualquier perfil" ON user_profiles;
DROP POLICY IF EXISTS "Usuarios Dios pueden crear perfiles" ON user_profiles;
DROP POLICY IF EXISTS "Usuarios Dios pueden eliminar perfiles" ON user_profiles;

-- PASO 2: Crear política que permita a CUALQUIER usuario autenticado leer su propio perfil
CREATE POLICY "usuarios_pueden_leer_su_perfil"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- PASO 3: Crear política que permita a usuarios actualizar su propio perfil
CREATE POLICY "usuarios_pueden_actualizar_su_perfil"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- PASO 4: Políticas para usuarios Dios (nivel 999)
-- Ver todos los perfiles
CREATE POLICY "dios_puede_ver_todos_los_perfiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND nivel = 999
    )
  );

-- Actualizar cualquier perfil
CREATE POLICY "dios_puede_actualizar_cualquier_perfil"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND nivel = 999
    )
  );

-- Insertar perfiles (crear usuarios)
CREATE POLICY "dios_puede_insertar_perfiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND nivel = 999
    )
  );

-- Eliminar perfiles
CREATE POLICY "dios_puede_eliminar_perfiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND nivel = 999
    )
  );

-- PASO 5: Verificar que las políticas se crearon
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY cmd, policyname;

-- PASO 6: Verificar que RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'user_profiles';

-- Si rowsecurity = false, ejecutar:
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;


