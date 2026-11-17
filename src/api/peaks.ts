import { ApiError, apiRequest } from './client'

/**
 * `GET /peaks` — the peaks inside a map extent, as GeoJSON.
 *
 * The wire types mirror the API's `PeakFeatureCollection`; see the contract in
 * the backend's `docs/api.md`. Both renderers consume GeoJSON directly, so the
 * payload is drawn as it arrives rather than transformed on the way in.
 */

export interface PeakProperties {
  name: string
  /**
   * Metres above sea level (moh.), or `null` where ingestion has not sampled a
   * terrain model yet. Null means unknown — never render it as sea level.
   */
  elevationMeters: number | null
  /** Primærfaktor in metres, when known. */
  prominenceMeters: number | null
  /** Optional outbound description link; every view must render without it. */
  utnoUrl: string | null
}

export interface PeakFeature {
  type: 'Feature'
  /** The catalogue id, at the Feature level where RFC 7946 puts it. */
  id: number
  geometry: {
    type: 'Point'
    /**
     * `[longitude, latitude]` — GeoJSON's order, and the reverse of Leaflet's.
     * Getting it backwards puts every Norwegian peak in the Indian Ocean.
     */
    coordinates: [number, number]
  }
  properties: PeakProperties
}

export interface PeakFeatureCollection {
  type: 'FeatureCollection'
  features: PeakFeature[]
  /**
   * Kartverket's data is CC BY 4.0, so the credit travels with the payload
   * rather than relying on the client to remember it. Render it wherever the
   * data is shown.
   */
  attribution: string
  /**
   * True when the extent held more peaks than `limit`. The highest are the ones
   * returned — tell the user to zoom in rather than drawing a partial picture
   * as though it were the whole one.
   */
  truncated: boolean
}

export interface FetchPeaksOptions {
  /** The map extent as `west,south,east,north` in WGS84 degrees. */
  bbox: string
  /** Maximum features to return; 1–1000, default 500 server-side. */
  limit?: number
  /** Return only peaks known to reach this height. */
  minElevationMeters?: number
  signal?: AbortSignal
}

export async function fetchPeaks({
  bbox,
  limit,
  minElevationMeters,
  signal,
}: FetchPeaksOptions): Promise<PeakFeatureCollection> {
  const query: Record<string, string> = { bbox }
  if (limit !== undefined) query.limit = String(limit)
  if (minElevationMeters !== undefined) {
    query.minElevationMeters = String(minElevationMeters)
  }

  const collection = await apiRequest<PeakFeatureCollection>('/peaks', { query, signal })

  // The proxy rewrites a path rather than reading a body, so a misconfigured
  // rewrite answers 200 with the SPA's own index.html. Checking the shape turns
  // that into a legible error instead of an empty map.
  if (!Array.isArray(collection.features)) {
    throw new ApiError({
      // Only a 2xx reaches this far; the body is what is wrong, not the status.
      status: 200,
      title: 'Uventet svar fra API-et',
      detail: 'Svaret var ikke en GeoJSON FeatureCollection.',
    })
  }

  return collection
}
