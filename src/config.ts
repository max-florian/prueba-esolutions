const portalUrl = import.meta.env.VITE_PORTAL_URL ?? 'http://localhost:5174/'

export const config = {
  portalUrl,
  // Solo se aceptan mensajes de este origen exacto.
  portalOrigin: new URL(portalUrl).origin,
} as const
