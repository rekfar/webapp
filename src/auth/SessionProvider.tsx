import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { signOut as requestSignOut, signOutEverywhere as requestSignOutEverywhere } from '../api/auth'
import { onUnauthorized } from '../api/client'
import { fetchProfile } from '../api/me'
import type { UserProfile } from '../api/me'
import { applyLocale } from '../i18n'

/**
 * Who is signed in, for the whole app.
 *
 * The session is an `HttpOnly` cookie (ADR-0017), so there is nothing in
 * JavaScript to inspect: the question "am I signed in?" is answered by calling
 * `GET /me` once at startup and believing the answer. That is also why the
 * session survives a reload without anything being persisted here — the cookie
 * is the state, and this is a cache of what the API said about it.
 */

export type SessionStatus = 'loading' | 'signedIn' | 'signedOut'

export interface Session {
  status: SessionStatus
  user: UserProfile | null
  /** Re-read `GET /me`; returns the profile, or null when not signed in. */
  refresh: () => Promise<UserProfile | null>
  /** Adopt a profile the API just returned, without a second round trip. */
  adopt: (user: UserProfile) => void
  signOut: () => Promise<void>
  signOutEverywhere: () => Promise<void>
}

const SessionContext = createContext<Session | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading')
  const [user, setUser] = useState<UserProfile | null>(null)

  const adopt = useCallback((profile: UserProfile) => {
    setUser(profile)
    setStatus('signedIn')
  }, [])

  const clear = useCallback(() => {
    setUser(null)
    setStatus('signedOut')
  }, [])

  const load = useCallback(
    async (signal?: AbortSignal): Promise<UserProfile | null> => {
      try {
        const profile = await fetchProfile(signal)
        if (signal?.aborted) return null
        adopt(profile)
        return profile
      } catch (error) {
        if (signal?.aborted) return null
        // 401 is the expected answer for a visitor, and anything else — a cold
        // start, no network — leaves us equally unable to act as this user.
        // Either way the app is anonymous until the next attempt succeeds.
        if (error instanceof DOMException && error.name === 'AbortError') return null
        clear()
        return null
      }
    },
    [adopt, clear],
  )

  // One probe at startup. StrictMode runs this twice in development; the second
  // pass aborts the first, which is exactly what the cleanup is for.
  useEffect(() => {
    const request = new AbortController()
    void load(request.signal)
    return () => request.abort()
  }, [load])

  // A session that expired between page loads shows up as a 401 on whatever
  // call happened to be next. Dropping the user here is what sends the guarded
  // routes back to sign-in instead of leaving a page that cannot save anything.
  useEffect(() => onUnauthorized(clear), [clear])

  // The user's own locale wins over the default once we know it (FR-ACC-3).
  useEffect(() => {
    applyLocale(user?.locale)
  }, [user?.locale])

  /*
    Both sign-outs clear only after the API confirms. Log out means the session
    is dropped server-side, not merely forgotten here (FR-ACC-2), so a request
    that failed has to surface as a failure the user can retry rather than as a
    UI that looks signed out while the session is still live. A 401 — the
    session was already gone — clears through the listener above regardless.
  */
  const signOut = useCallback(async () => {
    await requestSignOut()
    clear()
  }, [clear])

  const signOutEverywhere = useCallback(async () => {
    await requestSignOutEverywhere()
    clear()
  }, [clear])

  const session = useMemo<Session>(
    () => ({ status, user, refresh: () => load(), adopt, signOut, signOutEverywhere }),
    [status, user, load, adopt, signOut, signOutEverywhere],
  )

  return <SessionContext value={session}>{children}</SessionContext>
}

export function useSession(): Session {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession må brukes innenfor <SessionProvider>')
  return value
}
