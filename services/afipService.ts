// Tipos para los parámetros de certificado
export interface ParametrosCertificado {
  cuit: string;
  username: string;
  password: string;
  alias: string;
}

export interface ParametrosCertificadoDesarrollo {
  cuit: string;
  username: string;
  password: string;
  alias: string;
}

export interface CertificadoProduccion {
  id: string;
  status: string;
  data: {
    cert: string;
    key: string;
  };
}

export interface InfoModo {
  modo: 'desarrollo' | 'produccion';
  cuit: number;
  descripcion: string;
}

export interface ResultadoConexion {
  exito: boolean;
  mensaje: string;
}

class AfipService {
  private static readonly AFIP_SDK_BASE_URL = 'https://api.afipsdk.com';
  private static readonly STORAGE_KEY_CERTIFICADOS = 'afip_certificados';
  private static readonly API_KEY = import.meta.env.VITE_AFIP_SDK_API_KEY;

  // Información del modo actual
  static obtenerInfoModo(): InfoModo {
    return {
      modo: 'desarrollo',
      cuit: 20409378472,
      descripcion: 'Entorno de pruebas - CUIT genérico para testing'
    };
  }

  // Crear certificado de desarrollo
  static async crearCertificadoDesarrollo(parametros: ParametrosCertificadoDesarrollo): Promise<CertificadoProduccion> {
    if (!this.API_KEY) {
      throw new Error('API Key de AFIP SDK no configurada. Configura VITE_AFIP_SDK_API_KEY en tu archivo .env');
    }

    try {
      const response = await fetch(`${this.AFIP_SDK_BASE_URL}/certificates/development`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`,
        },
        body: JSON.stringify({
          cuit: parametros.cuit,
          username: parametros.username,
          password: parametros.password,
          alias: parametros.alias,
          environment: 'development'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP ${response.status}: ${response.statusText}`);
      }

      const certificado = await response.json();
      
      return {
        id: certificado.id || `dev_${Date.now()}`,
        status: certificado.status || 'active',
        data: {
          cert: certificado.certificate || this.generarCertificadoMock(),
          key: certificado.private_key || this.generarClaveMock()
        }
      };
    } catch (error: any) {
      // En caso de error, generar certificado mock para desarrollo
      console.warn('Error conectando con AFIP SDK, usando certificado mock:', error.message);
      
      return {
        id: `dev_mock_${Date.now()}`,
        status: 'active',
        data: {
          cert: this.generarCertificadoMock(),
          key: this.generarClaveMock()
        }
      };
    }
  }

  // Crear certificado de producción
  static async crearCertificadoProduccion(parametros: ParametrosCertificado): Promise<CertificadoProduccion> {
    if (!this.API_KEY) {
      throw new Error('API Key de AFIP SDK no configurada. Configura VITE_AFIP_SDK_API_KEY en tu archivo .env');
    }

    try {
      const response = await fetch(`${this.AFIP_SDK_BASE_URL}/certificates/production`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`,
        },
        body: JSON.stringify({
          cuit: parametros.cuit,
          username: parametros.username,
          password: parametros.password,
          alias: parametros.alias,
          environment: 'production'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP ${response.status}: ${response.statusText}`);
      }

      const certificado = await response.json();
      
      return {
        id: certificado.id || `prod_${Date.now()}`,
        status: certificado.status || 'active',
        data: {
          cert: certificado.certificate,
          key: certificado.private_key
        }
      };
    } catch (error: any) {
      throw new Error(`Error creando certificado de producción: ${error.message}`);
    }
  }

  // Probar conexión con AFIP (modo desarrollo)
  static async probarConexionDesarrollo(): Promise<ResultadoConexion> {
    if (!this.API_KEY) {
      return {
        exito: false,
        mensaje: 'API Key de AFIP SDK no configurada'
      };
    }

    try {
      const response = await fetch(`${this.AFIP_SDK_BASE_URL}/test/connection`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          exito: true,
          mensaje: data.message || 'Conexión exitosa con AFIP SDK'
        };
      } else {
        return {
          exito: false,
          mensaje: `Error de conexión: ${response.status} ${response.statusText}`
        };
      }
    } catch (error: any) {
      return {
        exito: false,
        mensaje: `Error de red: ${error.message}`
      };
    }
  }

  // Guardar certificado en localStorage
  static guardarCertificado(certificado: CertificadoProduccion, alias: string): void {
    try {
      const certificados = this.listarCertificados();
      const nuevoCertificado = {
        id: certificado.id,
        alias: alias,
        fechaCreacion: new Date().toISOString(),
        certificado: certificado
      };

      // Evitar duplicados por alias
      const certificadosFiltrados = certificados.filter(cert => cert.alias !== alias);
      certificadosFiltrados.push(nuevoCertificado);

      localStorage.setItem(this.STORAGE_KEY_CERTIFICADOS, JSON.stringify(certificadosFiltrados));
    } catch (error) {
      console.error('Error guardando certificado:', error);
      throw new Error('No se pudo guardar el certificado');
    }
  }

  // Listar certificados guardados
  static listarCertificados(): Array<{ alias: string; fechaCreacion: string; id: string }> {
    try {
      const certificadosStr = localStorage.getItem(this.STORAGE_KEY_CERTIFICADOS);
      if (!certificadosStr) return [];

      const certificados = JSON.parse(certificadosStr);
      return certificados.map((cert: any) => ({
        id: cert.id,
        alias: cert.alias,
        fechaCreacion: cert.fechaCreacion
      }));
    } catch (error) {
      console.error('Error listando certificados:', error);
      return [];
    }
  }

  // Eliminar certificado
  static eliminarCertificado(alias: string): boolean {
    try {
      const certificadosStr = localStorage.getItem(this.STORAGE_KEY_CERTIFICADOS);
      if (!certificadosStr) return false;

      const certificados = JSON.parse(certificadosStr);
      const certificadosFiltrados = certificados.filter((cert: any) => cert.alias !== alias);
      
      if (certificadosFiltrados.length === certificados.length) {
        return false; // No se encontró el certificado
      }

      localStorage.setItem(this.STORAGE_KEY_CERTIFICADOS, JSON.stringify(certificadosFiltrados));
      return true;
    } catch (error) {
      console.error('Error eliminando certificado:', error);
      return false;
    }
  }

  // Obtener certificado por alias
  static obtenerCertificado(alias: string): CertificadoProduccion | null {
    try {
      const certificadosStr = localStorage.getItem(this.STORAGE_KEY_CERTIFICADOS);
      if (!certificadosStr) return null;

      const certificados = JSON.parse(certificadosStr);
      const certificado = certificados.find((cert: any) => cert.alias === alias);
      
      return certificado ? certificado.certificado : null;
    } catch (error) {
      console.error('Error obteniendo certificado:', error);
      return null;
    }
  }

  // Generar certificado mock para desarrollo
  private static generarCertificadoMock(): string {
    return `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKoK/heBjcOuMA0GCSqGSIb3DQEBBQUAMEUxCzAJBgNV
BAYTAkFSMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMTMwOTEyMjE1MjAyWhcNMTQwOTEyMjE1MjAyWjBF
MQswCQYDVQQGEwJBUjETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAuGaP/3l3hQE8w4cHjGUjML8EJLufD8BFjCrEMDw0oEXQDu2BPzDPOsjv
HLOpTurThrBY8jGZEAFASVjM2Ha90QHqDx2IcEBfHlWQf2e9DUDhPwMp5frHFxsE
7dTnBh7fqc8WF8INnHIT7BdyuJBuoU/B28g4yEcGRaLnVA6+Yh2HZJY4OqwDdkw4
cEhIz+Iay+lPQe/v6lClHgHIH7T1/5YjNY9TFMJHqiX+qiB5U6DM7MbAA4kGBqzI
HrfBIh+7jVSvdvlI3NYMqarHhVxQPd9Zz5YQaNdqeM0jdDZFd1ieotVjNe4zGF7S
/k2+vWjKjXHk+jZjHAPfYuAU89HtzQIDAQABo1AwTjAdBgNVHQ4EFgQUhqR2/WNs
YQau5WOQBaldEgFBqEswHwYDVR0jBBgwFoAUhqR2/WNsYQau5WOQBaldEgFBqEsw
DAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQUFAAOCAQEAALRiaPqPPiNusxurYceE
+4+bcLrCP/Bcrp5MXcBLz1w6asOBNTuIjaNhczWAGBr4ha1WQJ8/WRytvB3t7kYb
2JVF37BsgkgZ/j/HI7mAIuQdcSoceQrhgPoqhJ15jr53BTfBzAf8uZwH4Wmybs7M
DEniOXX2ThTmF0nzI1SayNrTxQMrqz6IzXkjgvVKBE6zJTn1hl+jgszWbFo4IVM9
ZlVcQdI8kDqowXBWVmyHBQTyNdHSh9dFtLoHZgaljAH0bTjcQnuJsuzC4iX6fRpB
2zHzEb7693aTaRB3hlqFDUnPfFeh5GIrFFHnTnkXnxNTrTJFOJvR5CDtvbwz4s4O
5w==
-----END CERTIFICATE-----`;
  }

  // Generar clave privada mock para desarrollo
  private static generarClaveMock(): string {
    return `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC4Zo//eXeFATzD
hweMapQwvwQku58PwEWMKsQwPDSgRdAO7YE/MM86yO8cs6lO6tOGsFjyMZkQAUBJ
WMzYdr3RAeoPHYhwQF8eVZB/Z70NQOEeAynl+scXGwTt1OcGHt+pzxYXwg2cchPs
F3K4kG6hT8HbyDjIRwZFoudUDr5iHYdkljg6rAN2TDhwSEjP4hrL6U9B7+/qUKUe
AcgftPX/liM1j1MUwkeqJf6qIHlToMzsxsADiQYGrMget8EiH7uNVK92+Ujc1gyp
qseFXFA931nPlhBo12p4zSN0NkV3WJ6i1WM17jMYXtL+Tb69aMqNceT6NmMcA99i
4BTz0e3NAgMBAAECggEBAK8REAiQ2z0i2XDAcohELeNwscDVQyGXdRy5BdMP4Vkz
8EKVqCHXZNhmpNXHgcsKCOJFXZpFQpjGNTZHjmQVGbzjS+9AbdulEIn6VdmTqMjc
C3gn6ribHjh5f/EiojVCrBWYRqQs5bEiebmxUOqd3Q2SLQYZo8T2fbPLuWnAU84H
6+sHKzZB1hJMnmLJbw5N5SJORB2hoUVq1BVkNVTuIjdwNBa7I8/jOkXyZBzEMdFM
kqwHXACrXsaATh5t4OCBCZ5RRJCrVMZcI+IKnWitzNfQzicPRSGfHpzqwBTXf+eD
nnLJvQjHI5EgYJGfBtPvEcxrn2pVHqwyciImL0OyoQECgYkAuGaP/3l3hQE8w4cH
jGUjML8EJLufD8BFjCrEMDw0oEXQDu2BPzDPOsjvHLOpTurThrBY8jGZEAFASVjM
2Ha90QHqDx2IcEBfHlWQf2e9DUDhPwMp5frHFxsE7dTnBh7fqc8WF8INnHIT7Bdy
uJBuoU/B28g4yEcGRaLnVA6+Yh2HZJY4OqwDdkw4cEhIz+Iay+lPQe/v6lClHgHI
H7T1/5YjNY9TFMJHqiX+qiB5U6DM7MbAA4kGBqzIHrfBIh+7jVSvdvlI3NYMqarH
hVxQPd9Zz5YQaNdqeM0jdDZFd1ieotVjNe4zGF7S/k2+vWjKjXHk+jZjHAPfYuAU
89HtzQIDAQABAoIBAQCvERAIkNs9ItlwwHKIRC3jcLHA1UMhl3UcuQXTD+FZM/BC
laghl2TYZqTVx4HLCgjiRV2aRUKYxjU2R45kFRm840vvQG3bpRCJ+lXZk6jI3At4
J+q4mx44eX/xIqI1QqwVmEakLOWxInm5sVDqnd0Nki0GGaPE9n2zy7lpwFPOB+vr
Bys2QdYSTJ5iyW8OTeUiTkQdoaFFatQVZDVU7iI3cDQWuyPP4zpF8mQcxDHRTJKs
B1wAq17GgE4ebeDigQmeUUSQq1TGXCPiCp1orc/X0M4nD0UhnxYc6sAU13/ng55y
yb0IxyORIGCRnwbT7xHMa59qVR6sMnIiJi9DsqEBAoGJALhm//95d4UBPMOHB4xl
Iwy/BCS7nw/ARYwqxDA8NKBF0A7tgT8wzzrI7xyzqU7q04awWPIxmRABQElYzNh2
vdEB6g8diHBAXx5VkH9nvQ1A4T8DKeX6xxcbBO3U5wYe36nPFhfCDZxyE+wXcriQ
bqFPwdvIOMhHBkWi51QOvmIdh2SWODqsA3ZMOHBISIviGsvpT0Hv7+pQpR4ByB+0
9f+WIzWPUxTCR6ol/qogeVOgzOzGwAOJBgasyB63wSIfu41Ur3b5SNzWDKmqx4Vc
UD3fWc+WEGjXanjNI3Q2RXdYnqLVYzXuMxhe0v5Nvr1oyo1x5Po2YxwD32LgFPPR
7c0CAwEAAQ==
-----END PRIVATE KEY-----`;
  }
}

export default AfipService;