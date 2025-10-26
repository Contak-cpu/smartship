-- =====================================================
-- LIMPIAR TRIGGERS Y FUNCIONES PROBLEMÁTICAS
-- =====================================================
-- Ejecuta esto para eliminar todos los triggers y
-- funciones que puedan estar causando el error 500
-- =====================================================

-- 1. Ver triggers actuales
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table IN ('user_profiles', 'auth.users');

-- 2. Ver funciones relacionadas
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%user%' OR routine_name LIKE '%profile%';

-- =====================================================
-- ELIMINAR TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON user_profiles;
DROP TRIGGER IF EXISTS update_user_metadata_trigger ON user_profiles;

-- =====================================================
-- ELIMINAR FUNCIONES
-- =====================================================

DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS create_user_profile();
DROP FUNCTION IF EXISTS sync_user_metadata();
DROP FUNCTION IF EXISTS update_user_level();

-- =====================================================
-- VERIFICAR LIMPIEZA
-- =====================================================

-- No debería haber triggers
SELECT COUNT(*) as triggers_count
FROM information_schema.triggers
WHERE event_object_table IN ('user_profiles', 'auth.users');
-- Resultado esperado: 0

-- No debería haber funciones problemáticas
SELECT COUNT(*) as functions_count
FROM information_schema.routines
WHERE routine_name IN ('handle_new_user', 'create_user_profile', 'sync_user_metadata');
-- Resultado esperado: 0

-- =====================================================
-- FIN
-- =====================================================


