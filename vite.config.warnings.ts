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
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
      },
      mangle: {
        safari10: true
      }
    }
  },
  esbuild: {
    drop: ['console', 'debugger']
  }
});
