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
 * Sends a one-time code to the address. Answers `202` whether or not the
 * address has an account **and whether or not a code was actually sent** — an
 * address over its own allowance gets the same answer and no email. Nothing a
 * caller does with this result may hint at which it was.
 *
 * A code re-requested within a few minutes is the *same* code: it is derived
 * from the security stamp and the clock rather than stored. One that has
 * already been used stays used until that step rolls over.
 */
export function requestSignInCode(email: string): Promise<void> {
  return apiRequest<void>('/auth/code', { method: 'POST', body: { email } })
}

/**
 * Exchanges the code for a session, and returns the profile — the endpoint
 * sends it so a client that has just signed in does not need a second round
 * trip. An address verifying for the first time gets its account here, not when
 * the code was requested (FR-ACC-1).
 */
export function verifySignInCode(email: string, code: string): Promise<UserProfile> {
  return apiRequest<UserProfile>('/auth/verify', { method: 'POST', body: { email, code } })
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
 * Why a sign-in attempt was refused, in the three shapes the API distinguishes.
 *
 * `/auth/verify` answers **401 for a wrong code, an expired one, one already
 * used, and an address with no account alike** — deliberately, since telling
 * them apart would answer the question `/auth/code` refuses to answer. So the
 * client cannot separate them either, and the copy for `rejected` has to cover
 * all of them rather than pretend to know which it was.
 *
 * `429` is the one it does separate: the address has used up its guesses, and
 * the problem document says for how long.
 */
export type SignInRejection = 'malformed' | 'rejected' | 'tooManyAttempts' | 'unknown'

export function classifySignInFailure(error: unknown): SignInRejection {
  if (!(error instanceof ApiError)) return 'unknown'

  // 400 is about the request rather than the account: an address that is not an
  // address, or a missing or oversized code.
  if (error.status === 400) return 'malformed'
  if (error.status === 401) return 'rejected'
  if (error.status === 429) return 'tooManyAttempts'

  return 'unknown'
}
