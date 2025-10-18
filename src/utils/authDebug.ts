// Utilidades para debugging de autenticación
export const authDebug = {
  log: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`🔐 [AUTH DEBUG] ${message}`, data || '');
    }
  },
  
  error: (message: string, error?: any) => {
    console.error(`❌ [AUTH ERROR] ${message}`, error || '');
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`⚠️ [AUTH WARN] ${message}`, data || '');
  },
  
  success: (message: string, data?: any) => {
    console.log(`✅ [AUTH SUCCESS] ${message}`, data || '');
  }
};

// Función para verificar el estado de la sesión
export const checkSessionStatus = async (supabase: any) => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    authDebug.log('Estado de sesión:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      email: session?.user?.email,
      expiresAt: session?.expires_at
    });
    
    return { session, error };
  } catch (error) {
    authDebug.error('Error al verificar sesión:', error);
    return { session: null, error };
  }
};

// Función para verificar el perfil del usuario
export const checkUserProfile = async (supabase: any, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    authDebug.log('Estado del perfil:', {
      hasProfile: !!data,
      nivel: data?.nivel,
      username: data?.username,
      error: error?.message
    });
    
    return { data, error };
  } catch (error) {
    authDebug.error('Error al verificar perfil:', error);
    return { data: null, error };
  }
};

