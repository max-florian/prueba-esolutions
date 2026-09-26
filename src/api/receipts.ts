export interface SendReceiptRequest {
  paymentId: string
  emails: string[]
}

export interface SendReceiptResponse {
  receiptId: string
}

// La clave de idempotencia es la garantía real contra duplicados: si la
// petición se repite (doble clic, reintento, otra pestaña) el backend
// devuelve la misma respuesta sin volver a enviar.
export async function sendReceipt(
  request: SendReceiptRequest,
  idempotencyKey: string,
): Promise<SendReceiptResponse> {
  const response = await fetch('/api/receipts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`Error enviando el comprobante (${response.status})`)
  }

  return (await response.json()) as SendReceiptResponse
}
