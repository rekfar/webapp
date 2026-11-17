/**
 * The Rekfar API, as this client reaches it.
 *
 * Requests go to a relative base in every environment, so the browser only ever
 * talks to its own origin and CORS stays off the deployed critical path:
 *
 * - `npm run dev` — Vite's `server.proxy` forwards `/api/*` to the local API
 *   (see `vite.config.ts`).
 * - Netlify — a rewrite with `status = 200` proxies `/api/*` to the Azure
 *   Container Apps origin (see `netlify.toml`).
 *
 * Both rewrite `/api` to the API's `/v1`, so the version lives in the proxy
 * rather than in every call site. Set `VITE_API_BASE_URL` to an absolute
 * `https://…/v1` to bypass the proxy and call the origin directly — the backend
 * keeps an explicit CORS origin list for exactly that case.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

/**
 * The anti-forgery header the API requires on every state-changing request.
 *
 * The session cookie is `SameSite=None`, so the browser would attach it to a
 * cross-site form post too — that is the whole of CSRF. A custom header is what
 * a form cannot set: sending it forces a CORS preflight, which the API answers
 * against its origin allowlist. The value is never checked; being able to set
 * it at all is the proof.
 *
 * Must match the API's `Security:AntiForgeryHeader` setting, which defaults to
 * this name. A request without it is refused with 403.
 */
export const ANTI_FORGERY_HEADER = 'X-Rekfar-Csrf'

/**
 * Features to ask for per extent. The API caps at 1000 and defaults to 500; at
 * national zoom it returns the highest peaks in view and sets `truncated`
 * rather than refusing the request.
 */
export const PEAKS_LIMIT = 500

/**
 * How long the viewport has to settle before refetching. A drag ends in a
 * single `moveend`, but a scroll-wheel zoom fires a burst of them, and the
 * API rate-limits each caller to 120 requests a minute.
 */
export const PEAKS_DEBOUNCE_MS = 300

/**
 * Fraction of the viewport to over-fetch on each side, so a short pan finds
 * markers already loaded instead of a bare map waiting on a request.
 */
export const PEAKS_VIEWPORT_PADDING = 0.25
