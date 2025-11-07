-- Función RPC para obtener todos los usuarios desde auth.users.raw_user_meta_data
-- Esta función lee directamente desde metadata en lugar de user_profiles
-- Solo accesible para usuarios nivel Dios (999)

-- Eliminar la función existente si tiene un tipo de retorno diferente
DROP FUNCTION IF EXISTS get_all_users_admin();

-- Crear la nueva función con los campos de pago
CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE (
  id UUID,
  email TEXT,
  username TEXT,
  nivel INTEGER,
  email_confirmed_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_paid BOOLEAN,
  payment_status TEXT,
  paid_until TIMESTAMPTZ,
  trial_expires_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_level INTEGER;
BEGIN
  -- Verificar que el usuario actual es nivel Dios desde metadata
  SELECT COALESCE(
    (caller.raw_user_meta_data->>'nivel')::INTEGER,
    0
  ) INTO caller_level
  FROM auth.users caller
  WHERE caller.id = auth.uid();
  
  IF caller_level IS NULL OR caller_level != 999 THEN
    RAISE EXCEPTION 'Acceso denegado: Solo usuarios nivel Dios pueden ejecutar esta función';
  END IF;
  
  -- Retornar todos los usuarios con su información desde raw_user_meta_data
  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    COALESCE(
      u.raw_user_meta_data->>'username',
      split_part(u.email, '@', 1)
    )::TEXT as username,
    COALESCE(
      (u.raw_user_meta_data->>'nivel')::INTEGER,
      0
    ) as nivel,
    u.email_confirmed_at,
    u.last_sign_in_at,
    u.created_at,
    u.updated_at,
    CASE 
      WHEN u.raw_user_meta_data->'is_paid' = 'true'::jsonb THEN true
      WHEN u.raw_user_meta_data->>'is_paid' = 'true' THEN true
      WHEN u.raw_user_meta_data->>'is_paid'::text = 'true' THEN true
      ELSE false
    END as is_paid,
    COALESCE(
      u.raw_user_meta_data->>'payment_status',
      NULL
    )::TEXT as payment_status,
    CASE 
      WHEN u.raw_user_meta_data->>'paid_until' IS NOT NULL 
        AND u.raw_user_meta_data->>'paid_until' != 'null'
        AND u.raw_user_meta_data->>'paid_until' != ''
      THEN (u.raw_user_meta_data->>'paid_until')::TIMESTAMPTZ
      ELSE NULL
    END as paid_until,
    CASE 
      WHEN u.raw_user_meta_data->>'trial_expires_at' IS NOT NULL 
        AND u.raw_user_meta_data->>'trial_expires_at' != 'null'
        AND u.raw_user_meta_data->>'trial_expires_at' != ''
      THEN (u.raw_user_meta_data->>'trial_expires_at')::TIMESTAMPTZ
      ELSE NULL
    END as trial_expires_at
  FROM auth.users u
  ORDER BY 
    COALESCE((u.raw_user_meta_data->>'nivel')::INTEGER, 0) DESC, 
    u.created_at DESC;
END;
$$;

-- Comentario sobre la función
COMMENT ON FUNCTION get_all_users_admin() IS 
'Función para obtener todos los usuarios desde auth.users.raw_user_meta_data. Lee información de pago, nivel y trial directamente desde metadata. Solo accesible para usuarios nivel Dios (999).';

