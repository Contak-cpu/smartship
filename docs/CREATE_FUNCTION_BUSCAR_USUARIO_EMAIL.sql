-- Función para buscar usuario por email (para compartir tiendas)
-- Esta función permite buscar usuarios por email sin exponer información sensible

CREATE OR REPLACE FUNCTION buscar_usuario_por_email(p_email TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  username TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    COALESCE(
      au.raw_user_meta_data->>'username',
      SPLIT_PART(au.email, '@', 1)
    ) AS username
  FROM auth.users au
  WHERE LOWER(au.email) = LOWER(p_email)
  LIMIT 1;
END;
$$;

-- Comentario
COMMENT ON FUNCTION buscar_usuario_por_email IS 'Busca un usuario por email para compartir tiendas. Retorna id, email y username.';

