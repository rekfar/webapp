# Components

How the source tree is organised and what each piece is responsible for.

## Layout

```
public/
  favicon.svg       Waypoint mark on a rust tile
src/
  brand/
    Logo.tsx        Mark + wordmark lockup
    WaypointMark.tsx
    colors.ts       Palette for non-CSS consumers (Leaflet vector styles)
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

## Adding UI on top of the map

Children of `<MapContainer>` are rendered inside the Leaflet container, so a
plain `<div>` would pan the map when dragged and zoom it when scrolled. Wrap
overlay UI in `<Overlay>`, which applies Leaflet's `DomEvent` guards the same way
Leaflet's own controls do.

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
