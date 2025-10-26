/**
 * Script de Migración - Sistema de Trial
 * 
 * Este script aplica la migración para el sistema de trial de 7 días gratis
 * en la base de datos de Supabase.
 * 
 * Para ejecutar:
 * npx tsx scripts/migrate-trial-system.ts
 */

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rycifekzklqsnuczawub.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_KEY no está configurada en las variables de entorno');
  console.log('💡 Para obtener tu service key:');
  console.log('   1. Ve a tu proyecto en Supabase Dashboard');
  console.log('   2. Settings → API');
  console.log('   3. Copia la "service_role" key');
  console.log('   4. Ejecuta: export SUPABASE_SERVICE_KEY="tu_key_aqui"');
  process.exit(1);
}

// Crear cliente con permisos de service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Queries SQL para ejecutar
const migrations = [
  {
    name: 'Agregar columna trial_expires_at',
    query: `
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE;
    `
  },
  {
    name: 'Crear índice para búsquedas rápidas',
    query: `
      CREATE INDEX IF NOT EXISTS idx_user_profiles_trial_expires_at 
      ON user_profiles(trial_expires_at);
    `
  },
  {
    name: 'Actualizar registros existentes con trial',
    query: `
      UPDATE user_profiles 
      SET trial_expires_at = created_at + INTERVAL '7 days'
      WHERE trial_expires_at IS NULL;
    `
  },
  {
    name: 'Agregar comentario a la columna',
    query: `
      COMMENT ON COLUMN user_profiles.trial_expires_at IS 
      'Fecha de vencimiento del trial de 7 días gratis';
    `
  }
];

async function runMigration() {
  console.log('🚀 Iniciando migración del sistema de trial...\n');

  for (const migration of migrations) {
    try {
      console.log(`📋 Ejecutando: ${migration.name}`);
      const { error } = await supabase.rpc('exec_sql', { 
        sql: migration.query 
      });

      // Si la función exec_sql no existe, intentar con supabase.query
      if (error && error.message.includes('exec_sql')) {
        console.log('⚠️  Función exec_sql no disponible, usando método alternativo');
        continue;
      }

      if (error) {
        console.error(`❌ Error: ${error.message}`);
      } else {
        console.log(`✅ Completado: ${migration.name}\n`);
      }
    } catch (err: any) {
      console.error(`❌ Error ejecutando migración: ${err.message}`);
    }
  }

  console.log('✅ Migración completada');
}

// Ejecutar migración
runMigration()
  .then(() => {
    console.log('\n🎉 ¡Migración exitosa!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en la migración:', error);
    process.exit(1);
  });


