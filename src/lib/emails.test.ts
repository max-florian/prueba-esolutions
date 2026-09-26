import { describe, expect, it } from 'vitest'
import { getEmailError, isValidEmail, normalizeEmail } from './emails.ts'

describe('emails', () => {
  it.each(['ana@example.com', 'ana.perez+pagos@banco.com.gt', 'a_b@sub.dominio.io'])(
    'acepta %s',
    (email) => expect(isValidEmail(email)).toBe(true),
  )

  it.each(['', 'ana', 'ana@', '@example.com', 'ana@example', 'ana perez@example.com', 'ana@example.c'])(
    'rechaza "%s"',
    (email) => expect(isValidEmail(email)).toBe(false),
  )

  it('normaliza espacios y mayúsculas', () => {
    expect(normalizeEmail('  Ana@Example.COM ')).toBe('ana@example.com')
  })

  it('rechaza duplicados y más de 5 correos', () => {
    const five = ['a@x.com', 'b@x.com', 'c@x.com', 'd@x.com', 'e@x.com']
    expect(getEmailError('a@x.com', ['a@x.com'])).toMatch(/ya fue agregado/)
    expect(getEmailError('f@x.com', five)).toMatch(/hasta 5/)
    expect(getEmailError('f@x.com', five.slice(0, 4))).toBeNull()
  })
})
