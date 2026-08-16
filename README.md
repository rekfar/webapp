# Rekfar — webapp

MVP for an interactive map built on open map tiles from [Kartverket](https://www.kartverket.no/).
Intended as the foundation for further development, not as a finished product.

Vite 6 · React 19 + TypeScript (strict) · Leaflet 1.9 via react-leaflet 5.
No API key, backend or environment configuration is required — Kartverket's tile
cache is open.

## Getting started

```bash
npm install
```

```bash
npm run dev
```

The dev server runs on http://localhost:5173. Requires Node 20.11 or newer;
`.nvmrc` pins 22 because the deploy tooling needs it.

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
| [docs/deployment.md](docs/deployment.md) | GitHub Actions → Netlify pipeline, secrets, hosting constraints |

## Features

- Four Kartverket basemaps — topographic, greyscale, raster hiking map, nautical chart
- Zoom, scale bar and metric distance readout
- Live cursor / centre coordinates (WGS 84) and zoom level
- "Show my position" via the browser geolocation API
- The viewport is mirrored into the URL as `#zoom/lat/lon`, so any view is
  shareable and survives reload — e.g. `http://localhost:5173/#12/59.9139/10.7522`
