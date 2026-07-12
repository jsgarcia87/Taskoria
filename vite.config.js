import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { vitePrerenderPlugin } from 'vite-prerender-plugin'
import { cpSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// Copies the PHP backend into the build output so the deployed `dist/` always
// ships the API. Without this, fetch('api/*.php') returns the SPA index.html
// and the frontend throws "Unexpected token '<' ... is not valid JSON".
const copyApi = () => ({
  name: 'copy-php-api',
  apply: 'build',
  closeBundle() {
    const src = resolve(__dirname, 'api')
    const dest = resolve(__dirname, 'dist/api')
    if (existsSync(src)) {
      cpSync(src, dest, { recursive: true })
    }
  },
})

const copySpriteRegistry = () => ({
  name: 'copy-sprite-registry',
  apply: 'build',
  closeBundle() {
    const src = resolve(__dirname, 'src/data/sprite-registry.js')
    const dest = resolve(__dirname, 'dist/admin-tools/sprite-registry.js')
    if (existsSync(src)) {
      cpSync(src, dest)
    }
  },
})

// Minimal config to isolate build error
export default defineConfig({
  plugins: [
    react(),
    copyApi(),
    copySpriteRegistry(),
    // Prerender the landing route at build time so crawlers (Google, LinkedIn,
    // X, Slack, WhatsApp) get real HTML on first byte instead of an empty
    // <div id="root">. Client-side, main.jsx hydrates over the prerendered
    // markup. Only the '/' route is prerendered; the auth-gated dashboard
    // remains a pure SPA.
    vitePrerenderPlugin({
      renderTarget: '#root',
      prerenderScript: resolve(__dirname, 'src/prerender.jsx'),
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Taskoria RPG',
        short_name: 'Taskoria',
        description: 'Gamified Productivity RPG',
        theme_color: '#130f1e',
        background_color: '#130f1e',
        display: 'standalone',
        orientation: 'portrait',
        scope: './',
        start_url: './',
        icons: [
          {
            src: 'Icono_taskoria.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'Icono_taskoria.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Precache only the app shell on install — index, CSS, core JS, manifest.
        // Heavy feature chunks (world/admin/studio/landing/shop) and the
        // sprite PNGs are runtime-cached when the user actually navigates to
        // them. Brings first install from ~2.6 MB down to ~600 KB.
        globPatterns: ['**/*.{css,html,ico,svg,webmanifest}', 'assets/index-*.js', 'assets/vendor-*.js'],
        // Workbox precache has a 2 MiB per-file cap by default; sprite sheets
        // sit just under but we exclude them via globPatterns above.
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // Runtime caching: feature chunks + images get cached the first time
        // they're requested, so subsequent visits feel offline-instant too.
        runtimeCaching: [
          {
            urlPattern: /\/assets\/(world|admin|studio|landing|shop)-.*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'feature-chunks',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /\.(png|webp|avif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /\/api\/.*\.php$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  base: './',
  build: {
    // Split the monolithic bundle so cold visitors (landing/login) don't
    // download the world engine, admin panel and studio just to read marketing.
    // Each chunk is fetched on demand by React.lazy() at the route layer.
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor split — React + icons are app-wide critical, keep separate.
          // Motion evaluates React.createContext at module init, so it MUST
          // ship in the same chunk as react/react-dom; otherwise in prod builds
          // Rollup may evaluate `vendor` before `vendor-react` and throw
          // "Cannot read properties of undefined (reading 'createContext')".
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/motion/') ||
            id.includes('node_modules/motion-dom/') ||
            id.includes('node_modules/motion-utils/') ||
            id.includes('node_modules/framer-motion/') ||
            id.includes('node_modules/@motionone/')
          ) return 'vendor-react';
          if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
          if (id.includes('node_modules')) return 'vendor';

          // Feature chunks (loaded via React.lazy)
          if (id.includes('/src/components/dashboard/world/')) return 'world';
          if (id.includes('/src/components/dashboard/AdminPanel')
            || id.includes('/src/components/dashboard/AdminWorldTools')
            || id.includes('/src/components/dashboard/CreationsModeration')
            || id.includes('/src/components/dashboard/StudioAccessRequests')) return 'admin';
          if (id.includes('/src/components/dashboard/CreationStudio')
            || id.includes('/src/components/dashboard/CreationGallery')
            || id.includes('/src/components/dashboard/StudioAccessGate')) return 'studio';
          if (id.includes('/src/components/LandingPage')) return 'landing';
          // Shop drags the entire items catalog (with sprite URL) + UI
          if (id.includes('/src/components/Shop') || id.includes('/src/data/items')) return 'shop';
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
