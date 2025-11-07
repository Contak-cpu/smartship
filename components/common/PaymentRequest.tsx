import React, { useState } from 'react';

interface PaymentRequestProps {
  currentPlan: string;
  onPaymentRequested: (planName: string) => void;
}

export const PaymentRequest: React.FC<PaymentRequestProps> = ({ currentPlan, onPaymentRequested }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Basic');

  const plans = [
    { name: 'Starter', price: 1, description: 'Ideal para emprendedores' },
    { name: 'Basic', price: 49, description: 'Para empresas en crecimiento' },
    { name: 'Pro', price: 99, description: 'Acceso completo y funciones exclusivas' }
  ];

  const handleSelectPlan = (planName: string) => {
    setSelectedPlan(planName);
    setShowPaymentModal(true);
  };

  const handlePaymentConfirmed = async () => {
    // Aquí se enviaría una notificación al admin
    // Por ahora solo mostramos el QR
    alert('Tu solicitud de pago ha sido registrada. Estaremos revisando tu pago y te notificaremos por email.');
  };

  return (
    <>
      <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border border-yellow-500/30 rounded-2xl p-6 mb-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Info */}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">
              {currentPlan === 'Expirado' ? '⏰ Tu plan expiró' : '💳 ¿Quieres ser usuario pago?'}
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {currentPlan === 'Expirado' 
                ? 'Tu suscripción ha vencido. Renueva tu plan ahora para recuperar el acceso a todas las funcionalidades y beneficios exclusivos.'
                : 'Actualmente tienes acceso en modo trial. Actualiza tu plan para tener acceso permanente a todas las funcionalidades y beneficios exclusivos.'}
            </p>
          </div>

          {/* Botón */}
          <button
            onClick={() => handleSelectPlan('Basic')}
            className={`font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg ${
              currentPlan === 'Expirado'
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white hover:shadow-red-500/50'
                : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 hover:shadow-yellow-500/50'
            }`}
          >
            {currentPlan === 'Expirado' ? 'Renovar mi plan' : 'Actualizar mi plan'}
          </button>
        </div>
      </div>

      {/* Modal de pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setShowPaymentModal(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black border-2 border-yellow-500/30 rounded-2xl shadow-2xl max-w-4xl w-full p-8 animate-scaleIn overflow-y-auto max-h-[90vh]">
            {/* Botón de cierre */}
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-2xl font-bold text-center text-white mb-6">
              Actualizar mi plan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Columna izquierda - Selección de plan */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Elige tu plan:</h4>
                <div className="space-y-3">
                  {plans.map((plan) => (
                    <button
                      key={plan.name}
                      onClick={() => setSelectedPlan(plan.name)}
                      className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                        selectedPlan === plan.name
                          ? 'border-yellow-500 bg-yellow-500/10'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{plan.name}</p>
                          <p className="text-xs text-gray-400">{plan.description}</p>
                        </div>
                        <p className="text-lg font-bold text-yellow-400">${plan.price}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Columna derecha - QR y confirmación */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Realiza el pago:</h4>
                
                {/* QR Code */}
                <div className="flex justify-center mb-6">
                  <div className="bg-white p-4 rounded-xl shadow-2xl">
                    <img 
                      src="/binance-qr.png" 
                      alt="Binance QR Code" 
                      className="w-48 h-48"
                    />
                  </div>
                </div>

                {/* Información del plan seleccionado */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                  <p className="text-center text-yellow-400 font-semibold">
                    Plan {selectedPlan}
                  </p>
                  <p className="text-center text-2xl font-bold text-white">
                    ${plans.find(p => p.name === selectedPlan)?.price} <span className="text-lg text-gray-400">USD/mes</span>
                  </p>
                </div>

                {/* Instrucciones */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
                  <h5 className="text-blue-400 font-semibold mb-2 text-sm">Instrucciones:</h5>
                  <ol className="text-gray-300 text-xs space-y-2 list-decimal list-inside">
                    <li>Escanea el código QR con Binance</li>
                    <li>Realiza el pago de ${plans.find(p => p.name === selectedPlan)?.price} USD</li>
                    <li>Guarda el comprobante de pago</li>
                    <li>Haz clic en "Confirmar pago enviado"</li>
                  </ol>
                </div>

                {/* Checkbox de confirmación */}
                <div className="flex items-center gap-3 mb-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <input
                    type="checkbox"
                    id="paymentConfirmation"
                    className="w-5 h-5 text-yellow-600 bg-gray-800 border-gray-600 rounded focus:ring-yellow-500"
                  />
                  <label htmlFor="paymentConfirmation" className="text-gray-300 text-sm">
                    Confirmo que he realizado el pago
                  </label>
                </div>

                {/* Botón de confirmar */}
                <button
                  onClick={handlePaymentConfirmed}
                  className="w-full bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-yellow-500/50"
                >
                  ✅ Confirmar pago enviado
                </button>

                <p className="text-xs text-gray-400 text-center mt-4">
                  Te notificaremos por email cuando se apruebe tu pago
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

