import { useCallback, useRef, useState } from 'react'
import type { User } from '../api/auth.ts'
import { config } from '../config.ts'
import { usePortalMessages } from '../hooks/usePortalMessages.ts'
import { PortalFrame } from './PortalFrame.tsx'
import { ReceiptModal } from './ReceiptModal.tsx'

interface PaymentContainerProps {
  user: User
}

export function PaymentContainer({ user }: PaymentContainerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const closeModal = useCallback(() => setPaymentId(null), [])

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
      {/* El iframe siempre queda montado; el modal se superpone, no lo reemplaza. */}
      <PortalFrame ref={iframeRef} />
      {paymentId && <ReceiptModal key={paymentId} paymentId={paymentId} onClose={closeModal} />}
    </main>
  )
}
