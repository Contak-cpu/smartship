-- Query para editar directamente el raw_user_meta_data de un usuario
-- Usuario: doblemm2323@hotmail.com
-- IMPORTANTE: Después de actualizar, revocar sesiones para que el usuario obtenga el nuevo token

DO $$
DECLARE
    usuario_id UUID := '6cc8dbf8-142b-4a57-b3a4-bb9bff8dfdd3';
    nuevo_metadata JSONB;
    sesiones_revocadas INT;
BEGIN
    -- Construir el nuevo raw_user_meta_data con todos los campos que quieras
    nuevo_metadata := jsonb_build_object(
        'sub', usuario_id::text,
        'plan', 'VIP',
        'email', 'doblemm2323@hotmail.com',
        'nivel', 3,
        'is_paid', true,
        'username', 'manchi ',
        'paid_until', '2025-12-05T23:59:59.999Z',
        'email_verified', true,
        'payment_status', 'approved',
        'phone_verified', false,
        'trial_expires_at', '2025-12-05T23:59:59.999Z'
    );
    
    -- Actualizar el raw_user_meta_data directamente
    UPDATE auth.users
    SET raw_user_meta_data = nuevo_metadata
    WHERE id = usuario_id;
    
    -- Revocar todas las sesiones activas para forzar nuevo login
    DELETE FROM auth.refresh_tokens
    WHERE user_id = usuario_id::text;
    
    GET DIAGNOSTICS sesiones_revocadas = ROW_COUNT;
    
    RAISE NOTICE '✅ Metadata actualizado para usuario: doblemm2323@hotmail.com';
    RAISE NOTICE '✅ Sesiones revocadas: %', sesiones_revocadas;
    RAISE NOTICE '📋 Nuevo metadata: %', nuevo_metadata;
END $$;

-- Verificar el resultado
SELECT 
    id,
    email,
    raw_user_meta_data,
    updated_at,
    (SELECT COUNT(*) FROM auth.refresh_tokens WHERE user_id = id::text) as sesiones_activas
FROM auth.users
WHERE email = 'doblemm2323@hotmail.com';



