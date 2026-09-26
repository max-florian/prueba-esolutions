import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { server } from '../mocks/server.ts'
import { ReceiptModal } from './ReceiptModal.tsx'

function setup() {
  const onClose = vi.fn()
  const user = userEvent.setup()
  render(<ReceiptModal paymentId="pay_123" onClose={onClose} />)

  const input = screen.getByLabelText('Correo electrónico')
  const addButton = screen.getByRole('button', { name: 'Agregar' })
  const sendButton = screen.getByRole('button', { name: 'Enviar' })
  const list = screen.getByRole('list', { name: 'Correos agregados' })

  async function addEmail(email: string) {
    await user.clear(input)
    await user.type(input, email)
    await user.click(addButton)
  }

  return { user, onClose, input, addButton, sendButton, list, addEmail }
}

describe('ReceiptModal: validación de correos', () => {
  it('no permite enviar sin al menos un correo', () => {
    const { sendButton } = setup()

    expect(sendButton).toBeDisabled()
  })

  it('rechaza un correo con formato inválido', async () => {
    const { addEmail, list, sendButton } = setup()

    await addEmail('correo-invalido')

    expect(screen.getByRole('alert')).toHaveTextContent('El correo no tiene un formato válido.')
    expect(within(list).queryAllByRole('listitem')).toHaveLength(0)
    expect(sendButton).toBeDisabled()
  })

  it('agrega correos válidos normalizados y rechaza duplicados', async () => {
    const { addEmail, list, sendButton } = setup()

    await addEmail('  Ana@Example.com ')
    await addEmail('ana@example.com')

    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
    expect(within(list).getByText(/ana@example\.com/)).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Ese correo ya fue agregado.')
    expect(sendButton).toBeEnabled()
  })

  it('permite como máximo 5 correos', async () => {
    const { addEmail, list, input, addButton } = setup()

    for (const n of [1, 2, 3, 4, 5]) await addEmail(`user${n}@example.com`)

    expect(within(list).getAllByRole('listitem')).toHaveLength(5)
    expect(screen.getByText('5/5 correos')).toBeInTheDocument()
    expect(input).toBeDisabled()
    expect(addButton).toBeDisabled()
  })

  it('permite quitar un correo', async () => {
    const { addEmail, list, user } = setup()

    await addEmail('ana@example.com')
    await user.click(screen.getByRole('button', { name: 'Quitar ana@example.com' }))

    expect(within(list).queryAllByRole('listitem')).toHaveLength(0)
  })
})

describe('ReceiptModal: envío', () => {
  it('evita envíos duplicados ante un doble clic', async () => {
    const requests: Request[] = []
    server.events.on('request:start', ({ request }) => {
      if (request.url.endsWith('/api/receipts')) requests.push(request.clone())
    })
    const { addEmail, user, sendButton } = setup()

    await addEmail('ana@example.com')
    await user.dblClick(sendButton)

    expect(await screen.findByText('Comprobante enviado.')).toBeInTheDocument()
    expect(requests).toHaveLength(1)
    expect(requests[0].headers.get('Idempotency-Key')).toBeTruthy()
    expect(await requests[0].json()).toEqual({ paymentId: 'pay_123', emails: ['ana@example.com'] })
    expect(sendButton).toBeDisabled()
  })

  it('reintenta con la misma clave de idempotencia si el envío falla', async () => {
    const keys: (string | null)[] = []
    let attempt = 0
    server.use(
      http.post('/api/receipts', ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key'))
        attempt += 1
        return attempt === 1
          ? HttpResponse.json({ error: 'unavailable' }, { status: 503 })
          : HttpResponse.json({ receiptId: 'rcpt_1' }, { status: 201 })
      }),
    )
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { addEmail, user, sendButton } = setup()

    await addEmail('ana@example.com')
    await user.click(sendButton)
    expect(await screen.findByText(/no se pudo enviar/i)).toBeInTheDocument()

    await user.click(sendButton)
    await waitFor(() => expect(screen.getByText('Comprobante enviado.')).toBeInTheDocument())

    expect(keys).toHaveLength(2)
    expect(keys[0]).toBe(keys[1])
  })

  it('se cierra con Escape y con el botón Cerrar', async () => {
    const { user, onClose } = setup()

    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))

    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
