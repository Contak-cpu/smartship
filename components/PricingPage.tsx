import React, { useState } from 'react';

interface PricingPageProps {
  onGoToLogin: () => void;
  onShowBasicPlan: () => void;
  onShowIntermediatePlan: () => void;
  onShowProPlan: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onGoToLogin, onShowBasicPlan, onShowIntermediatePlan, onShowProPlan }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isValidated, setIsValidated] = useState(false);

  const VALID_CODES = ['2310']; // Códigos de activación válidos

  const handlePlanSelection = (planName: string) => {
    const message = `Hola! Me interesa el plan ${planName} de FACIL.UNO. ¿Podrías darme más información?`;
    const whatsappUrl = `https://wa.me/5493541289228?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleAccessClick = (planName: string) => {
    setSelectedPlan(planName);
    setShowModal(true);
    setInvitationCode('');
    setCodeError('');
    setIsValidated(false);
  };

  const handleInvitationCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setInvitationCode(value);
    setCodeError(''); // Limpiar error al escribir
  };

  const handleValidateCode = () => {
    if (invitationCode.length === 4) {
      // Validar si el código es correcto
      if (VALID_CODES.includes(invitationCode)) {
        setIsValidated(true);
        setCodeError('');
        
        // Esperar 2 segundos antes de abrir WhatsApp
        setTimeout(() => {
          const message = `Hola! Tengo el código de invitación ${invitationCode} y me interesa el plan ${selectedPlan} de FACIL.UNO. ¿Podrías darme más información?`;
          const whatsappUrl = `https://wa.me/5493541289228?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, '_blank');
          
          // Cerrar el modal después de abrir WhatsApp
          setTimeout(() => {
            setShowModal(false);
            setIsValidated(false);
          }, 500);
        }, 2000);
      } else {
        setCodeError('Código inválido. Verifica tu código de invitación.');
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header simplificado */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Botón Invitado */}
            <button
              onClick={() => {
                onGoToLogin();
                // Simular login como invitado
                setTimeout(() => {
                  const loginButton = document.querySelector('[data-guest-login]') as HTMLButtonElement;
                  if (loginButton) loginButton.click();
                }, 100);
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-300 flex-shrink-0"
            >
              <span className="hidden sm:inline">Ingresar como invitado</span>
              <span className="sm:hidden">Invitado</span>
            </button>
            
            {/* Nombre centrado */}
            <h2 className="absolute left-1/2 transform -translate-x-1/2 text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              FACIL.UNO
            </h2>
            
            {/* Botón Ya tengo un plan */}
            <button
              onClick={onGoToLogin}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-300 flex-shrink-0"
            >
              <span className="hidden sm:inline">Ya tengo un plan</span>
              <span className="sm:hidden">Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-grow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-24">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Elige tu plan
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-gray-600 dark:text-gray-400 px-4">
              Ahorra al menos un 10% en todas las etiquetas. Precios simples y transparentes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
            {/* Plan Starter - Nivel 1 */}
            <div className="relative flex flex-col bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border-2 border-blue-500 p-6 sm:p-8">
              <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                  Nivel 1
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Starter</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">$1</span>
                <span className="text-sm sm:text-base font-medium text-gray-500 dark:text-gray-400">/mes</span>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Ideal para emprendedores que necesitan controlar la rentabilidad.
              </p>
              <button 
                onClick={() => handleAccessClick('Starter')}
                className="mt-6 sm:mt-8 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors text-sm sm:text-base"
              >
                Conseguir acceso
              </button>
              <ul className="mt-8 space-y-4 text-sm flex-grow">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Calculadora de Rentabilidad</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Calculadora Breakeven & ROAS</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Soporte por email</span>
                </li>
              </ul>
            </div>

            {/* Plan Basic (Nivel 2) - Más Popular */}
            <div className="relative flex flex-col bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border-2 border-blue-500 p-6 sm:p-8 md:col-span-2 lg:col-span-1">
              <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                  Más Popular
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Basic</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">$49</span>
                <span className="text-sm sm:text-base font-medium text-gray-500 dark:text-gray-400">/mes</span>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Para empresas en crecimiento que necesitan automatización completa.
              </p>
              <button 
                onClick={() => handleAccessClick('Basic')}
                className="mt-6 sm:mt-8 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors text-sm sm:text-base"
              >
                Conseguir acceso
              </button>
              <ul className="mt-8 space-y-4 text-sm flex-grow">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Todo del plan Starter</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Transformador SmartShip</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Atención por Whatsapp</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Soporte prioritario</span>
                </li>
              </ul>
            </div>

            {/* Plan Pro (Nivel 3) */}
            <div className="relative flex flex-col bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border-2 border-blue-500 p-6 sm:p-8">
              <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                  Nivel 3
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Pro</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">$99</span>
                <span className="text-sm sm:text-base font-medium text-gray-500 dark:text-gray-400">/mes</span>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Acceso completo para administradores y funciones exclusivas.
              </p>
              <button 
                onClick={() => handleAccessClick('Pro')}
                className="mt-6 sm:mt-8 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors text-sm sm:text-base"
              >
                Conseguir acceso
              </button>
              <ul className="mt-8 space-y-4 text-sm flex-grow">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Todo del plan Basic</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Integrar SKU en Rótulos Andreani</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Funciones administrativas</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Acceso anticipado a nuevas funciones</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Soporte dedicado 24/7</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Acceso Exclusivo */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          {/* Backdrop con blur */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setShowModal(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black border-2 border-green-500/30 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scaleIn">
            {/* Efectos de brillo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-green-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
            
            {/* Icono de candado */}
            <div className="relative flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                <div className="relative bg-gradient-to-br from-green-600 to-green-800 p-4 rounded-full">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Título */}
            <h3 className="relative text-2xl sm:text-3xl font-bold text-center text-white mb-3">
              Acceso Exclusivo
            </h3>
            
            {/* Badge del plan */}
            <div className="flex justify-center mb-4">
              <span className="bg-green-500/20 text-green-400 px-4 py-1 rounded-full text-sm font-semibold border border-green-500/30">
                Plan {selectedPlan}
              </span>
            </div>

            {/* Mensaje */}
            <div className="relative space-y-4 text-center mb-6">
              {!isValidated ? (
                <>
                  <p className="text-gray-300 text-base leading-relaxed">
                    El acceso a <span className="text-green-400 font-bold">FACIL.UNO</span> es limitado y está disponible únicamente para personas que reciban una{' '}
                    <span className="text-green-400 font-bold">invitación exclusiva</span>.
                  </p>
                  
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-sm">
                    <p className="flex items-center justify-center gap-2 text-gray-300 mb-3">
                      <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold text-green-400">Solo por invitación</span>
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                      Si ya tienes una invitación, ingresa el número de la misma aquí abajo
                    </p>

                    {/* Campo de código de invitación */}
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={invitationCode}
                        onChange={handleInvitationCodeChange}
                        placeholder="XXXX"
                        maxLength={4}
                        className={`w-full bg-gray-800 border-2 rounded-lg px-4 py-3 text-center text-2xl font-bold text-white tracking-widest focus:outline-none transition-colors placeholder-gray-600 ${
                          codeError 
                            ? 'border-red-500/70 focus:border-red-400' 
                            : 'border-green-500/50 focus:border-green-400'
                        }`}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && invitationCode.length === 4) {
                            handleValidateCode();
                          }
                        }}
                      />
                      
                      {/* Mensaje de error */}
                      {codeError && (
                        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-2 animate-fadeIn">
                          <p className="text-red-400 text-xs font-semibold flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {codeError}
                          </p>
                        </div>
                      )}
                      
                      <button
                        onClick={handleValidateCode}
                        disabled={invitationCode.length !== 4}
                        className={`w-full py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-300 ${
                          invitationCode.length === 4
                            ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-green-500/50'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {invitationCode.length === 4 ? '🔓 Validar código' : '🔒 Ingresa 4 dígitos'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Pantalla de código validado */
                <div className="animate-scaleIn">
                  <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 border-2 border-green-500/60 rounded-2xl p-8">
                    {/* Checkmark animado */}
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-green-500/30 rounded-full blur-xl animate-pulse" />
                        <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-full p-4 shadow-xl">
                          <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Mensaje de éxito */}
                    <h4 className="text-2xl font-bold text-white mb-2">
                      ¡Código Validado!
                    </h4>
                    <p className="text-green-400 text-lg font-semibold mb-4">
                      Código: {invitationCode}
                    </p>
                    <p className="text-gray-300 text-sm mb-6">
                      Serás redirigido a nuestro contacto exclusivo...
                    </p>

                    {/* Barra de progreso */}
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-green-500 to-green-400 h-full rounded-full" 
                           style={{ animation: 'progressBar 2s ease-in-out forwards' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botón cerrar */}
            {!isValidated && (
              <button
                onClick={() => setShowModal(false)}
                className="relative w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 border border-gray-600"
              >
                Cerrar
              </button>
            )}

            {/* Botón de cierre X */}
            {!isValidated && (
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
