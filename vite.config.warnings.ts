import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignorar warnings específicos que no son críticos
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        if (warning.code === 'EVAL') return;
        
        // Mostrar otros warnings
        warn(warning);
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['xlsx']
        }
      }
    },
    minify: 'esbuild' // Usar esbuild en lugar de terser
  },
  esbuild: {
    drop: ['console', 'debugger'] // Eliminar console y debugger en producción
  }
});
