import React from 'react'
import { Card } from '../ui/card'

export function HowItWorksSection() {
  const steps = [
    {
      icon: (
        <svg className="h-7 w-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: "¿Cómo generar tu archivo de Envíos para la empresa que utilizas?",
      description:
        "Al ingresar en nuestra sección de archivos para envíos masivos, podés seleccionar tu empresa de transporte, dentro de la misma vas a tener que cargar el archivo .CSV de ventas de la plataforma que utilices ya sea TiendaNube o Shopify.",
      extraInfo:
        "El sistema te devolverá tu archivo listo para subir a la plataforma de envíos masivos de tu empresa donde podrás aplicar cualquiera de nuestros cupones disponibles, según lo necesites.",
      reminder:
        "*Recordatorio: Podés ajustar Peso, Medidas y Valor declarado según necesites desde la sección de configuración.",
      step: "01",
    },
    {
      icon: (
        <svg className="h-7 w-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "¿Querés agregar los productos que tenés que despachar en el rótulo de cada envío?",
      description:
        "En nuestra sección de 'SKU En Rótulos' podés integrar el producto que haya comprado el cliente dentro de la etiqueta de envío correspondiente, facilitándole al usuario o logística el proceso de empaquetamiento, evitando errores y papelerío innecesario.",
      extraInfo:
        "Una vez que hayas realizado el pago de tus envíos luego de aprovechar nuestros descuentos, dentro de la sección volverás a ingresar el archivo de ventas_tiendanube.csv y también ingresarás el PDF con todos los rótulos pagados, nuestro sistema le realizará un parseo inteligente y le devolverá el PDF idéntico con el SKU integrado en el rótulo según corresponda.",
      plus:
        "*Plus: Al ingresar SKU en los Rótulos de tus envíos nuestra plataforma te genera una hoja extra adicional en el PDF con los productos y cantidades totales despachadas para facilitar aún más todo.",
      reminder:
        "*Recordatorio: Recordá configurar el SKU en tu tienda para evitar errores, podés utilizar sin problemas el nombre del producto, pero al ser largo normalmente suele estorbar en la etiqueta de envío.",
      step: "02",
    },
    {
      icon: (
        <svg className="h-7 w-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "¿Puedo manejar mi stock desde dentro de Facil.uno?",
      description:
        "Si, con nuestra sección de stock podés cargar el stock que tenés en tu depósito/logística y cada vez que ingresés el SKU en los Rótulos te va a permitir descontar los productos y cantidades despachadas de tu stock, agilizando y facilitando el control de forma automática.",
      step: "03",
    },
  ]

  return (
    <section id="como-funciona" className="py-20 sm:py-32 bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-balance text-white">Cómo Funciona</h2>
          <p className="text-lg text-gray-300 text-pretty">
            Tres pasos simples para optimizar tus envíos y comenzar a ahorrar
          </p>
        </div>

        <div className="grid gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="relative p-8 bg-white border-2 border-white hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                    {step.step}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="mb-4">
                    <div className="h-14 w-14 rounded-lg bg-blue-100 flex items-center justify-center">
                      {step.icon}
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold mb-3 text-gray-900">{step.title}</h3>

                  <div className="space-y-3">
                    <p className="text-gray-700 leading-relaxed">{step.description}</p>
                    {step.extraInfo && (
                      <p className="text-gray-700 leading-relaxed">{step.extraInfo}</p>
                    )}
                    {step.plus && (
                      <p className="text-sm text-blue-600 font-medium italic">{step.plus}</p>
                    )}
                    {step.reminder && (
                      <p className="text-sm text-emerald-500 font-medium italic">{step.reminder}</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

