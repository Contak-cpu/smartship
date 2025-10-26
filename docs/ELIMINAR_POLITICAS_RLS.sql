-- ELIMINAR POLÍTICAS RLS QUE ESTÁN CAUSANDO ERROR 406

DROP POLICY IF EXISTS read_own_profile ON user_profiles;
DROP POLICY IF EXISTS update_own_profile ON user_profiles;
DROP POLICY IF EXISTS insert_own_profile ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Verificar que no queden políticas
SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles';

