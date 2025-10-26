-- =====================================================
-- SOLUCIÓN COMPLETA - RLS + ACTUALIZAR USUARIO EXISTENTE
-- =====================================================

-- PASO 1: Configurar RLS para user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Crear políticas simples y permisivas
CREATE POLICY "Enable all for authenticated users" ON user_profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- PASO 2: Actualizar el usuario existente de nivel 0 a 3
UPDATE user_profiles 
SET nivel = 3 
WHERE id = '90356f28-0731-4157-947d-638fbed1133d';

-- PASO 3: Verificar
SELECT username, email, nivel, trial_expires_at 
FROM user_profiles 
WHERE id = '90356f28-0731-4157-947d-638fbed1133d';

-- Resultado esperado: nivel = 3


