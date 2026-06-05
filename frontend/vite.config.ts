import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

const proxyApiTarget = process.env.VITE_PROXY_API_TARGET ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: proxyApiTarget,
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/react/setup.ts'],
    exclude: [...configDefaults.exclude, 'src/test/playwright/**'],
  },
})
