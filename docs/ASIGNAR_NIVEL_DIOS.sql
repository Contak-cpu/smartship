-- ========================================
-- ASIGNAR NIVEL DIOS (999) A TU USUARIO
-- ========================================

-- PASO 1: Ver todos tus usuarios actuales
-- ========================================
SELECT 
  au.id,
  au.email,
  up.username,
  up.nivel,
  au.created_at
FROM auth.users au
LEFT JOIN user_profiles up ON up.id = au.id
ORDER BY au.created_at DESC;

-- PASO 2: Copiar el EMAIL del usuario al que quieres dar nivel Dios
-- ========================================

-- PASO 3: Actualizar a nivel 999 (REEMPLAZA CON TU EMAIL)
-- ========================================
UPDATE user_profiles 
SET nivel = 999, updated_at = NOW() 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'TU_EMAIL_AQUI@ejemplo.com'
);

-- EJEMPLO REAL:
-- UPDATE user_profiles 
-- SET nivel = 999, updated_at = NOW() 
-- WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'juan@gmail.com'
-- );

-- PASO 4: Verificar que se actualizó correctamente
-- ========================================
SELECT 
  au.email,
  up.username,
  up.nivel,
  CASE 
    WHEN up.nivel = 999 THEN '👑 USUARIO DIOS'
    WHEN up.nivel >= 4 THEN '⭐ PRO'
    WHEN up.nivel >= 2 THEN '🔵 BÁSICO/INTERMEDIO'
    WHEN up.nivel >= 1 THEN '🟢 STARTER'
    ELSE '⚪ INVITADO'
  END as tipo_usuario
FROM auth.users au
JOIN user_profiles up ON up.id = au.id
ORDER BY up.nivel DESC, au.created_at DESC;

-- Deberías ver tu usuario con nivel 999 y el emoji 👑

-- ========================================
-- SI QUIERES ACTUALIZAR POR ID EN LUGAR DE EMAIL
-- ========================================
-- UPDATE user_profiles 
-- SET nivel = 999, updated_at = NOW() 
-- WHERE id = 'TU_USER_ID_AQUI'::uuid;

-- ========================================
-- ACTUALIZAR MÚLTIPLES USUARIOS A LA VEZ
-- ========================================
-- UPDATE user_profiles 
-- SET nivel = 999, updated_at = NOW() 
-- WHERE email IN ('email1@ejemplo.com', 'email2@ejemplo.com');


