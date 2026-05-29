import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { cpSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// Copies the PHP backend into the build output so the standalone bundle always
// ships the API. Without this, fetch('api/*.php') returns the SPA index.html
// and the frontend throws "Unexpected token '<' ... is not valid JSON".
const copyApi = (outDir) => ({
    name: 'copy-php-api',
    apply: 'build',
    closeBundle() {
        const src = resolve(__dirname, 'api')
        const dest = resolve(__dirname, outDir, 'api')
        if (existsSync(src)) {
            cpSync(src, dest, { recursive: true })
        }
    },
})

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), viteSingleFile(), copyApi('standalone')],
    base: './',
    build: {
        outDir: 'standalone',
        emptyOutDir: true,
    },
})
