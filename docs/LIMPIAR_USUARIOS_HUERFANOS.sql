-- =====================================================
-- SCRIPT: Limpiar usuarios huérfanos
-- =====================================================
-- Este script elimina usuarios de auth.users que no tienen
-- un perfil correspondiente en user_profiles
-- =====================================================
-- ⚠️  IMPORTANTE: Ejecuta esto en Supabase SQL Editor
-- =====================================================

-- Ver usuarios huérfanos (usuarios en auth.users sin perfil en user_profiles)
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.email_confirmed_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ORDER BY au.created_at DESC;

-- =====================================================
-- OPCIÓN 1: Eliminar SOLO usuarios sin email confirmado
-- (Más seguro - no elimina usuarios que ya confirmaron email)
-- =====================================================

DELETE FROM auth.users
WHERE id IN (
  SELECT au.id
  FROM auth.users au
  LEFT JOIN user_profiles up ON au.id = up.id
  WHERE up.id IS NULL
    AND au.email_confirmed_at IS NULL  -- Solo usuarios sin confirmar
);

-- =====================================================
-- OPCIÓN 2: Eliminar TODOS los usuarios huérfanos
-- (⚠️ MÁS AGRESIVO - elimina todos incluso confirmados)
-- =====================================================

/*
DELETE FROM auth.users
WHERE id IN (
  SELECT au.id
  FROM auth.users au
  LEFT JOIN user_profiles up ON au.id = up.id
  WHERE up.id IS NULL
);
*/

-- =====================================================
-- OPCIÓN 3: Recrear perfiles para usuarios huérfanos
-- (En lugar de eliminar, crea el perfil faltante)
-- =====================================================

INSERT INTO user_profiles (id, username, email, nivel, created_at, updated_at, trial_expires_at)
SELECT 
  au.id,
  SPLIT_PART(au.email, '@', 1) || '_' || EXTRACT(EPOCH FROM NOW())::BIGINT AS username,
  au.email,
  3 AS nivel, -- Cliente VIP
  au.created_at,
  NOW(),
  au.created_at + INTERVAL '7 days' AS trial_expires_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- =====================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- =====================================================

-- Verificar que ya no hay usuarios huérfanos
SELECT 
  COUNT(*) as usuarios_huérfanos
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Ver todos los usuarios con su perfil
SELECT 
  au.id,
  au.email,
  up.username,
  up.nivel,
  up.trial_expires_at,
  CASE 
    WHEN up.id IS NULL THEN 'Huérfano'
    ELSE 'Con perfil'
  END as estado
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC
LIMIT 20;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

