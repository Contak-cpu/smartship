# 🚀 SmartShip - Transformador de Pedidos Andreani

Una aplicación web moderna para convertir automáticamente pedidos de Tiendanube al formato requerido por Andreani para envíos.

## ✨ Características Principales

- **🔄 Conversión Automática**: Transforma archivos CSV de Tiendanube al formato Andreani
- **📍 Separación Inteligente**: Distingue automáticamente entre envíos a domicilio y sucursales
- **🎯 Mapeo de Sucursales**: Búsqueda inteligente de sucursales Andreani por dirección
- **🔤 Normalización**: Manejo automático de caracteres especiales y acentos
- **📊 Columnas Optimizadas**: Peso, alto, ancho, profundidad y valor al inicio de la planilla
- **💻 Interfaz Moderna**: Diseño responsive con Tailwind CSS
- **⚡ Procesamiento Rápido**: Optimizado para manejar grandes volúmenes de pedidos

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
git clone https://github.com/Contak-cpu/smartship.git
cd smartship

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

### Variables de Entorno (Opcional)
Si necesitas configurar variables de entorno en Vercel:
```
NODE_ENV=production
VITE_APP_NAME=SmartShip - Transformador de Pedidos Andreani
VITE_APP_VERSION=1.0.0
```

## 📋 Cómo Usar la Aplicación

1. **Subir Archivo**: Arrastra y suelta tu archivo CSV de Tiendanube
2. **Procesar**: Haz clic en "Procesar Archivo" 
3. **Descargar**: Descarga los archivos CSV procesados:
   - `Domicilios.csv` - Para envíos a domicilio
   - `Sucursales.csv` - Para envíos a sucursales
   - `Combinado.csv` - Ambos tipos en un solo archivo

## 📁 Estructura del Proyecto

```
smartship/
├── components/          # Componentes React
│   ├── FileUploader.tsx
│   ├── ResultsDisplay.tsx
│   └── StatusDisplay.tsx
├── services/           # Lógica de procesamiento
│   └── csvProcessor.ts
├── public/             # Archivos estáticos
│   ├── sucursales.csv
│   └── Domicilios - Hoja 1.csv
├── types.ts            # Definiciones de tipos TypeScript
├── App.tsx             # Componente principal
└── index.tsx          # Punto de entrada
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

**Desarrollado con ❤️ para automatizar la logística de envíos**