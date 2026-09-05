import type { TFunction } from 'i18next'

import { ApiError } from './client'

/**
 * A failed request in one Norwegian sentence.
 *
 * The three cases worth distinguishing everywhere are no answer at all, the
 * rate limiter, and a 5xx — which on this stack usually means a cold start
 * rather than a bug. Anything else falls back to the API's own `detail`, which
 * is written for a human and carries the specifics we could not guess.
 */
export function describeApiError(error: unknown, t: TFunction): string {
  // fetch() rejects with a TypeError when the request never got an answer.
  if (!(error instanceof ApiError)) return t('errors.network')

  if (error.status === 429) {
    return error.retryAfterSeconds
      ? t('errors.rateLimitedIn', { seconds: error.retryAfterSeconds })
      : t('errors.rateLimited')
  }

  if (error.status >= 500) return t('errors.server')

  return error.detail ?? t('errors.unexpected')
}

/** Seconds the caller must wait, when the API said so with `Retry-After`. */
export function retryAfterSeconds(error: unknown): number | null {
  return error instanceof ApiError ? (error.retryAfterSeconds ?? null) : null
}
