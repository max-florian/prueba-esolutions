import { defineConfig } from 'vite'

// El portal se sirve en otro puerto (otro origen) que el contenedor.
export default defineConfig({
  envDir: '..',
  server: {
    port: 5174,
    strictPort: true,
  },
})
