/**
 * Script para limpiar usuarios huérfanos en Supabase
 * 
 * Ejecuta: npx tsx scripts/limpiar-usuarios-huerfanos.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rycifekzklqsnuczawub.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5Y2lmZWt6a2xxc251Y3phd3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNTIzNTYsImV4cCI6MjA3NTYyODM1Nn0.qOQc6lc_ODu1P8armYsDLA0Oy0MkOI5JtrgIbfXDqqU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function verUsuariosHuerfanos() {
  console.log('\n🔍 Verificando usuarios huérfanos...\n');
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        au.id,
        au.email,
        au.created_at,
        au.email_confirmed_at
      FROM auth.users au
      LEFT JOIN user_profiles up ON au.id = up.id
      WHERE up.id IS NULL
      ORDER BY au.created_at DESC;
    `
  });

  if (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  No se puede ejecutar directamente desde aquí.');
    console.log('Debes usar la función RPC o ejecutar el SQL manualmente en Supabase Dashboard.\n');
    return null;
  }

  return data;
}

async function limpiarUsuariosHuerfanos() {
  console.log('\n🚀 Iniciando limpieza de usuarios huérfanos...\n');
  
  console.log('⚠️  IMPORTANTE: Esta operación eliminará usuarios de auth.users');
  console.log('que no tienen perfil en user_profiles.\n');
  
  const confirmacion = await question('¿Estás seguro de continuar? (s/n): ');
  
  if (confirmacion.toLowerCase() !== 's') {
    console.log('❌ Operación cancelada.\n');
    rl.close();
    return;
  }

  // Primero, mostrar los usuarios que se van a eliminar
  console.log('\n📋 Usuarios que serán eliminados:\n');
  
  const { data: usuarios } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', 'huerfanos');

  console.log('⚠️  No se puede ejecutar directamente el SQL desde aquí.');
  console.log('\n📝 Pasos manuales:\n');
  console.log('1. Ve a: https://supabase.com/dashboard');
  console.log('2. SQL Editor → New query');
  console.log('3. Ejecuta este SQL:\n');
  console.log(`
DELETE FROM auth.users
WHERE id IN (
  SELECT au.id
  FROM auth.users au
  LEFT JOIN user_profiles up ON au.id = up.id
  WHERE up.id IS NULL
    AND au.email_confirmed_at IS NULL
);
  `);
  console.log('\n✅ Esto eliminará solo usuarios sin email confirmado (SIGURO)\n');
  
  rl.close();
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       LIMPIAR USUARIOS HUÉRFANOS - SUPABASE               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Intentar ver usuarios huérfanos
  await verUsuariosHuerfanos();
  
  // Mostrar opciones
  console.log('\n📋 OPCIONES:\n');
  console.log('1. Ejecutar SQL manualmente en Supabase Dashboard (RECOMENDADO)');
  console.log('2. Ver instrucciones detalladas');
  console.log('3. Salir\n');
  
  const opcion = await question('Selecciona una opción (1-3): ');
  
  switch (opcion) {
    case '1':
      await limpiarUsuariosHuerfanos();
      break;
    case '2':
      console.log('\n📄 Archivos de documentación:');
      console.log('   - docs/LIMPIAR_USUARIOS_HUERFANOS.sql');
      console.log('   - docs/SOLUCION_EMAIL_EN_USO.md\n');
      break;
    case '3':
      console.log('\n👋 ¡Hasta luego!\n');
      break;
    default:
      console.log('\n❌ Opción inválida\n');
  }
  
  rl.close();
}

main().catch(console.error);


