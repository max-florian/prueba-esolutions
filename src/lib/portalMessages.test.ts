import { describe, expect, it } from 'vitest'
import { isPaymentAppliedMessage } from './portalMessages.ts'

describe('isPaymentAppliedMessage', () => {
  it('acepta un mensaje con la estructura esperada', () => {
    expect(isPaymentAppliedMessage({ type: 'payment.applied', paymentId: 'pay_123-abc' })).toBe(true)
  })

  it.each([
    ['null', null],
    ['string', 'payment.applied'],
    ['array', [{ type: 'payment.applied', paymentId: 'pay_1' }]],
    ['otro type', { type: 'payment.failed', paymentId: 'pay_1' }],
    ['sin paymentId', { type: 'payment.applied' }],
    ['paymentId numérico', { type: 'payment.applied', paymentId: 123 }],
    ['paymentId vacío', { type: 'payment.applied', paymentId: '' }],
    ['paymentId con HTML', { type: 'payment.applied', paymentId: '<img src=x onerror=alert(1)>' }],
  ])('rechaza %s', (_, data) => {
    expect(isPaymentAppliedMessage(data)).toBe(false)
  })
})
