import { useCallback, useEffect, useRef, useState } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import type { Map as LeafletMap } from 'leaflet'

import { fetchPeaks } from '../api/peaks'
import type { PeakFeature } from '../api/peaks'
import { PEAKS_DEBOUNCE_MS, PEAKS_LIMIT, PEAKS_VIEWPORT_PADDING } from '../config/api'

export type PeaksStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface PeaksInView {
  peaks: PeakFeature[]
  /** Attribution as the payload sent it, or null before the first response. */
  attribution: string | null
  /** The extent held more peaks than were returned. */
  truncated: boolean
  status: PeaksStatus
  error: Error | null
  /** Refetch the current extent now, skipping the debounce. */
  refresh: () => void
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * The viewport as the `bbox` the API expects: `west,south,east,north` in WGS84
 * degrees — the same ordering `bounds.toBBoxString()` emits.
 *
 * Assembled by hand only because the values need clamping first. The API
 * rejects a longitude outside ±180, a latitude outside ±90, and any box that is
 * not strictly ordered; padding a zoomed-out viewport produces all three, and
 * `maxBoundsViscosity` resists dragging past the bounds rather than forbidding
 * it. Returns null for a degenerate extent, which is nothing worth asking for.
 */
function viewportBbox(map: LeafletMap): string | null {
  const bounds = map.getBounds().pad(PEAKS_VIEWPORT_PADDING)

  const west = clamp(bounds.getWest(), -180, 180)
  const south = clamp(bounds.getSouth(), -90, 90)
  const east = clamp(bounds.getEast(), -180, 180)
  const north = clamp(bounds.getNorth(), -90, 90)

  if (west >= east || south >= north) return null

  // Six decimals is ~10 cm. Rounding also means a viewport returned to keeps
  // the URL it had, so the response's Cache-Control can actually be used.
  return [west, south, east, north].map((value) => value.toFixed(6)).join(',')
}

/**
 * Keeps the peaks in the current map extent loaded (FR-MAP-5).
 *
 * Refetches when the viewport settles, debounced — a drag ends in one `moveend`
 * but a wheel zoom fires a burst of them, and the API rate-limits per caller.
 * Each new extent aborts the request still in flight, so a fast pan across the
 * country leaves one response to render rather than a queue of stale ones.
 */
export function usePeaksInView(): PeaksInView {
  const map = useMap()

  const [peaks, setPeaks] = useState<PeakFeature[]>([])
  const [attribution, setAttribution] = useState<string | null>(null)
  const [truncated, setTruncated] = useState(false)
  const [status, setStatus] = useState<PeaksStatus>('idle')
  const [error, setError] = useState<Error | null>(null)

  const inFlight = useRef<AbortController | null>(null)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(() => {
    const bbox = viewportBbox(map)
    if (!bbox) return

    inFlight.current?.abort()
    const request = new AbortController()
    inFlight.current = request

    setStatus('loading')
    setError(null)

    fetchPeaks({ bbox, limit: PEAKS_LIMIT, signal: request.signal })
      .then((collection) => {
        if (request.signal.aborted) return
        setPeaks(collection.features)
        setAttribution(collection.attribution)
        setTruncated(collection.truncated)
        setStatus('ready')
      })
      .catch((cause: unknown) => {
        // A superseded request is not a failure — the map already moved on.
        if (request.signal.aborted) return
        setError(cause instanceof Error ? cause : new Error(String(cause)))
        setStatus('error')
      })
  }, [map])

  const schedule = useCallback(() => {
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(load, PEAKS_DEBOUNCE_MS)
  }, [load])

  useMapEvents({ moveend: schedule, zoomend: schedule })

  useEffect(() => {
    load()

    return () => {
      if (debounce.current) clearTimeout(debounce.current)
      inFlight.current?.abort()
    }
  }, [load])

  return { peaks, attribution, truncated, status, error, refresh: load }
}
