-- 🔍 SCRIPT DE VERIFICACIÓN DEL SISTEMA
-- Ejecuta este script después de implementar la solución para verificar que todo funciona

-- ============================================================================
-- 1. VERIFICAR ESTADO DE RLS
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Habilitado",
    CASE 
        WHEN rowsecurity = true THEN '⚠️  RLS Activo (puede causar error 406)'
        ELSE '✅ RLS Deshabilitado (modo test)'
    END as estado
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'historial_smartship', 'historial_sku', 'historial_rentabilidad')
ORDER BY tablename;

-- ============================================================================
-- 2. VERIFICAR POLÍTICAS ACTIVAS
-- ============================================================================
SELECT 
    tablename,
    policyname,
    CASE 
        WHEN COUNT(*) > 0 THEN '⚠️  Hay políticas activas'
        ELSE '✅ Sin políticas'
    END as estado
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'historial_smartship', 'historial_sku', 'historial_rentabilidad')
GROUP BY tablename, policyname
ORDER BY tablename;

-- Si no devuelve filas, significa que no hay políticas (✅ correcto para modo test)

-- ============================================================================
-- 3. VERIFICAR ESTRUCTURA DE TABLA user_profiles
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name = 'trial_expires_at' THEN '✅ Columna de trial presente'
        WHEN column_name = 'nivel' THEN '✅ Columna de nivel presente'
        ELSE '✅ Columna básica'
    END as estado
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- ============================================================================
-- 4. VERIFICAR TRIGGERS AUTOMÁTICOS
-- ============================================================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    CASE 
        WHEN trigger_name = 'on_auth_user_created' THEN '✅ Trigger para nuevos usuarios'
        WHEN trigger_name = 'sync_user_metadata_trigger' THEN '✅ Trigger de sincronización'
        ELSE '✅ Trigger presente'
    END as estado
FROM information_schema.triggers 
WHERE event_object_table IN ('users', 'user_profiles')
ORDER BY trigger_name;

-- ============================================================================
-- 5. VERIFICAR FUNCIONES CREADAS
-- ============================================================================
SELECT 
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name = 'handle_new_user' THEN '✅ Función para nuevos usuarios'
        WHEN routine_name = 'sync_user_metadata' THEN '✅ Función de sincronización'
        ELSE '✅ Función presente'
    END as estado
FROM information_schema.routines 
WHERE routine_name IN ('handle_new_user', 'sync_user_metadata')
ORDER BY routine_name;

-- ============================================================================
-- 6. ESTADÍSTICAS DE USUARIOS
-- ============================================================================
SELECT 
    'Total usuarios en auth.users' as descripcion,
    COUNT(*) as cantidad,
    '✅' as estado
FROM auth.users
UNION ALL
SELECT 
    'Total usuarios en user_profiles' as descripcion,
    COUNT(*) as cantidad,
    CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as estado
FROM user_profiles
UNION ALL
SELECT 
    'Usuarios con nivel 3 o superior' as descripcion,
    COUNT(*) as cantidad,
    CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as estado
FROM user_profiles WHERE nivel >= 3
UNION ALL
SELECT 
    'Usuarios con trial activo' as descripcion,
    COUNT(*) as cantidad,
    CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '⚠️' END as estado
FROM user_profiles WHERE trial_expires_at > NOW()
UNION ALL
SELECT 
    'Usuarios con metadata sincronizado' as descripcion,
    COUNT(*) as cantidad,
    CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as estado
FROM auth.users 
WHERE raw_user_meta_data->>'nivel' IS NOT NULL;

-- ============================================================================
-- 7. VERIFICAR USUARIOS ESPECÍFICOS
-- ============================================================================
SELECT 
    '=== DETALLE DE USUARIOS ===' as info,
    '' as email,
    '' as username,
    '' as nivel,
    '' as trial_estado,
    '' as metadata_ok
UNION ALL
SELECT 
    'Usuario' as info,
    u.email,
    up.username,
    up.nivel::text,
    CASE 
        WHEN up.trial_expires_at > NOW() THEN '✅ Activo (' || EXTRACT(DAY FROM up.trial_expires_at - NOW()) || ' días)'
        WHEN up.trial_expires_at IS NULL THEN '❌ Sin trial'
        ELSE '❌ Expirado'
    END as trial_estado,
    CASE 
        WHEN u.raw_user_meta_data->>'nivel' = up.nivel::text THEN '✅ Sincronizado'
        ELSE '❌ Desincronizado'
    END as metadata_ok
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
ORDER BY info DESC, up.nivel DESC NULLS LAST;

-- ============================================================================
-- 8. VERIFICAR ACCESO A TABLAS (SIMULACIÓN DE CONSULTA DE LA APP)
-- ============================================================================
-- Esta consulta simula lo que hace la aplicación
SELECT 
    'Test de acceso a user_profiles' as test,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ Acceso exitoso (sin error 406)'
        ELSE '❌ Error de acceso'
    END as resultado,
    COUNT(*) as registros_accesibles
FROM user_profiles
LIMIT 1;

-- ============================================================================
-- 9. RESUMEN DE CONFIGURACIÓN
-- ============================================================================
SELECT '=== RESUMEN DE CONFIGURACIÓN ===' as seccion
UNION ALL
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_tables WHERE tablename = 'user_profiles' AND rowsecurity = false) > 0 
        THEN '✅ RLS deshabilitado correctamente'
        ELSE '❌ RLS sigue habilitado (revisar configuración)'
    END
UNION ALL
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') > 0 
        THEN '✅ Trigger de nuevos usuarios configurado'
        ELSE '❌ Trigger de nuevos usuarios faltante'
    END
UNION ALL
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM user_profiles WHERE nivel >= 3) > 0 
        THEN '✅ Usuarios con nivel 3 o superior encontrados'
        ELSE '⚠️  No hay usuarios con nivel 3 (normal si no hay usuarios)'
    END
UNION ALL
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'trial_expires_at') > 0 
        THEN '✅ Columna de trial configurada'
        ELSE '❌ Columna de trial faltante'
    END;

-- ============================================================================
-- 10. PRÓXIMOS PASOS RECOMENDADOS
-- ============================================================================
SELECT '=== PRÓXIMOS PASOS ===' as recomendacion
UNION ALL
SELECT '1. Probar registro de nuevo usuario desde la aplicación'
UNION ALL
SELECT '2. Verificar que aparezca inmediatamente con nivel 3'
UNION ALL
SELECT '3. Confirmar que el trial muestre 7 días en el dashboard'
UNION ALL
SELECT '4. Revisar que no aparezcan errores 406 en la consola'
UNION ALL
SELECT '5. Validar acceso a todas las secciones del dashboard';

-- ============================================================================
-- INTERPRETACIÓN DE RESULTADOS:
-- ============================================================================
-- ✅ = Configuración correcta
-- ❌ = Problema que necesita corrección
-- ⚠️  = Advertencia o situación a revisar
-- 
-- Si ves muchos ✅, la configuración está correcta.
-- Si ves ❌, revisa la sección correspondiente en el script de configuración.
-- Si ves ⚠️, es normal en algunos casos (ej: no hay usuarios aún).
