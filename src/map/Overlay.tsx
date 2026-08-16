import { useCallback } from 'react'
import type { ReactNode } from 'react'
import { DomEvent } from 'leaflet'

type Position = 'top-left' | 'top-right' | 'right' | 'bottom-left'

/**
 * Positions plain React UI on top of the map.
 *
 * Children of <MapContainer> land inside the Leaflet container, so without
 * this the map would pan when you drag a panel and zoom when you scroll one.
 * Leaflet's own controls solve that with DomEvent; we do the same.
 */
export function Overlay({ position, children }: { position: Position; children: ReactNode }) {
  const ref = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    DomEvent.disableClickPropagation(node)
    DomEvent.disableScrollPropagation(node)
  }, [])

  return (
    <div ref={ref} className="map-overlay" data-position={position}>
      {children}
    </div>
  )
}
