import { apiRequest } from './client'

/**
 * `GET`/`PATCH /me` — the signed-in user's own profile (FR-ACC-3).
 *
 * There is no user id in the payload the client needs: every call is scoped to
 * the session cookie, so "me" is the only user this client can address.
 */

export interface UserProfile {
  email: string
  /** May be empty until the user sets one; the UI falls back to the address. */
  displayName: string | null
  /** BCP 47, e.g. `nb-NO`. */
  locale: string
}

/** Answers "am I signed in?" — 401 means no, which is not an error condition. */
export function fetchProfile(signal?: AbortSignal): Promise<UserProfile> {
  return apiRequest<UserProfile>('/me', { signal })
}

export interface ProfileUpdate {
  displayName?: string | null
  locale?: string
}

/** Returns the profile as stored, so the client renders the server's truth. */
export function updateProfile(update: ProfileUpdate): Promise<UserProfile> {
  return apiRequest<UserProfile>('/me', { method: 'PATCH', body: update })
}
