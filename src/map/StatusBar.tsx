import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMap, useMapEvents } from 'react-leaflet'
import type { LatLng } from 'leaflet'

/**
 * Read-out of the cursor position (falling back to the map centre on touch
 * devices, which never fire mousemove) plus the current zoom level.
 */
export function StatusBar() {
  const map = useMap()
  const { t } = useTranslation()
  const [pointer, setPointer] = useState<LatLng | null>(null)
  const [zoom, setZoom] = useState(() => map.getZoom())
  const [center, setCenter] = useState(() => map.getCenter())

  useMapEvents({
    mousemove: (e) => setPointer(e.latlng),
    mouseout: () => setPointer(null),
    zoomend: () => setZoom(map.getZoom()),
    moveend: () => setCenter(map.getCenter()),
  })

  const position = pointer ?? center

  return (
    <div className="status-bar" role="status" aria-live="off">
      <span className="status-bar__label">
        {pointer ? t('map.status.pointer') : t('map.status.center')}
      </span>
      <span className="status-bar__value" title={t('map.status.coordinatesTitle')}>
        {position.lat.toFixed(5)}°N&nbsp;&nbsp;{position.lng.toFixed(5)}°Ø
      </span>
      <span className="status-bar__divider" aria-hidden="true" />
      <span className="status-bar__label">{t('map.status.zoom')}</span>
      <span className="status-bar__value">{zoom}</span>
    </div>
  )
}
