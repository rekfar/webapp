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

Requires Node 20.11 or newer.

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
