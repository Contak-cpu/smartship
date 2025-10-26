-- =====================================================
-- MIGRACIÓN: Sistema de Trial de 7 días gratis
-- =====================================================
-- Ejecuta este script en Supabase SQL Editor para habilitar
-- el sistema de trial de 7 días gratis
-- =====================================================

-- 1. Agregar columna trial_expires_at a user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Crear índice para búsquedas rápidas de usuarios con trial activo
CREATE INDEX IF NOT EXISTS idx_user_profiles_trial_expires_at 
ON user_profiles(trial_expires_at);

-- 3. Actualizar registros existentes con trial_expires_at (opcional)
-- Esto establece la fecha de vencimiento para usuarios existentes
UPDATE user_profiles 
SET trial_expires_at = created_at + INTERVAL '7 days'
WHERE trial_expires_at IS NULL;

-- 4. Comentario en la columna para documentación
COMMENT ON COLUMN user_profiles.trial_expires_at IS 
'Fecha de vencimiento del trial de 7 días gratis. Cuando expire, el usuario será degradado a nivel 0.';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Ejecuta esto para verificar que la migración fue exitosa:

-- Ver la estructura de la tabla
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles';

-- Ver usuarios con trial activo
SELECT 
  username, 
  email, 
  nivel, 
  trial_expires_at,
  NOW() as current_time,
  CASE 
    WHEN trial_expires_at > NOW() THEN 'Activo'
    ELSE 'Expirado'
  END as trial_status
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- =====================================================
-- FUNCIONES ÚTILES (Opcionales)
-- =====================================================

-- Función para obtener usuarios con trial expirado
CREATE OR REPLACE FUNCTION get_expired_trial_users()
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  email TEXT,
  nivel INTEGER,
  trial_expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.username,
    up.email,
    up.nivel,
    up.trial_expires_at
  FROM user_profiles up
  WHERE up.trial_expires_at IS NOT NULL
    AND up.trial_expires_at < NOW()
    AND up.nivel > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener usuarios con trial activo
CREATE OR REPLACE FUNCTION get_active_trial_users()
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  email TEXT,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.username,
    up.email,
    EXTRACT(DAY FROM (up.trial_expires_at - NOW()))::INTEGER as days_remaining
  FROM user_profiles up
  WHERE up.trial_expires_at IS NOT NULL
    AND up.trial_expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- AUTOMATIZACIÓN (Opcional)
-- =====================================================
-- Esto requiere la extensión pg_cron de Supabase
-- No disponible en el plan gratuito

-- Función para degradar automáticamente usuarios con trial expirado
-- SE EJECUTA CADA DÍA A LAS 00:00

/*
CREATE OR REPLACE FUNCTION auto_degrade_expired_trials()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET 
    nivel = 0,
    updated_at = NOW()
  WHERE trial_expires_at < NOW()
    AND nivel > 0;
  
  RAISE NOTICE 'Usuarios con trial expirado degradados automáticamente';
END;
$$ LANGUAGE plpgsql;

-- Programar tarea diaria (requiere extensión pg_cron)
SELECT cron.schedule(
  'degrade-expired-trials',
  '0 0 * * *',  -- Cada día a las 00:00
  $$SELECT auto_degrade_expired_trials()$$
);
*/

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================


