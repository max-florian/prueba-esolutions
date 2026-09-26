import { delay, http, HttpResponse } from 'msw'
import type { User } from '../api/auth.ts'
import type { SendReceiptRequest, SendReceiptResponse } from '../api/receipts.ts'
import { isValidEmail, MAX_EMAILS } from '../lib/emails.ts'

export const VALID_TOKEN = 'token-valido'

export const MOCK_USER: User = {
  id: 'u-001',
  name: 'Ana Pérez',
  email: 'ana.perez@example.com',
}

// Simula el registro de idempotencia del backend.
const processedReceipts = new Map<string, SendReceiptResponse>()

function isValidReceiptRequest(body: unknown): body is SendReceiptRequest {
  if (typeof body !== 'object' || body === null) return false
  const { paymentId, emails } = body as Record<string, unknown>
  return (
    typeof paymentId === 'string' &&
    Array.isArray(emails) &&
    emails.length >= 1 &&
    emails.length <= MAX_EMAILS &&
    emails.every((email) => typeof email === 'string' && isValidEmail(email))
  )
}

export const handlers = [
  http.post('/api/validate-token', async ({ request }) => {
    const body = (await request.json().catch(() => null)) as { token?: unknown } | null

    if (body?.token !== VALID_TOKEN) {
      return HttpResponse.json({ error: 'invalid_token' }, { status: 401 })
    }

    return HttpResponse.json(MOCK_USER)
  }),

  http.post('/api/receipts', async ({ request }) => {
    const idempotencyKey = request.headers.get('Idempotency-Key')
    if (!idempotencyKey) {
      return HttpResponse.json({ error: 'missing_idempotency_key' }, { status: 400 })
    }

    const previous = processedReceipts.get(idempotencyKey)
    if (previous) {
      return HttpResponse.json(previous, { headers: { 'Idempotent-Replayed': 'true' } })
    }

    const body: unknown = await request.json().catch(() => null)
    if (!isValidReceiptRequest(body)) {
      return HttpResponse.json({ error: 'invalid_request' }, { status: 422 })
    }

    // En el navegador simula latencia real; en Node (tests) no espera.
    await delay()

    const result: SendReceiptResponse = { receiptId: `rcpt_${crypto.randomUUID()}` }
    processedReceipts.set(idempotencyKey, result)
    return HttpResponse.json(result, { status: 201 })
  }),
]
