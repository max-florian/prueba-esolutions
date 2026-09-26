/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  // msw se importa dinámicamente en main.tsx; sin esto Vite lo descubre tarde,
  // recarga la página y el token ya no está en la URL.
  optimizeDeps: {
    include: ['msw/browser'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    restoreMocks: true,
  },
})
