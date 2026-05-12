import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            const location = proxyRes.headers.location
            if (typeof location === 'string') {
              proxyRes.headers.location = location.replace('http://localhost:8000', '')
            }
          })
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
