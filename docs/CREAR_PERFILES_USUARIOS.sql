-- ========================================
-- CREAR PERFILES PARA USUARIOS EXISTENTES
-- ========================================

-- IMPORTANTE: Primero necesitas obtener los IDs de tus usuarios existentes

-- PASO 1: Ver los usuarios que tienes en Authentication
-- Ejecuta esto para ver tus usuarios:
SELECT 
  id,
  email,
  raw_user_meta_data->>'username' as username,
  raw_user_meta_data->>'nivel' as nivel,
  created_at
FROM auth.users
ORDER BY created_at;

-- PASO 2: Copia los IDs que te aparezcan arriba y úsalos en los INSERT de abajo

-- ========================================
-- OPCIÓN A: Insertar manualmente (si conoces los IDs)
-- ========================================

-- Reemplaza 'UUID_AQUI' con los IDs reales de la consulta anterior

-- Usuario Erick (Nivel 3 - Admin)
INSERT INTO user_profiles (id, username, email, nivel)
VALUES (
  'UUID_DE_ERICK_AQUI'::uuid,  -- Reemplaza con el UUID real
  'Erick',
  'erick@faciluno.com',
  3
)
ON CONFLICT (id) DO UPDATE 
SET username = EXCLUDED.username, 
    nivel = EXCLUDED.nivel,
    updated_at = NOW();

-- Usuario Yael (Nivel 2 - Basic)
INSERT INTO user_profiles (id, username, email, nivel)
VALUES (
  'UUID_DE_YAEL_AQUI'::uuid,  -- Reemplaza con el UUID real
  'Yael',
  'yael@faciluno.com',
  2
)
ON CONFLICT (id) DO UPDATE 
SET username = EXCLUDED.username, 
    nivel = EXCLUDED.nivel,
    updated_at = NOW();

-- Usuario Pedro (Nivel 1 - Starter)
INSERT INTO user_profiles (id, username, email, nivel)
VALUES (
  'UUID_DE_PEDRO_AQUI'::uuid,  -- Reemplaza con el UUID real
  'Pedro',
  'pedro@faciluno.com',
  1
)
ON CONFLICT (id) DO UPDATE 
SET username = EXCLUDED.username, 
    nivel = EXCLUDED.nivel,
    updated_at = NOW();

-- ========================================
-- OPCIÓN B: Insertar automáticamente desde auth.users
-- ========================================
-- Esta opción toma los datos del metadata y crea los perfiles automáticamente

INSERT INTO user_profiles (id, username, email, nivel)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'username', SPLIT_PART(email, '@', 1)) as username,
  email,
  COALESCE((raw_user_meta_data->>'nivel')::INTEGER, 0) as nivel
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.users.id
)
ON CONFLICT (id) DO UPDATE 
SET username = EXCLUDED.username,
    nivel = EXCLUDED.nivel,
    email = EXCLUDED.email,
    updated_at = NOW();

-- ========================================
-- VERIFICACIÓN
-- ========================================
-- Verifica que los perfiles se crearon correctamente:

SELECT 
  up.id,
  up.username,
  up.email,
  up.nivel,
  au.email as auth_email,
  au.created_at as user_created_at
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
ORDER BY up.nivel DESC;

-- Debería mostrar todos tus usuarios con sus niveles

