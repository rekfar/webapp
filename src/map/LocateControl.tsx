import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMap, useMapEvents } from 'react-leaflet'
import type { LatLng } from 'leaflet'

type LocateState = 'idle' | 'locating' | 'error'

/**
 * "Where am I" control. Uses Leaflet's own `map.locate`, which wraps the
 * browser geolocation API and emits locationfound / locationerror.
 */
export function LocateControl({ onLocated }: { onLocated: (latlng: LatLng) => void }) {
  const map = useMap()
  const { t } = useTranslation()
  const [state, setState] = useState<LocateState>('idle')

  useMapEvents({
    locationfound: (e) => {
      setState('idle')
      onLocated(e.latlng)
    },
    locationerror: () => setState('error'),
  })

  const locate = () => {
    setState('locating')
    map.locate({ setView: true, maxZoom: 14, enableHighAccuracy: true })
  }

  const label = t(`map.locate.${state}`)

  return (
    <button
      type="button"
      className="control-button"
      onClick={locate}
      disabled={state === 'locating'}
      aria-label={label}
      title={label}
      data-state={state}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <circle cx="12" cy="12" r="3.5" fill="currentColor" />
        <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
}
