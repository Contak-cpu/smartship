# 🚀 Guía de Rutas y Navegación - SmartShip

Esta guía explica la estructura de rutas escalable implementada en SmartShip.

## 📁 Estructura de Carpetas

```
transformador-de-pedidos-andreani/
├── App.tsx                          # Punto de entrada principal con Router
├── pages/                           # Páginas de la aplicación
│   ├── HomePage.tsx                 # Página principal (SmartShip)
│   ├── PDFGeneratorPage.tsx        # Generador de PDFs
│   └── LandingPage.tsx              # Página de login/pricing
├── components/
│   ├── routing/                     # Componentes de rutas
│   │   ├── ProtectedRoute.tsx      # HOC para rutas protegidas
│   │   └── PublicRoute.tsx         # HOC para rutas públicas
│   ├── layout/                      # Componentes de layout
│   │   └── Navigation.tsx          # Navegación reutilizable
│   └── pdf/                         # Componentes del generador PDF
└── routes/
    └── routes.tsx                   # Configuración centralizada de rutas
```

## 🔧 Cómo Agregar Nuevas Rutas

### Paso 1: Crear la Página

Crea un nuevo archivo en `pages/`:

```tsx
// pages/NuevaFuncionalidadPage.tsx
const NuevaFuncionalidadPage = () => {
  return (
    <div>
      <h1>Nueva Funcionalidad</h1>
      {/* Tu contenido aquí */}
    </div>
  );
};

export default NuevaFuncionalidadPage;
```

### Paso 2: Agregar la Ruta

En `routes/routes.tsx`, agrega tu nueva ruta:

```tsx
import NuevaFuncionalidadPage from '../pages/NuevaFuncionalidadPage';

export const routes: RouteObject[] = [
  // ... rutas existentes ...
  {
    path: '/nueva-funcionalidad',
    element: (
      <ProtectedRoute>
        <NuevaFuncionalidadPage />
      </ProtectedRoute>
    ),
  },
  // ... resto de rutas ...
];
```

### Paso 3: Agregar al Menú de Navegación

En `components/layout/Navigation.tsx`, agrega el enlace:

```tsx
const navLinks: NavigationLink[] = [
  // ... enlaces existentes ...
  {
    path: '/nueva-funcionalidad',
    label: 'Nueva Funcionalidad',
    icon: (
      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {/* Tu icono SVG aquí */}
      </svg>
    ),
    color: 'bg-purple-600 hover:bg-purple-700', // Color personalizado
  },
];
```

## 🔒 Tipos de Rutas

### Rutas Protegidas (ProtectedRoute)

Requieren autenticación. Si el usuario no está autenticado, redirige a `/login`.

```tsx
<ProtectedRoute>
  <MiPaginaPage />
</ProtectedRoute>
```

### Rutas Públicas (PublicRoute)

Solo accesibles cuando NO estás autenticado. Si ya estás autenticado, redirige a `/`.

```tsx
<PublicRoute>
  <LoginPage />
</PublicRoute>
```

### Rutas Abiertas

Sin restricciones de autenticación.

```tsx
<MiPaginaPublicaPage />
```

## 📍 Rutas Actuales

| Ruta | Componente | Tipo | Descripción |
|------|-----------|------|-------------|
| `/` | HomePage | Protegida | Transformador de pedidos Andreani |
| `/pdf-generator` | PDFGeneratorPage | Protegida | Generador de PDFs desde CSV |
| `/login` | LandingPage | Pública | Login y página de precios |
| `*` | 404 | Abierta | Página no encontrada |

## 🎨 Componente de Navegación

El componente `Navigation` es reutilizable y se actualiza automáticamente:

- Muestra el nombre del usuario
- Oculta el botón de la página actual
- Incluye botón de cerrar sesión
- Estilos consistentes con la identidad de marca

## 💡 Mejores Prácticas

1. **Nombres Consistentes**: Usa el sufijo `Page` para páginas (ej: `DashboardPage.tsx`)

2. **Organización por Funcionalidad**: Agrupa componentes relacionados en carpetas

3. **Rutas Semánticas**: Usa nombres de ruta descriptivos (`/pdf-generator` en lugar de `/pdf`)

4. **Lazy Loading** (opcional para optimización futura):
```tsx
const NuevaPage = lazy(() => import('../pages/NuevaPage'));
```

5. **Breadcrumbs** (para implementar en el futuro):
```tsx
// Agrega metadata a cada ruta
{
  path: '/pdf-generator',
  element: <PDFGeneratorPage />,
  meta: { breadcrumb: 'Generador de PDFs' }
}
```

## 🔄 Navegación Programática

Usa el hook `useNavigate` de React Router:

```tsx
import { useNavigate } from 'react-router-dom';

const MiComponente = () => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate('/pdf-generator');
  };
  
  return <button onClick={handleClick}>Ir a PDF Generator</button>;
};
```

## 📦 Ventajas de Esta Estructura

✅ **Escalable**: Fácil agregar nuevas rutas sin modificar App.tsx  
✅ **Modular**: Cada página es independiente y reutilizable  
✅ **Mantenible**: Configuración centralizada en un solo archivo  
✅ **Segura**: Sistema de rutas protegidas integrado  
✅ **DRY**: Navegación reutilizable en todas las páginas  
✅ **Type-Safe**: Full TypeScript support  

## 🚀 Próximos Pasos Sugeridos

1. Implementar lazy loading para optimizar el bundle size
2. Agregar animaciones de transición entre páginas
3. Implementar breadcrumbs para mejor UX
4. Agregar middleware para rutas (ej: verificación de permisos)
5. Implementar rutas anidadas si se necesitan sub-páginas

---

**Desarrollado por pictoN** 🎨

