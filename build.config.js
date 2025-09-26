// Configuración de build para Vercel
module.exports = {
  // Configuración de build
  buildCommand: 'npm run vercel-build',
  outputDirectory: 'dist',
  
  // Configuración de desarrollo
  devCommand: 'npm run dev',
  
  // Configuración de instalación
  installCommand: 'npm install',
  
  // Variables de entorno por defecto
  env: {
    NODE_ENV: 'production',
    VITE_APP_NAME: 'SmartShip - Transformador de Pedidos Andreani',
    VITE_APP_VERSION: '1.0.0'
  },
  
  // Configuración de archivos estáticos
  public: true,
  
  // Configuración de rutas
  routes: [
    {
      src: '/(.*)',
      dest: '/index.html'
    }
  ]
};
