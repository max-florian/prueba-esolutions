export const MAX_EMAILS = 5

// Suficiente para la UI; la validación definitiva siempre la hace el backend.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_PATTERN.test(email)
}

// Devuelve el mensaje de error, o null si el correo se puede agregar.
export function getEmailError(email: string, current: readonly string[]): string | null {
  if (current.length >= MAX_EMAILS) return `Puedes agregar hasta ${MAX_EMAILS} correos.`
  if (!email) return 'Escribe un correo.'
  if (!isValidEmail(email)) return 'El correo no tiene un formato válido.'
  if (current.includes(email)) return 'Ese correo ya fue agregado.'
  return null
}
