import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'

export function Header() {
  const navigate = useNavigate()

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/facil-uno.png?v=2" 
              alt="FACIL.UNO Logo" 
              className="h-8 w-auto object-contain drop-shadow-lg"
            />
            <span className="text-xl font-semibold text-gray-900 dark:text-white">Facil Uno - Soluciones Digitales</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#como-funciona"
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cómo Funciona
            </a>
            <a
              href="#beneficios"
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Beneficios
            </a>
            <a
              href="#precios"
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Precios
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/login')}>
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

