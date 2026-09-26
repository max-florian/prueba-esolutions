import { useEffect, useState } from 'react'
import { validateToken, type User } from '../api/auth.ts'

export type AuthState =
  | { status: 'loading' }
  | { status: 'authorized'; user: User }
  | { status: 'unauthorized' }

const TOKEN_PARAM = 'token'

function readTokenFromUrl(): string | null {
  const token = new URLSearchParams(window.location.search).get(TOKEN_PARAM)
  return token?.trim() || null
}

function removeTokenFromUrl() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has(TOKEN_PARAM)) return
  url.searchParams.delete(TOKEN_PARAM)
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
}

export function useTokenAuth(): AuthState {
  // Se lee una sola vez al montar. Guardarlo en estado evita perderlo cuando
  // StrictMode vuelve a ejecutar el efecto después de haber limpiado la URL.
  const [token] = useState(readTokenFromUrl)
  const [state, setState] = useState<AuthState>(() =>
    token ? { status: 'loading' } : { status: 'unauthorized' },
  )

  useEffect(() => {
    // Se limpia la URL de inmediato, sea válido o no, para que no quede en el historial.
    removeTokenFromUrl()
    if (!token) return

    const controller = new AbortController()

    validateToken(token, controller.signal)
      .then((user) => {
        setState(user ? { status: 'authorized', user } : { status: 'unauthorized' })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        console.error('Error validando el token', error)
        setState({ status: 'unauthorized' })
      })

    return () => controller.abort()
  }, [token])

  return state
}
