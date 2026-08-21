import { useEffect } from 'react'
import { CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet'

import type { PeakFeature } from '../api/peaks'
import { KARTVERKET_ATTRIBUTION } from '../config/basemaps'
import { BRAND } from '../brand/colors'
import { usePeaks } from './PeaksProvider'

/**
 * The readable text of an attribution string, for comparing two of them.
 *
 * Parsed rather than regex-stripped because the credits differ in more than
 * markup: the tile layer's is `&copy; <a …>Kartverket</a>` and the API sends
 * `© Kartverket`, so the entity has to be decoded before they can match.
 * DOMParser is inert — nothing in the parsed document loads or runs.
 */
const asText = (value: string) =>
  (new DOMParser().parseFromString(value, 'text/html').body.textContent ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

/**
 * Credits the peak data (NFR-LEGAL-2). The payload carries its own attribution
 * rather than trusting the client to remember one, but today it says the same
 * thing as the tile layer's — both are Kartverket — and printing "© Kartverket"
 * twice serves nobody. A second source dataset later will not match, and shows.
 */
function usePeakAttribution(attribution: string | null) {
  const map = useMap()

  useEffect(() => {
    if (!attribution) return
    if (asText(attribution) === asText(KARTVERKET_ATTRIBUTION)) return

    map.attributionControl.addAttribution(attribution)
    return () => {
      map.attributionControl.removeAttribution(attribution)
    }
  }, [attribution, map])
}

/** `2469 moh.`, or null where the height has not been sampled yet. */
function elevationLabel(peak: PeakFeature): string | null {
  const { elevationMeters } = peak.properties
  return elevationMeters === null ? null : `${elevationMeters} moh.`
}

function PeakPopup({ peak, attribution }: { peak: PeakFeature; attribution: string | null }) {
  const { name, elevationMeters, prominenceMeters, utnoUrl } = peak.properties

  return (
    <div className="peak-popup">
      <h2 className="peak-popup__name">{name}</h2>

      <dl className="peak-popup__facts">
        <dt>Høyde</dt>
        <dd>{elevationMeters === null ? 'Ukjent' : `${elevationMeters} moh.`}</dd>

        {prominenceMeters !== null && (
          <>
            <dt>Primærfaktor</dt>
            <dd>{prominenceMeters} m</dd>
          </>
        )}
      </dl>

      {utnoUrl && (
        <a className="peak-popup__link" href={utnoUrl} target="_blank" rel="noreferrer">
          Les mer på ut.no
        </a>
      )}

      {attribution && (
        <p
          className="peak-popup__attribution"
          // The API sends the credit as the markup it wants rendered.
          dangerouslySetInnerHTML={{ __html: attribution }}
        />
      )}
    </div>
  )
}

/**
 * Draws the peaks in the current extent (FR-MAP-2), each with its details a
 * click away (FR-MAP-7).
 *
 * GeoJSON coordinates are [longitude, latitude]; Leaflet wants them the other
 * way round. Swapping them here, once, is the whole of the conversion.
 */
export function PeaksLayer() {
  const { peaks, attribution } = usePeaks()

  usePeakAttribution(attribution)

  return (
    <>
      {peaks.map((peak) => {
        const [longitude, latitude] = peak.geometry.coordinates
        const elevation = elevationLabel(peak)

        return (
          <CircleMarker
            key={peak.id}
            center={[latitude, longitude]}
            radius={5}
            pathOptions={{
              color: '#ffffff',
              weight: 1.5,
              fillColor: BRAND.rustInk,
              fillOpacity: 1,
            }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              {elevation ? `${peak.properties.name} · ${elevation}` : peak.properties.name}
            </Tooltip>
            <Popup>
              <PeakPopup peak={peak} attribution={attribution} />
            </Popup>
          </CircleMarker>
        )
      })}
    </>
  )
}
