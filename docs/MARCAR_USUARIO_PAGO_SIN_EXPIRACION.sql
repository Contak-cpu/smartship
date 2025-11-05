-- Query para marcar usuario como pagado sin fecha de expiración
-- Usuario: erick@gmail.com
-- IMPORTANTE: El usuario debe cerrar sesión y volver a iniciar sesión para que los cambios surtan efecto

-- Paso 1: Obtener el ID del usuario y mantener su nivel actual
DO $$
DECLARE
    usuario_id UUID;
    usuario_username TEXT;
    nivel_actual INTEGER;
BEGIN
    -- Obtener ID, username y nivel actual del usuario
    SELECT 
        id, 
        COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
        COALESCE((raw_user_meta_data->>'nivel')::integer, 0)
    INTO usuario_id, usuario_username, nivel_actual
    FROM auth.users
    WHERE email = 'erick@gmail.com';
    
    IF usuario_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no encontrado: erick@gmail.com';
    END IF;
    
    -- Paso 2: Actualizar auth.users.raw_user_meta_data
    -- Marcar como pagado pero SIN fecha de expiración (eliminar paid_until)
    UPDATE auth.users
    SET raw_user_meta_data = 
        -- Primero eliminar paid_until si existe
        COALESCE(raw_user_meta_data, '{}'::jsonb) - 'paid_until'
        -- Luego agregar/actualizar los campos de pago
        || jsonb_build_object(
            'is_paid', true,
            'payment_status', 'approved'
        )
    WHERE id = usuario_id;
    
    -- Paso 3: Actualizar también user_profiles si existe (para sincronización)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        -- Usar INSERT ... ON CONFLICT para actualizar o insertar
        INSERT INTO public.user_profiles (id, username, email, nivel, created_at, updated_at)
        VALUES (usuario_id, usuario_username, 'erick@gmail.com', nivel_actual, NOW(), NOW())
        ON CONFLICT (id) 
        DO UPDATE SET 
            updated_at = NOW(),
            username = COALESCE(EXCLUDED.username, user_profiles.username);
    END IF;
    
    RAISE NOTICE 'Usuario marcado como pagado sin expiración: ID=%, Email=erick@gmail.com, Nivel=%, Paid=true', usuario_id, nivel_actual;
END $$;

-- Paso 4: Verificar el estado actualizado
SELECT 
    'auth.users' as fuente,
    u.id,
    u.email,
    u.raw_user_meta_data->>'username' as username,
    (u.raw_user_meta_data->>'nivel')::integer as nivel,
    (u.raw_user_meta_data->>'is_paid')::boolean as is_paid,
    u.raw_user_meta_data->>'payment_status' as payment_status,
    u.raw_user_meta_data->>'paid_until' as paid_until,
    CASE 
        WHEN u.raw_user_meta_data->>'paid_until' IS NULL OR u.raw_user_meta_data->>'paid_until' = 'null' 
        THEN '✅ Sin expiración'
        ELSE '⚠️ Expira: ' || u.raw_user_meta_data->>'paid_until'
    END as estado_expiracion
FROM auth.users u
WHERE u.email = 'erick@gmail.com'
UNION ALL
SELECT 
    'user_profiles' as fuente,
    up.id,
    up.email,
    up.username,
    up.nivel,
    NULL as is_paid,
    NULL as payment_status,
    NULL as paid_until,
    'N/A' as estado_expiracion
FROM public.user_profiles up
WHERE up.email = 'erick@gmail.com'
   OR up.id IN (SELECT id FROM auth.users WHERE email = 'erick@gmail.com');

