import { ANTI_FORGERY_HEADER, API_BASE_URL } from '../config/api'

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
  /**
   * How long to wait, in seconds. From `Retry-After`, or from the problem
   * document's own `retryAfterSeconds` — `/auth/verify` sends it that way,
   * because the attempt cap is the endpoint's own budget rather than the rate
   * limiter's.
   */
  readonly retryAfterSeconds: number | undefined

  constructor(init: {
    status: number
    title: string
    detail?: string
    traceId?: string
    retryAfterSeconds?: number
  }) {
    super(init.detail ? `${init.title}: ${init.detail}` : init.title)
    this.name = 'ApiError'
    this.status = init.status
    this.detail = init.detail
    this.traceId = init.traceId
    this.retryAfterSeconds = init.retryAfterSeconds
  }
}

interface ProblemDetails {
  title?: string
  detail?: string
  traceId?: string
  retryAfterSeconds?: number
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

  const header = Number(response.headers.get('retry-after'))
  const retryAfter = Number.isFinite(header) && header > 0 ? header : problem.retryAfterSeconds

  return new ApiError({
    status: response.status,
    title: problem.title ?? response.statusText ?? `HTTP ${response.status}`,
    detail: problem.detail,
    traceId: problem.traceId,
    retryAfterSeconds: typeof retryAfter === 'number' && retryAfter > 0 ? retryAfter : undefined,
  })
}

const SAFE_METHODS = new Set(['GET', 'HEAD'])

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

  // The API refuses a state-changing request that does not carry this header,
  // and never looks at what is in it — so "1" is as good as a token, and there
  // is no token store on either side.
  if (!SAFE_METHODS.has(method)) headers[ANTI_FORGERY_HEADER] = '1'

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
