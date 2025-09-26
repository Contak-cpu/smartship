import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  build: {
    minify: 'esbuild', // Usar esbuild que es más rápido y estable
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['xlsx']
        }
      }
    }
  },
  esbuild: {
    drop: ['console', 'debugger'] // Eliminar console y debugger en producción
  }
});
