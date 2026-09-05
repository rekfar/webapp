import { ApiError, apiRequest } from './client'
import type { UserProfile } from './me'

/**
 * `/auth` — the whole of signing in and out (ADR-0017).
 *
 * There is no password anywhere in this file, and no token either: verifying
 * the code makes the API set an `HttpOnly` session cookie the JavaScript here
 * cannot read. "Am I signed in?" is therefore `fetchProfile()`, not a check of
 * anything this module returns.
 */

/**
 * Sends a one-time code to the address. Answers the same whether or not an
 * account exists — a new one is created when the code is verified — so nothing
 * a caller does with this result may hint at which it was.
 */
export function requestSignInCode(email: string): Promise<void> {
  return apiRequest<void>('/auth/code', { method: 'POST', body: { email } })
}

/**
 * Exchanges the code for a session. Returns the profile where the endpoint
 * sends one; callers that need it regardless should fall back to
 * `fetchProfile()`, which is the authoritative read either way.
 */
export function verifySignInCode(email: string, code: string): Promise<UserProfile | undefined> {
  return apiRequest<UserProfile | undefined>('/auth/verify', {
    method: 'POST',
    body: { email, code },
  })
}

/** Ends this device's session, server-side and not only in the cookie. */
export function signOut(): Promise<void> {
  return apiRequest<void>('/auth/signout', { method: 'POST' })
}

/**
 * Ends every session for the account by rotating the security stamp. With no
 * password to change, this is the only lever a user has over a lost device, so
 * it ships on the profile page rather than in a later settings screen.
 */
export function signOutEverywhere(): Promise<void> {
  return apiRequest<void>('/auth/signout-all', { method: 'POST' })
}

/**
 * Why a code was rejected, in the three cases worth their own Norwegian
 * wording. An expired or used code and an exhausted attempt cap both mean
 * "ask for a new one", which a generic failure would not tell the user.
 *
 * Read from the problem document's `code` member where the API sends one, and
 * from the status otherwise: `410 Gone` for a code that is no longer there,
 * `429`/`423` for the attempt cap, and the remaining 4xx for a wrong code.
 */
export type CodeRejection = 'invalid' | 'expired' | 'tooManyAttempts' | 'unknown'

export function classifyCodeRejection(error: unknown): CodeRejection {
  if (!(error instanceof ApiError)) return 'unknown'

  switch (error.code) {
    case 'code_expired':
    case 'code_used':
      return 'expired'
    case 'code_invalid':
      return 'invalid'
    case 'too_many_attempts':
      return 'tooManyAttempts'
  }

  if (error.status === 410) return 'expired'
  if (error.status === 429 || error.status === 423) return 'tooManyAttempts'
  if (error.status === 400 || error.status === 401 || error.status === 422) return 'invalid'

  return 'unknown'
}
