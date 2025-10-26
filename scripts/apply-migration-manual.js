/**
 * Instrucciones para aplicar la migración manualmente en Supabase
 * 
 * Como no podemos ejecutar SQL directamente desde aquí sin las credenciales,
 * sigue estos pasos para aplicar la migración manualmente.
 */

const migrationSQL = `
-- =====================================================
-- MIGRACIÓN: Sistema de Trial de 7 días gratis
-- =====================================================
-- Copia y pega este SQL en Supabase SQL Editor
-- =====================================================

-- 1. Agregar columna trial_expires_at a user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Crear índice para búsquedas rápidas de usuarios con trial activo
CREATE INDEX IF NOT EXISTS idx_user_profiles_trial_expires_at 
ON user_profiles(trial_expires_at);

-- 3. Actualizar registros existentes con trial_expires_at
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
-- Ejecuta esto después para verificar que la migración fue exitosa:

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
`;

console.log('📋 INSTRUCCIONES PARA APLICAR LA MIGRACIÓN MANUALMENTE');
console.log('=====================================================\n');
console.log('1. Ve a tu proyecto en Supabase Dashboard');
console.log('   https://supabase.com/dashboard\n');
console.log('2. Navega a: SQL Editor (en el menú lateral)\n');
console.log('3. Click en "New query"\n');
console.log('4. Copia y pega este SQL:\n');
console.log(migrationSQL);
console.log('\n');
console.log('5. Click en "Run" o presiona Ctrl+Enter\n');
console.log('6. Deberías ver "Success" en la consola\n');
console.log('✅ ¡Listo! La migración está aplicada.\n');

// Guardar el SQL en un archivo usando ES modules
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.join(__dirname, '..', 'MIGRATION_TO_RUN.sql');
fs.writeFileSync(outputPath, migrationSQL);
console.log(`💾 SQL guardado en: ${outputPath}\n`);

