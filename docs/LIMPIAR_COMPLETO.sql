-- =====================================================
-- LIMPIEZA COMPLETA DE TRIGGERS Y FUNCIONES
-- =====================================================
-- Ejecuta este SQL en orden para limpiar todo
-- =====================================================

-- PASO 1: Eliminar el trigger problemático
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

-- PASO 2: Eliminar otros triggers relacionados
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users CASCADE;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users CASCADE;
DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON user_profiles CASCADE;

-- PASO 3: Ahora sí, eliminar las funciones
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS sync_user_metadata() CASCADE;
DROP FUNCTION IF EXISTS update_user_level() CASCADE;

-- PASO 4: Verificar que se eliminaron
SELECT 
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('auth.users', 'user_profiles');

-- Resultado esperado: 0 filas (sin triggers)

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Ver que no hay funciones conflictivas
SELECT routine_name 
FROM information_schema.routines
WHERE routine_name IN ('handle_new_user', 'create_user_profile', 'sync_user_metadata');

-- Resultado esperado: 0 filas (sin funciones)

-- =====================================================
-- LISTO PARA PROBAR REGISTRO
-- =====================================================

-- Ahora el registro debería funcionar sin problemas
-- Los perfiles se crearán desde la app (no desde triggers)


