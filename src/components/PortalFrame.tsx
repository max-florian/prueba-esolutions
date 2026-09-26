import { memo, type Ref } from 'react'
import { config } from '../config.ts'

interface PortalFrameProps {
  ref?: Ref<HTMLIFrameElement>
}

// memo + props estables: los re-renders del contenedor (por ejemplo al abrir
// o cerrar el modal) no tocan el iframe, así que nunca se recarga.
export const PortalFrame = memo(function PortalFrame({ ref }: PortalFrameProps) {
  return (
    <iframe
      ref={ref}
      title="Portal de pagos"
      src={config.portalUrl}
      // allow-same-origin mantiene el origen real del portal; sin él llegaría como "null".
      sandbox="allow-scripts allow-forms allow-same-origin"
      referrerPolicy="no-referrer"
      className="portal-frame"
    />
  )
})
