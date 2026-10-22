/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { readFileSync } from 'fs'
import { execSync } from 'child_process'

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')) as { version: string }

/** Commit being built: Netlify sets COMMIT_REF; fall back to local git for local builds. */
function getCommit(): string {
  if (process.env.COMMIT_REF) return process.env.COMMIT_REF
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'unknown'
  }
}

// Build metadata from Netlify's build env (https://docs.netlify.com/configure-builds/environment-variables/).
// Injected into the bundle and published as /version.json so QA can prove which commit is live.
const buildInfo = {
  version: pkg.version,
  commit: getCommit(),
  branch: process.env.BRANCH ?? 'local',
  context: process.env.CONTEXT ?? 'local',
  pullRequest: process.env.PULL_REQUEST === 'true' ? (process.env.REVIEW_ID ?? null) : null,
  deployId: process.env.DEPLOY_ID ?? null,
  builtAt: new Date().toISOString(),
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __BUILD_INFO__: JSON.stringify(buildInfo),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  plugins: [
    react(),
    {
      name: 'emit-version-json',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify(buildInfo, null, 2) + '\n' })
      },
    },
    VitePWA({
      injectRegister: false,
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Pepl - Employee Management App',
        short_name: 'Pepl',
        description: 'Employee Management Application',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        skipWaiting: false,
        clientsClaim: false,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Opening /version.json in the browser must hit the network, not the SPA fallback
        navigateFallbackDenylist: [/^\/version\.json$/],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MB (generated PWA icons are large; replace with optimized assets for production)
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
