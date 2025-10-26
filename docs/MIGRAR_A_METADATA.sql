-- ============================================
-- MIGRACIÓN DE user_profiles A user_metadata
-- ============================================
-- Este script copia los datos de la tabla user_profiles
-- al campo user_metadata de auth.users
-- 
-- Ejecutar SOLO UNA VEZ en producción
-- ============================================

-- Paso 1: Ver usuarios actuales y su metadata
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data as metadata_actual,
  p.username,
  p.nivel,
  p.trial_expires_at,
  p.created_at
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
LIMIT 10;

-- Paso 2: Actualizar metadata de todos los usuarios
-- NOTA: Esto sobrescribirá el metadata existente
UPDATE auth.users u
SET raw_user_meta_data = jsonb_build_object(
  'username', COALESCE(p.username, split_part(u.email, '@', 1)),
  'nivel', COALESCE(p.nivel, 3),
  'trial_expires_at', COALESCE(
    p.trial_expires_at::text, 
    (NOW() + INTERVAL '7 days')::text
  ),
  'email', u.email
)
FROM public.user_profiles p
WHERE u.id = p.id;

-- Paso 3: Actualizar usuarios que NO tienen perfil en user_profiles
-- (les asigna valores por defecto)
UPDATE auth.users u
SET raw_user_meta_data = jsonb_build_object(
  'username', split_part(u.email, '@', 1),
  'nivel', 3,
  'trial_expires_at', (NOW() + INTERVAL '7 days')::text,
  'email', u.email
)
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles p WHERE p.id = u.id
)
AND (raw_user_meta_data->>'nivel') IS NULL;

-- Paso 4: Verificar que todos los usuarios tienen metadata correcto
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'username' as username,
  (u.raw_user_meta_data->>'nivel')::int as nivel,
  u.raw_user_meta_data->>'trial_expires_at' as trial_expira,
  CASE 
    WHEN (u.raw_user_meta_data->>'trial_expires_at')::timestamp > NOW() 
    THEN 'Activo'
    ELSE 'Expirado'
  END as estado_trial
FROM auth.users u
ORDER BY u.created_at DESC;

-- ============================================
-- OPCIONAL: Deshabilitar RLS en user_profiles
-- ============================================
-- Ya que ahora usamos metadata, podemos deshabilitar RLS

-- Ver estado actual de RLS
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- Deshabilitar RLS (OPCIONAL - solo si ya no usas la tabla)
-- ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- ============================================
-- OPCIONAL: Backup de user_profiles
-- ============================================
-- Si quieres hacer backup antes de eliminar la tabla

-- CREATE TABLE public.user_profiles_backup AS 
-- SELECT * FROM public.user_profiles;

-- ============================================
-- LIMPIEZA (Solo ejecutar si estás SEGURO)
-- ============================================
-- Una vez que confirmes que todo funciona con metadata,
-- puedes eliminar la tabla user_profiles

-- ⚠️ PRECAUCIÓN: Esto eliminará permanentemente la tabla
-- DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- ============================================
-- SCRIPT DE VERIFICACIÓN RÁPIDA
-- ============================================
-- Ejecutar para verificar que la migración fue exitosa

SELECT 
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN (raw_user_meta_data->>'nivel')::int >= 1 THEN 1 END) as con_acceso,
  COUNT(CASE WHEN (raw_user_meta_data->>'nivel')::int = 3 THEN 1 END) as vip,
  COUNT(CASE WHEN (raw_user_meta_data->>'trial_expires_at')::timestamp > NOW() THEN 1 END) as trial_activo
FROM auth.users;

