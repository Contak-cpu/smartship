#!/usr/bin/env node

/**
 * Script para configurar la API Key de Coinbase Commerce en Vercel
 * 
 * Uso:
 *   node scripts/configurar-coinbase-vercel.js
 * 
 * Requiere Vercel CLI instalado y autenticado
 */

const { execSync } = require('child_process');

const API_KEY = '3814de1d-49e3-43ff-abb8-8ac977d98fb7';
const VAR_NAME = 'VITE_COINBASE_COMMERCE_API_KEY';
const ENVIRONMENTS = ['production', 'preview', 'development'];

console.log('🔐 Configurando Coinbase Commerce API Key en Vercel...\n');

// Verificar que Vercel CLI esté instalado
try {
  execSync('vercel --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Error: Vercel CLI no está instalado.');
  console.error('   Instálalo con: npm install -g vercel');
  process.exit(1);
}

// Verificar autenticación
try {
  execSync('vercel whoami', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Error: No estás autenticado en Vercel.');
  console.error('   Ejecuta: vercel login');
  process.exit(1);
}

// Configurar para cada ambiente
ENVIRONMENTS.forEach(env => {
  console.log(`📝 Configurando ${env}...`);
  
  try {
    // Usar echo para pasar el valor de forma segura
    execSync(
      `echo "${API_KEY}" | vercel env add ${VAR_NAME} ${env}`,
      { stdio: 'inherit' }
    );
    console.log(`✅ ${env} configurado exitosamente\n`);
  } catch (error) {
    console.error(`❌ Error configurando ${env}:`, error.message);
  }
});

console.log('🎉 ¡Configuración completada!');
console.log('\n📋 Próximos pasos:');
console.log('1. Ve a https://vercel.com/dashboard');
console.log('2. Selecciona tu proyecto');
console.log('3. Haz clic en "Redeploy" en el último deployment');
console.log('\n💡 O ejecuta: vercel --prod');

