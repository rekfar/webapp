# Rekfar — webapp

MVP for an interactive map built on open map tiles from [Kartverket](https://www.kartverket.no/).
Intended as the foundation for further development, not as a finished product.

Vite 6 · React 19 + TypeScript (strict) · Leaflet 1.9 via react-leaflet 5.
Tiles come from Kartverket's open cache, which needs no API key. Peaks come from
the [Rekfar API](https://github.com/rekfar/backend) — reached through a proxy at
`/api`, so no environment configuration is required to run the app either.

## Getting started

```bash
npm install
```

```bash
npm run dev
```

The dev server runs on http://localhost:5173. Requires Node 20.11 or newer;
`.nvmrc` pins 22 because the deploy tooling needs it.

The map draws its peaks from the API, which the dev server proxies at `/api`.
Run [rekfar/backend](https://github.com/rekfar/backend) on its documented port
(`dotnet run --project src/Rekfar.Api`, which listens on 5199) and they appear;
without it the map still works and says it could not reach the API. See
[docs/api.md](docs/api.md) to point at a different one.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Typecheck, then production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Typecheck only |

## Documentation

| Document | Contents |
| --- | --- |
| [docs/components.md](docs/components.md) | Project layout, component responsibilities, adding UI over the map |
| [docs/styling.md](docs/styling.md) | Brand identity, design tokens, where colours are duplicated |
| [docs/map-data.md](docs/map-data.md) | Kartverket WMTS tiles, zoom limits, attribution, coverage limits |
| [docs/api.md](docs/api.md) | The Rekfar API, the `/api` proxy, and the peaks endpoint |
| [docs/deployment.md](docs/deployment.md) | GitHub Actions → Netlify pipeline, secrets, hosting constraints |

## Features

- Two Kartverket basemaps — topographic and raster hiking map
- Mountain peaks for the current map extent, refetched as you pan and zoom,
  with elevation, primærfaktor and an ut.no link a click away
- Zoom, scale bar and metric distance readout
- Live cursor / centre coordinates (WGS 84) and zoom level
- "Show my position" via the browser geolocation API
- The viewport is mirrored into the URL as `#zoom/lat/lon`, so any view is
  shareable and survives reload — e.g. `http://localhost:5173/#12/59.9139/10.7522`
