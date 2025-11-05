import React from 'react'
import { Card } from '../ui/card'

export function BenefitsSection() {
  const benefits = [
    {
      icon: (
        <svg className="h-6 w-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Ahorro Garantizado",
      description:
        "Reducí tu promedio de envíos notablemente pasando de 7500/8000 a 5000/5500 promedio por envío, aplicando cupones desde un 10 a un 40% de descuento.",
      color: "text-emerald-500",
    },
    {
      icon: (
        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Ahorro de Tiempo",
      description:
        "Automatiza el proceso manual y libera horas de trabajo. Lo que tomaba días ahora toma minutos. Lo que requería de trabajo humano hoy simplificado en nuestra aplicación.",
      color: "text-blue-600",
    },
    {
      icon: (
        <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Precisión y Control",
      description:
        "Nada mejor que llevar precisamente el control de tu stock y tus envíos de forma fácil y cómoda sin depender de papeles escritos a mano o hojas de excel que se pueden perder.",
      color: "text-purple-600",
    },
    {
      icon: (
        <svg className="h-6 w-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "¡Facil.uno se adapta a todo!",
      description:
        "¡Facil.uno se adapta a todo! Podés utilizar nuestra plataforma indistinto la plataforma que uses para vender, procesamos correctamente archivos de Tiendanube y Shopify. Podés generar el archivo de envíos para tu empresa de correspondencia preferida ya sea Correo Argentino o Andreani pudiendo utilizar cupón de descuento en ambas!",
      color: "text-orange-500",
    },
  ]

  return (
    <section id="beneficios" className="py-20 sm:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-balance">
            Beneficios Clave
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Optimiza tu operación logística y mejora tus márgenes de ganancia
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {benefits.map((benefit, index) => (
            <Card key={index} className="p-6 bg-white border border-gray-200 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="mb-4">
                <div className={`h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center ${benefit.color}`}>
                  {benefit.icon}
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-2 text-gray-900">{benefit.title}</h3>

              <p className="text-sm text-gray-700 leading-relaxed">{benefit.description}</p>
            </Card>
          ))}
        </div>

        <div className="mt-16 max-w-4xl mx-auto space-y-6">
          <div className="text-center bg-white rounded-xl p-6 border border-gray-200">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-600 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              Operativos desde el 27/10/25 • Fase Beta
            </div>
            <p className="mt-3 text-sm text-gray-700">
              Estamos en nuestras primeras semanas de operación. Tu feedback es esencial para mejorar.
            </p>
          </div>
          <Card className="p-8 bg-white border-2 border-gray-200">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">+35</div>
                <div className="text-sm text-gray-600">Clientes Registrados</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-emerald-500 mb-2">35K+</div>
                <div className="text-sm text-gray-600">Envíos procesados mensualmente</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">$50M+</div>
                <div className="text-sm text-gray-600">Ahorrados por nuestros clientes</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}

