import { useTranslation } from 'react-i18next'

import { describeApiError } from '../api/errors'
import { PEAKS_LIMIT } from '../config/api'
import { usePeaks } from './PeaksProvider'

/**
 * What the peaks layer is doing, when that is worth saying.
 *
 * The truncated case is the one the API asks the client to surface: over a
 * large extent it returns the highest peaks rather than refusing, and drawing
 * those silently would present a partial picture as the whole one.
 */
export function PeaksStatus() {
  const { t } = useTranslation()
  const { peaks, truncated, status, error, refresh } = usePeaks()

  if (status === 'error' && error) {
    return (
      <div className="peaks-status" data-state="error" role="status">
        <span>{t('map.peaks.failed', { reason: describeApiError(error, t) })}</span>
        <button type="button" className="peaks-status__retry" onClick={refresh}>
          {t('common.retry')}
        </button>
      </div>
    )
  }

  // Only announce loading on an empty map; a refetch while markers are up
  // should not make the chip flicker on every pan.
  if (status === 'loading' && peaks.length === 0) {
    return (
      <div className="peaks-status" role="status">
        {t('map.peaks.loading')}
      </div>
    )
  }

  if (status === 'ready' && truncated) {
    return (
      <div className="peaks-status" role="status">
        {t('map.peaks.truncated', { limit: PEAKS_LIMIT })}
      </div>
    )
  }

  if (status === 'ready' && peaks.length === 0) {
    return (
      <div className="peaks-status" role="status">
        {t('map.peaks.empty')}
      </div>
    )
  }

  return null
}
