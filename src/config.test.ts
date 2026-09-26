import { describe, expect, it } from 'vitest'
import { resolveConfig } from './config.ts'

const prodEnv = { DEV: false }

describe('resolveConfig', () => {
  it('usa valores por defecto de desarrollo sin configuración', () => {
    expect(resolveConfig(undefined, { DEV: true })).toEqual({
      portalUrl: 'http://localhost:5174/',
      portalOrigin: 'http://localhost:5174',
      enableMocks: true,
    })
  })

  it('la configuración en runtime tiene prioridad sobre la de build', () => {
    const config = resolveConfig(
      { portalUrl: 'https://pagos.cert.example.com/portal', enableMocks: 'false' },
      { DEV: true, VITE_PORTAL_URL: 'https://otro.example.com/', VITE_ENABLE_MOCKS: 'true' },
    )

    expect(config).toEqual({
      portalUrl: 'https://pagos.cert.example.com/portal',
      portalOrigin: 'https://pagos.cert.example.com',
      enableMocks: false,
    })
  })

  it('ignora valores vacíos (variable no definida al generar config.js)', () => {
    const config = resolveConfig(
      { portalUrl: '', enableMocks: '' },
      { ...prodEnv, VITE_PORTAL_URL: 'https://pagos.example.com/' },
    )

    expect(config.portalUrl).toBe('https://pagos.example.com/')
    expect(config.enableMocks).toBe(false)
  })

  it.each(['no-es-una-url', 'javascript:alert(1)', 'ftp://pagos.example.com'])(
    'falla con una portalUrl inválida: %s',
    (portalUrl) => {
      expect(() => resolveConfig({ portalUrl }, prodEnv)).toThrow(/portalUrl/)
    },
  )
})
