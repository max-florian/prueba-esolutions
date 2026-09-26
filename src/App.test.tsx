import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App.tsx'
import { MOCK_USER, VALID_TOKEN } from './mocks/handlers.ts'
import { server } from './mocks/server.ts'

function setUrl(path: string) {
  window.history.replaceState(null, '', path)
}

describe('Acceso por token', () => {
  beforeEach(() => setUrl('/'))

  it('muestra acceso no autorizado con un token inválido y lo elimina de la URL', async () => {
    setUrl('/?token=token-falso&otro=1')

    render(<App />)

    expect(await screen.findByRole('heading', { name: /acceso no autorizado/i })).toBeInTheDocument()
    expect(window.location.search).toBe('?otro=1')
  })

  it('muestra el usuario con un token válido y lo elimina de la URL', async () => {
    setUrl(`/?token=${VALID_TOKEN}`)

    // StrictMode ejecuta el efecto dos veces: el token no debe perderse al limpiar la URL.
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

    expect(await screen.findByText(MOCK_USER.name)).toBeInTheDocument()
    expect(window.location.search).toBe('')
  })

  it('muestra acceso no autorizado sin token y no llama a la API', async () => {
    let called = false
    server.use(
      http.post('/api/validate-token', () => {
        called = true
        return HttpResponse.json(MOCK_USER)
      }),
    )

    render(<App />)

    expect(screen.getByRole('heading', { name: /acceso no autorizado/i })).toBeInTheDocument()
    expect(called).toBe(false)
  })

  it('muestra acceso no autorizado si la API falla', async () => {
    setUrl(`/?token=${VALID_TOKEN}`)
    server.use(http.post('/api/validate-token', () => HttpResponse.error()))

    render(<App />)

    expect(await screen.findByRole('heading', { name: /acceso no autorizado/i })).toBeInTheDocument()
  })
})
