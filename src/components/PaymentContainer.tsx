import { useRef, useState } from 'react'
import type { User } from '../api/auth.ts'
import { config } from '../config.ts'
import { usePortalMessages } from '../hooks/usePortalMessages.ts'
import { PortalFrame } from './PortalFrame.tsx'

interface PaymentContainerProps {
  user: User
}

export function PaymentContainer({ user }: PaymentContainerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)

  usePortalMessages({
    allowedOrigin: config.portalOrigin,
    iframeRef,
    onPaymentApplied: (message) => setPaymentId(message.paymentId),
  })

  return (
    <main>
      <h1>Contenedor de pagos</h1>
      <p>
        Usuario: <strong>{user.name}</strong> ({user.email})
      </p>
      {paymentId && <p role="status">Pago recibido: {paymentId}</p>}
      <PortalFrame ref={iframeRef} />
    </main>
  )
}
