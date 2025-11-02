/**
 * Servicio de Coinbase Commerce
 * Maneja pagos con criptomonedas utilizando la API de Coinbase Commerce
 */

const COMMERCE_API_BASE_URL = 'https://api.commerce.coinbase.com';

export interface ChargeRequest {
  name: string;
  description: string;
  local_price: {
    amount: string;
    currency: string;
  };
  pricing_type: 'fixed_price';
  metadata?: {
    [key: string]: string;
  };
}

export interface Charge {
  id: string;
  resource: 'charge';
  code: string;
  name: string;
  description: string;
  logo_url: string | null;
  hosted_url: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  timeline: Array<{
    status: string;
    timestamp: string;
  }>;
  metadata: {
    [key: string]: string;
  };
  pricing_type: string;
  payments: Array<any>;
  pricing: {
    local: {
      amount: string;
      currency: string;
    };
  };
  resource_path: string;
}

export interface CreateChargeResponse {
  data: Charge;
}

export interface GetChargeResponse {
  data: Charge;
}

class CoinbaseCommerceService {
  private apiKey: string;

  constructor() {
    // La API key se debe obtener de las variables de entorno
    this.apiKey = import.meta.env.VITE_COINBASE_COMMERCE_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ [CoinbaseCommerce] API Key no configurada');
    } else {
      console.log('✅ [CoinbaseCommerce] API Key cargada:', this.apiKey.substring(0, 10) + '...');
      // Validar que sea una API key de Coinbase Commerce (no de CDP)
      if (this.apiKey.startsWith('prj_') || this.apiKey.includes('coinbase.com')) {
        console.error('❌ [CoinbaseCommerce] Esta parece ser una API key del CDP, no de Coinbase Commerce');
        console.error('   La API key de Coinbase Commerce debe obtenerse de commerce.coinbase.com');
      }
    }
  }

  /**
   * Crea un nuevo cargo (charge) en Coinbase Commerce
   */
  async createCharge(request: ChargeRequest): Promise<{ success: boolean; charge?: Charge; error?: string }> {
    try {
      console.log('💰 [CoinbaseCommerce] Creando charge:', request.name);
      
      if (!this.apiKey) {
        return {
          success: false,
          error: 'Coinbase Commerce API Key no configurada'
        };
      }

      const response = await fetch(`${COMMERCE_API_BASE_URL}/charges/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CC-Api-Key': this.apiKey,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [CoinbaseCommerce] Error creando charge:', errorText);
        return {
          success: false,
          error: `Error al crear charge: ${response.statusText}`
        };
      }

      const data: CreateChargeResponse = await response.json();
      console.log('✅ [CoinbaseCommerce] Charge creado:', data.data.id);

      return {
        success: true,
        charge: data.data,
      };
    } catch (error: any) {
      console.error('❌ [CoinbaseCommerce] Excepción al crear charge:', error);
      return {
        success: false,
        error: error.message || 'Error inesperado al crear charge',
      };
    }
  }

  /**
   * Obtiene el estado de un charge por su ID
   */
  async getCharge(chargeId: string): Promise<{ success: boolean; charge?: Charge; error?: string }> {
    try {
      console.log('🔍 [CoinbaseCommerce] Obteniendo charge:', chargeId);
      
      if (!this.apiKey) {
        return {
          success: false,
          error: 'Coinbase Commerce API Key no configurada'
        };
      }

      const response = await fetch(`${COMMERCE_API_BASE_URL}/charges/${chargeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-CC-Api-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [CoinbaseCommerce] Error obteniendo charge:', errorText);
        return {
          success: false,
          error: `Error al obtener charge: ${response.statusText}`
        };
      }

      const data: GetChargeResponse = await response.json();
      console.log('✅ [CoinbaseCommerce] Charge obtenido:', data.data.id);

      return {
        success: true,
        charge: data.data,
      };
    } catch (error: any) {
      console.error('❌ [CoinbaseCommerce] Excepción al obtener charge:', error);
      return {
        success: false,
        error: error.message || 'Error inesperado al obtener charge',
      };
    }
  }

  /**
   * Verifica el estado de un charge
   * Retorna true si el charge está completado
   */
  isChargeCompleted(charge: Charge): boolean {
    if (!charge.timeline || charge.timeline.length === 0) {
      return false;
    }

    const lastStatus = charge.timeline[charge.timeline.length - 1];
    return lastStatus.status === 'COMPLETED';
  }

  /**
   * Verifica el estado de un charge
   * Retorna true si el charge está pendiente
   */
  isChargePending(charge: Charge): boolean {
    if (!charge.timeline || charge.timeline.length === 0) {
      return false;
    }

    const lastStatus = charge.timeline[charge.timeline.length - 1];
    return lastStatus.status === 'PENDING';
  }

  /**
   * Obtiene el estado actual del charge
   */
  getChargeStatus(charge: Charge): string {
    if (!charge.timeline || charge.timeline.length === 0) {
      return 'NEW';
    }

    const lastStatus = charge.timeline[charge.timeline.length - 1];
    return lastStatus.status;
  }
}

// Exportar instancia singleton
export const coinbaseCommerceService = new CoinbaseCommerceService();

