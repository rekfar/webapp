import { ApiError } from '../api/peaks'
import { PEAKS_LIMIT } from '../config/api'
import { usePeaks } from './PeaksProvider'

function describe(error: Error): string {
  // fetch() rejects with a TypeError when the request never got an answer.
  if (!(error instanceof ApiError)) return 'Fikk ikke kontakt med API-et.'

  if (error.status === 429) {
    return error.retryAfterSeconds
      ? `For mange forespørsler. Prøv igjen om ${error.retryAfterSeconds} sekunder.`
      : 'For mange forespørsler. Vent litt og prøv igjen.'
  }

  // The likeliest 5xx here is not a bug but a cold start: the API scales to zero
  // and its database auto-pauses, so the first request after an idle period can
  // outlast the proxy in front of it. "Bad Gateway" tells the user nothing;
  // "try again" is both true and actionable.
  if (error.status >= 500) {
    return 'API-et svarte ikke. Det starter kanskje opp igjen — prøv om litt.'
  }

  return error.detail ?? error.message
}

/**
 * What the peaks layer is doing, when that is worth saying.
 *
 * The truncated case is the one the API asks the client to surface: over a
 * large extent it returns the highest peaks rather than refusing, and drawing
 * those silently would present a partial picture as the whole one.
 */
export function PeaksStatus() {
  const { peaks, truncated, status, error, refresh } = usePeaks()

  if (status === 'error' && error) {
    return (
      <div className="peaks-status" data-state="error" role="status">
        <span>
          Kunne ikke hente topper. {describe(error)}
        </span>
        <button type="button" className="peaks-status__retry" onClick={refresh}>
          Prøv igjen
        </button>
      </div>
    )
  }

  // Only announce loading on an empty map; a refetch while markers are up
  // should not make the chip flicker on every pan.
  if (status === 'loading' && peaks.length === 0) {
    return (
      <div className="peaks-status" role="status">
        Laster topper …
      </div>
    )
  }

  if (status === 'ready' && truncated) {
    return (
      <div className="peaks-status" role="status">
        Viser de {PEAKS_LIMIT} høyeste toppene — zoom inn for å se alle
      </div>
    )
  }

  if (status === 'ready' && peaks.length === 0) {
    return (
      <div className="peaks-status" role="status">
        Ingen topper i dette området
      </div>
    )
  }

  return null
}
