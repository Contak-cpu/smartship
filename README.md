# 🚀 FACIL.UNO - Herramientas para Ecommerce

Una suite completa de herramientas profesionales para gestionar y optimizar tu ecommerce, incluyendo calculadoras financieras, análisis de rentabilidad y automatización de envíos.

## ✨ Características Principales

- **📊 Calculadora de Rentabilidad**: Analiza tu rentabilidad diaria con soporte para múltiples monedas
- **📈 Breakeven y ROAS**: Calcula tu punto de equilibrio y retorno de inversión publicitaria
- **🔄 SmartShip**: Transforma archivos CSV de Tiendanube al formato Andreani
- **📍 Integración SKU**: Integra SKUs en rótulos de envío de Andreani (Nivel Admin)
- **💼 Gastos Personalizados**: Agrega y gestiona gastos adicionales en tus cálculos
- **💰 Pagos con Criptomonedas**: Integración con Coinbase Commerce para pagos instantáneos
- **💻 Interfaz Moderna**: Diseño responsive y armónico con Tailwind CSS
- **🔐 Sistema de Niveles**: Control de acceso por planes (Invitado, Starter, Basic, Pro)
- **⚡ Procesamiento Rápido**: Optimizado para manejar grandes volúmenes de datos

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18.2.0 + TypeScript
- **Build Tool**: Vite 6.3.6
- **Styling**: Tailwind CSS
- **CSV Processing**: PapaParse
- **Excel Support**: XLSX

## 🚀 Instalación y Uso

### Prerrequisitos
- Node.js 16+ 
- npm o yarn

### Instalación Local
```bash
# Clonar el repositorio
git clone https://github.com/tuusuario/facil-uno.git
cd facil-uno

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

### Comandos Disponibles
```bash
npm run dev         # Servidor de desarrollo (puerto 3000)
npm run build       # Construcción para producción
npm run preview     # Vista previa de la construcción
npm run vercel-build # Build optimizado para Vercel
```

## 🌐 Deploy en Vercel

### Deploy Automático
El proyecto está configurado para deploy automático en Vercel:

1. **Conectar repositorio**: Ve a [Vercel](https://vercel.com) y conecta tu repositorio GitHub
2. **Deploy automático**: Vercel detectará automáticamente la configuración y hará el deploy
3. **Sin configuración manual**: Todo está preconfigurado en `vercel.json`

### Configuración Incluida
- ✅ **vercel.json**: Configuración de build y rutas
- ✅ **Scripts optimizados**: Build específico para Vercel
- ✅ **Variables de entorno**: Configuradas automáticamente
- ✅ **Rutas SPA**: Configuradas para React Router
- ✅ **Assets optimizados**: Chunks separados para mejor performance

### Variables de Entorno Requeridas
Para producción, configura estas variables en Vercel:

```
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
VITE_COINBASE_COMMERCE_API_KEY=tu_api_key_de_coinbase_commerce
```

**Guías de configuración:**
- [Configuración de Supabase](./docs/SUPABASE_SETUP.md)
- [Configuración de Coinbase Commerce](./docs/COINBASE_COMMERCE_SETUP.md)
- [Configurar API Key en Vercel](./docs/COINFIGURAR_API_KEY_COINBASE.md)

## 📋 Cómo Usar la Aplicación

### Calculadoras Financieras
1. **Rentabilidad**: Ingresa tus ingresos y gastos del día para calcular tu rentabilidad
2. **Breakeven & ROAS**: Calcula tu punto de equilibrio y retorno de inversión publicitaria
3. **Gastos Personalizados**: Agrega gastos adicionales para análisis más precisos

### SmartShip
1. **Subir Archivo**: Arrastra tu archivo CSV de Tiendanube
2. **Procesar**: Haz clic en "Procesar Archivo" 
3. **Descargar**: Descarga los archivos procesados para Andreani

## 📁 Estructura del Proyecto

```
facil-uno/
├── components/
│   ├── calculators/          # Calculadoras financieras
│   │   ├── RentabilidadCalculator.tsx
│   │   └── BreakevenROASCalculator.tsx
│   ├── layout/               # Componentes de layout
│   │   ├── DashboardLayout.tsx
│   │   └── Navigation.tsx
│   ├── routing/              # Componentes de enrutamiento
│   └── pdf/                  # Generación de PDFs
├── pages/                    # Páginas principales
├── services/                 # Lógica de procesamiento
├── hooks/                    # React hooks personalizados
├── routes/                   # Configuración de rutas
├── types.ts                  # Definiciones de tipos TypeScript
└── App.tsx                   # Componente principal
```

## 🔧 Configuración

### Archivos de Referencia Requeridos

La aplicación necesita estos archivos en la carpeta `public/`:

- **`sucursales.csv`**: Lista de sucursales Andreani con direcciones
- **`Domicilios - Hoja 1.csv`**: Mapeo de códigos postales argentinos

### Formato de Entrada Esperado

El archivo CSV de Tiendanube debe contener estas columnas:
- Número de orden
- Email del comprador
- Nombre del comprador
- DNI/CUIT
- Teléfono
- Dirección completa
- Medio de envío

## 🎯 Funcionalidades Avanzadas

### Mapeo Inteligente de Sucursales
- Búsqueda difusa por dirección
- Normalización de caracteres especiales
- Desempate por localización geográfica
- Manejo de variaciones en nombres de calles

### Procesamiento de Datos
- Normalización automática de nombres y apellidos
- Corrección de códigos de área telefónicos por provincia
- Manejo de caracteres especiales y acentos
- Validación de datos de entrada

### Optimización de Columnas
Las columnas están ordenadas para facilitar el trabajo:
1. **Peso (grs)**
2. **Alto (cm)**
3. **Ancho (cm)**
4. **Profundidad (cm)**
5. **Valor declarado ($ C/IVA)**
6. Número Interno
7. Datos del cliente
8. Información de envío

## 🐛 Solución de Problemas

### Error de Codificación
Si encuentras problemas con caracteres especiales:
- Asegúrate de que el archivo CSV esté en UTF-8
- La aplicación normaliza automáticamente los caracteres

### Sucursales No Encontradas
- Verifica que el archivo `sucursales.csv` esté en la carpeta `public/`
- La aplicación usa búsqueda difusa para encontrar coincidencias

### Problemas de Rendimiento
- Para archivos muy grandes (>10,000 pedidos), considera procesar en lotes
- La aplicación está optimizada para manejar archivos de hasta 50MB

### Error de Configuración de Coinbase Commerce
- Verifica que `VITE_COINBASE_COMMERCE_API_KEY` esté configurada en Vercel
- Verifica que hayas hecho redeploy después de agregar la variable
- Ver [Configurar API Key en Vercel](./docs/COINFIGURAR_API_KEY_COINBASE.md)

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- Abre un issue en GitHub
- Contacta al equipo de desarrollo

---

**Desarrollado con ❤️ por pictoN para optimizar tu ecommerce** 🚀