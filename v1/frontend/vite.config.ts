import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    // Optimisations de build
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['typescript'],
        }
      }
    }
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@games': path.resolve(__dirname, './src/games'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
      '@css': path.resolve(__dirname, './css'),
    },
  },
  
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    open: false, // N'ouvre pas automatiquement le navigateur
    cors: true,
    hmr: {
      clientPort: 5173,
      overlay: true, // Affiche les erreurs en overlay
    },
    // Proxy pour le backend si besoin
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true,
      }
    }
  },
  
  // CSS
  css: {
    devSourcemap: true,
  },
  
  // Optimisations
  optimizeDeps: {
    include: [], // Ajoute ici les dépendances à pré-bundle
  },
  
  // Logging
  logLevel: 'info',
  
  // Clear screen
  clearScreen: false,
});
