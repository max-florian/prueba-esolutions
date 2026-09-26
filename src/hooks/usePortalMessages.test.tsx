import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePortalMessages } from './usePortalMessages.ts'

const ALLOWED_ORIGIN = 'http://localhost:5174'
const VALID_MESSAGE = { type: 'payment.applied', paymentId: 'pay_123' }

describe('usePortalMessages', () => {
  let iframe: HTMLIFrameElement

  beforeEach(() => {
    iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
  })

  afterEach(() => iframe.remove())

  function setup() {
    const onPaymentApplied = vi.fn()
    const iframeRef = { current: iframe }
    const hook = renderHook(() =>
      usePortalMessages({ allowedOrigin: ALLOWED_ORIGIN, iframeRef, onPaymentApplied }),
    )
    return { onPaymentApplied, ...hook }
  }

  function postFromPortal(data: unknown, origin = ALLOWED_ORIGIN, source = iframe.contentWindow) {
    act(() => {
      window.dispatchEvent(new MessageEvent('message', { data, origin, source }))
    })
  }

  it('acepta un mensaje válido del origen configurado', () => {
    const { onPaymentApplied } = setup()

    postFromPortal(VALID_MESSAGE)

    expect(onPaymentApplied).toHaveBeenCalledWith(VALID_MESSAGE)
  })

  it('ignora mensajes de un origen no permitido', () => {
    const { onPaymentApplied } = setup()

    postFromPortal(VALID_MESSAGE, 'http://evil.example.com')
    postFromPortal(VALID_MESSAGE, 'http://localhost:5174.evil.example.com')

    expect(onPaymentApplied).not.toHaveBeenCalled()
  })

  it('ignora mensajes del origen correcto que no vienen del iframe', () => {
    const { onPaymentApplied } = setup()

    postFromPortal(VALID_MESSAGE, ALLOWED_ORIGIN, window)

    expect(onPaymentApplied).not.toHaveBeenCalled()
  })

  it('ignora mensajes con estructura inesperada', () => {
    const { onPaymentApplied } = setup()

    postFromPortal({ type: 'payment.applied' })
    postFromPortal({ type: 'otro', paymentId: 'pay_1' })
    postFromPortal('payment.applied')

    expect(onPaymentApplied).not.toHaveBeenCalled()
  })

  it('elimina el listener al desmontar', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { onPaymentApplied, unmount } = setup()

    unmount()
    postFromPortal(VALID_MESSAGE)

    expect(onPaymentApplied).not.toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalledWith('message', expect.any(Function))
    removeSpy.mockRestore()
  })
})
