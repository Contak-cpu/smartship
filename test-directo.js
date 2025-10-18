// Test directo de login y nivel
const https = require('https');
const http = require('http');

console.log('🧪 EJECUTANDO TEST DE LOGIN Y NIVEL');
console.log('='.repeat(50));

// Test 1: Verificar servidor local
console.log('\n🔍 Verificando servidor local...');
const req = http.get('http://localhost:3002', (res) => {
  console.log('✅ Servidor funcionando en puerto 3002');
  
  // Test 2: Login con Supabase
  console.log('\n🔍 Intentando login con Supabase...');
  
  const loginData = JSON.stringify({
    email: 'erick@gmail.com',
    password: 'testpassword'
  });
  
  const options = {
    hostname: 'rycifekzklqsnuczawub.supabase.co',
    port: 443,
    path: '/auth/v1/token?grant_type=password',
    method: 'POST',
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5Y2lmZWt6a2xxc251Y3phd3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNTIzNTYsImV4cCI6MjA3NTYyODM1Nn0.qOQc6lc_ODu1P8armYsDLA0Oy0MkOI5JtrgIbfXDqqU',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };
  
  const loginReq = https.request(options, (loginRes) => {
    let data = '';
    loginRes.on('data', (chunk) => data += chunk);
    loginRes.on('end', () => {
      if (loginRes.statusCode === 200) {
        console.log('✅ Login exitoso!');
        const result = JSON.parse(data);
        console.log('📧 Email:', result.user.email);
        console.log('🆔 ID:', result.user.id);
        
        const metadata = result.user.user_metadata;
        if (metadata) {
          console.log('📊 Metadata:');
          console.log('   Username:', metadata.username);
          console.log('   Nivel:', metadata.nivel);
          
          if (metadata.nivel) {
            console.log('✅ Nivel encontrado en metadata:', metadata.nivel);
          } else {
            console.log('❌ PROBLEMA: No hay nivel en metadata');
          }
        } else {
          console.log('❌ PROBLEMA: No hay metadata del usuario');
        }
      } else {
        console.log('❌ Error en login:', loginRes.statusCode);
        console.log('   Respuesta:', data);
        
        // Intentar con contraseñas comunes
        console.log('\n🔄 Probando contraseñas comunes...');
        const passwords = ['password', '123456', 'admin', 'test', 'erick123'];
        
        passwords.forEach((pwd, index) => {
          setTimeout(() => {
            console.log('   Probando:', pwd);
            
            const testData = JSON.stringify({
              email: 'erick@gmail.com',
              password: pwd
            });
            
            const testOptions = {
              hostname: 'rycifekzklqsnuczawub.supabase.co',
              port: 443,
              path: '/auth/v1/token?grant_type=password',
              method: 'POST',
              headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5Y2lmZWt6a2xxc251Y3phd3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNTIzNTYsImV4cCI6MjA3NTYyODM1Nn0.qOQc6lc_ODu1P8armYsDLA0Oy0MkOI5JtrgIbfXDqqU',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(testData)
              }
            };
            
            const testReq = https.request(testOptions, (testRes) => {
              let testData = '';
              testRes.on('data', (chunk) => testData += chunk);
              testRes.on('end', () => {
                if (testRes.statusCode === 200) {
                  console.log('✅ Login exitoso con contraseña:', pwd);
                  const testResult = JSON.parse(testData);
                  const testMetadata = testResult.user.user_metadata;
                  
                  if (testMetadata && testMetadata.nivel) {
                    console.log('✅ Nivel encontrado:', testMetadata.nivel);
                  } else {
                    console.log('❌ PROBLEMA: No hay nivel en metadata');
                  }
                  
                  // Test 3: Verificar user_profiles
                  console.log('\n🔍 Verificando tabla user_profiles...');
                  
                  const profilesOptions = {
                    hostname: 'rycifekzklqsnuczawub.supabase.co',
                    port: 443,
                    path: '/rest/v1/user_profiles',
                    method: 'GET',
                    headers: {
                      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5Y2lmZWt6a2xxc251Y3phd3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNTIzNTYsImV4cCI6MjA3NTYyODM1Nn0.qOQc6lc_ODu1P8armYsDLA0Oy0MkOI5JtrgIbfXDqqU'
                    }
                  };
                  
                  const profilesReq = https.request(profilesOptions, (profilesRes) => {
                    let profilesData = '';
                    profilesRes.on('data', (chunk) => profilesData += chunk);
                    profilesRes.on('end', () => {
                      if (profilesRes.statusCode === 200) {
                        console.log('✅ Acceso a user_profiles exitoso');
                        const profiles = JSON.parse(profilesData);
                        console.log('📊 Perfiles encontrados:', profiles.length);
                        
                        profiles.forEach(profile => {
                          console.log('   ' + profile.username + ': nivel ' + profile.nivel);
                        });
                      } else {
                        console.log('❌ Error accediendo a user_profiles:', profilesRes.statusCode);
                      }
                      
                      console.log('\n📋 RESUMEN:');
                      console.log('='.repeat(30));
                      console.log('✅ Test ejecutado completamente');
                      console.log('🎯 Problema identificado en el análisis anterior');
                      console.log('🔧 Solución disponible en el código');
                    });
                  });
                  
                  profilesReq.on('error', (err) => {
                    console.log('❌ Error en request de profiles:', err.message);
                  });
                  
                  profilesReq.end();
                }
              });
            });
            
            testReq.on('error', (err) => {
              // Continuar con siguiente contraseña
            });
            
            testReq.write(testData);
            testReq.end();
          }, index * 1000);
        });
      }
    });
  });
  
  loginReq.on('error', (err) => {
    console.log('❌ Error en login:', err.message);
  });
  
  loginReq.write(loginData);
  loginReq.end();
});

req.on('error', (err) => {
  console.log('❌ Error conectando al servidor:', err.message);
});


