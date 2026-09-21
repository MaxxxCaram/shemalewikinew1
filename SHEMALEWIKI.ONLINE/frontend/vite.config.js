import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // ── PWA: instalable en el teléfono (chicas + clientes), arranque offline
    //    y caché de fotos para que la segunda visita sea instantánea. ──
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'logosw.png', 'robots.txt'],
      manifest: {
        name: 'ShemaleWiki Online — Trans Companion Directory',
        short_name: 'ShemaleWiki',
        description: "The world's premier multilingual directory of trans companions. Browse verified profiles by country and city.",
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0a0a0f',
        theme_color: '#e83e8c',
        lang: 'en',
        categories: ['social', 'lifestyle'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Buscar perfiles', short_name: 'Buscar', url: '/europe' },
          { name: 'Publicar mi perfil', short_name: 'Publicar', url: '/register' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Las portadas del libro (2-3 MB) NO van al precache: no son críticas
        // para el arranque offline y sumaban ~5 MB a la instalación de la PWA.
        // globIgnores funciona donde el patrón negativo '!covers/**' no matchea.
        globIgnores: ['**/covers/**'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
        // Las páginas de perfil NO se sirven del caché: pasan por el servidor
        // porque ahí se inyectan las etiquetas OpenGraph (preview con la foto).
        navigateFallbackDenylist: [/^\/api\//, /^\/_/, /\/(?:[a-z]{2}\/)?profile\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // Fotos vía el proxy con caché del edge (mismo dominio) → el
            // navegador también las guarda: segunda visita instantánea.
            urlPattern: /\/api\/img\?/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'sw-photos-proxy',
              expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Fallback: fotos servidas directo por PocketBase
            urlPattern: /^https:\/\/api\.shemalewiki\.online\/api\/files\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pb-photos',
              expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // API de PocketBase → red primero, caché de respaldo (semi-offline)
            urlPattern: /^https:\/\/api\.shemalewiki\.online\/api\/collections\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pb-api',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
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
      // Two HTML shells share the same app bundle: index.html (ShemaleWiki) and
      // index-bt.html (BuscaTrans, served by vercel.json on buscatrans.com so the
      // no-JS HTML carries the right brand/canonical instead of shemalewiki's).
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        bt: fileURLToPath(new URL('./index-bt.html', import.meta.url)),
      },
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
