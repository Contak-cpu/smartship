import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'

export function PackagingSection() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden bg-muted/30 py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative lg:order-1">
            <div className="relative rounded-2xl bg-white p-8 shadow-2xl border border-gray-200">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">ventas_tiendanube.csv</div>
                    <div className="text-xs text-gray-600">250 pedidos</div>
                  </div>
                  <div className="text-emerald-500 font-semibold">✓</div>
                </div>

                <div className="flex items-center justify-center py-2">
                  <svg className="h-6 w-6 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-500">
                  <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">rotulos_para_despachar.pdf</div>
                    <div className="text-xs text-emerald-500 font-medium">SKU integrado automáticamente</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 bg-emerald-500 text-white rounded-full p-4 shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">-20%</div>
                <div className="text-xs">Ahorro</div>
              </div>
            </div>
          </div>

          <div className="space-y-8 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              Empaquetamiento inteligente
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
              Facilita tu empaquetamiento
            </h2>

            <div className="space-y-4">
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed text-pretty">
                Optimiza el proceso de empaque de tus pedidos con nuestra herramienta inteligente. Con nuestra herramienta "Integración de SKU en Rótulos" podés ingresar el producto y la cantidad a despachar dentro de tu rótulo generado por tu empresa de envíos!
              </p>
              <p className="text-lg sm:text-xl text-accent font-medium">
                Con <span className="font-bold">facil.uno</span> automatizás todo el proceso y ahorrás tiempo y recursos.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-base" onClick={() => navigate('/precios')}>
                Ver Precios
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
              <Button size="lg" className="text-base bg-emerald-500 hover:bg-emerald-600 text-white" asChild>
                <a href="https://wa.me/5493625499796" target="_blank" rel="noopener noreferrer">
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Consultar por WhatsApp
                </a>
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold text-foreground">50%</div>
                <div className="text-sm text-muted-foreground">Menos tiempo</div>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div>
                <div className="text-3xl font-bold text-foreground">100%</div>
                <div className="text-sm text-muted-foreground">Automatizado</div>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div>
                <div className="text-3xl font-bold text-foreground">99%</div>
                <div className="text-sm text-muted-foreground">Precisión</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

