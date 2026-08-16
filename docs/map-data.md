# Map data

Tiles come from Kartverket's open WMTS cache, following
[Bygge inn kart på nett](https://www.kartverket.no/til-lands/kart/bygge-inn-kart-pa-nett):

```
https://cache.kartverket.no/v1/wmts/1.0.0/{layer}/default/{matrixSet}/{z}/{y}/{x}.png
```

Note that the RESTful WMTS path is `TileMatrix/TileRow/TileCol` — the **row (y)
comes before the column (x)**.

Layers used: `topo`, `toporaster`.
The `webmercator` matrix set is published for **zoom 0–18**; z19 and above return
HTTP 400, so `maxNativeZoom` is pinned to 18 and Leaflet upscales beyond that.

Kartverket also publishes UTM matrix sets (`utm32n`, `utm33n`, `utm35n`). Those
need a projection plugin such as Proj4Leaflet and are not wired up here — see
`MatrixSet` in `src/config/basemaps.ts`.

**Attribution is mandatory.** `© Kartverket` is rendered in the map's
attribution control and must stay there.

## Coverage

Kartverket's cache only covers Norwegian territory. The viewport is loosely
constrained to Norway (Svalbard and Jan Mayen included) rather than exposing an
empty world map — see `src/config/view.ts`.
