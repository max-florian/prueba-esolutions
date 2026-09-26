import { defineConfig } from 'vite'

// El portal se sirve en otro puerto (otro origen) que el contenedor.
export default defineConfig({
  envDir: '..',
  // Caché propia: si comparte node_modules/.vite con el contenedor, cada
  // servidor invalida la del otro y Vite re-optimiza y recarga en cada arranque.
  cacheDir: '../node_modules/.vite-portal',
  server: {
    port: 5174,
    strictPort: true,
  },
})
