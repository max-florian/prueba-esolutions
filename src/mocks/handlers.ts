import { http, HttpResponse } from 'msw'
import type { User } from '../api/auth.ts'

export const VALID_TOKEN = 'token-valido'

export const MOCK_USER: User = {
  id: 'u-001',
  name: 'Ana Pérez',
  email: 'ana.perez@example.com',
}

export const handlers = [
  http.post('/api/validate-token', async ({ request }) => {
    const body = (await request.json().catch(() => null)) as { token?: unknown } | null

    if (body?.token !== VALID_TOKEN) {
      return HttpResponse.json({ error: 'invalid_token' }, { status: 401 })
    }

    return HttpResponse.json(MOCK_USER)
  }),
]
