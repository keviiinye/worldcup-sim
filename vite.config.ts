/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/football': {
        target: 'https://v3.football.api-sports.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/football/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const key = process.env.VITE_API_FOOTBALL_KEY
            if (key) {
              proxyReq.setHeader('x-apisports-key', key)
            }
          })
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
