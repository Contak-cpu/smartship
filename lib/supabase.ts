import { createClient } from '@supabase/supabase-js';

// Validar que las variables de entorno estén configuradas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rycifekzklqsnuczawub.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5Y2lmZWt6a2xxc251Y3phd3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNTIzNTYsImV4cCI6MjA3NTYyODM1Nn0.qOQc6lc_ODu1P8armYsDLA0Oy0MkOI5JtrgIbfXDqqU';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno de Supabase. ' +
    'Asegúrate de tener configurado VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env.local'
  );
}

// Crear y exportar el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    // Configuraciones adicionales para evitar problemas de sincronización
    flowType: 'pkce',
    debug: false,
    // Desactivar confirmación de email temporalmente
    confirmEmailChange: false,
  },
  // Configuraciones adicionales del cliente
  global: {
    headers: {
      'X-Client-Info': 'facil-uno-app',
    },
  },
});

// Log de verificación
console.log('🔧 [Supabase] Cliente inicializado correctamente');
console.log('🔧 [Supabase] URL:', supabaseUrl);
console.log('🔧 [Supabase] Anon Key:', supabaseAnonKey ? 'Configurado' : 'No configurado');

// Tipos para TypeScript (opcional, pero muy recomendado)
export type Database = {
  // Aquí puedes definir tus tipos de base de datos
  // Por ejemplo:
  // public: {
  //   Tables: {
  //     users: {
  //       Row: { ... },
  //       Insert: { ... },
  //       Update: { ... }
  //     }
  //   }
  // }
};

