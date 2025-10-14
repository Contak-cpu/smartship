-- ========================================
-- FIX: LOGIN INFINITO - SOLUCIÓN RÁPIDA
-- ========================================
-- Ejecuta este script si el login se queda cargando eternamente

-- PASO 1: Agregar política para que usuarios lean su propio perfil
-- ========================================

-- Eliminar política existente si existe
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON user_profiles;

-- Crear política que permita leer el propio perfil
CREATE POLICY "Los usuarios pueden ver su propio perfil"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- PASO 2: Crear perfiles para todos los usuarios existentes que no tengan
-- ========================================

-- Insertar perfiles faltantes desde auth.users
INSERT INTO user_profiles (id, username, email, nivel)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'username', SPLIT_PART(au.email, '@', 1)) as username,
  au.email,
  COALESCE((au.raw_user_meta_data->>'nivel')::INTEGER, 0) as nivel
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- PASO 3: Verificar que el trigger existe para crear perfiles automáticamente
-- ========================================

-- Eliminar trigger antiguo si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Eliminar función antigua si existe
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Crear función actualizada
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, email, nivel)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'nivel')::INTEGER, 0)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Ver todos los usuarios y sus perfiles
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  up.username,
  up.nivel,
  CASE 
    WHEN up.id IS NULL THEN '❌ SIN PERFIL'
    ELSE '✅ CON PERFIL'
  END as estado_perfil
FROM auth.users au
LEFT JOIN user_profiles up ON up.id = au.id
ORDER BY au.created_at DESC;

-- Ver políticas activas
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'user_profiles'
AND cmd = 'SELECT'
ORDER BY policyname;

-- Si ves tu usuario con "❌ SIN PERFIL", ejecuta esto (reemplaza con tu email):
-- UPDATE user_profiles SET nivel = 0 WHERE id = (SELECT id FROM auth.users WHERE email = 'TU_EMAIL@ejemplo.com');
-- O mejor, ejecuta el INSERT de arriba de nuevo


