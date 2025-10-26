
-- =====================================================
-- MIGRACIÓN: Sistema de Trial de 7 días gratis
-- =====================================================
-- Ejecuta este SQL en Supabase SQL Editor
-- =====================================================

-- 1. Agregar columna trial_expires_at a user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Crear índice para búsquedas rápidas de usuarios con trial activo
CREATE INDEX IF NOT EXISTS idx_user_profiles_trial_expires_at 
ON user_profiles(trial_expires_at);

-- 3. Actualizar registros existentes con trial_expires_at
UPDATE user_profiles 
SET trial_expires_at = created_at + INTERVAL '7 days'
WHERE trial_expires_at IS NULL;

-- 4. Comentario en la columna para documentación
COMMENT ON COLUMN user_profiles.trial_expires_at IS 
'Fecha de vencimiento del trial de 7 días gratis. Cuando expire, el usuario será degradado a nivel 0.';
