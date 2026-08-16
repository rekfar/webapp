# Rekfar — webapp

MVP for an interactive map built on open map tiles from [Kartverket](https://www.kartverket.no/).
Intended as the foundation for further development, not as a finished product.

## Stack

| | |
| --- | --- |
| Build | Vite 6 |
| UI | React 19 + TypeScript (strict) |
| Map | Leaflet 1.9 via react-leaflet 5 |

No API key, backend or environment configuration is required — Kartverket's tile
cache is open.

## Getting started

```bash
npm install
```

```bash
npm run dev
```

The dev server runs on http://localhost:5173.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Typecheck, then production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Typecheck only |

Requires Node 20.11 or newer. `.nvmrc` pins 22 because the deploy tooling needs it
(see [Deployment](#deployment)); the app itself builds fine on 20.11.

## Deployment

The build is produced by GitHub Actions and uploaded to Netlify as a static
bundle. Netlify does **not** build this repo — the project must stay
_unconnected_ from Git in the Netlify UI, or it will try to build on push and
race the pipeline.

Workflow: `.github/workflows/deploy.yml`

| Trigger | Result |
| --- | --- |
| Push to `main` | Production deploy (`--prod`) |
| Pull request | Draft deploy; the preview URL is commented on the PR |
| Fork pull request | Build and typecheck only — no secrets, so the deploy step is skipped |

`npm run build` runs `tsc -b` first, so CI has no separate typecheck step.

### Required repository secrets

Set under _Settings → Secrets and variables → Actions_:

| Secret | Where to find it |
| --- | --- |
| `NETLIFY_AUTH_TOKEN` | Netlify _User settings → Applications → Personal access tokens_ |
| `NETLIFY_SITE_ID` | Netlify _Project configuration → General → Project details_ |

Netlify's UI labels that second value **Project ID** — it renamed Sites to
Projects — but the CLI, API and environment variable still say `site`, so the
secret name is `NETLIFY_SITE_ID`.

`netlify-cli` is pinned to an exact version in the workflow's `env` block rather
than tracking `@latest`, so an upstream release cannot break `main`. That version
of the CLI requires Node ≥ 22.13, which is what `.nvmrc` reflects.

### Hosting constraints

- **HTTPS is mandatory.** The geolocation API is secure-context only, so "Show my
  position" silently fails over plain HTTP. Netlify provisions TLS automatically.
- **No SPA fallback redirect is needed.** The viewport lives in the URL _fragment_,
  so the server only ever sees a request for `/`. A `/* /index.html 200` rule
  would be dead config.
- Assets are referenced from the root (`/assets/…`), so the site must be served
  from a domain root. Deploying under a subpath would need `base` set in
  `vite.config.ts`.

`netlify.toml` holds cache and security headers only — no build command, by
design. The `Permissions-Policy` header there must keep `geolocation=(self)`.

## Features

- Four Kartverket basemaps — topographic, greyscale, raster hiking map, nautical chart
- Zoom, scale bar and metric distance readout
- Live cursor / centre coordinates (WGS 84) and zoom level
- "Show my position" via the browser geolocation API
- The viewport is mirrored into the URL as `#zoom/lat/lon`, so any view is
  shareable and survives reload — e.g. `http://localhost:5173/#12/59.9139/10.7522`

## Map data

Tiles come from Kartverket's open WMTS cache, following
[Bygge inn kart på nett](https://www.kartverket.no/til-lands/kart/bygge-inn-kart-pa-nett):

```
https://cache.kartverket.no/v1/wmts/1.0.0/{layer}/default/{matrixSet}/{z}/{y}/{x}.png
```

Note that the RESTful WMTS path is `TileMatrix/TileRow/TileCol` — the **row (y)
comes before the column (x)**.

Layers used: `topo`, `topograatone`, `toporaster`, `sjokartraster`.
The `webmercator` matrix set is published for **zoom 0–18**; z19 and above return
HTTP 400, so `maxNativeZoom` is pinned to 18 and Leaflet upscales beyond that.

Kartverket also publishes UTM matrix sets (`utm32n`, `utm33n`, `utm35n`). Those
need a projection plugin such as Proj4Leaflet and are not wired up here — see
`MatrixSet` in `src/config/basemaps.ts`.

**Attribution is mandatory.** `© Kartverket` is rendered in the map's
attribution control and must stay there.

## Layout

```
src/
  config/
    basemaps.ts     Kartverket WMTS layers, URL builder, zoom limits, attribution
    view.ts         Default centre/zoom and the bounds the viewport is kept within
  map/
    MapView.tsx     Composes the map, tile layer and overlay UI
    BasemapSwitcher.tsx
    HashSync.tsx    Two-way sync between the viewport and the URL fragment
    LocateControl.tsx
    Overlay.tsx     Positions React UI over the map without leaking events to Leaflet
    StatusBar.tsx   Coordinate and zoom readout
  App.tsx
  main.tsx
  styles.css
```

### Adding UI on top of the map

Children of `<MapContainer>` are rendered inside the Leaflet container, so a
plain `<div>` would pan the map when dragged and zoom it when scrolled. Wrap
overlay UI in `<Overlay>`, which applies Leaflet's `DomEvent` guards the same way
Leaflet's own controls do.

## Known limitations

- Kartverket's cache only covers Norwegian territory. The viewport is loosely
  constrained to Norway (Svalbard and Jan Mayen included) rather than exposing an
  empty world map.
- `sjokartraster` covers coastal and sea areas only; inland areas render blank.
- Basemap choice is component state and is not persisted in the URL.
