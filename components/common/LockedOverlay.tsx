import React from 'react';

interface LockedOverlayProps {
  requiredLevel: number;
  sectionName: string;
}

const LockedOverlay: React.FC<LockedOverlayProps> = ({ requiredLevel, sectionName }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="max-w-md mx-4 bg-gray-800 rounded-2xl shadow-2xl border-2 border-yellow-500 p-8 text-center transform animate-fadeIn">
        {/* Icono de candado grande */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <svg
              className="w-24 h-24 text-yellow-500 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full w-8 h-8 flex items-center justify-center">
              <span className="text-gray-900 font-bold text-sm">{requiredLevel}</span>
            </div>
          </div>
        </div>

        {/* Título */}
        <h2 className="text-3xl font-bold text-white mb-3">
          Contenido Bloqueado
        </h2>

        {/* Mensaje */}
        <p className="text-xl text-yellow-400 mb-2 font-semibold">
          {requiredLevel >= 4 ? 'Requiere Pago' : 'Solo disponible para'}
        </p>
        <p className="text-2xl text-yellow-500 font-bold mb-6">
          {requiredLevel === 4 ? 'Plan Pro+' : `Acceso Nivel ${requiredLevel}`}
        </p>

        {/* Sección bloqueada */}
        <div className="bg-gray-700/50 rounded-lg p-4 mb-6 border border-yellow-500/30">
          <p className="text-gray-300 text-sm mb-1">Sección bloqueada:</p>
          <p className="text-white font-bold text-lg">{sectionName}</p>
        </div>

        {/* Descripción de beneficios */}
        <div className="bg-gradient-to-br from-yellow-900/30 to-gray-700/30 rounded-lg p-4 mb-6 border border-yellow-500/20">
          <p className="text-sm text-gray-300 leading-relaxed">
            {requiredLevel === 2 ? (
              <>
                Actualiza a <span className="text-yellow-400 font-semibold">Nivel 2</span> para acceder a esta herramienta y potenciar tu negocio con funciones avanzadas de procesamiento y automatización.
              </>
            ) : requiredLevel === 3 ? (
              <>
                Obtén <span className="text-yellow-400 font-semibold">Nivel 3 (Administrador)</span> para desbloquear todas las funcionalidades premium y tener control total sobre tu sistema.
              </>
            ) : requiredLevel === 4 ? (
              <>
                Contratá el <span className="text-yellow-400 font-semibold">Plan Pro+</span> para habilitar la gestión avanzada de stock, descuentos automáticos y reportes exclusivos.
              </>
            ) : (
              <>
                Mejora tu nivel de acceso para desbloquear esta funcionalidad y muchas más herramientas profesionales.
              </>
            )}
          </p>
        </div>

        {/* Características del nivel requerido */}
        <div className="text-left mb-6 space-y-2">
          <p className="text-xs text-gray-400 font-semibold mb-3 text-center">
            ✨ {requiredLevel === 4 ? 'Plan Pro+ incluye:' : `Nivel ${requiredLevel} incluye:`}
          </p>
          {requiredLevel === 2 && (
            <>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-gray-300">Transformador de Pedidos SmartShip</p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-gray-300">Generador de PDFs Masivo</p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-gray-300">Calculadora de Rentabilidad</p>
              </div>
            </>
          )}
          {requiredLevel === 3 && (
            <>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-gray-300">Acceso completo a todas las secciones</p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-gray-300">Funciones administrativas avanzadas</p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-gray-300">Próximas funcionalidades exclusivas</p>
              </div>
            </>
          )}
          {requiredLevel === 4 && (
            <>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-gray-300">Gestión completa de inventario y control de equivalencias por SKU</p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-gray-300">Descuento automático de stock al generar rótulos con SKU</p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-gray-300">Historial de despachos y reportes priorizados</p>
              </div>
            </>
          )}
        </div>

        {/* Botón de contacto/upgrade */}
        <button
          onClick={() => {
            window.history.back();
          }}
          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          {requiredLevel === 4 ? 'Solicitar Plan Pro+' : `Solicitar Upgrade a Nivel ${requiredLevel}`}
        </button>

        {/* Botón secundario para volver */}
        <button
          onClick={() => window.history.back()}
          className="w-full mt-3 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
        >
          Volver al Inicio
        </button>

        {/* Nota adicional */}
        <p className="text-xs text-gray-500 mt-6">
          Contacta con tu administrador para obtener más información sobre los planes disponibles
        </p>
      </div>

      {/* Añadir animación fadeIn en el CSS */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LockedOverlay;

