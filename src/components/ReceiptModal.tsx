import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { sendReceipt } from '../api/receipts.ts'
import { getEmailError, MAX_EMAILS, normalizeEmail } from '../lib/emails.ts'

interface ReceiptModalProps {
  paymentId: string
  onClose: () => void
}

type SendStatus = 'idle' | 'sending' | 'sent' | 'error'

export function ReceiptModal({ paymentId, onClose }: ReceiptModalProps) {
  const titleId = useId()
  const inputId = useId()
  const errorId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const [emails, setEmails] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [status, setStatus] = useState<SendStatus>('idle')

  // Una clave por comprobante: se reutiliza en los reintentos para que el
  // backend reconozca la operación como la misma.
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  // Candado síncrono: setState no es inmediato y un doble clic rápido se colaría.
  const sendingRef = useRef(false)

  const isFull = emails.length >= MAX_EMAILS
  const isLocked = status === 'sending' || status === 'sent'
  const canSend = emails.length > 0 && !isLocked

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleAddEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = normalizeEmail(draft)
    const error = getEmailError(email, emails)
    setEmailError(error)
    if (error) return

    setEmails((current) => [...current, email])
    setDraft('')
    inputRef.current?.focus()
  }

  function handleRemoveEmail(email: string) {
    setEmails((current) => current.filter((item) => item !== email))
    setEmailError(null)
  }

  async function handleSend() {
    if (sendingRef.current || !canSend) return
    sendingRef.current = true
    setStatus('sending')

    try {
      await sendReceipt({ paymentId, emails }, idempotencyKey)
      setStatus('sent')
      setDraft('')
      setEmailError(null)
    } catch (error) {
      console.error(error)
      setStatus('error')
      sendingRef.current = false
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId}>Enviar comprobante</h2>
        <p>
          Pago <code>{paymentId}</code> aplicado. Agrega de 1 a {MAX_EMAILS} correos.
        </p>

        <form onSubmit={handleAddEmail} noValidate>
          <label htmlFor={inputId}>Correo electrónico</label>
          <div className="row">
            <input
              ref={inputRef}
              id={inputId}
              type="email"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value)
                setEmailError(null)
              }}
              disabled={isFull || isLocked}
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? errorId : undefined}
            />
            <button type="submit" disabled={isFull || isLocked}>
              Agregar
            </button>
          </div>
          {emailError && (
            <p id={errorId} role="alert" className="error">
              {emailError}
            </p>
          )}
        </form>

        <p className="hint">
          {emails.length}/{MAX_EMAILS} correos
        </p>
        <ul className="email-list" aria-label="Correos agregados">
          {emails.map((email) => (
            <li key={email}>
              <span>{email}</span>
              <button
                type="button"
                className="btn-link"
                onClick={() => handleRemoveEmail(email)}
                disabled={isLocked}
                aria-label={`Quitar ${email}`}
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>

        {status === 'sent' && (
          <p role="status" className="success">
            Comprobante enviado.
          </p>
        )}
        {status === 'error' && (
          <p role="alert" className="error">
            No se pudo enviar el comprobante. Intenta de nuevo.
          </p>
        )}

        <div className="row actions">
          <button type="button" onClick={onClose}>
            Cerrar
          </button>
          <button type="button" className="btn-primary" onClick={handleSend} disabled={!canSend}>
            {status === 'sending' ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  )
}
