-- Script para actualizar la contraseña de un usuario de forma segura
-- Este script actualiza la contraseña usando crypt de PostgreSQL
-- IMPORTANTE: Solo ejecuta esto si eres nivel Dios (999)

-- Ejecutar este script en el SQL Editor de Supabase
-- Reemplaza 'doblem2323@hotmail.com' con el email del usuario
-- Reemplaza 'Facil345' con la nueva contraseña

-- Paso 1: Obtener el ID del usuario
DO $$
DECLARE
  v_user_id UUID;
  v_new_password TEXT := 'Facil345';
  v_user_email TEXT := 'doblem2323@hotmail.com';
BEGIN
  -- Obtener el ID del usuario
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_user_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado: %', v_user_email;
  END IF;
  
  -- Actualizar la contraseña usando crypt
  -- Nota: Supabase usa bcrypt para las contraseñas
  -- Necesitamos usar la función crypt de pgcrypto
  UPDATE auth.users
  SET 
    encrypted_password = crypt(v_new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = v_user_id;
  
  RAISE NOTICE 'Contraseña actualizada exitosamente para el usuario: %', v_user_email;
END $$;









