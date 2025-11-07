-- Actualizar usuario tiago.vas.mar@gmail.com
-- Configuración: Nivel 2 (Intermedio), usuario pagado, expira en 30 días

-- Paso 1: Obtener el ID del usuario y calcular fecha de expiración
DO $$
DECLARE
    usuario_id UUID;
    usuario_username TEXT;
    fecha_expiracion TEXT;
BEGIN
    -- Obtener ID y username del usuario
    SELECT 
        id, 
        COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1))
    INTO usuario_id, usuario_username
    FROM auth.users
    WHERE email = 'tiago.vas.mar@gmail.com';
    
    IF usuario_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no encontrado: tiago.vas.mar@gmail.com';
    END IF;
    
    -- Calcular fecha de expiración (30 días desde ahora, al final del día)
    fecha_expiracion := to_char((NOW() + INTERVAL '30 days')::date, 'YYYY-MM-DD') || 'T23:59:59.999Z';
    
    -- Paso 2: Actualizar auth.users.raw_user_meta_data
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
            'username', COALESCE((raw_user_meta_data->>'username'), usuario_username),
            'nivel', 2,
            'is_paid', true,
            'payment_status', 'approved',
            'paid_until', fecha_expiracion,
            'trial_expires_at', fecha_expiracion
        )
    WHERE id = usuario_id;
    
    RAISE NOTICE '✅ Usuario actualizado: ID=%, Email=tiago.vas.mar@gmail.com, Nivel=2, Paid=true, Expira=%', usuario_id, fecha_expiracion;
END $$;

-- Verificar que se actualizó correctamente
SELECT 
  id,
  email,
  raw_user_meta_data->>'username' as username,
  raw_user_meta_data->>'nivel' as nivel,
  raw_user_meta_data->>'is_paid' as is_paid,
  raw_user_meta_data->>'payment_status' as payment_status,
  raw_user_meta_data->>'trial_expires_at' as trial_expires_at,
  raw_user_meta_data->>'paid_until' as paid_until,
  NOW() as fecha_actual,
  CASE 
    WHEN (raw_user_meta_data->>'paid_until')::timestamp > NOW() THEN '✅ Activo'
    ELSE '❌ Expirado'
  END as estado
FROM auth.users
WHERE email = 'tiago.vas.mar@gmail.com';

-- ============================================
-- QUERY DE VERIFICACIÓN COMPLETA
-- Ejecuta esta query para corroborar todos los datos
-- ============================================
SELECT 
  u.id,
  u.email,
  u.created_at as fecha_creacion,
  u.raw_user_meta_data->>'username' as username,
  (u.raw_user_meta_data->>'nivel')::integer as nivel,
  CASE 
    WHEN (u.raw_user_meta_data->>'nivel')::integer = 0 THEN '❌ Sin acceso'
    WHEN (u.raw_user_meta_data->>'nivel')::integer = 1 THEN '🟡 Básico'
    WHEN (u.raw_user_meta_data->>'nivel')::integer = 2 THEN '🟢 Intermedio'
    WHEN (u.raw_user_meta_data->>'nivel')::integer = 3 THEN '🔵 VIP'
    ELSE '❓ Desconocido'
  END as nivel_descripcion,
  u.raw_user_meta_data->'is_paid' as is_paid_json,
  CASE 
    WHEN u.raw_user_meta_data->'is_paid' = 'true'::jsonb THEN '✅ Sí (boolean)'
    WHEN u.raw_user_meta_data->>'is_paid' = 'true' THEN '✅ Sí (string)'
    WHEN u.raw_user_meta_data->'is_paid' = 'false'::jsonb THEN '❌ No'
    ELSE '❓ No definido'
  END as estado_pago,
  u.raw_user_meta_data->>'payment_status' as payment_status,
  u.raw_user_meta_data->>'paid_until' as paid_until,
  u.raw_user_meta_data->>'trial_expires_at' as trial_expires_at,
  NOW() as fecha_actual,
  CASE 
    WHEN (u.raw_user_meta_data->>'paid_until')::timestamp > NOW() THEN '✅ Activo (pago vigente)'
    WHEN (u.raw_user_meta_data->>'paid_until')::timestamp IS NULL THEN '⚠️ Sin fecha de expiración'
    ELSE '❌ Expirado'
  END as estado_pago_detalle,
  CASE 
    WHEN (u.raw_user_meta_data->>'paid_until')::timestamp > NOW() 
    THEN EXTRACT(EPOCH FROM ((u.raw_user_meta_data->>'paid_until')::timestamp - NOW())) / 86400
    ELSE NULL
  END as dias_restantes,
  u.raw_user_meta_data as metadata_completa
FROM auth.users u
WHERE u.email = 'tiago.vas.mar@gmail.com';

