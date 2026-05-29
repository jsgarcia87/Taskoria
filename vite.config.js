import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
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

// Minimal config to isolate build error
export default defineConfig({
  plugins: [
    react(),
    copyApi(),
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  base: './',
})
