-- Query SIMPLE para editar raw_user_meta_data
-- Usuario: doblemm2323@hotmail.com
-- Edita los valores que necesites abajo y ejecuta la query

-- ============================================
-- EDITA ESTOS VALORES SEGÚN NECESITES:
-- ============================================
DO $$
DECLARE
    usuario_id UUID := '6cc8dbf8-142b-4a57-b3a4-bb9bff8dfdd3';
    usuario_email TEXT := 'doblemm2323@hotmail.com';
    usuario_username TEXT := 'manchi ';
    nivel_usuario INTEGER := 3;
    plan_usuario TEXT := 'VIP';
    is_paid_usuario BOOLEAN := true;
    payment_status_usuario TEXT := 'approved';  -- Puede ser: 'approved', 'pending', 'rejected', o NULL
    paid_until_usuario TEXT := '2025-12-05T23:59:59.999Z';  -- Fecha ISO o NULL para sin expiración
    trial_expires_at_usuario TEXT := '2025-12-05T23:59:59.999Z';  -- Fecha ISO o NULL
    email_verified_usuario BOOLEAN := true;
    phone_verified_usuario BOOLEAN := false;
    
    nuevo_metadata JSONB;
    sesiones_revocadas INT;
BEGIN
    -- Construir el nuevo metadata
    nuevo_metadata := jsonb_build_object(
        'sub', usuario_id::text,
        'plan', plan_usuario,
        'email', usuario_email,
        'nivel', nivel_usuario,
        'is_paid', is_paid_usuario,
        'username', usuario_username,
        'email_verified', email_verified_usuario,
        'phone_verified', phone_verified_usuario
    );
    
    -- Agregar campos opcionales solo si tienen valor
    IF payment_status_usuario IS NOT NULL THEN
        nuevo_metadata := nuevo_metadata || jsonb_build_object('payment_status', payment_status_usuario);
    END IF;
    
    IF paid_until_usuario IS NOT NULL THEN
        nuevo_metadata := nuevo_metadata || jsonb_build_object('paid_until', paid_until_usuario);
    END IF;
    
    IF trial_expires_at_usuario IS NOT NULL THEN
        nuevo_metadata := nuevo_metadata || jsonb_build_object('trial_expires_at', trial_expires_at_usuario);
    END IF;
    
    -- Actualizar el raw_user_meta_data
    UPDATE auth.users
    SET raw_user_meta_data = nuevo_metadata
    WHERE id = usuario_id;
    
    -- Revocar todas las sesiones activas para forzar nuevo login
    DELETE FROM auth.refresh_tokens
    WHERE user_id = usuario_id::text;
    
    GET DIAGNOSTICS sesiones_revocadas = ROW_COUNT;
    
    RAISE NOTICE '✅ Metadata actualizado exitosamente';
    RAISE NOTICE '📧 Email: %', usuario_email;
    RAISE NOTICE '👤 Username: %', usuario_username;
    RAISE NOTICE '⭐ Nivel: %', nivel_usuario;
    RAISE NOTICE '💰 Pagado: %', is_paid_usuario;
    RAISE NOTICE '🔒 Sesiones revocadas: % (El usuario debe hacer login nuevamente)', sesiones_revocadas;
END $$;

-- Verificar el resultado
SELECT 
    id,
    email,
    raw_user_meta_data->>'username' as username,
    (raw_user_meta_data->>'nivel')::integer as nivel,
    raw_user_meta_data->>'plan' as plan,
    (raw_user_meta_data->>'is_paid')::boolean as is_paid,
    raw_user_meta_data->>'payment_status' as payment_status,
    raw_user_meta_data->>'paid_until' as paid_until,
    raw_user_meta_data->>'trial_expires_at' as trial_expires_at,
    raw_user_meta_data as metadata_completo,
    (SELECT COUNT(*) FROM auth.refresh_tokens WHERE user_id = id::text) as sesiones_activas
FROM auth.users
WHERE email = 'doblemm2323@hotmail.com';

