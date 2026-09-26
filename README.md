# prueba-esolutions
Evaluación Técnica: Desarrollador Frontend Senior

## Parte A. Teórica

### 1. Problemas típicos con useEffect y cómo evitarlos

- Dependencias incorrectas: Si falta una, el efecto trabaja con valores viejos (stale closure). Si se incluye un objeto o función que se recrea en cada render, el efecto se ejecuta siempre y puede generar loops. Se evita con la regla react-hooks/exhaustive-deps, moviendo la función dentro del efecto o estabilizándola con useCallback/useMemo, y revisando si el efecto es realmente necesario (muchas veces es estado derivado que se calcula en el render).
- Condiciones de carrera: una petición vieja responde después de una nueva y sobrescribe el resultado correcto. Se evita cancelando con AbortController en el cleanup o con una bandera que descarte respuestas obsoletas. Librerías como TanStack Query ya lo resuelven.
- Listeners, timers o suscripciones sin limpiar: Provocan fugas de memoria y handlers duplicados. Todo lo que se registra en el efecto se libera en la función de cleanup, usando la misma referencia de la función.

### 2. Comunicación segura con postMessage entre una página y un iframe de otro dominio

- Al enviar, usar siempre el origen exacto del destino como targetOrigin, nunca '*'.
- Al recibir, comparar event.origin contra una whitelist de orígenes exactos (no usar includes ni endsWith, que se pueden burlar con dominios). Si no coincide, ignorar el mensaje.
- Verificar que event.source sea el contentWindow del iframe esperado.
- Validar la estructura del mensaje como input no confiable (type guard o schema), y nunca insertarlo en innerHTML ni evaluarlo.
- Definir un protocolo pequeño con tipos conocidos y descartar el resto.
- Remover el listener al desmontar.
- Tratar el mensaje como una notificación para la UI y confirmar el estado real con el backend.

### 3. Problemas de cookies y sesión con el iframe en otro dominio

- Las cookies del iframe pasan a ser cookies de terceros.
- SameSite: por defecto los navegadores aplican Lax, que no envía la cookie en un iframe cross-site. Se necesita SameSite=None; Secure, lo que obliga a usar HTTPS.
- Bloqueo de terceros: Safari (ITP) bloquea cookies de terceros, Firefox las particiona y Chrome también las restringe, así que SameSite=None no es suficiente.
- Soluciones, en orden de preferencia:
  - Servir el iframe bajo el mismo sitio (un subdominio del dominio principal) para que las cookies sean first-party.
  - Usar cookies particionadas (CHIPS) con el atributo Partitioned.
  - Usar la Storage Access API, que requiere un gesto del usuario.
  - No depender de cookies en el iframe: el contenedor envía un token de vida corta por postMessage y el iframe lo usa en el header Authorization, guardándolo solo en memoria.

### 4. JWT recibido por query string: riesgos y qué hacer al recibirlo

- Riesgos: la URL queda en el historial del navegador, en logs de servidores, proxies y CDN, en el header Referer hacia terceros, en herramientas de analítica y en enlaces compartidos. Quien lo obtenga puede reutilizarlo mientras no expire.
- Al recibirlo:
  - Leerlo al cargar la app, antes de que se ejecute analítica o cualquier script externo.
  - Eliminarlo de la URL de inmediato con history.replaceState.
  - Configurar Referrer-Policy como no-referrer o strict-origin.
  - Validarlo en el backend (firma, exp, aud, iss), no solo decodificarlo en el cliente.
  - Idealmente, que sea de un solo uso y vida corta, y que el backend lo intercambie por una sesión real en una cookie HttpOnly.

### 5. Dónde guardar el token de sesión en una aplicación bancaria y cómo manejar su expiración

- Almacenamiento:
  - Cookie HttpOnly; Secure; SameSite=Strict o Lax emitida por el backend, inaccesible desde JavaScript y por lo tanto protegida ante XSS.
  - No usar localStorage ni sessionStorage.
  - Idealmente un patrón BFF, donde el navegador nunca ve el token real.
  - Si el frontend necesita un access token, mantenerlo solo en memoria con vida corta, y el refresh token en cookie HttpOnly.
  - Protección CSRF adicional con token anti-CSRF en operaciones de escritura.
- Expiración:
  - Access token de 5 a 15 minutos y refresh token con rotación; si se detecta la reutilización de un refresh token, invalidar la sesión.
  - Ante un 401, intentar un único refresh encolando las peticiones pendientes; si falla, redirigir al login.
  - Cierre por inactividad con aviso previo al usuario.
  - Sincronizar el cierre de sesión entre pestañas con BroadcastChannel.
  - Al cerrar sesión, invalidar en el servidor y limpiar el estado del cliente.

### 6. Una misma imagen Docker para desarrollo, certificación y producción

- Las variables de import.meta.env quedan fijas en el bundle al compilar, así que la configuración por ambiente debe cargarse en tiempo de ejecución.
- Al arrancar el contenedor, un script de entrypoint genera un config.js o config.json a partir de variables de entorno (por ejemplo con envsubst sobre una plantilla) que define window.__APP_CONFIG__ con las URLs.
- El index.html carga ese archivo antes del bundle, o la app hace un fetch del JSON antes de montar React.
- Un módulo config.ts centraliza la lectura, con fallback a import.meta.env para desarrollo local.
- Servir ese archivo con Cache-Control: no-store.
- Cada ambiente solo cambia sus variables de entorno o ConfigMap; la imagen es la misma que se probó en certificación.
- Todo lo que va en ese archivo es público, por lo que no debe contener secretos.

### 7. Cómo evitar un pago o envío duplicado y por qué no basta con el frontend

- En la interfaz:
  - Deshabilitar el botón y mostrar estado de envío al primer clic.
  - Bloquear reenvíos mientras hay una petición en curso usando un ref como candado, ya que setState no es inmediato y un doble clic rápido puede pasar.
  - Generar un UUID por operación y enviarla en un header Idempotency-Key, reutilizándola en los reintentos.
- No basta con el frontend porque el frontend está bajo control del usuario. Puede haber varias pestañas, navegación hacia atrás, reintentos por red o de un proxy, o peticiones enviadas directamente sin pasar por la UI. La garantía real está en el backend, que registra la clave de idempotencia y, si se repite, devuelve la respuesta original sin procesar de nuevo.

### 8. CSP para una aplicación que embebe un portal de pagos en un iframe

- default-src 'self' como base restrictiva.
- frame-src con solo el origen exacto del portal de pagos, sin comodines.
- frame-ancestors 'none' o 'self' para que la aplicación no pueda ser embebida por terceros (clickjacking).
- script-src 'self' sin 'unsafe-inline' ni 'unsafe-eval'; si se requiere código inline, usar nonces o hashes.
- style-src 'self'.
- connect-src limitado a las APIs propias.
- img-src 'self' data:.
- form-action 'self'.
- object-src 'none' y base-uri 'none'.
- upgrade-insecure-requests.
- report-to para registrar violaciones, desplegando primero en modo Content-Security-Policy-Report-Only.
- Complementos fuera de la CSP: atributo sandbox en el iframe con solo los permisos necesarios, allow="payment" si el portal usa Payment Request API, y Referrer-Policy: strict-origin-when-cross-origin.


## Parte B. Práctica

Aplicación contenedora en React, TypeScript y Vite que valida un token, embebe un portal de pagos servido en otro puerto y recibe el pago por postMessage para enviar el comprobante por correo.

### Requisitos

- Node.js 22.12 o superior (el repositorio incluye `.nvmrc` con Node 24).
- npm.

### Cómo ejecutarlo

```bash
nvm use        # opcional, si se usa nvm
npm install
npm run dev
```

`npm run dev` levanta dos servidores:

- Contenedor: http://localhost:5173
- Portal de pagos: http://localhost:5174

La API se simula con msw en el navegador, no hace falta levantar un backend.

### Cómo probarlo

- Acceso válido: http://localhost:5173/?token=token-valido
- Acceso no autorizado: http://localhost:5173/?token=cualquier-otro o http://localhost:5173/

Flujo:

1. Con el token válido se muestra el usuario, el token desaparece de la URL y se carga el portal en el iframe.
2. En el portal, el botón "Aplicar pago" envía `{ type: 'payment.applied', paymentId }` al contenedor.
3. El contenedor abre el modal de comprobante: se agregan de 1 a 5 correos válidos y se envía.
4. Al cerrar el modal (botón Cerrar o Escape) el iframe mantiene su estado.

### Pruebas

```bash
npm test
```

Pruebas principales pedidas:

- Token inválido: `src/App.test.tsx`
- Mensaje de un origen no permitido: `src/App.test.tsx` y `src/hooks/usePortalMessages.test.tsx`
- Validación de correos: `src/components/ReceiptModal.test.tsx` y `src/lib/emails.test.ts`

También cubren: token válido en StrictMode, mensajes con estructura inesperada o de otra ventana, limpieza del listener, doble clic en Enviar, reintento con la misma clave de idempotencia, que el iframe no se recarga al cerrar el modal y la configuración en tiempo de ejecución.

### Otros comandos

- `npm run build`: compila el contenedor en `dist/`.
- `npm run build:portal`: compila el portal en `portal/dist/`.
- `npm run lint`: revisa el código con oxlint.
- `npm run test:watch`: pruebas en modo observación.

### Docker

La misma imagen sirve para cualquier ambiente. Las URLs se leen de un `config.js` que se genera al arrancar el contenedor a partir de variables de entorno.

```bash
docker compose up --build
```

- Contenedor: http://localhost:8080/?token=token-valido
- Portal: http://localhost:8081

Variables de entorno:

| Imagen | Variable | Descripción |
|---|---|---|
| app | `PORTAL_URL` | URL del portal embebido |
| app | `PORTAL_ORIGIN` | Origen del portal, usado en `frame-src` de la CSP |
| app | `ENABLE_MOCKS` | `true` para usar la API simulada (no hay backend real) |
| portal | `CONTAINER_ORIGIN` | Origen del contenedor, destino del postMessage y `frame-ancestors` |

### Estructura

```
src/
  api/          llamadas a la API (validar token, enviar comprobante)
  components/   PaymentContainer, PortalFrame, ReceiptModal, Unauthorized
  hooks/        useTokenAuth, usePortalMessages
  lib/          validación de correos y de mensajes del portal
  mocks/        handlers de msw (navegador y pruebas)
  config.ts     configuración en tiempo de ejecución
portal/         página HTML del portal de pagos
docker/         plantillas de nginx y config.js, script de arranque
```

### Decisiones

- Solo frontend: el enunciado pide una API simulada. msw intercepta `fetch` tanto en el navegador como en las pruebas, así que el código es el mismo que con un backend real.
- Token: se lee una sola vez, se elimina de la URL de inmediato con `history.replaceState` (sea válido o no) y se envía a la API en el body, no en la URL. En producción el backend lo cambiaría por una sesión en cookie `HttpOnly`.
- Seguridad de mensajes: se valida el origen exacto, que `event.source` sea el iframe y la estructura del mensaje. El portal envía a un `targetOrigin` explícito, nunca `'*'`.
- Iframe sin recargas: el iframe queda siempre montado y memoizado; el modal se renderiza al lado, no en su lugar.
- Envíos duplicados: el botón se bloquea con un `ref` síncrono y cada comprobante lleva un `Idempotency-Key`. La API simulada devuelve la misma respuesta si la clave se repite, que es la garantía real que debe dar el backend.
- Configuración: `window.__APP_CONFIG__` tiene prioridad sobre las variables de Vite, para no recompilar por ambiente.
- CSP: las plantillas de nginx aplican `frame-src` solo al portal y `frame-ancestors` restringido en ambos lados.
