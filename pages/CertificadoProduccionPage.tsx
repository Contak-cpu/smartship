import React, { useState, useEffect } from 'react';
import AfipService, { ParametrosCertificado, ParametrosCertificadoDesarrollo, CertificadoProduccion } from '../services/afipService';

const CertificadoProduccionPage: React.FC = () => {
  const [parametros, setParametros] = useState<ParametrosCertificado>({
    cuit: '',
    username: '',
    password: '',
    alias: ''
  });
  
  const [parametrosDesarrollo, setParametrosDesarrollo] = useState<ParametrosCertificadoDesarrollo>({
    cuit: '20111111112',
    username: '20111111112',
    password: '',
    alias: ''
  });
  
  const [tipoCertificado, setTipoCertificado] = useState<'desarrollo' | 'produccion'>('desarrollo');
  
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState<'success' | 'error' | 'info'>('info');
  const [certificados, setCertificados] = useState<Array<{ alias: string; fechaCreacion: string; id: string }>>([]);
  const [mostrarCertificado, setMostrarCertificado] = useState<CertificadoProduccion | null>(null);
  const [infoModo, setInfoModo] = useState<{ modo: 'desarrollo' | 'produccion'; cuit: number; descripcion: string } | null>(null);
  const [probandoConexion, setProbandoConexion] = useState(false);

  useEffect(() => {
    cargarCertificados();
    cargarInfoModo();
  }, []);

  const cargarInfoModo = () => {
    const info = AfipService.obtenerInfoModo();
    setInfoModo(info);
  };

  const cargarCertificados = () => {
    const lista = AfipService.listarCertificados();
    setCertificados(lista);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParametros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInputChangeDesarrollo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParametrosDesarrollo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validarParametros = (): boolean => {
    const params = tipoCertificado === 'desarrollo' ? parametrosDesarrollo : parametros;
    
    if (!params.cuit || params.cuit.length !== 11) {
      setMensaje('El CUIT debe tener 11 dígitos');
      setTipoMensaje('error');
      return false;
    }
    
    if (!params.username) {
      setMensaje('El username es requerido');
      setTipoMensaje('error');
      return false;
    }
    
    if (!params.password) {
      setMensaje('La contraseña es requerida');
      setTipoMensaje('error');
      return false;
    }
    
    if (!params.alias || params.alias.length < 3) {
      setMensaje('El alias debe tener al menos 3 caracteres');
      setTipoMensaje('error');
      return false;
    }

    return true;
  };

  const crearCertificado = async () => {
    if (!validarParametros()) return;

    setCargando(true);
    setMensaje('');

    try {
      let resultado: CertificadoProduccion;
      
      if (tipoCertificado === 'desarrollo') {
        resultado = await AfipService.crearCertificadoDesarrollo(parametrosDesarrollo);
      } else {
        resultado = await AfipService.crearCertificadoProduccion(parametros);
      }
      
      // Guardar el certificado
      const alias = tipoCertificado === 'desarrollo' ? parametrosDesarrollo.alias : parametros.alias;
      AfipService.guardarCertificado(resultado, alias);
      
      setMostrarCertificado(resultado);
      setMensaje(`Certificado ${tipoCertificado} "${alias}" creado exitosamente`);
      setTipoMensaje('success');
      
      // Limpiar formulario
      if (tipoCertificado === 'desarrollo') {
        setParametrosDesarrollo({
          cuit: '20111111112',
          username: '20111111112',
          password: '',
          alias: ''
        });
      } else {
        setParametros({
          cuit: '',
          username: '',
          password: '',
          alias: ''
        });
      }
      
      // Recargar lista de certificados
      cargarCertificados();
      
    } catch (error: any) {
      setMensaje(`Error: ${error.message}`);
      setTipoMensaje('error');
    } finally {
      setCargando(false);
    }
  };

  const eliminarCertificado = (alias: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el certificado "${alias}"?`)) {
      const eliminado = AfipService.eliminarCertificado(alias);
      if (eliminado) {
        setMensaje(`Certificado "${alias}" eliminado exitosamente`);
        setTipoMensaje('success');
        cargarCertificados();
      } else {
        setMensaje(`Error al eliminar el certificado "${alias}"`);
        setTipoMensaje('error');
      }
    }
  };

  const formatearFecha = (fechaISO: string) => {
    return new Date(fechaISO).toLocaleString('es-AR');
  };

  const probarConexionAFIP = async () => {
    setProbandoConexion(true);
    setMensaje('');

    try {
      const resultado = await AfipService.probarConexionDesarrollo();
      
      if (resultado.exito) {
        setMensaje(`✅ ${resultado.mensaje}`);
        setTipoMensaje('success');
      } else {
        setMensaje(`❌ ${resultado.mensaje}`);
        setTipoMensaje('error');
      }
    } catch (error: any) {
      setMensaje(`❌ Error: ${error.message}`);
      setTipoMensaje('error');
    } finally {
      setProbandoConexion(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Gestión de Certificados de Producción AFIP
          </h1>

          {/* Información del modo actual */}
          {infoModo && (
            <div className={`mb-6 p-4 rounded-lg border ${
              infoModo.modo === 'desarrollo' 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-medium ${
                    infoModo.modo === 'desarrollo' ? 'text-blue-800' : 'text-green-800'
                  }`}>
                    Modo Actual: {infoModo.modo === 'desarrollo' ? '🧪 Desarrollo' : '🚀 Producción'}
                  </h3>
                  <p className={`text-sm ${
                    infoModo.modo === 'desarrollo' ? 'text-blue-700' : 'text-green-700'
                  }`}>
                    CUIT: {infoModo.cuit.toString().replace(/(\d{2})(\d{8})(\d{1})/, '$1-$2-$3')}
                  </p>
                  <p className={`text-sm ${
                    infoModo.modo === 'desarrollo' ? 'text-blue-700' : 'text-green-700'
                  }`}>
                    {infoModo.descripcion}
                  </p>
                </div>
                {infoModo.modo === 'desarrollo' && (
                  <button
                    onClick={probarConexionAFIP}
                    disabled={probandoConexion}
                    className={`px-4 py-2 rounded-md font-medium ${
                      probandoConexion
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    }`}
                  >
                    {probandoConexion ? 'Probando...' : 'Probar Conexión'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Mensaje de estado */}
          {mensaje && (
            <div className={`mb-6 p-4 rounded-lg ${
              tipoMensaje === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
              tipoMensaje === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
              'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {mensaje}
            </div>
          )}

          {/* Formulario para crear certificado */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Crear Nuevo Certificado
            </h2>
            
            {/* Selector de tipo de certificado */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Certificado
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="desarrollo"
                    checked={tipoCertificado === 'desarrollo'}
                    onChange={(e) => setTipoCertificado(e.target.value as 'desarrollo' | 'produccion')}
                    className="mr-2"
                  />
                  <span className="text-sm">🧪 Desarrollo</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="produccion"
                    checked={tipoCertificado === 'produccion'}
                    onChange={(e) => setTipoCertificado(e.target.value as 'desarrollo' | 'produccion')}
                    className="mr-2"
                  />
                  <span className="text-sm">🚀 Producción</span>
                </label>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CUIT *
                </label>
                <input
                  type="text"
                  name="cuit"
                  value={tipoCertificado === 'desarrollo' ? parametrosDesarrollo.cuit : parametros.cuit}
                  onChange={tipoCertificado === 'desarrollo' ? handleInputChangeDesarrollo : handleInputChange}
                  placeholder={tipoCertificado === 'desarrollo' ? '20111111112' : '20123456789'}
                  maxLength={11}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username (CUIT para login) *
                </label>
                <input
                  type="text"
                  name="username"
                  value={tipoCertificado === 'desarrollo' ? parametrosDesarrollo.username : parametros.username}
                  onChange={tipoCertificado === 'desarrollo' ? handleInputChangeDesarrollo : handleInputChange}
                  placeholder={tipoCertificado === 'desarrollo' ? '20111111112' : '20123456789'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña ARCA *
                </label>
                <input
                  type="password"
                  name="password"
                  value={tipoCertificado === 'desarrollo' ? parametrosDesarrollo.password : parametros.password}
                  onChange={tipoCertificado === 'desarrollo' ? handleInputChangeDesarrollo : handleInputChange}
                  placeholder="Tu contraseña de ARCA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alias del Certificado *
                </label>
                <input
                  type="text"
                  name="alias"
                  value={tipoCertificado === 'desarrollo' ? parametrosDesarrollo.alias : parametros.alias}
                  onChange={tipoCertificado === 'desarrollo' ? handleInputChangeDesarrollo : handleInputChange}
                  placeholder={tipoCertificado === 'desarrollo' ? 'mi-certificado-dev' : 'mi-certificado-prod'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={crearCertificado}
                disabled={cargando}
                className={`px-6 py-2 rounded-md font-medium ${
                  cargando
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : tipoCertificado === 'desarrollo'
                    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500'
                }`}
              >
                {cargando 
                  ? 'Creando Certificado...' 
                  : `Crear Certificado ${tipoCertificado === 'desarrollo' ? 'de Desarrollo' : 'de Producción'}`
                }
              </button>
            </div>
          </div>

          {/* Lista de certificados existentes */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Certificados Guardados ({certificados.length})
            </h2>
            
            {certificados.length === 0 ? (
              <p className="text-gray-500 italic">No hay certificados guardados</p>
            ) : (
              <div className="space-y-3">
                {certificados.map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{cert.alias}</h3>
                      <p className="text-sm text-gray-600">
                        Creado: {formatearFecha(cert.fechaCreacion)}
                      </p>
                      <p className="text-xs text-gray-500">ID: {cert.id}</p>
                    </div>
                    <button
                      onClick={() => eliminarCertificado(cert.alias)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mostrar certificado creado */}
          {mostrarCertificado && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Certificado Creado Exitosamente
              </h2>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">Detalles del Certificado:</h3>
                <p className="text-sm text-green-700 mb-2">
                  <strong>ID:</strong> {mostrarCertificado.id}
                </p>
                <p className="text-sm text-green-700 mb-2">
                  <strong>Estado:</strong> {mostrarCertificado.status}
                </p>
                
                <div className="mt-4">
                  <h4 className="font-medium text-green-800 mb-2">Certificado:</h4>
                  <textarea
                    value={mostrarCertificado.data.cert}
                    readOnly
                    className="w-full h-32 px-3 py-2 border border-green-300 rounded-md bg-white text-xs font-mono"
                  />
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium text-green-800 mb-2">Clave Privada:</h4>
                  <textarea
                    value={mostrarCertificado.data.key}
                    readOnly
                    className="w-full h-32 px-3 py-2 border border-green-300 rounded-md bg-white text-xs font-mono"
                  />
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={() => setMostrarCertificado(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Información importante */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">⚠️ Información Importante:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• <strong>Modo Desarrollo:</strong> Usa CUIT 20-40937847-2 sin necesidad de certificado digital</li>
              <li>• <strong>Modo Producción:</strong> Requiere certificado digital válido para obtener TA</li>
              <li>• Los certificados se guardan localmente en tu navegador</li>
              <li>• Asegúrate de tener una copia de seguridad de tus certificados</li>
              <li>• Los certificados de producción tienen validez limitada</li>
              <li>• Necesitas configurar la variable de entorno VITE_AFIP_SDK_API_KEY</li>
              <li>• Los certificados se crean automáticamente en el servidor de AFIP SDK</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificadoProduccionPage;
