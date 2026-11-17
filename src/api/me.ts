import { apiRequest } from './client'

/**
 * `GET`/`PATCH /me` — the signed-in user's own profile (FR-ACC-3).
 *
 * There is no user id in the payload the client needs: every call is scoped to
 * the session cookie, so "me" is the only user this client can address.
 */

export interface UserProfile {
  /** The credential, and not changeable here. */
  email: string
  /** Never empty: a new account's is seeded from the address's local part. */
  displayName: string
  /** BCP 47, e.g. `nb-NO`. */
  locale: string
}

/** Answers "am I signed in?" — 401 means no, which is not an error condition. */
export function fetchProfile(signal?: AbortSignal): Promise<UserProfile> {
  return apiRequest<UserProfile>('/me', { signal })
}

/**
 * Both fields are optional, and one that is absent is left as it is — which is
 * what makes this a PATCH. There is no way to *clear* a display name: the
 * column is NOT NULL, and the API requires 1–80 characters after trimming.
 */
export interface ProfileUpdate {
  displayName?: string
  locale?: string
}

/**
 * Returns the profile as stored, so the client renders the server's truth.
 * A `400` names the field that was wrong and applies neither.
 */
export function updateProfile(update: ProfileUpdate): Promise<UserProfile> {
  return apiRequest<UserProfile>('/me', { method: 'PATCH', body: update })
}
