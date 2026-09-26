// Origen exacto del contenedor. Nunca se usa '*' como targetOrigin.
// Prioridad: config en runtime > variable de Vite > valor de desarrollo.
const CONTAINER_ORIGIN =
  window.__PORTAL_CONFIG__?.containerOrigin ||
  import.meta.env.VITE_CONTAINER_ORIGIN ||
  'http://localhost:5173'

const button = document.getElementById('apply-payment')
const status = document.getElementById('status')

button.addEventListener('click', () => {
  if (window.parent === window) {
    status.textContent = 'Esta página debe abrirse dentro del contenedor.'
    return
  }

  const paymentId = `pay_${crypto.randomUUID()}`
  window.parent.postMessage({ type: 'payment.applied', paymentId }, CONTAINER_ORIGIN)
  status.textContent = `Pago aplicado: ${paymentId}`
})
