/**
 * Servicio de Autenticación Modular
 * Maneja todo el sistema de login, logout y registro de usuarios
 */

import { supabase } from '../lib/supabase';

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: any;
  session?: any;
}

export interface SignUpResponse {
  success: boolean;
  error?: string;
  user?: any;
  requiresEmailConfirmation?: boolean;
}

class AuthService {
  /**
   * Inicia sesión con email y contraseña
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('🔐 [AuthService] Iniciando login para:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ [AuthService] Error en login:', error);
        return {
          success: false,
          error: error.message || 'Error al iniciar sesión',
        };
      }

      if (!data.session || !data.user) {
        console.error('❌ [AuthService] No se obtuvo sesión o usuario');
        return {
          success: false,
          error: 'No se pudo establecer la sesión',
        };
      }

      console.log('✅ [AuthService] Login exitoso');
      
      return {
        success: true,
        user: data.user,
        session: data.session,
      };
    } catch (error: any) {
      console.error('❌ [AuthService] Excepción en login:', error);
      return {
        success: false,
        error: error.message || 'Error inesperado al iniciar sesión',
      };
    }
  }

  /**
   * Cierra sesión del usuario actual
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 [AuthService] Cerrando sesión');
      
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ [AuthService] Error al cerrar sesión:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('✅ [AuthService] Sesión cerrada exitosamente');
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ [AuthService] Excepción al cerrar sesión:', error);
      return {
        success: false,
        error: error.message || 'Error inesperado al cerrar sesión',
      };
    }
  }


  /**
   * Registra un nuevo usuario
   */
  async signUp(
    email: string,
    password: string,
    username: string,
    plan: string = 'Starter'
  ): Promise<SignUpResponse> {
    try {
      console.log('🔐 [AuthService] Registrando usuario:', email, 'Plan:', plan);

      // Calcular fecha de expiración del trial (7 días)
      const trialExpiresAt = new Date();
      trialExpiresAt.setDate(trialExpiresAt.getDate() + 7);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            plan,
            nivel: 3, // Nivel VIP por defecto
            trial_expires_at: trialExpiresAt.toISOString(),
          },
          emailRedirectTo: undefined, // No requerir confirmación de email
        },
      });

      if (error) {
        console.error('❌ [AuthService] Error en registro:', error);
        
        // Si el error es "email already exists", dar mensaje más amigable
        let errorMessage = error.message;
        if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
          errorMessage = 'Este email ya está registrado. Si es tu cuenta, intenta iniciar sesión en su lugar.';
        }
        
        return {
          success: false,
          error: errorMessage,
        };
      }

      if (!data.user) {
        console.error('❌ [AuthService] No se creó el usuario');
        return {
          success: false,
          error: 'No se pudo crear el usuario',
        };
      }

      console.log('✅ [AuthService] Usuario registrado exitosamente con nivel 3 y 7 días de trial');

      // Verificar si requiere confirmación de email
      const requiresEmailConfirmation = 
        !data.session && data.user.email_confirmed_at === null;

      return {
        success: true,
        user: data.user,
        requiresEmailConfirmation,
      };
    } catch (error: any) {
      console.error('❌ [AuthService] Excepción en registro:', error);
      return {
        success: false,
        error: error.message || 'Error inesperado al registrar usuario',
      };
    }
  }

  /**
   * Obtiene la sesión actual del usuario
   */
  async getCurrentSession(): Promise<{ session: any; error?: any }> {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      return {
        session: data.session,
        error,
      };
    } catch (error) {
      return {
        session: null,
        error,
      };
    }
  }

  /**
   * Obtiene el usuario actual
   */
  async getCurrentUser(): Promise<{ user: any; error?: any }> {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      return {
        user: data.user,
        error,
      };
    } catch (error) {
      return {
        user: null,
        error,
      };
    }
  }

  /**
   * Escucha cambios en el estado de autenticación
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 [AuthService] Auth state change:', event);
      callback(event, session);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }

  /**
   * Reenvía el email de confirmación
   */
  async resendConfirmationEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Exportar instancia singleton
export const authService = new AuthService();

