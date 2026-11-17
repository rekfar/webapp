# The API

Peaks come from the [Rekfar API](https://github.com/rekfar/backend), which owns all
business logic — the client renders what it is given and computes nothing about the
catalogue itself.

## One relative base, two proxies

The client calls **`/api`**, never an absolute API host:

| Environment | `/api/peaks` reaches the API through |
| --- | --- |
| `npm run dev` | `server.proxy` in `vite.config.ts` → `http://localhost:5199/v1/peaks` |
| Netlify | the `[[redirects]]` rewrite in `netlify.toml` → `https://…azurecontainerapps.io/v1/peaks` |

Both rewrite `/api` to the API's `/v1`, so the version is configured in one place rather
than repeated at every call site, and both leave the request **same-origin**. That is the
point: CORS drops out of the deployed path entirely — no preflights, and no origin list
that can break the client in production while every `curl` and integration test still
passes. On Netlify the `status = 200` is what makes the rule a proxy rather than a
redirect.

The API keeps its own `Cors:AllowedOrigins` configured regardless, because a caller that
does not go through this site — a future native client — still needs it.

To bypass the proxy, set `VITE_API_BASE_URL` to an absolute base **including the version**
(see `.env.example`). The API's development configuration already allows
`http://localhost:5173`, so this works locally without touching the backend.

## Every request carries the session

`src/api/client.ts` issues every call, and decides three things once so no call
site has to:

- **`credentials: 'include'`.** The session is an `HttpOnly` cookie
  ([ADR-0017](https://github.com/rekfar/docs/blob/main/adr/0017-passwordless-email-sign-in.md)),
  so the browser attaches it and the client never sees it. Through the proxies
  above the call is same-origin and this is free. Through `VITE_API_BASE_URL` it
  is cross-origin, and the API's CORS policy does **not** currently call
  `.AllowCredentials()` — so the browser drops the response, for `/peaks` as
  much as for `/me`. That escape hatch needs the backend to send
  `Access-Control-Allow-Credentials` before it works again; the proxied path,
  which is what runs in development and in production, is unaffected.
- **The anti-forgery header on state-changing calls.** The session cookie is
  `SameSite=None`, so the browser would attach it to a cross-site form post too
  — that is the whole of CSRF. Every `POST` and `PATCH` therefore carries
  `X-Rekfar-Csrf`, whose value the API never reads: sending a custom header at
  all forces a CORS preflight, which is answered against the origin allowlist,
  and a form post cannot send one. The name is in `src/config/api.ts` and must
  match the API's `Security:AntiForgeryHeader`; a request without it is refused
  with `403`.
- **Failures are `ApiError`.** RFC 9457 `problem+json` parsed into a status, a
  `detail`, the `traceId` that matches the server log, and a wait in seconds
  taken from `Retry-After` or from the document's own `retryAfterSeconds`.

## Accounts

`SignInPage` and `ProfilePage` use these. Full contract in the backend's
[docs/api.md](https://github.com/rekfar/backend/blob/main/docs/api.md); what
matters here:

| Endpoint | Used for |
| --- | --- |
| `POST /api/auth/code` | Send a one-time code to an email address |
| `POST /api/auth/verify` | Exchange the code for a session |
| `POST /api/auth/signout` | End this device's session |
| `POST /api/auth/signout-all` | End every session for the account |
| `GET /api/me` | The profile — and the answer to "am I signed in?" |
| `PATCH /api/me` | Display name and locale |

- **`GET /me` answers 401 for a visitor**, and that is not an error: it is how
  the app learns it is anonymous. Every *other* 401 is treated as a session that
  expired, and drops the user back to sign-in.
- **`/auth/code` answers `202` whether or not the address has an account, and
  whether or not a code was sent** — an address over its own allowance gets the
  same answer and no email. Only a malformed address is refused, with `400`. The
  UI is written so it cannot leak the difference either: registration and login
  are one screen, and no copy says which one happened.
- **`/auth/verify` answers `401` for a wrong code, an expired one, one already
  used, *and* an address with no account — one message for all four.** The
  client cannot tell them apart, so `signIn.errors.codeRejected` names every
  possibility and both ways out rather than guessing at one. The case it *can*
  distinguish is `429`, the address having used up its guesses, which carries
  `retryAfterSeconds` in the problem document rather than a `Retry-After`
  header. `classifySignInFailure` in `src/api/auth.ts` is that whole mapping.
- **A code re-requested within a few minutes is the same code.** It is derived
  from the security stamp and the clock, not stored, so "send the code again"
  may well deliver the one already in the inbox — and a code that has been used
  stays used until the step rolls over. Hence *"Vi har sendt koden på nytt"*
  rather than *"en ny kode"*. The resend cooldown is 60 seconds, or whatever a
  `429` from `/auth/code` asks for.
- **`verify` returns the profile** along with the `Set-Cookie`, so signing in
  costs one round trip rather than two.
- **A display name is never empty.** The column is `NOT NULL` and a new account's
  is seeded from the address's local part, so the API requires 1–80 characters
  after trimming and `PATCH /me` has no way to clear one. `ProfilePage` checks
  that before sending, to keep it a Norwegian field note rather than a `400`
  whose `detail` is English. A field that is absent or `null` is left as it is —
  which is what makes it a PATCH — so the client sends only what it means to
  change.
- **There is no new-account signal, by design.** A first verification is
  answered exactly like a returning one, so sign-in lands on the route the guard
  sent the user away from, or the map; UC-1's "set display name and locale" is
  the profile, one click away in the header.

## `GET /api/peaks`

The map's endpoint. Full contract in the backend's
[docs/api.md](https://github.com/rekfar/backend/blob/main/docs/api.md); what matters here:

- **`bbox` is `west,south,east,north`** in WGS84 degrees — the ordering
  `bounds.toBBoxString()` emits. `src/map/usePeaksInView.ts` clamps the padded viewport to
  ±180/±90 before sending, because the API rejects an out-of-range or inverted box and a
  zoomed-out viewport produces both.
- **The response is GeoJSON**, with `attribution` and `truncated` as foreign members.
  `coordinates` is `[longitude, latitude]` — the reverse of Leaflet's order. The swap
  happens once, in `src/map/PeaksLayer.tsx`.
- **`elevationMeters`, `prominenceMeters` and `utnoUrl` are nullable.** A null elevation
  means *not yet sampled*, not sea level, and renders as `Ukjent`.
- **A large extent is capped, not refused.** Over the whole country the API returns the
  highest `limit` peaks and sets `truncated`; `PeaksStatus` says so and invites the user to
  zoom in, rather than presenting a partial picture as the whole one.
- **Errors are RFC 9457 `problem+json`**, each carrying a `traceId` that matches the server
  log. `src/api/peaks.ts` keeps it on the thrown `ApiError`.

Requests are debounced and the in-flight one is aborted when the extent changes again — the
API rate-limits each caller to 120 requests a minute, which a map that refetched on every
frame would spend in seconds.

## The cold start is a real failure mode

The API scales to zero and its database is serverless and auto-pauses. Two cold starts can
stack, and the backend's own operations notes put a database resume at *tens of seconds*.
The backend is built for that — a 60-second command timeout, and a `/health` probe that
never touches the database — but **Netlify's proxy gives up well before then**, so the first
request after an idle period can fail at the edge rather than succeed slowly.

That is why an error here is not fatal: `PeaksStatus` reports it and offers *Prøv igjen*
instead of leaving a dead map. The durable fix belongs in the backend (raise the database's
auto-pause delay, raise `minReplicas`, or add a warm-up ping) and is tracked there.

## Not wired up yet

`minElevationMeters` is supported by the endpoint and typed in `src/api/peaks.ts`, but no
UI asks for it. Everything else — trips, plans, wishlist, statistics — is unbuilt on both
sides.

FR-ACC-4 (default privacy) is a column on the account the profile screen does not
yet show, and FR-ACC-5 (delete my account) has no endpoint. Both are out of this
slice deliberately.
