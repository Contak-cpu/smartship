/**
 * Script para consultar los atributos del usuario soporte.ecommerce123@gmail.com
 * Ejecuta: node scripts/consultar-usuario-soporte.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rycifekzklqsnuczawub.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Error: No se encontró SUPABASE_SERVICE_ROLE_KEY en las variables de entorno');
  console.log('\n📝 Para obtener la service_role_key:');
  console.log('1. Ve a https://supabase.com/dashboard/project/rycifekzklqsnuczawub');
  console.log('2. Settings → API');
  console.log('3. Copia la "service_role" key (secret)');
  console.log('4. Agrega al archivo .env.local: SUPABASE_SERVICE_ROLE_KEY=tu_key_aqui\n');
  process.exit(1);
}

// Crear cliente con service_role para acceso admin
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function consultarUsuario() {
  const email = 'soporte.ecommerce123@gmail.com';
  
  console.log('🔍 Consultando usuario:', email);
  console.log('─'.repeat(60));

  try {
    // Consultar usuario desde auth.users usando RPC o función personalizada
    // Nota: Necesitamos usar una función SQL personalizada o consulta directa
    
    // Opción 1: Intentar consultar directamente (requiere función SQL)
    const { data, error } = await supabase.rpc('get_user_metadata', {
      user_email: email
    });

    if (error) {
      console.log('⚠️  No se pudo usar RPC, intentando método alternativo...\n');
      
      // Opción 2: Consultar desde user_profiles si existe
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (profileError) {
        console.error('❌ Error consultando user_profiles:', profileError.message);
      } else if (profile) {
        console.log('✅ Usuario encontrado en user_profiles:');
        console.log(JSON.stringify(profile, null, 2));
      } else {
        console.log('⚠️  Usuario no encontrado en user_profiles');
      }
    } else {
      console.log('✅ Datos del usuario:');
      console.log(JSON.stringify(data, null, 2));
    }

    console.log('\n📋 Para consultar directamente desde Supabase SQL Editor:');
    console.log('─'.repeat(60));
    console.log(`
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data->>'username' as username,
  raw_user_meta_data->>'nivel' as nivel,
  raw_user_meta_data->>'is_paid' as is_paid,
  raw_user_meta_data->>'pagos_empresa' as pagos_empresa,
  raw_user_meta_data->>'paid_until' as paid_until,
  raw_user_meta_data->>'trial_expires_at' as trial_expires_at,
  raw_user_meta_data->>'payment_status' as payment_status,
  raw_user_meta_data as metadata_completo
FROM auth.users
WHERE email = '${email}';
    `);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

consultarUsuario();






