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

  return (
    <main>
      <h1>Contenedor de pagos</h1>
      <p>
        Usuario: <strong>{auth.user.name}</strong> ({auth.user.email})
      </p>
    </main>
  )
}

export default App
