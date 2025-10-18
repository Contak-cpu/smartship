// Script para testear el problema de nivel de usuario
// Este script simula el proceso de login y verifica si el nivel se actualiza correctamente

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://rycifekzklqsnuczawub.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5Y2lmZWt6a2xxc251Y3phd3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNTIzNTYsImV4cCI6MjA3NTYyODM1Nn0.qOQc6lc_ODu1P8armYsDLA0Oy0MkOI5JtrgIbfXDqqU';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

interface TestResult {
  step: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  data?: any;
  timestamp: Date;
}

class LoginLevelTester {
  private results: TestResult[] = [];

  private addResult(step: string, status: TestResult['status'], message: string, data?: any) {
    const result: TestResult = {
      step,
      status,
      message,
      data,
      timestamp: new Date()
    };
    this.results.push(result);
    console.log(`🧪 [TEST] ${step}: ${message}`, data || '');
  }

  private getStatusIcon(status: TestResult['status']) {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  }

  async runTest(email: string, password: string) {
    this.results = [];
    this.addResult('INICIO', 'info', 'Iniciando test automatizado de login y nivel');

    try {
      // Paso 1: Verificar estado inicial
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      this.addResult('ESTADO_INICIAL', 'info', 'Verificando estado inicial', {
        hasSession: !!initialSession,
        hasUser: !!initialSession?.user,
        email: initialSession?.user?.email
      });

      // Paso 2: Cerrar sesión si existe
      if (initialSession) {
        this.addResult('LOGOUT', 'info', 'Cerrando sesión existente');
        await supabase.auth.signOut();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Paso 3: Intentar login
      this.addResult('LOGIN_ATTEMPT', 'info', `Intentando login con ${email}`);
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (loginError) {
        this.addResult('LOGIN_ERROR', 'error', 'Error en login', loginError);
        return this.results;
      }

      this.addResult('LOGIN_SUCCESS', 'success', 'Login exitoso', {
        userId: loginData.user?.id,
        email: loginData.user?.email
      });

      // Paso 4: Esperar un poco para que se actualice el estado
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Paso 5: Verificar sesión después del login
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        this.addResult('SESSION_ERROR', 'error', 'Error al obtener sesión', sessionError);
        return this.results;
      }

      this.addResult('SESSION_CHECK', 'info', 'Verificando sesión de Supabase', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        email: session?.user?.email,
        metadata: session?.user?.user_metadata
      });

      // Paso 6: Analizar metadata del usuario
      const metadata = session?.user?.user_metadata || {};
      const nivelFromMetadata = parseInt(metadata.nivel) || 0;
      
      this.addResult('METADATA_ANALYSIS', 'info', 'Analizando metadata del usuario', {
        metadata,
        nivelFromMetadata,
        usernameFromMetadata: metadata.username,
        allMetadataKeys: Object.keys(metadata)
      });

      // Paso 7: Verificar si el nivel está definido correctamente
      if (metadata.nivel === undefined || metadata.nivel === null) {
        this.addResult('NO_LEVEL_IN_METADATA', 'error', 
          '❌ PROBLEMA CRÍTICO: El campo "nivel" no existe en los metadata del usuario',
          { metadata }
        );
      } else if (isNaN(nivelFromMetadata)) {
        this.addResult('INVALID_LEVEL_VALUE', 'error', 
          `❌ PROBLEMA CRÍTICO: El valor del nivel no es un número válido: "${metadata.nivel}"`,
          { metadata }
        );
      } else {
        this.addResult('LEVEL_FOUND', 'success', 
          `✅ Nivel encontrado en metadata: ${nivelFromMetadata}`
        );
      }

      // Paso 8: Verificar si hay usuarios en la tabla de perfiles
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session?.user?.id);

        if (profilesError) {
          this.addResult('PROFILES_TABLE_ERROR', 'warning', 
            'No se pudo acceder a la tabla user_profiles (esto puede ser normal)', 
            profilesError
          );
        } else {
          this.addResult('PROFILES_CHECK', 'info', 'Verificando tabla user_profiles', {
            hasProfile: profiles && profiles.length > 0,
            profile: profiles?.[0],
            totalProfiles: profiles?.length
          });
        }
      } catch (error) {
        this.addResult('PROFILES_TABLE_EXCEPTION', 'warning', 
          'Excepción al acceder a user_profiles', 
          error
        );
      }

      // Paso 9: Verificar configuración de RLS
      try {
        const { data: policies, error: policiesError } = await supabase
          .from('user_profiles')
          .select('*')
          .limit(0); // Solo verificar acceso, no obtener datos

        if (policiesError) {
          this.addResult('RLS_CHECK', 'warning', 
            'Verificación de RLS - puede haber restricciones', 
            policiesError
          );
        } else {
          this.addResult('RLS_CHECK', 'success', 
            'Acceso a user_profiles verificado'
          );
        }
      } catch (error) {
        this.addResult('RLS_EXCEPTION', 'warning', 
          'Excepción en verificación de RLS', 
          error
        );
      }

      // Paso 10: Resumen del problema
      if (metadata.nivel === undefined || metadata.nivel === null) {
        this.addResult('PROBLEM_SUMMARY', 'error', 
          '🎯 PROBLEMA IDENTIFICADO: El usuario no tiene el campo "nivel" en sus metadata. ' +
          'Esto puede deberse a: 1) El usuario fue creado sin nivel, 2) El nivel no se actualizó correctamente, ' +
          '3) Hay un problema en la migración de datos.'
        );
      } else if (isNaN(nivelFromMetadata)) {
        this.addResult('PROBLEM_SUMMARY', 'error', 
          '🎯 PROBLEMA IDENTIFICADO: El campo "nivel" existe pero tiene un valor inválido. ' +
          'El valor debe ser un número entero.'
        );
      } else {
        this.addResult('PROBLEM_SUMMARY', 'success', 
          '✅ No se detectaron problemas obvios con el nivel del usuario. ' +
          'El problema puede estar en el hook useAuth o en la sincronización del estado.'
        );
      }

    } catch (error) {
      this.addResult('TEST_EXCEPTION', 'error', 'Excepción durante el test', error);
    }

    this.addResult('FIN', 'info', 'Test completado');
    return this.results;
  }

  printResults() {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 RESULTADOS DEL TEST DE LOGIN Y NIVEL');
    console.log('='.repeat(80));
    
    this.results.forEach((result, index) => {
      const icon = this.getStatusIcon(result.status);
      const time = result.timestamp.toLocaleTimeString();
      console.log(`\n${icon} [${time}] ${result.step}`);
      console.log(`   ${result.message}`);
      
      if (result.data) {
        console.log('   Datos:', JSON.stringify(result.data, null, 2));
      }
    });
    
    console.log('\n' + '='.repeat(80));
  }

  getResults() {
    return this.results;
  }
}

// Función principal para ejecutar el test
export async function runLoginLevelTest(email: string, password: string) {
  const tester = new LoginLevelTester();
  const results = await tester.runTest(email, password);
  tester.printResults();
  return results;
}

// Función para ejecutar el test desde la consola del navegador
if (typeof window !== 'undefined') {
  (window as any).runLoginLevelTest = runLoginLevelTest;
  console.log('🧪 Test de Login y Nivel disponible. Usa: runLoginLevelTest("email", "password")');
}
