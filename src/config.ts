export interface AppConfig {
  portalUrl: string
  portalOrigin: string
  enableMocks: boolean
}

interface BuildEnv {
  DEV: boolean
  VITE_PORTAL_URL?: string
  VITE_ENABLE_MOCKS?: string
}

const DEFAULT_PORTAL_URL = 'http://localhost:5174/'

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

function parseBoolean(value: unknown): boolean | undefined {
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return undefined
}

function parseHttpUrl(value: string): URL {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`portalUrl inválida: "${value}"`)
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`portalUrl debe ser http(s): "${value}"`)
  }
  return url
}

// Prioridad: config en runtime (window.__APP_CONFIG__, generado al arrancar el
// contenedor) > variables de Vite (build) > valores por defecto de desarrollo.
// Así la misma imagen sirve para desarrollo, certificación y producción.
export function resolveConfig(runtime: unknown, env: BuildEnv): AppConfig {
  const source = typeof runtime === 'object' && runtime !== null ? (runtime as Record<string, unknown>) : {}

  const portalUrl = parseHttpUrl(
    nonEmptyString(source.portalUrl) ?? nonEmptyString(env.VITE_PORTAL_URL) ?? DEFAULT_PORTAL_URL,
  )

  const enableMocks = parseBoolean(source.enableMocks) ?? parseBoolean(env.VITE_ENABLE_MOCKS) ?? env.DEV

  return {
    portalUrl: portalUrl.href,
    // Solo se aceptan mensajes de este origen exacto.
    portalOrigin: portalUrl.origin,
    enableMocks,
  }
}

export const config = resolveConfig(window.__APP_CONFIG__, import.meta.env)
