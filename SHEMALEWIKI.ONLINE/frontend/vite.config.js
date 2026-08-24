import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Genera chunks de vendor separados para mejor cacheo del navegador
  // y reducción del bundle inicial (lazy-load de páginas ya está en App.jsx).
  build: {
    // Modern target → better tree-shaking & smaller bundles. Vercel edge supports it.
    target: 'es2022',
    // CSS code-split per-chunk
    cssCodeSplit: true,
    // Brotli-level compression on emitted assets (1 = fastest; 9 = best). Vite uses esbuild.
    // (Vercel aplica brotli/gzip en el edge automáticamente; esto es para el build output).
    sourcemap: 'hidden',
    // Limpiar dist antes de cada build
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Hash por contenido: cada build genera un nombre UNICO.
        entryFileNames: 'assets/index-[hash].js',
        chunkFileNames: 'assets/chunk-[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        // Manual chunking: separa vendors grandes para que el navegador los cachee
        // de forma independiente y no se re-descarguen al cambiar el código de app.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react/') || id.includes('scheduler')) {
              return 'react-vendor';
            }
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('axios')) {
              return 'axios-vendor';
            }
            if (id.includes('react-helmet-async')) {
              return 'helmet-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            if (id.includes('cheerio') || id.includes('node-html-parser')) {
              return 'parser-vendor';
            }
            // Resto de node_modules → vendor genérico
            return 'vendor';
          }
        },
      },
    },
  },
  // Dev server: no afecta producción
  server: {
    host: true,
  },
})
