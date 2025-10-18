import { supabase } from '../lib/supabase';

export interface UserLevel {
  id: string;
  username: string;
  nivel: number;
  email: string;
}

export interface LevelConfig {
  requiredLevel: number;
  sectionName: string;
  description: string;
}

// Configuración centralizada de niveles y secciones
export const LEVEL_CONFIG: Record<string, LevelConfig> = {
  // Secciones públicas (nivel 0)
  'rentabilidad': {
    requiredLevel: 0,
    sectionName: 'Calculadora de Rentabilidad',
    description: 'Análisis financiero básico'
  },
  
  // Secciones de nivel Starter (nivel 1)
  'breakeven-roas': {
    requiredLevel: 1,
    sectionName: 'Calcula tu Breakeven y ROAS',
    description: 'Análisis de inversión'
  },
  
  // Secciones de nivel Basic (nivel 2)
  'smartship': {
    requiredLevel: 2,
    sectionName: 'SmartShip - Transformador de Pedidos',
    description: 'Procesador de pedidos Andreani'
  },
  'historial': {
    requiredLevel: 2,
    sectionName: 'Historial de Archivos',
    description: 'Gestión de archivos procesados'
  },
  'informacion': {
    requiredLevel: 2,
    sectionName: 'Información y Estadísticas',
    description: 'Análisis inteligente de datos'
  },
  
  // Secciones de nivel Admin (nivel 3)
  'pdf-generator': {
    requiredLevel: 3,
    sectionName: 'Integrar SKU en Rótulos Andreani',
    description: 'Generador de rótulos con SKU'
  },
  
  // Secciones de nivel Dios (nivel 999)
  'admin': {
    requiredLevel: 999,
    sectionName: 'Panel de Administración Dios',
    description: 'Control total del sistema'
  }
};

// Niveles de usuario con nombres descriptivos
export const LEVEL_NAMES: Record<number, string> = {
  0: 'Invitado',
  1: 'Starter',
  2: 'Basic',
  3: 'Admin',
  999: 'Dios'
};

// Colores para cada nivel
export const LEVEL_COLORS: Record<number, string> = {
  0: 'gray',
  1: 'green',
  2: 'blue',
  3: 'purple',
  999: 'red'
};

class LevelService {
  private userLevel: UserLevel | null = null;
  private isLoading: boolean = true;

  /**
   * Obtiene el nivel del usuario desde la base de datos
   */
  async getUserLevel(userId: string): Promise<UserLevel | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error obteniendo nivel de usuario:', error);
        return null;
      }

      this.userLevel = data;
      this.isLoading = false;
      return data;
    } catch (error) {
      console.error('❌ Error en getUserLevel:', error);
      this.isLoading = false;
      return null;
    }
  }

  /**
   * Verifica si el usuario tiene acceso a una sección específica
   */
  hasAccess(requiredLevel: number): boolean {
    if (!this.userLevel) return false;
    return this.userLevel.nivel >= requiredLevel;
  }

  /**
   * Obtiene la configuración de una sección
   */
  getSectionConfig(sectionKey: string): LevelConfig | null {
    return LEVEL_CONFIG[sectionKey] || null;
  }

  /**
   * Obtiene el nombre del nivel del usuario
   */
  getLevelName(level?: number): string {
    const userLevel = level ?? this.userLevel?.nivel ?? 0;
    return LEVEL_NAMES[userLevel] || 'Desconocido';
  }

  /**
   * Obtiene el color del nivel del usuario
   */
  getLevelColor(level?: number): string {
    const userLevel = level ?? this.userLevel?.nivel ?? 0;
    return LEVEL_COLORS[userLevel] || 'gray';
  }

  /**
   * Actualiza el nivel de un usuario
   */
  async updateUserLevel(userId: string, newLevel: number): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ nivel: newLevel, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (!error) {
        // Actualizar el nivel local
        if (this.userLevel) {
          this.userLevel.nivel = newLevel;
        }
      }

      return { error };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Obtiene todas las secciones accesibles para el usuario actual
   */
  getAccessibleSections(): Array<{ key: string; config: LevelConfig; hasAccess: boolean }> {
    if (!this.userLevel) return [];

    return Object.entries(LEVEL_CONFIG).map(([key, config]) => ({
      key,
      config,
      hasAccess: this.hasAccess(config.requiredLevel)
    }));
  }

  /**
   * Limpia el estado del servicio
   */
  clearState(): void {
    this.userLevel = null;
    this.isLoading = true;
  }

  /**
   * Getters para el estado actual
   */
  get currentUserLevel(): UserLevel | null {
    return this.userLevel;
  }

  get currentIsLoading(): boolean {
    return this.isLoading;
  }

  get currentLevel(): number {
    return this.userLevel?.nivel ?? 0;
  }

  get currentUsername(): string {
    return this.userLevel?.username ?? 'Usuario';
  }
}

// Instancia singleton del servicio
export const levelService = new LevelService();

// Funciones de utilidad exportadas
export const getUserLevel = (userId: string) => levelService.getUserLevel(userId);
export const hasAccess = (requiredLevel: number) => levelService.hasAccess(requiredLevel);
export const getSectionConfig = (sectionKey: string) => levelService.getSectionConfig(sectionKey);
export const getLevelName = (level?: number) => levelService.getLevelName(level);
export const getLevelColor = (level?: number) => levelService.getLevelColor(level);
export const updateUserLevel = (userId: string, newLevel: number) => levelService.updateUserLevel(userId, newLevel);
export const getAccessibleSections = () => levelService.getAccessibleSections();
