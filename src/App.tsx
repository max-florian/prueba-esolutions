import { PaymentContainer } from './components/PaymentContainer.tsx'
import { Unauthorized } from './components/Unauthorized.tsx'
import { useTokenAuth } from './hooks/useTokenAuth.ts'

function App() {
  const auth = useTokenAuth()

  if (auth.status === 'loading') {
    return <p role="status">Validando acceso…</p>
  }

  if (auth.status === 'unauthorized') {
    return <Unauthorized />
  }

  return <PaymentContainer user={auth.user} />
}

export default App
