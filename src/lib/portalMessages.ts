export interface PaymentAppliedMessage {
  type: 'payment.applied'
  paymentId: string
}

const PAYMENT_ID_PATTERN = /^[\w-]{1,100}$/

// Todo lo que llega por postMessage es input no confiable: se valida la forma
// exacta antes de usarlo.
export function isPaymentAppliedMessage(data: unknown): data is PaymentAppliedMessage {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return false
  const message = data as Record<string, unknown>
  return (
    message.type === 'payment.applied' &&
    typeof message.paymentId === 'string' &&
    PAYMENT_ID_PATTERN.test(message.paymentId)
  )
}
