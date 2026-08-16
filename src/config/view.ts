import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet'

/** Roughly centred on mainland Norway at a zoom that shows the whole country. */
export const DEFAULT_CENTER: LatLngExpression = [64.5, 13.5]
export const DEFAULT_ZOOM = 5
export const MIN_ZOOM = 4

/**
 * Kartverket's cache only holds Norwegian territory, so panning far outside it
 * just yields empty tiles. Keep the viewport loosely constrained (Svalbard and
 * Jan Mayen included) instead of letting users drift into the blank world.
 */
export const MAX_BOUNDS: LatLngBoundsExpression = [
  [56.0, -14.0],
  [82.0, 40.0],
]
