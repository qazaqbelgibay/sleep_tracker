import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/sleep_tracker/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      manifest: {
        name: 'Sleep Tracker',
        short_name: 'Sleep',
        description: 'Smart sleep coaching app — know when to sleep, track what works',
        start_url: '/sleep_tracker/',
        scope: '/sleep_tracker/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        orientation: 'portrait',
        icons: [
          {
            src: '/sleep_tracker/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/sleep_tracker/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
