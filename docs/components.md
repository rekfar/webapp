# Components

How the source tree is organised and what each piece is responsible for.

## Layout

```
public/
  favicon.svg       Waypoint mark on a rust tile
src/
  api/
    peaks.ts        GET /peaks — the wire types and the call itself
  brand/
    Logo.tsx        Mark + wordmark lockup
    WaypointMark.tsx
    colors.ts       Palette for non-CSS consumers (Leaflet vector styles)
  config/
    api.ts          API base URL and the peak layer's fetching limits
    basemaps.ts     Kartverket WMTS layers, URL builder, zoom limits, attribution
    view.ts         Default centre/zoom and the bounds the viewport is kept within
  map/
    MapView.tsx     Composes the map, tile layer and overlay UI
    BasemapSwitcher.tsx
    HashSync.tsx    Two-way sync between the viewport and the URL fragment
    LocateControl.tsx
    Overlay.tsx     Positions React UI over the map without leaking events to Leaflet
    PeaksLayer.tsx  Draws the peaks, with a tooltip and a details popup each
    PeaksProvider.tsx  One fetch loop, shared by the layer and the status chip
    PeaksStatus.tsx Loading, empty, truncated and error states for that layer
    StatusBar.tsx   Coordinate and zoom readout
    usePeaksInView.ts  Refetches the extent when the viewport settles
  App.tsx
  main.tsx
  styles.css
  vite-env.d.ts     Types for the VITE_* environment variables
```

## Adding UI on top of the map

Children of `<MapContainer>` are rendered inside the Leaflet container, so a
plain `<div>` would pan the map when dragged and zoom it when scrolled. Wrap
overlay UI in `<Overlay>`, which applies Leaflet's `DomEvent` guards the same way
Leaflet's own controls do.

## The peaks layer

`usePeaksInView` turns viewport changes into one debounced, abortable request per settled
extent, and `PeaksProvider` shares that single result: `PeaksLayer` draws it and
`PeaksStatus` reports on it. Two components reading one hook would otherwise mean two fetch
loops for the same data. Both must be rendered inside `<MapContainer>`, since the extent
comes from Leaflet's map instance. The endpoint and its traps are in [api.md](api.md).

Markers are `CircleMarker`s and `<MapContainer>` sets `preferCanvas`: an extent can hold up
to 500 of them, which is one canvas element between them rather than 500 DOM nodes.

## Configuration

Map defaults are data, not component state: `src/config/view.ts` holds the
initial centre/zoom and the bounds the viewport is kept within, and
`src/config/basemaps.ts` holds the layer definitions and URL builder described in
[map-data.md](map-data.md). Prefer editing those over hard-coding values in
components.

## Known limitations

- Kartverket's cache only covers Norwegian territory. The viewport is loosely
  constrained to Norway (Svalbard and Jan Mayen included) rather than exposing an
  empty world map.
- Basemap choice is component state and is not persisted in the URL.
- The peaks layer cannot be toggled off yet (FR-MAP-4), and peaks are not clustered — over
  a large extent the API caps the result at the 500 highest and the map says so.
