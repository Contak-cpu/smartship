import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface FormData {
  valorDolar: string;
  producto: string;
  envio: string;
  fulfillment: string;
  comisionCuotas: string;
  comisionRetirar: string;
  comisionTN: string;
  comisionIB: string;
  cpaEstimado: string;
  precioVenta: string;
  targetProfitPorcentaje: string;
}

interface GastoPersonalizado {
  id: string;
  nombre: string;
  monto: string;
}

interface Resultados {
  // Valores en pesos
  productoPesos: number;
  envioPesos: number;
  fulfillmentPesos: number;
  totalComisionesPesos: number;
  cpaEstimadoPesos: number;
  precioVentaPesos: number;
  gastosPersonalizadosPesos: number;
  
  // Valores en USD
  productoUSD: number;
  envioUSD: number;
  fulfillmentUSD: number;
  totalComisionesUSD: number;
  cpaEstimadoUSD: number;
  precioVentaUSD: number;
  gastosPersonalizadosUSD: number;
  
  // Porcentajes
  porcentajeComisionesTotal: number;
  
  // Costos totales
  totalCostosConCPA: number;
  totalCostosConCPAUSD: number;
  costosSinCPA: number;
  costosSinCPAUSD: number;
  
  // Rentabilidad
  utilidadNeta: number;
  utilidadNetaUSD: number;
  cpaBreakeven: number;
  cpaBreakevenUSD: number;
  cpaObjetivo: number;
  cpaObjetivoUSD: number;
  
  // ROAS
  roasBreakeven: number;
  roasObjetivo: number;
  
  // Target Profit
  targetProfitPesos: number;
  targetProfitUSD: number;
}

interface HistorialItem {
  id: string;
  fecha: string;
  hora: string;
  valorDolar: number;
  precioVenta: number;
  utilidadNeta: number;
  roasObjetivo: number;
  cpaObjetivo: number;
  targetProfitPorcentaje: number;
}

const BreakevenROASCalculator = () => {
  const { userLevel } = useAuth();
  const isGuest = userLevel === 0;
  
  const [formData, setFormData] = useState<FormData>({
    valorDolar: '1440',
    producto: '26000',
    envio: '6000',
    fulfillment: '1000',
    comisionCuotas: '15.35',
    comisionRetirar: '6.30',
    comisionTN: '1.5',
    comisionIB: '3.5',
    cpaEstimado: '10000',
    precioVenta: '99990',
    targetProfitPorcentaje: '20',
  });

  const [gastosPersonalizados, setGastosPersonalizados] = useState<GastoPersonalizado[]>([]);
  const [nuevoGastoNombre, setNuevoGastoNombre] = useState('');
  const [nuevoGastoMonto, setNuevoGastoMonto] = useState('');

  const [resultados, setResultados] = useState<Resultados | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [comisionesExpanded, setComisionesExpanded] = useState(false);

  // Cargar historial desde localStorage al iniciar
  useEffect(() => {
    const savedHistorial = localStorage.getItem('breakeven_historial');
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
      localStorage.setItem('breakeven_historial', JSON.stringify(historial));
    }
  }, [historial]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    // Permitir solo números y punto decimal
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const agregarGastoPersonalizado = () => {
    if (nuevoGastoNombre.trim() === '' || nuevoGastoMonto === '') {
      alert('Por favor completa el nombre y monto del gasto');
      return;
    }

    if (parseFloat(nuevoGastoMonto) <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    const nuevoGasto: GastoPersonalizado = {
      id: Date.now().toString(),
      nombre: nuevoGastoNombre.trim(),
      monto: nuevoGastoMonto,
    };

    setGastosPersonalizados(prev => [...prev, nuevoGasto]);
    setNuevoGastoNombre('');
    setNuevoGastoMonto('');
  };

  const eliminarGastoPersonalizado = (id: string) => {
    setGastosPersonalizados(prev => prev.filter(gasto => gasto.id !== id));
  };

  const calcularTotalGastosPersonalizados = (): number => {
    return gastosPersonalizados.reduce((total, gasto) => {
      return total + (parseFloat(gasto.monto) || 0);
    }, 0);
  };

  const calcularBreakevenROAS = () => {
    // Obtener valores del formulario
    const valorDolar = parseFloat(formData.valorDolar) || 0;
    const producto = parseFloat(formData.producto) || 0;
    const envio = parseFloat(formData.envio) || 0;
    const fulfillment = parseFloat(formData.fulfillment) || 0;
    const cpaEstimado = parseFloat(formData.cpaEstimado) || 0;
    const precioVenta = parseFloat(formData.precioVenta) || 0;
    const targetProfitPorcentaje = parseFloat(formData.targetProfitPorcentaje) || 0;

    // Comisiones
    const comisionCuotas = parseFloat(formData.comisionCuotas) || 0;
    const comisionRetirar = parseFloat(formData.comisionRetirar) || 0;
    const comisionTN = parseFloat(formData.comisionTN) || 0;
    const comisionIB = parseFloat(formData.comisionIB) || 0;

    // Gastos personalizados
    const gastosPersonalizadosPesos = calcularTotalGastosPersonalizados();

    // Validaciones
    if (valorDolar === 0) {
      alert('Debes ingresar el valor del dólar');
      return;
    }

    if (producto === 0 || precioVenta === 0) {
      alert('Debes ingresar al menos el costo del producto y el precio de venta');
      return;
    }

    // Calcular porcentaje total de comisiones
    const porcentajeComisionesTotal = comisionCuotas + comisionRetirar + comisionTN + comisionIB;
    
    // Calcular comisiones en pesos basado en precio de venta
    const totalComisionesPesos = precioVenta * (porcentajeComisionesTotal / 100);

    // Convertir a USD
    const productoUSD = producto / valorDolar;
    const envioUSD = envio / valorDolar;
    const fulfillmentUSD = fulfillment / valorDolar;
    const totalComisionesUSD = totalComisionesPesos / valorDolar;
    const cpaEstimadoUSD = cpaEstimado / valorDolar;
    const precioVentaUSD = precioVenta / valorDolar;
    const gastosPersonalizadosUSD = gastosPersonalizadosPesos / valorDolar;

    // Calcular costos
    const costosSinCPA = producto + envio + fulfillment + totalComisionesPesos + gastosPersonalizadosPesos;
    const costosSinCPAUSD = costosSinCPA / valorDolar;
    
    const totalCostosConCPA = costosSinCPA + cpaEstimado;
    const totalCostosConCPAUSD = totalCostosConCPA / valorDolar;

    // Calcular utilidad neta
    const utilidadNeta = precioVenta - totalCostosConCPA;
    const utilidadNetaUSD = utilidadNeta / valorDolar;

    // Calcular CPA Breakeven (Margen Bruto)
    const cpaBreakeven = precioVenta - costosSinCPA;
    const cpaBreakevenUSD = cpaBreakeven / valorDolar;

    // Calcular Target Profit
    const targetProfitPesos = precioVenta * (targetProfitPorcentaje / 100);
    const targetProfitUSD = targetProfitPesos / valorDolar;

    // Calcular CPA Objetivo
    const cpaObjetivo = precioVenta * (targetProfitPorcentaje / 100);
    const cpaObjetivoUSD = cpaObjetivo / valorDolar;

    // Calcular ROAS
    const roasBreakeven = cpaBreakeven > 0 ? precioVenta / cpaBreakeven : 0;
    const roasObjetivo = cpaObjetivo > 0 ? precioVenta / (precioVenta - costosSinCPA - cpaObjetivo) : 0;

    const resultadosCalculados: Resultados = {
      productoPesos: producto,
      envioPesos: envio,
      fulfillmentPesos: fulfillment,
      totalComisionesPesos,
      cpaEstimadoPesos: cpaEstimado,
      precioVentaPesos: precioVenta,
      gastosPersonalizadosPesos,
      
      productoUSD,
      envioUSD,
      fulfillmentUSD,
      totalComisionesUSD,
      cpaEstimadoUSD,
      precioVentaUSD,
      gastosPersonalizadosUSD,
      
      porcentajeComisionesTotal,
      
      totalCostosConCPA,
      totalCostosConCPAUSD,
      costosSinCPA,
      costosSinCPAUSD,
      
      utilidadNeta,
      utilidadNetaUSD,
      cpaBreakeven,
      cpaBreakevenUSD,
      cpaObjetivo,
      cpaObjetivoUSD,
      
      roasBreakeven,
      roasObjetivo,
      
      targetProfitPesos,
      targetProfitUSD,
    };

    setResultados(resultadosCalculados);
    setShowResults(true);

    // Agregar al historial
    const now = new Date();
    const nuevoItem: HistorialItem = {
      id: now.getTime().toString(),
      fecha: now.toLocaleDateString('es-AR'),
      hora: now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      valorDolar,
      precioVenta,
      utilidadNeta,
      roasObjetivo,
      cpaObjetivo,
      targetProfitPorcentaje,
    };

    setHistorial(prev => [nuevoItem, ...prev]);
  };

  const limpiarFormulario = () => {
    setFormData({
      valorDolar: '1440',
      producto: '26000',
      envio: '6000',
      fulfillment: '1000',
      comisionCuotas: '15.35',
      comisionRetirar: '6.30',
      comisionTN: '1.5',
      comisionIB: '3.5',
      cpaEstimado: '10000',
      precioVenta: '99990',
      targetProfitPorcentaje: '20',
    });
    setGastosPersonalizados([]);
    setNuevoGastoNombre('');
    setNuevoGastoMonto('');
    setResultados(null);
    setShowResults(false);
  };

  const limpiarHistorial = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar todo el historial?')) {
      setHistorial([]);
      localStorage.removeItem('breakeven_historial');
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

  const formatUSD = (value: number): string => {
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="w-full max-w-7xl mx-auto bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 space-y-6 border border-gray-700/50">
        {/* Banner de invitado */}
        {isGuest && (
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-2 border-blue-500/50 rounded-lg p-3">
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-white font-semibold text-sm">
                Utilizando como usuario invitado
              </p>
              <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-bold border border-yellow-500/30">
                Acceso Limitado
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="text-blue-500 size-8">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Calculadora de Breakeven y ROAS
            </h1>
          </div>
          <p className="text-blue-400 font-medium text-sm">
            Calcula tu punto de equilibrio y ROAS objetivo
          </p>
        </header>

        {/* Valor Dólar - Destacado */}
        <div className="bg-yellow-900/20 p-4 rounded-lg border border-yellow-500/50">
          <label className="block text-sm font-medium text-yellow-300 mb-2">
            💵 Valor Dólar al Día (ARS) *
          </label>
          <input
            type="text"
            value={formData.valorDolar}
            onChange={(e) => handleInputChange('valorDolar', e.target.value)}
            className="w-full p-3 border rounded-lg bg-gray-700 text-white border-gray-600 focus:border-blue-500 focus:outline-none font-bold text-lg"
            placeholder="1440"
          />
        </div>

        {/* Formulario en 2 columnas balanceadas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna Izquierda - Configuración Base */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white border-b border-gray-600 pb-2">
              ⚙️ Configuración Base
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Producto (ARS) *
                </label>
                <input
                  type="text"
                  value={formData.producto}
                  onChange={(e) => handleInputChange('producto', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-gray-700 text-white border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="26000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Envío (ARS)
                </label>
                <input
                  type="text"
                  value={formData.envio}
                  onChange={(e) => handleInputChange('envio', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-gray-700 text-white border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="6000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fulfillment (ARS)
                </label>
                <input
                  type="text"
                  value={formData.fulfillment}
                  onChange={(e) => handleInputChange('fulfillment', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-gray-700 text-white border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="1000"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Costo de despacho (bolsas, cinta, etc.)
                </p>
              </div>
            </div>

            {/* Gastos Personalizados */}
            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
              <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                💼 Gastos Personalizados
              </h4>
              <p className="text-xs text-gray-400 mb-3">
                Agrega gastos adicionales como logística, empleados, alquiler, etc.
              </p>

              <div className="space-y-2 mb-3">
                <input
                  type="text"
                  value={nuevoGastoNombre}
                  onChange={(e) => setNuevoGastoNombre(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-gray-600 text-white border-gray-500 focus:border-blue-500 focus:outline-none text-sm"
                  placeholder="Ej: Logística privada"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && nuevoGastoMonto) {
                      agregarGastoPersonalizado();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nuevoGastoMonto}
                    onChange={(e) => {
                      if (e.target.value === '' || /^\d*\.?\d*$/.test(e.target.value)) {
                        setNuevoGastoMonto(e.target.value);
                      }
                    }}
                    className="flex-1 p-2 border rounded-lg bg-gray-600 text-white border-gray-500 focus:border-blue-500 focus:outline-none text-sm"
                    placeholder="Monto (ARS)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && nuevoGastoNombre) {
                        agregarGastoPersonalizado();
                      }
                    }}
                  />
                  <button
                    onClick={agregarGastoPersonalizado}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    Agregar
                  </button>
                </div>
              </div>

              {gastosPersonalizados.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {gastosPersonalizados.map((gasto) => (
                    <div
                      key={gasto.id}
                      className="bg-gray-600/50 p-2 rounded-lg border border-gray-500 flex items-center justify-between group hover:border-blue-500/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{gasto.nombre}</p>
                        <p className="text-xs text-blue-400 font-semibold">
                          {formatCurrency(parseFloat(gasto.monto))}
                        </p>
                      </div>
                      <button
                        onClick={() => eliminarGastoPersonalizado(gasto.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
                        title="Eliminar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {gastosPersonalizados.length > 0 && (
                    <div className="bg-blue-900/30 p-2 rounded-lg border border-blue-500/50">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-300">Total:</p>
                        <p className="text-lg font-bold text-blue-400">
                          {formatCurrency(calcularTotalGastosPersonalizados())}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Comisiones - Desplegable */}
            <div className="bg-gray-700/50 rounded-lg border border-gray-600">
              <button
                onClick={() => setComisionesExpanded(!comisionesExpanded)}
                className="w-full p-3 flex items-center justify-between hover:bg-gray-700/70 transition-colors rounded-lg"
              >
                <h4 className="text-xs font-bold text-blue-300 flex items-center gap-2">
                  💰 % Comisiones
                  <span className="text-xs font-normal text-gray-400">
                    (Total: {(
                      parseFloat(formData.comisionCuotas || '0') +
                      parseFloat(formData.comisionRetirar || '0') +
                      parseFloat(formData.comisionTN || '0') +
                      parseFloat(formData.comisionIB || '0')
                    ).toFixed(2)}%)
                  </span>
                </h4>
                <svg
                  className={`w-4 h-4 text-blue-300 transition-transform duration-200 ${
                    comisionesExpanded ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {comisionesExpanded && (
                <div className="px-3 pb-3 space-y-2 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Cuotas (%)
                    </label>
                    <input
                      type="text"
                      value={formData.comisionCuotas}
                      onChange={(e) => handleInputChange('comisionCuotas', e.target.value)}
                      className="w-full p-2 border rounded-lg bg-gray-600 text-white border-gray-500 focus:border-blue-500 focus:outline-none text-xs"
                      placeholder="15.35"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Retirar por el Momento (%)
                    </label>
                    <input
                      type="text"
                      value={formData.comisionRetirar}
                      onChange={(e) => handleInputChange('comisionRetirar', e.target.value)}
                      className="w-full p-2 border rounded-lg bg-gray-600 text-white border-gray-500 focus:border-blue-500 focus:outline-none text-xs"
                      placeholder="6.30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Tarjeta Nacional (TN) (%)
                    </label>
                    <input
                      type="text"
                      value={formData.comisionTN}
                      onChange={(e) => handleInputChange('comisionTN', e.target.value)}
                      className="w-full p-2 border rounded-lg bg-gray-600 text-white border-gray-500 focus:border-blue-500 focus:outline-none text-xs"
                      placeholder="1.5"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Ingresos Brutos (IB) (%)
                    </label>
                    <input
                      type="text"
                      value={formData.comisionIB}
                      onChange={(e) => handleInputChange('comisionIB', e.target.value)}
                      className="w-full p-2 border rounded-lg bg-gray-600 text-white border-gray-500 focus:border-blue-500 focus:outline-none text-xs"
                      placeholder="3.5"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha - Precio, CPA y Target */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white border-b border-gray-600 pb-2">
              🎯 Precio y Objetivos
            </h3>

            <div className="space-y-4">
            <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/50">
              <label className="block text-sm font-medium text-blue-300 mb-2">
                Precio de Venta (ARS) *
              </label>
                <input
                  type="text"
                  value={formData.precioVenta}
                  onChange={(e) => handleInputChange('precioVenta', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-gray-700 text-white border-gray-600 focus:border-blue-500 focus:outline-none font-bold text-lg"
                  placeholder="99990"
                />
              </div>

            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                CPA Estimado (ARS)
              </label>
                <input
                  type="text"
                  value={formData.cpaEstimado}
                  onChange={(e) => handleInputChange('cpaEstimado', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-gray-700 text-white border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="10000"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Costo por Adquisición estimado
                </p>
              </div>

            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Target Profit (%) *
              </label>
                <input
                  type="text"
                  value={formData.targetProfitPorcentaje}
                  onChange={(e) => handleInputChange('targetProfitPorcentaje', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-gray-700 text-white border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="20"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Porcentaje de ganancia objetivo
                </p>
              </div>

              <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                <h4 className="text-sm font-bold text-gray-300 mb-2">💡 Información</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Los valores marcados con * son obligatorios</li>
                  <li>• El CPA Breakeven es tu punto de equilibrio</li>
                  <li>• El ROAS indica cuánto generas por cada peso invertido</li>
                  <li>• Los gastos personalizados se incluyen en los costos base</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={calcularBreakevenROAS}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-150 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Calcular Breakeven y ROAS
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
          <div className="bg-gradient-to-br from-blue-900/50 to-gray-700 p-6 rounded-2xl border-2 border-blue-500 space-y-6 animate-fadeIn">
            <h3 className="text-2xl font-bold text-white text-center mb-4 flex items-center justify-center gap-2">
              <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Resultados del Análisis
            </h3>

            {/* Costos Base */}
            <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-600">
              <h4 className="text-lg font-bold text-white mb-3">📊 Costos Base</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-700/50 p-3 rounded">
                  <p className="text-xs text-gray-400 mb-1">Producto</p>
                  <p className="text-sm font-bold text-white">{formatCurrency(resultados.productoPesos)}</p>
                  <p className="text-xs text-gray-400">{formatUSD(resultados.productoUSD)}</p>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                  <p className="text-xs text-gray-400 mb-1">Envío</p>
                  <p className="text-sm font-bold text-white">{formatCurrency(resultados.envioPesos)}</p>
                  <p className="text-xs text-gray-400">{formatUSD(resultados.envioUSD)}</p>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                  <p className="text-xs text-gray-400 mb-1">Fulfillment</p>
                  <p className="text-sm font-bold text-white">{formatCurrency(resultados.fulfillmentPesos)}</p>
                  <p className="text-xs text-gray-400">{formatUSD(resultados.fulfillmentUSD)}</p>
                </div>
                <div className="bg-gray-700/50 p-3 rounded border border-gray-600">
                  <p className="text-xs text-gray-400 mb-1">% Comisiones</p>
                  <p className="text-sm font-bold text-white">{resultados.porcentajeComisionesTotal.toFixed(2)}%</p>
                  <p className="text-xs text-gray-400">{formatCurrency(resultados.totalComisionesPesos)}</p>
                </div>
                {resultados.gastosPersonalizadosPesos > 0 && (
                  <div className="bg-gray-700/50 p-3 rounded border border-gray-600 col-span-2">
                    <p className="text-xs text-gray-400 mb-1">Gastos Personalizados</p>
                    <p className="text-sm font-bold text-white">{formatCurrency(resultados.gastosPersonalizadosPesos)}</p>
                    <p className="text-xs text-gray-400">{formatUSD(resultados.gastosPersonalizadosUSD)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Costos Totales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-600">
                <p className="text-sm text-gray-400 mb-1">Costos Sin CPA</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(resultados.costosSinCPA)}</p>
                <p className="text-sm text-gray-400">{formatUSD(resultados.costosSinCPAUSD)}</p>
              </div>

              <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-600">
                <p className="text-sm text-gray-400 mb-1">Total Costos con CPA</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(resultados.totalCostosConCPA)}</p>
                <p className="text-sm text-gray-400">{formatUSD(resultados.totalCostosConCPAUSD)}</p>
              </div>
            </div>

            {/* Precio de Venta y Utilidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-600">
                <p className="text-sm text-gray-400 mb-1">Precio de Venta</p>
                <p className="text-2xl font-bold text-blue-400">{formatCurrency(resultados.precioVentaPesos)}</p>
                <p className="text-sm text-gray-400">{formatUSD(resultados.precioVentaUSD)}</p>
              </div>

              <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-600">
                <p className="text-sm text-gray-400 mb-1">Utilidad Neta</p>
                <p className={`text-2xl font-bold ${resultados.utilidadNeta >= 0 ? 'text-blue-400' : 'text-white'}`}>
                  {formatCurrency(resultados.utilidadNeta)}
                </p>
                <p className="text-sm text-gray-400">{formatUSD(resultados.utilidadNetaUSD)}</p>
              </div>
            </div>

            {/* CPA y Target */}
            <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-600">
              <h4 className="text-lg font-bold text-white mb-3">🎯 CPA y Target Profit</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-gray-700/50 p-3 rounded border border-gray-600">
                  <p className="text-xs text-gray-400 mb-1">CPA Breakeven</p>
                  <p className="text-xl font-bold text-blue-400">{formatCurrency(resultados.cpaBreakeven)}</p>
                  <p className="text-xs text-gray-400">{formatUSD(resultados.cpaBreakevenUSD)}</p>
                  <p className="text-xs text-gray-400 mt-1">Tu punto de equilibrio</p>
                </div>
                <div className="bg-gray-700/50 p-3 rounded border border-gray-600">
                  <p className="text-xs text-gray-400 mb-1">CPA Objetivo</p>
                  <p className="text-xl font-bold text-blue-400">{formatCurrency(resultados.cpaObjetivo)}</p>
                  <p className="text-xs text-gray-400">{formatUSD(resultados.cpaObjetivoUSD)}</p>
                  <p className="text-xs text-gray-400 mt-1">Para alcanzar tu target</p>
                </div>
                <div className="bg-gray-700/50 p-3 rounded border border-gray-600">
                  <p className="text-xs text-gray-400 mb-1">Target Profit</p>
                  <p className="text-xl font-bold text-blue-400">{formatCurrency(resultados.targetProfitPesos)}</p>
                  <p className="text-xs text-gray-400">{formatUSD(resultados.targetProfitUSD)}</p>
                  <p className="text-xs text-gray-400 mt-1">{formData.targetProfitPorcentaje}% sobre venta</p>
                </div>
              </div>
            </div>

            {/* ROAS */}
            <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-600">
              <h4 className="text-lg font-bold text-white mb-3">📈 ROAS (Return on Ad Spend)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                  <p className="text-sm text-gray-400 mb-1">ROAS Breakeven</p>
                  <p className="text-4xl font-bold text-blue-400">{resultados.roasBreakeven.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Por cada $1 invertido, necesitas generar ${resultados.roasBreakeven.toFixed(2)} para no perder
                  </p>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                  <p className="text-sm text-gray-400 mb-1">ROAS Objetivo ({formData.targetProfitPorcentaje}%)</p>
                  <p className="text-4xl font-bold text-blue-400">{resultados.roasObjetivo.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Por cada $1 invertido, genera ${resultados.roasObjetivo.toFixed(2)} para tu objetivo
                  </p>
                </div>
              </div>
            </div>

            {/* Análisis */}
            <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-600">
              <p className="text-sm font-medium text-blue-400 mb-2">💡 Análisis y Recomendaciones:</p>
              <div className="space-y-2 text-sm text-gray-300">
                {resultados.utilidadNeta > 0 ? (
                  <p>✅ <strong>Utilidad positiva:</strong> Tu producto es rentable con estos parámetros.</p>
                ) : (
                  <p>❌ <strong>Utilidad negativa:</strong> Necesitas reducir costos o aumentar el precio de venta.</p>
                )}
                
                <p>
                  📊 <strong>CPA máximo:</strong> No gastes más de {formatCurrency(resultados.cpaBreakeven)} por venta para no perder dinero.
                </p>
                
                <p>
                  🎯 <strong>CPA recomendado:</strong> Mantén tu CPA por debajo de {formatCurrency(resultados.cpaObjetivo)} para alcanzar un {formData.targetProfitPorcentaje}% de ganancia.
                </p>
                
                {resultados.roasObjetivo >= 3 ? (
                  <p>⚠️ <strong>ROAS alto:</strong> Necesitas un ROAS de {resultados.roasObjetivo.toFixed(2)}. Esto puede ser desafiante, considera optimizar costos.</p>
                ) : resultados.roasObjetivo >= 2 ? (
                  <p>👍 <strong>ROAS moderado:</strong> Un ROAS de {resultados.roasObjetivo.toFixed(2)} es alcanzable con buenas campañas publicitarias.</p>
                ) : (
                  <p>✅ <strong>ROAS bajo:</strong> Un ROAS de {resultados.roasObjetivo.toFixed(2)} es muy alcanzable. Tienes buenos márgenes.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Historial */}
        {historial.length > 0 && (
          <div className="bg-gray-700 rounded-2xl p-6 border border-gray-600">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Historial de Cálculos
                {isGuest && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-full border border-yellow-500/30">
                    Vista Limitada
                  </span>
                )}
              </h3>
              {!isGuest && (
                <button
                  onClick={limpiarHistorial}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Limpiar Historial
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {historial.map((item, index) => (
                <div
                  key={item.id}
                  className="relative bg-gray-800/80 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
                >
                  {isGuest && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-10">
                      <div className="text-center p-4">
                        <svg className="w-12 h-12 text-yellow-500 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <p className="text-white font-bold text-lg mb-1">
                          Funcionalidad solo disponible para
                        </p>
                        <p className="text-yellow-400 font-bold text-xl mb-3">
                          Plan Starter
                        </p>
                        <p className="text-green-400 font-semibold text-lg">
                          Hazte parte por solo $1
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-sm">
                        {historial.length - index}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">
                          {item.fecha} - {item.hora}
                        </p>
                      </div>
                    </div>
                    {!isGuest && (
                      <button
                        onClick={() => eliminarItemHistorial(item.id)}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                        title="Eliminar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-700/50 rounded p-2">
                      <p className="text-xs text-gray-400 mb-1">Dólar</p>
                      <p className="text-sm font-bold text-white">${item.valorDolar}</p>
                    </div>
                    <div className="bg-gray-700/50 rounded p-2">
                      <p className="text-xs text-gray-400 mb-1">Precio Venta</p>
                      <p className="text-sm font-bold text-white">{formatCurrency(item.precioVenta)}</p>
                    </div>
                    <div className="bg-blue-900/30 rounded p-2 border border-blue-500/30">
                      <p className="text-xs text-gray-400 mb-1">Utilidad Neta</p>
                      <p className="text-sm font-bold text-blue-400">{formatCurrency(item.utilidadNeta)}</p>
                    </div>
                    <div className="bg-blue-900/30 rounded p-2 border border-blue-500/30">
                      <p className="text-xs text-gray-400 mb-1">ROAS Objetivo</p>
                      <p className="text-sm font-bold text-blue-400">{item.roasObjetivo.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      🎯 Target: {item.targetProfitPorcentaje}%
                    </span>
                    <span className="text-xs text-blue-400 font-bold">
                      CPA Max: {formatCurrency(item.cpaObjetivo)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="text-center text-gray-500 text-xs sm:text-sm">
          <p>Calculadora de Breakeven y ROAS para Ecommerce</p>
          <p className="mt-1 text-gray-600">by pictoN</p>
        </footer>
      </div>
    </div>
  );
};

export default BreakevenROASCalculator;
