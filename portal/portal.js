// Origen exacto del contenedor. Nunca se usa '*' como targetOrigin.
const CONTAINER_ORIGIN = import.meta.env.VITE_CONTAINER_ORIGIN ?? 'http://localhost:5173'

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
