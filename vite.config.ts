import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: './',
  server: {
    proxy: {
      '/api': {
        target: 'https://inversionappb-backend.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  define: {
    // Expose backend URL to the app (used by Capacitor build)
    __BACKEND_URL__: JSON.stringify(
      process.env.VITE_BACKEND_URL ?? 'https://inversionappb-backend.onrender.com'
    ),
  },
  plugins: [
    react(),
    // Disable PWA plugin entirely for Capacitor builds — SW doesn't work with file:// protocol
    ...(process.env.VITE_CAPACITOR !== 'true' ? [VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'InversionAPP',
        short_name: 'InversionAPP',
        description: 'Monthly Investment Advisor',
        theme_color: '#0F1117',
        background_color: '#0F1117',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/inversionappb-backend\.onrender\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    })] : []),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
  },
})
