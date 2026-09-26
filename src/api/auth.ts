export interface User {
  id: string
  name: string
  email: string
}

function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.id === 'string' && typeof v.name === 'string' && typeof v.email === 'string'
}

// El token viaja en el body, no en la URL, para que no quede en logs ni en el Referer.
export async function validateToken(token: string, signal?: AbortSignal): Promise<User | null> {
  const response = await fetch('/api/validate-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
    signal,
  })

  if (!response.ok) return null

  const data: unknown = await response.json()
  return isUser(data) ? data : null
}
