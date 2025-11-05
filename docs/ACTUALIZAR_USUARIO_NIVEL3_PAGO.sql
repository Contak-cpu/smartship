-- Query para actualizar usuario a nivel 3 y pago, y verificar acceso a secciones
-- Usuario: doblemm2323@hotmail.com
-- IMPORTANTE: El usuario debe cerrar sesión y volver a iniciar sesión para que los cambios surtan efecto

-- Paso 1: Obtener el ID del usuario
DO $$
DECLARE
    usuario_id UUID;
    usuario_username TEXT;
BEGIN
    -- Obtener ID y username del usuario
    SELECT id, COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1))
    INTO usuario_id, usuario_username
    FROM auth.users
    WHERE email = 'doblemm2323@hotmail.com';
    
    IF usuario_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no encontrado: doblemm2323@hotmail.com';
    END IF;
    
    -- Paso 2: Actualizar auth.users.raw_user_meta_data (fuente de verdad principal)
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
            'nivel', 3,
            'is_paid', true,
            'payment_status', 'approved',
            'paid_until', (NOW() + INTERVAL '1 year')::text
        )
    WHERE id = usuario_id;
    
    -- Paso 3: Actualizar también user_profiles si existe (para sincronización)
    -- Esto asegura que cualquier código legacy que lea de user_profiles también funcione
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        -- Usar INSERT ... ON CONFLICT para actualizar o insertar
        INSERT INTO public.user_profiles (id, username, email, nivel, created_at, updated_at)
        VALUES (usuario_id, usuario_username, 'doblemm2323@hotmail.com', 3, NOW(), NOW())
        ON CONFLICT (id) 
        DO UPDATE SET 
            nivel = 3,
            updated_at = NOW(),
            username = COALESCE(EXCLUDED.username, user_profiles.username);
    END IF;
    
    RAISE NOTICE 'Usuario actualizado correctamente: ID=%, Email=doblemm2323@hotmail.com, Nivel=3, Paid=true', usuario_id;
END $$;

-- Paso 4: Verificar sincronización entre auth.users y user_profiles
SELECT 
    'auth.users' as fuente,
    u.id,
    u.email,
    u.raw_user_meta_data->>'username' as username,
    (u.raw_user_meta_data->>'nivel')::integer as nivel,
    (u.raw_user_meta_data->>'is_paid')::boolean as is_paid,
    u.raw_user_meta_data->>'payment_status' as payment_status
FROM auth.users u
WHERE u.email = 'doblemm2323@hotmail.com'
UNION ALL
SELECT 
    'user_profiles' as fuente,
    up.id,
    up.email,
    up.username,
    up.nivel,
    NULL as is_paid,
    NULL as payment_status
FROM public.user_profiles up
WHERE up.email = 'doblemm2323@hotmail.com'
   OR up.id IN (SELECT id FROM auth.users WHERE email = 'doblemm2323@hotmail.com');

-- Paso 5: Verificar el estado actualizado y acceso a cada sección
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

