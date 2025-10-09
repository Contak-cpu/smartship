import { useState, useEffect } from 'react';

interface FormData {
  facturacion: string;
  ingresoReal: string;
  cantidadVentas: string;
  cantidadProductos: string;
  gastosStock: string;
  gastosEnvio: string;
  gastosMetaAds: string;
  gastosTiktokAds: string;
  gastosGoogleAds: string;
}

interface Resultados {
  totalGastos: number;
  totalAlBolsillo: number;
  rentabilidadPorcentaje: number;
  margenNeto: number;
}

interface HistorialItem {
  id: string;
  fecha: string;
  hora: string;
  facturacion: number;
  ingresoReal: number;
  totalGastos: number;
  totalAlBolsillo: number;
  rentabilidadPorcentaje: number;
  cantidadVentas: number;
  cantidadProductos: number;
}

type MonedaAds = 'ARS' | 'USDT';

const RentabilidadCalculator = () => {
  const [formData, setFormData] = useState<FormData>({
    facturacion: '',
    ingresoReal: '',
    cantidadVentas: '',
    cantidadProductos: '',
    gastosStock: '',
    gastosEnvio: '',
    gastosMetaAds: '',
    gastosTiktokAds: '',
    gastosGoogleAds: '',
  });

  const [monedaMeta, setMonedaMeta] = useState<MonedaAds>('ARS');
  const [monedaTiktok, setMonedaTiktok] = useState<MonedaAds>('ARS');
  const [monedaGoogle, setMonedaGoogle] = useState<MonedaAds>('ARS');
  const [cotizacionUSDT, setCotizacionUSDT] = useState<string>('1100');

  const [resultados, setResultados] = useState<Resultados | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);

  // Cargar historial desde localStorage al iniciar
  useEffect(() => {
    const savedHistorial = localStorage.getItem('rentabilidad_historial');
    if (savedHistorial) {
      try {
        setHistorial(JSON.parse(savedHistorial));
      } catch (e) {
        console.error('Error al cargar historial:', e);
      }
    }
  }, []);

  // Guardar historial en localStorage cuando cambie
  useEffect(() => {
    if (historial.length > 0) {
      localStorage.setItem('rentabilidad_historial', JSON.stringify(historial));
    }
  }, [historial]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    // Permitir solo números y punto decimal
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const convertirARS = (monto: number, moneda: MonedaAds): number => {
    if (moneda === 'USDT') {
      return monto * parseFloat(cotizacionUSDT || '0');
    }
    return monto;
  };

  const calcularRentabilidad = () => {
    const facturacion = parseFloat(formData.facturacion) || 0;
    const ingresoReal = parseFloat(formData.ingresoReal) || 0;
    const gastosStock = parseFloat(formData.gastosStock) || 0;
    const gastosEnvio = parseFloat(formData.gastosEnvio) || 0;

    // Convertir gastos de ADS a ARS según la moneda seleccionada
    const gastosMetaARS = convertirARS(parseFloat(formData.gastosMetaAds) || 0, monedaMeta);
    const gastosTiktokARS = convertirARS(parseFloat(formData.gastosTiktokAds) || 0, monedaTiktok);
    const gastosGoogleARS = convertirARS(parseFloat(formData.gastosGoogleAds) || 0, monedaGoogle);

    // Validar que al menos un gasto de ADS esté ingresado
    const tieneGastosAds = gastosMetaARS > 0 || gastosTiktokARS > 0 || gastosGoogleARS > 0;

    if (!tieneGastosAds) {
      alert('Debes ingresar al menos un gasto en publicidad (Meta, TikTok o Google ADS)');
      return;
    }

    if (facturacion === 0 || ingresoReal === 0) {
      alert('Debes ingresar la facturación e ingreso real del día');
      return;
    }

    const totalGastosAds = gastosMetaARS + gastosTiktokARS + gastosGoogleARS;
    const totalGastos = gastosStock + gastosEnvio + totalGastosAds;
    const totalAlBolsillo = ingresoReal - totalGastos;
    const rentabilidadPorcentaje = (totalAlBolsillo / facturacion) * 100;
    const margenNeto = totalAlBolsillo;

    const resultadosCalculados = {
      totalGastos,
      totalAlBolsillo,
      rentabilidadPorcentaje,
      margenNeto,
    };

    setResultados(resultadosCalculados);
    setShowResults(true);

    // Agregar al historial
    const now = new Date();
    const nuevoItem: HistorialItem = {
      id: now.getTime().toString(),
      fecha: now.toLocaleDateString('es-AR'),
      hora: now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      facturacion,
      ingresoReal,
      totalGastos,
      totalAlBolsillo,
      rentabilidadPorcentaje,
      cantidadVentas: parseFloat(formData.cantidadVentas) || 0,
      cantidadProductos: parseFloat(formData.cantidadProductos) || 0,
    };

    setHistorial(prev => [nuevoItem, ...prev]);
  };

  const limpiarFormulario = () => {
    setFormData({
      facturacion: '',
      ingresoReal: '',
      cantidadVentas: '',
      cantidadProductos: '',
      gastosStock: '',
      gastosEnvio: '',
      gastosMetaAds: '',
      gastosTiktokAds: '',
      gastosGoogleAds: '',
    });
    setResultados(null);
    setShowResults(false);
  };

  const limpiarHistorial = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar todo el historial?')) {
      setHistorial([]);
      localStorage.removeItem('rentabilidad_historial');
    }
  };

  const eliminarItemHistorial = (id: string) => {
    setHistorial(prev => prev.filter(item => item.id !== id));
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <header className="text-center mb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-green-500 size-10">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Calculadora de Rentabilidad
            </h1>
          </div>
          <p className="text-green-400 font-medium text-sm sm:text-base">
            Analiza la rentabilidad diaria de tu ecommerce
          </p>
        </header>

        {/* Cotización USDT */}
        <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cotización USDT → ARS
          </label>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">1 USDT =</span>
            <input
              type="text"
              value={cotizacionUSDT}
              onChange={(e) => {
                if (e.target.value === '' || /^\d*\.?\d*$/.test(e.target.value)) {
                  setCotizacionUSDT(e.target.value);
                }
              }}
              className="flex-1 p-2 border rounded-lg bg-gray-600 text-white border-gray-500 focus:border-green-500 focus:outline-none"
              placeholder="1100"
            />
            <span className="text-gray-400 text-sm">ARS</span>
          </div>
        </div>

        {/* Formulario en grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna Izquierda - Ingresos */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-green-400 border-b border-gray-600 pb-2">
              📈 Ingresos del Día
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Facturación del Día (ARS) *
              </label>
              <input
                type="text"
                value={formData.facturacion}
                onChange={(e) => handleInputChange('facturacion', e.target.value)}
                className="w-full p-3 border rounded-lg bg-gray-700 text-white border-gray-600 focus:border-green-500 focus:outline-none"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ingreso Real del Día (ARS) *
              </label>
              <input
                type="text"
                value={formData.ingresoReal}
                onChange={(e) => handleInputChange('ingresoReal', e.target.value)}
                className="w-full p-3 border rounded-lg bg-gray-700 text-white border-gray-600 focus:border-green-500 focus:outline-none"
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cantidad de Ventas
                </label>
                <input
                  type="text"
                  value={formData.cantidadVentas}
                  onChange={(e) => handleInputChange('cantidadVentas', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-gray-700 text-white border-gray-600 focus:border-green-500 focus:outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cantidad de Productos
                </label>
                <input
                  type="text"
                  value={formData.cantidadProductos}
                  onChange={(e) => handleInputChange('cantidadProductos', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-gray-700 text-white border-gray-600 focus:border-green-500 focus:outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Columna Derecha - Gastos */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-red-400 border-b border-gray-600 pb-2">
              📉 Gastos del Día
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Gastos en Stock (ARS)
              </label>
              <input
                type="text"
                value={formData.gastosStock}
                onChange={(e) => handleInputChange('gastosStock', e.target.value)}
                className="w-full p-3 border rounded-lg bg-gray-700 text-white border-gray-600 focus:border-green-500 focus:outline-none"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Gastos en Envío (ARS)
              </label>
              <input
                type="text"
                value={formData.gastosEnvio}
                onChange={(e) => handleInputChange('gastosEnvio', e.target.value)}
                className="w-full p-3 border rounded-lg bg-gray-700 text-white border-gray-600 focus:border-green-500 focus:outline-none"
                placeholder="0.00"
              />
            </div>

            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
              <h4 className="text-sm font-bold text-blue-400 mb-3">💰 Gastos en Publicidad (mínimo uno requerido)</h4>

              {/* Meta ADS */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Meta ADS
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.gastosMetaAds}
                    onChange={(e) => handleInputChange('gastosMetaAds', e.target.value)}
                    className="flex-1 p-2 border rounded-lg bg-gray-600 text-white border-gray-500 focus:border-green-500 focus:outline-none"
                    placeholder="0.00"
                  />
                  <select
                    value={monedaMeta}
                    onChange={(e) => setMonedaMeta(e.target.value as MonedaAds)}
                    className="p-2 border rounded-lg bg-gray-600 text-white border-gray-500 focus:border-green-500 focus:outline-none"
                  >
                    <option value="ARS">ARS</option>
                    <option value="USDT">USDT</option>
                  </select>
                </div>
              </div>

              {/* TikTok ADS */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  TikTok ADS
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.gastosTiktokAds}
                    onChange={(e) => handleInputChange('gastosTiktokAds', e.target.value)}
                    className="flex-1 p-2 border rounded-lg bg-gray-600 text-white border-gray-500 focus:border-green-500 focus:outline-none"
                    placeholder="0.00"
                  />
                  <select
                    value={monedaTiktok}
                    onChange={(e) => setMonedaTiktok(e.target.value as MonedaAds)}
                    className="p-2 border rounded-lg bg-gray-600 text-white border-gray-500 focus:border-green-500 focus:outline-none"
                  >
                    <option value="ARS">ARS</option>
                    <option value="USDT">USDT</option>
                  </select>
                </div>
              </div>

              {/* Google ADS */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Google ADS
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.gastosGoogleAds}
                    onChange={(e) => handleInputChange('gastosGoogleAds', e.target.value)}
                    className="flex-1 p-2 border rounded-lg bg-gray-600 text-white border-gray-500 focus:border-green-500 focus:outline-none"
                    placeholder="0.00"
                  />
                  <select
                    value={monedaGoogle}
                    onChange={(e) => setMonedaGoogle(e.target.value as MonedaAds)}
                    className="p-2 border rounded-lg bg-gray-600 text-white border-gray-500 focus:border-green-500 focus:outline-none"
                  >
                    <option value="ARS">ARS</option>
                    <option value="USDT">USDT</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={calcularRentabilidad}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-150 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Calcular Rentabilidad
          </button>

          <button
            onClick={limpiarFormulario}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-150 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Limpiar
          </button>
        </div>

        {/* Resultados */}
        {showResults && resultados && (
          <div className="bg-gradient-to-br from-green-900/50 to-gray-700 p-6 rounded-2xl border-2 border-green-500 space-y-4 animate-fadeIn">
            <h3 className="text-2xl font-bold text-white text-center mb-4 flex items-center justify-center gap-2">
              <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Resultados del Análisis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Total Gastos */}
              <div className="bg-gray-800/80 p-4 rounded-lg border border-red-500/50">
                <p className="text-sm text-gray-400 mb-1">Total Gastos</p>
                <p className="text-2xl font-bold text-red-400">{formatCurrency(resultados.totalGastos)}</p>
              </div>

              {/* Total al Bolsillo */}
              <div className="bg-gray-800/80 p-4 rounded-lg border border-green-500/50">
                <p className="text-sm text-gray-400 mb-1">Total al Bolsillo</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(resultados.totalAlBolsillo)}</p>
              </div>

              {/* Rentabilidad % */}
              <div className="bg-gray-800/80 p-4 rounded-lg border border-blue-500/50">
                <p className="text-sm text-gray-400 mb-1">Rentabilidad (%)</p>
                <p className={`text-3xl font-bold ${resultados.rentabilidadPorcentaje >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {resultados.rentabilidadPorcentaje.toFixed(2)}%
                </p>
              </div>

              {/* Margen Neto */}
              <div className="bg-gray-800/80 p-4 rounded-lg border border-purple-500/50">
                <p className="text-sm text-gray-400 mb-1">Margen Neto</p>
                <p className={`text-2xl font-bold ${resultados.margenNeto >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(resultados.margenNeto)}
                </p>
              </div>
            </div>

            {/* Análisis adicional */}
            <div className="bg-gray-800/80 p-4 rounded-lg border border-yellow-500/50">
              <p className="text-sm font-medium text-yellow-400 mb-2">📊 Análisis:</p>
              <p className="text-sm text-gray-300">
                {resultados.rentabilidadPorcentaje >= 30
                  ? '✅ Excelente rentabilidad. Tu negocio está muy bien optimizado.'
                  : resultados.rentabilidadPorcentaje >= 15
                  ? '👍 Buena rentabilidad. Hay margen para mejorar los gastos.'
                  : resultados.rentabilidadPorcentaje >= 5
                  ? '⚠️ Rentabilidad baja. Considera optimizar gastos publicitarios.'
                  : '❌ Rentabilidad crítica. Revisa urgentemente tu estructura de costos.'}
              </p>
            </div>
          </div>
        )}

        {/* Historial de cálculos */}
        {historial.length > 0 && (
          <div className="bg-gray-700 rounded-2xl p-6 border border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Historial de Cálculos
              </h3>
              <button
                onClick={limpiarHistorial}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Limpiar Historial
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {historial.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-gray-800/80 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-600 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-sm">
                        {historial.length - index}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">
                          {item.fecha} - {item.hora}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => eliminarItemHistorial(item.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                      title="Eliminar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-700/50 rounded p-2">
                      <p className="text-xs text-gray-400 mb-1">Facturación</p>
                      <p className="text-sm font-bold text-white">{formatCurrency(item.facturacion)}</p>
                    </div>
                    <div className="bg-gray-700/50 rounded p-2">
                      <p className="text-xs text-gray-400 mb-1">Ingreso Real</p>
                      <p className="text-sm font-bold text-white">{formatCurrency(item.ingresoReal)}</p>
                    </div>
                    <div className="bg-red-900/30 rounded p-2 border border-red-500/30">
                      <p className="text-xs text-gray-400 mb-1">Total Gastos</p>
                      <p className="text-sm font-bold text-red-400">{formatCurrency(item.totalGastos)}</p>
                    </div>
                    <div className="bg-green-900/30 rounded p-2 border border-green-500/30">
                      <p className="text-xs text-gray-400 mb-1">Al Bolsillo</p>
                      <p className="text-sm font-bold text-green-400">{formatCurrency(item.totalAlBolsillo)}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {item.cantidadVentas > 0 && (
                        <span className="text-xs text-gray-400">
                          📦 {item.cantidadVentas} ventas
                        </span>
                      )}
                      {item.cantidadProductos > 0 && (
                        <span className="text-xs text-gray-400">
                          📊 {item.cantidadProductos} productos
                        </span>
                      )}
                    </div>
                    <div className={`text-lg font-bold ${item.rentabilidadPorcentaje >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {item.rentabilidadPorcentaje.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="text-center mt-6 text-gray-500 text-xs sm:text-sm">
          <p>Calculadora de Rentabilidad para Ecommerce</p>
          <p className="mt-1 text-gray-600">by pictoN</p>
        </footer>
      </div>
    </div>
  );
};

export default RentabilidadCalculator;

