import { useEffect, useEffectEvent, type RefObject } from 'react'
import { isPaymentAppliedMessage, type PaymentAppliedMessage } from '../lib/portalMessages.ts'

interface UsePortalMessagesOptions {
  allowedOrigin: string
  iframeRef: RefObject<HTMLIFrameElement | null>
  onPaymentApplied: (message: PaymentAppliedMessage) => void
}

export function usePortalMessages({
  allowedOrigin,
  iframeRef,
  onPaymentApplied,
}: UsePortalMessagesOptions) {
  // useEffectEvent siempre ve el callback más reciente sin volver a registrar el listener.
  const handlePaymentApplied = useEffectEvent(onPaymentApplied)

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // 1. Origen exacto, sin includes/endsWith.
      if (event.origin !== allowedOrigin) return
      // 2. Tiene que venir de nuestro iframe, no de otra ventana del mismo origen.
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return
      // 3. Estructura esperada.
      if (!isPaymentAppliedMessage(event.data)) return

      handlePaymentApplied({ type: event.data.type, paymentId: event.data.paymentId })
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [allowedOrigin, iframeRef])
}
