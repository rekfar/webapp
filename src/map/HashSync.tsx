import { useEffect } from 'react'
import { useMap, useMapEvent } from 'react-leaflet'

/**
 * Keeps the URL fragment in sync with the viewport as `#zoom/lat/lon`
 * (the same convention osm.org and norgeskart use), so any view is
 * linkable and survives a reload.
 */

export interface HashView {
  zoom: number
  lat: number
  lon: number
}

export function parseHash(hash: string): HashView | null {
  const parts = hash.replace(/^#/, '').split('/')
  if (parts.length !== 3) return null

  const [zoom, lat, lon] = parts.map(Number)
  if (![zoom, lat, lon].every(Number.isFinite)) return null
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null

  return { zoom, lat, lon }
}

export function formatHash({ zoom, lat, lon }: HashView): string {
  // ~1 m of precision is plenty and keeps the URL readable.
  const decimals = Math.max(0, Math.min(7, Math.round(zoom / 2)))
  return `#${zoom}/${lat.toFixed(decimals)}/${lon.toFixed(decimals)}`
}

export function HashSync() {
  const map = useMap()

  const write = () => {
    const { lat, lng } = map.getCenter()
    const next = formatHash({ zoom: map.getZoom(), lat, lon: lng })
    if (next !== window.location.hash) {
      window.history.replaceState(null, '', next)
    }
  }

  useMapEvent('moveend', write)
  useMapEvent('zoomend', write)

  // Respond to back/forward navigation and hand-edited URLs.
  useEffect(() => {
    const onHashChange = () => {
      const view = parseHash(window.location.hash)
      if (!view) return

      const { lat, lng } = map.getCenter()
      const unchanged =
        map.getZoom() === view.zoom &&
        Math.abs(lat - view.lat) < 1e-6 &&
        Math.abs(lng - view.lon) < 1e-6
      if (unchanged) return

      map.setView([view.lat, view.lon], view.zoom)
    }

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [map])

  return null
}
