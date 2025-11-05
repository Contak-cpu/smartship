-- Query para actualizar usuario doblemm2323@hotmail.com
-- Con los mismos parámetros que qiowe@gmail.com pero:
-- - Nivel 3 (en lugar de nivel 2)
-- - Fecha de expiración: 05/12/2025 (5 de diciembre de 2025)
-- IMPORTANTE: El usuario debe cerrar sesión y volver a iniciar sesión para que los cambios surtan efecto

-- Paso 1: Obtener el ID y username actual del usuario
DO $$
DECLARE
    usuario_id UUID;
    usuario_username TEXT;
    fecha_expiracion TEXT := '2025-12-05T23:59:59.999Z';
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
    -- Mismos parámetros que qiowe@gmail.com pero con nivel 3 y fecha 05/12/2025
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
            'sub', usuario_id::text,
            'plan', 'VIP',
            'email', 'doblemm2323@hotmail.com',
            'nivel', 3,
            'is_paid', true,
            'username', usuario_username,
            'paid_until', fecha_expiracion,
            'email_verified', true,
            'phone_verified', false,
            'trial_expires_at', fecha_expiracion
        )
    WHERE id = usuario_id;
    
    -- Paso 3: Actualizar también user_profiles si existe (para sincronización)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        -- Usar INSERT ... ON CONFLICT para actualizar o insertar
        INSERT INTO public.user_profiles (id, username, email, nivel, created_at, updated_at, trial_expires_at)
        VALUES (usuario_id, usuario_username, 'doblemm2323@hotmail.com', 3, NOW(), NOW(), fecha_expiracion::timestamp)
        ON CONFLICT (id) 
        DO UPDATE SET 
            nivel = 3,
            updated_at = NOW(),
            username = COALESCE(EXCLUDED.username, user_profiles.username),
            trial_expires_at = fecha_expiracion::timestamp;
    END IF;
    
    RAISE NOTICE 'Usuario actualizado: ID=%, Email=doblemm2323@hotmail.com, Nivel=3, Paid=true, Expira=05/12/2025', usuario_id;
END $$;

-- Paso 4: Verificar sincronización entre auth.users y user_profiles
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
    (u.raw_user_meta_data->>'email_verified')::boolean as email_verified,
    (u.raw_user_meta_data->>'phone_verified')::boolean as phone_verified
FROM auth.users u
WHERE u.email = 'doblemm2323@hotmail.com'
UNION ALL
SELECT 
    'user_profiles' as fuente,
    up.id,
    up.email,
    up.username,
    up.nivel,
    NULL as plan,
    NULL as is_paid,
    NULL as payment_status,
    NULL as paid_until,
    up.trial_expires_at::text as trial_expires_at,
    NULL as email_verified,
    NULL as phone_verified
FROM public.user_profiles up
WHERE up.email = 'doblemm2323@hotmail.com'
   OR up.id IN (SELECT id FROM auth.users WHERE email = 'doblemm2323@hotmail.com');

-- Paso 5: Mostrar acceso a secciones
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

