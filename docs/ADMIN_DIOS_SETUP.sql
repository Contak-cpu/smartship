-- ========================================
-- CONFIGURACIÓN PANEL ADMINISTRACIÓN DIOS
-- ========================================

-- PASO 1: Agregar políticas para usuarios nivel Dios (999)
-- ========================================

-- Permitir a usuarios Dios ver todos los perfiles
CREATE POLICY "Usuarios Dios pueden ver todos los perfiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND nivel = 999
    )
  );

-- Permitir a usuarios Dios actualizar cualquier perfil
CREATE POLICY "Usuarios Dios pueden actualizar cualquier perfil"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND nivel = 999
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND nivel = 999
    )
  );

-- Permitir a usuarios Dios insertar perfiles (crear usuarios)
CREATE POLICY "Usuarios Dios pueden crear perfiles"
  ON user_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND nivel = 999
    )
  );

-- Permitir a usuarios Dios eliminar perfiles
CREATE POLICY "Usuarios Dios pueden eliminar perfiles"
  ON user_profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND nivel = 999
    )
  );

-- ========================================
-- PASO 2: Función para obtener todos los usuarios (solo Dios)
-- ========================================

CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE(
  id UUID,
  email TEXT,
  username TEXT,
  nivel INTEGER,
  email_confirmed_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
SECURITY DEFINER
AS $$
DECLARE
  caller_level INTEGER;
BEGIN
  -- Verificar que quien llama es nivel Dios
  SELECT up.nivel INTO caller_level
  FROM user_profiles up
  WHERE up.id = auth.uid();
  
  IF caller_level IS NULL OR caller_level != 999 THEN
    RAISE EXCEPTION 'Acceso denegado: Solo usuarios nivel Dios pueden ejecutar esta función';
  END IF;
  
  -- Retornar todos los usuarios con su información de autenticación
  RETURN QUERY
  SELECT 
    au.id,
    au.email::TEXT,
    up.username,
    up.nivel,
    au.email_confirmed_at,
    au.last_sign_in_at,
    au.created_at,
    up.updated_at
  FROM auth.users au
  LEFT JOIN user_profiles up ON up.id = au.id
  ORDER BY up.nivel DESC, au.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PASO 3: Función para actualizar nivel de usuario (solo Dios)
-- ========================================

CREATE OR REPLACE FUNCTION update_user_level(
  p_user_id UUID,
  p_new_level INTEGER
)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
  caller_level INTEGER;
BEGIN
  -- Verificar que quien llama es nivel Dios
  SELECT nivel INTO caller_level
  FROM user_profiles
  WHERE id = auth.uid();
  
  IF caller_level IS NULL OR caller_level != 999 THEN
    RAISE EXCEPTION 'Acceso denegado: Solo usuarios nivel Dios pueden cambiar niveles';
  END IF;
  
  -- Actualizar el nivel
  UPDATE user_profiles
  SET nivel = p_new_level,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PASO 4: Función para crear usuario con autoconfirmación (solo Dios)
-- ========================================
-- NOTA: Esta función debe ejecutarse con service_role_key desde el backend
-- No puede crear usuarios desde RLS policies

-- ========================================
-- PASO 5: Establecer el primer usuario Dios
-- ========================================
-- IMPORTANTE: Ejecuta este comando reemplazando el email con tu usuario

-- Primero, busca tu ID de usuario:
SELECT id, email FROM auth.users WHERE email = 'TU_EMAIL_AQUI';

-- Luego actualiza el nivel a 999:
UPDATE user_profiles 
SET nivel = 999, updated_at = NOW() 
WHERE id = 'TU_USER_ID_AQUI'::uuid;

-- Verifica que se actualizó correctamente:
SELECT * FROM user_profiles WHERE nivel = 999;

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Ver todas las políticas de user_profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Ver funciones creadas
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_all_users_admin', 'update_user_level')
ORDER BY routine_name;

