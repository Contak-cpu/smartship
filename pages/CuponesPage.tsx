import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';

interface Cupon {
  id: string;
  codigo: string;
  descripcion: string;
  descuento: string;
  activo: boolean;
}

const CuponesPage: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const cupones: Cupon[] = [
    {
      id: '1',
      codigo: 'S054-CACOMERCIORE30%',
      descripcion: 'Cupón de descuento para comercios',
      descuento: '30% OFF',
      activo: true,
    },
    {
      id: '2',
      codigo: 'S051-CUPONESTARAL30%',
      descripcion: 'Cupón especial Star',
      descuento: '30% OFF',
      activo: true,
    },
  ];

  const copyToClipboard = async (codigo: string, index: number) => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiedIndex(index);
      
      // Resetear después de 2 segundos
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Cupones de Descuento
            </h1>
            <p className="text-gray-400 text-lg">
              Obtén descuentos exclusivos para Andreani. Copia tus códigos activos y utilízalos al cargar tus rótulos en Andreani para obtener desde un 20% hasta un 40% de descuento.
            </p>
          </div>

          {/* Cupones Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cupones.map((cupon, index) => (
              <div
                key={cupon.id}
                className="bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-500/30 rounded-2xl p-8 hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300"
              >
                {/* Badge de Descuento */}
                <div className="flex items-start justify-between mb-6">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg">
                    {cupon.descuento}
                  </div>
                  {cupon.activo && (
                    <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-medium">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Activo
                    </div>
                  )}
                </div>

                {/* Código del Cupón */}
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2 font-medium">Código del Cupón</p>
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 flex items-center justify-between gap-4">
                    <code className="text-green-400 font-mono text-lg font-bold">
                      {cupon.codigo}
                    </code>
                    <button
                      onClick={() => copyToClipboard(cupon.codigo, index)}
                      className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        copiedIndex === index
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      {copiedIndex === index ? (
                        <>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Copiado
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copiar
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Descripción */}
                <div className="border-t border-gray-700 pt-4">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {cupon.descripcion}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Información adicional */}
          <div className="mt-10 bg-gradient-to-br from-gray-800/80 to-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <div className="flex items-start gap-5">
              <div className="text-green-500 flex-shrink-0">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-3">
                  💡 ¿Cómo usar los cupones?
                </h3>
                <p className="text-gray-300 text-base leading-relaxed mb-4">
                  Copia el código del cupón haciendo clic en el botón "Copiar" y utilízalo 
                  al momento de cargar tus rótulos en la plataforma de Andreani. Los cupones te permiten 
                  obtener descuentos que van desde el 20% hasta el 40% en el costo de tus envíos.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                    <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-gray-300 text-sm">Descuentos del 20% al 40%</p>
                  </div>
                  <div className="flex items-center gap-3 bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                    <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-gray-300 text-sm">Válido al cargar rótulos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CuponesPage;

