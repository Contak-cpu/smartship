-- Query para actualizar usuario y REVOCAR todas sus sesiones activas
-- Esto fuerza al usuario a hacer login nuevamente y obtener un token con los metadatos actualizados
-- Usuario: doblemm2323@hotmail.com
-- Nivel 3, Fecha de expiración: 05/12/2025

-- Paso 1: Obtener el ID del usuario
DO $$
DECLARE
    usuario_id UUID;
    usuario_username TEXT;
    fecha_expiracion TEXT := '2025-12-05T23:59:59.999Z';
    sesiones_revocadas INT;
BEGIN
    -- Obtener ID y username del usuario
    SELECT 
        id, 
        COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1))
    INTO usuario_id, usuario_username
    FROM auth.users
    WHERE email = 'doblemm2323@hotmail.com';
    
    IF usuario_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no encontrado: doblemm2323@hotmail.com';
    END IF;
    
    -- Paso 2: Actualizar auth.users.raw_user_meta_data
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
            'sub', usuario_id::text,
            'plan', 'VIP',
            'email', 'doblemm2323@hotmail.com',
            'nivel', 3,
            'is_paid', true,
            'payment_status', 'approved',
            'username', usuario_username,
            'paid_until', fecha_expiracion,
            'email_verified', true,
            'phone_verified', false,
            'trial_expires_at', fecha_expiracion
        )
    WHERE id = usuario_id;
    
    -- Paso 3: REVOCAR TODAS LAS SESIONES ACTIVAS
    -- Esto elimina todos los refresh tokens, forzando al usuario a hacer login nuevamente
    -- Nota: user_id en refresh_tokens es VARCHAR, no UUID, por lo que necesitamos convertir
    DELETE FROM auth.refresh_tokens
    WHERE user_id = usuario_id::text;
    
    GET DIAGNOSTICS sesiones_revocadas = ROW_COUNT;
    
    -- Paso 4: Actualizar también user_profiles si existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        INSERT INTO public.user_profiles (id, username, email, nivel, created_at, updated_at, trial_expires_at)
        VALUES (usuario_id, usuario_username, 'doblemm2323@hotmail.com', 3, NOW(), NOW(), fecha_expiracion::timestamp)
        ON CONFLICT (id) 
        DO UPDATE SET 
            nivel = 3,
            updated_at = NOW(),
            username = COALESCE(EXCLUDED.username, user_profiles.username),
            trial_expires_at = fecha_expiracion::timestamp;
    END IF;
    
    RAISE NOTICE '✅ Usuario actualizado: ID=%, Email=doblemm2323@hotmail.com, Nivel=3, Paid=true, Expira=05/12/2025', usuario_id;
    RAISE NOTICE '✅ Sesiones revocadas: % (El usuario debe hacer login nuevamente)', sesiones_revocadas;
END $$;

-- Paso 5: Verificar el estado actualizado
SELECT 
    'auth.users' as fuente,
    u.id,
    u.email,
    u.raw_user_meta_data->>'username' as username,
    (u.raw_user_meta_data->>'nivel')::integer as nivel,
    u.raw_user_meta_data->>'plan' as plan,
    (u.raw_user_meta_data->>'is_paid')::boolean as is_paid,
    u.raw_user_meta_data->>'payment_status' as payment_status,
    u.raw_user_meta_data->>'paid_until' as paid_until,
    u.raw_user_meta_data->>'trial_expires_at' as trial_expires_at,
    (SELECT COUNT(*) FROM auth.refresh_tokens WHERE user_id = u.id::text) as sesiones_activas
FROM auth.users u
WHERE u.email = 'doblemm2323@hotmail.com';

-- Paso 6: Mostrar acceso a secciones
WITH usuario_actualizado AS (
    SELECT 
        id,
        email,
        raw_user_meta_data->>'username' as username,
        (raw_user_meta_data->>'nivel')::integer as nivel_actual,
        (raw_user_meta_data->>'is_paid')::boolean as is_paid,
        raw_user_meta_data->>'payment_status' as payment_status
    FROM auth.users
    WHERE email = 'doblemm2323@hotmail.com'
),
secciones AS (
    SELECT 'rentabilidad' as seccion_key, 'Calculadora de Rentabilidad' as nombre, 0 as nivel_requerido
    UNION ALL SELECT 'breakeven-roas', 'Calcula tu Breakeven y ROAS', 1
    UNION ALL SELECT 'smartship', 'SmartShip - Transformador de Pedidos', 2
    UNION ALL SELECT 'historial', 'Historial de Archivos', 2
    UNION ALL SELECT 'informacion', 'Información y Estadísticas', 2
    UNION ALL SELECT 'pdf-generator', 'Integrar SKU en Rótulos Andreani', 3
    UNION ALL SELECT 'admin', 'Panel de Administración Dios', 999
)
SELECT 
    ua.email,
    ua.username,
    ua.nivel_actual,
    CASE WHEN ua.is_paid = true THEN '✅ PAGADO' ELSE '❌ NO PAGADO' END as estado_pago,
    ua.payment_status,
    s.seccion_key,
    s.nombre as seccion_nombre,
    s.nivel_requerido,
    CASE 
        WHEN ua.nivel_actual >= s.nivel_requerido THEN '✅ OK'
        ELSE '❌ DENEGADO'
    END as acceso
FROM usuario_actualizado ua
CROSS JOIN secciones s
ORDER BY s.nivel_requerido, s.seccion_key;


