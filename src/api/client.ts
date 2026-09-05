import { API_BASE_URL } from '../config/api'

/**
 * One place where this client talks to the Rekfar API.
 *
 * Everything that matters about a request is decided here rather than at each
 * call site: the base URL, the session cookie, the anti-forgery header, and how
 * a failure becomes an exception.
 */

/** An RFC 9457 `application/problem+json` response, which is how the API fails. */
export class ApiError extends Error {
  readonly status: number
  readonly detail: string | undefined
  /** Matches the server log line for this request; useless once discarded. */
  readonly traceId: string | undefined
  /** From `Retry-After` on a 429, in seconds. */
  readonly retryAfterSeconds: number | undefined
  /**
   * A machine-readable discriminator from the problem document, where the
   * endpoint sends one. Used to tell "wrong code" from "expired code" without
   * parsing Norwegian prose — see `src/api/auth.ts`.
   */
  readonly code: string | undefined

  constructor(init: {
    status: number
    title: string
    detail?: string
    traceId?: string
    retryAfterSeconds?: number
    code?: string
  }) {
    super(init.detail ? `${init.title}: ${init.detail}` : init.title)
    this.name = 'ApiError'
    this.status = init.status
    this.detail = init.detail
    this.traceId = init.traceId
    this.retryAfterSeconds = init.retryAfterSeconds
    this.code = init.code
  }
}

interface ProblemDetails {
  title?: string
  detail?: string
  traceId?: string
  code?: string
  errorCode?: string
}

async function readProblem(response: Response): Promise<ApiError> {
  let problem: ProblemDetails = {}

  // A 502 from a proxy, or a request that never reached the API, is not
  // problem+json — fall back to the status text rather than throwing here and
  // losing the real failure.
  try {
    if (response.headers.get('content-type')?.includes('json')) {
      problem = (await response.json()) as ProblemDetails
    }
  } catch {
    problem = {}
  }

  const retryAfter = Number(response.headers.get('retry-after'))

  return new ApiError({
    status: response.status,
    title: problem.title ?? response.statusText ?? `HTTP ${response.status}`,
    detail: problem.detail,
    traceId: problem.traceId,
    retryAfterSeconds: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    code: problem.code ?? problem.errorCode,
  })
}

/**
 * ASP.NET Core's antiforgery cookie and header names.
 *
 * The session is an `HttpOnly` cookie the browser attaches by itself
 * (ADR-0017), which is exactly what makes cross-site request forgery possible,
 * so state-changing calls carry a header a cross-site form cannot set. Where
 * the API issues a readable antiforgery cookie we echo it back; where it does
 * not, `X-Requested-With` still forces a preflight the attacker's origin has to
 * survive. Both are cheap, and neither breaks the same-origin proxy path.
 */
const CSRF_COOKIE = 'XSRF-TOKEN'
const CSRF_HEADER = 'X-XSRF-TOKEN'

const SAFE_METHODS = new Set(['GET', 'HEAD'])

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

type UnauthorizedListener = () => void

let unauthorizedListener: UnauthorizedListener | null = null

/**
 * Called when any authenticated call comes back 401, so a session that expired
 * between page loads lands the user back at sign-in instead of on an error.
 * The session provider registers it; returns the unsubscribe.
 */
export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListener = listener
  return () => {
    if (unauthorizedListener === listener) unauthorizedListener = null
  }
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  /** Serialised as JSON. */
  body?: unknown
  query?: Record<string, string>
  signal?: AbortSignal
}

/**
 * Issues one request and returns its parsed body.
 *
 * A 204, or any response without a JSON body, resolves to `undefined` — call
 * such endpoints as `apiRequest<void>(…)`. Anything but 2xx throws `ApiError`.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal } = options

  const url = query
    ? `${API_BASE_URL}${path}?${new URLSearchParams(query)}`
    : `${API_BASE_URL}${path}`

  const headers: Record<string, string> = { accept: 'application/json' }

  if (body !== undefined) headers['content-type'] = 'application/json'

  if (!SAFE_METHODS.has(method)) {
    headers['x-requested-with'] = 'XMLHttpRequest'
    const token = readCookie(CSRF_COOKIE)
    if (token) headers[CSRF_HEADER] = token
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
    // The session is an HttpOnly cookie, so every call has to carry it — and
    // must keep carrying it if VITE_API_BASE_URL ever points off-origin.
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await readProblem(response)

    // The sign-in endpoints answer 401 for a wrong code; that is a form error,
    // not an expired session, and must not bounce the user anywhere.
    if (error.status === 401 && !path.startsWith('/auth/')) unauthorizedListener?.()

    throw error
  }

  if (response.status === 204 || !response.headers.get('content-type')?.includes('json')) {
    return undefined as T
  }

  return (await response.json()) as T
}
