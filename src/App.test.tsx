import { act, render, screen } from '@testing-library/react'
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
    expect(screen.getByTitle('Portal de pagos')).toHaveAttribute('src', 'http://localhost:5174/')
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
    expect(screen.queryByTitle('Portal de pagos')).not.toBeInTheDocument()
    expect(called).toBe(false)
  })

  it('muestra acceso no autorizado si la API falla', async () => {
    setUrl(`/?token=${VALID_TOKEN}`)
    server.use(http.post('/api/validate-token', () => HttpResponse.error()))

    render(<App />)

    expect(await screen.findByRole('heading', { name: /acceso no autorizado/i })).toBeInTheDocument()
  })
})

describe('Mensajes del portal', () => {
  async function renderAuthorized() {
    setUrl(`/?token=${VALID_TOKEN}`)
    render(<App />)
    await screen.findByText(MOCK_USER.name)
    return screen.getByTitle<HTMLIFrameElement>('Portal de pagos')
  }

  function post(data: unknown, origin: string, source: Window | null) {
    act(() => {
      window.dispatchEvent(new MessageEvent('message', { data, origin, source }))
    })
  }

  const payment = { type: 'payment.applied', paymentId: 'pay_123' }

  it('ignora un pago enviado desde un origen no permitido', async () => {
    const iframe = await renderAuthorized()

    post(payment, 'http://evil.example.com', iframe.contentWindow)

    expect(screen.queryByText(/pago recibido/i)).not.toBeInTheDocument()
  })

  it('procesa un pago enviado desde el portal configurado', async () => {
    const iframe = await renderAuthorized()

    post(payment, 'http://localhost:5174', iframe.contentWindow)

    expect(screen.getByText('Pago recibido: pay_123')).toBeInTheDocument()
  })
})
