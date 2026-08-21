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

## `GET /api/peaks`

The only endpoint the client uses. Full contract in the backend's
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
