/**
 * Kartverket's open WMTS cache.
 *
 * Docs: https://www.kartverket.no/til-lands/kart/bygge-inn-kart-pa-nett
 * The service is open and needs no API key. Attribution is mandatory.
 *
 * RESTful WMTS path is {layer}/default/{matrixSet}/{TileMatrix}/{TileRow}/{TileCol}
 * — note that the row (y) comes before the column (x).
 */
const WMTS_BASE = 'https://cache.kartverket.no/v1/wmts/1.0.0'

/** Tile matrix sets published by the cache. Only webmercator suits plain Leaflet. */
export type MatrixSet = 'webmercator' | 'utm32n' | 'utm33n' | 'utm35n'

export const KARTVERKET_ATTRIBUTION =
  '&copy; <a href="https://www.kartverket.no/" target="_blank" rel="noreferrer">Kartverket</a>'

/** The webmercator matrix set is published for zoom 0–18; z19+ returns HTTP 400. */
export const MAX_NATIVE_ZOOM = 18

/** Leaflet upscales tiles beyond MAX_NATIVE_ZOOM rather than blanking out. */
export const MAX_ZOOM = 19

export interface Basemap {
  id: string
  /** WMTS layer identifier at cache.kartverket.no */
  layer: string
}

/**
 * The layers offered, as facts about the service only. Their names and
 * descriptions are copy, so they live in the i18n layer under
 * `map.basemaps.<id>` — adding a layer here means adding those two keys.
 */
export const BASEMAPS: Basemap[] = [
  { id: 'topo', layer: 'topo' },
  { id: 'toporaster', layer: 'toporaster' },
]

export const DEFAULT_BASEMAP_ID = BASEMAPS[0].id

export function getBasemap(id: string): Basemap {
  return BASEMAPS.find((b) => b.id === id) ?? BASEMAPS[0]
}

/** Build a Leaflet-compatible tile URL template for a Kartverket WMTS layer. */
export function tileUrlTemplate(layer: string, matrixSet: MatrixSet = 'webmercator'): string {
  return `${WMTS_BASE}/${layer}/default/${matrixSet}/{z}/{y}/{x}.png`
}
