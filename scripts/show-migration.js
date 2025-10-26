import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Instrucciones para aplicar la migración manualmente en Supabase
 */
const migrationSQL = `
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
`;

console.log('\n');
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║         MIGRACIÓN DEL SISTEMA DE TRIAL - INSTRUCCIONES        ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

console.log('📋 PASO 1: Ir a Supabase Dashboard');
console.log('   👉 https://supabase.com/dashboard\n');

console.log('📋 PASO 2: Navegar a SQL Editor');
console.log('   📂 Menú lateral → SQL Editor\n');

console.log('📋 PASO 3: Crear nueva query');
console.log('   ➕ Click en "New query"\n');

console.log('📋 PASO 4: Copiar y pegar este SQL:\n');
console.log(migrationSQL);
console.log('\n');

console.log('📋 PASO 5: Ejecutar');
console.log('   ▶️  Click en "Run" o presiona Ctrl+Enter\n');

console.log('📋 PASO 6: Verificar');
console.log('   ✅ Deberías ver "Success" en la consola\n');

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║                       ¡MIGRACIÓN LISTA!                      ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Guardar el SQL en un archivo
const outputPath = path.join(__dirname, '..', 'MIGRATION_TO_RUN.sql');
fs.writeFileSync(outputPath, migrationSQL);
console.log(`💾 SQL guardado en: ${outputPath}\n`);


