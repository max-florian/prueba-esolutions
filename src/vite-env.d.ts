/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PORTAL_URL?: string
  readonly VITE_ENABLE_MOCKS?: string
}

interface Window {
  // Se define en /config.js, que se genera al arrancar el contenedor.
  __APP_CONFIG__?: unknown
}
