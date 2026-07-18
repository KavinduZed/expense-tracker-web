/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    env: {
      // Absolute base so MSW can match requests in unit tests.
      VITE_API_BASE_URL: 'http://localhost:5000',
      // Keep demo mode out of tests regardless of any local .env.
      VITE_ENABLE_MOCKS: 'false',
    },
  },
})
