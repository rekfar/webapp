# Components

How the source tree is organised and what each piece is responsible for.

## Layout

```
public/
  favicon.svg       Waypoint mark on a rust tile
src/
  api/
    client.ts       One fetch: base URL, session cookie, anti-forgery, problem+json
    auth.ts         /auth — request a code, verify it, sign out here or everywhere
    me.ts           GET/PATCH /me — the signed-in user's own profile
    errors.ts       A failed request as one Norwegian sentence
    peaks.ts        GET /peaks — the wire types and the call itself
  auth/
    SessionProvider.tsx  Who is signed in, for the whole app
    RequireSession.tsx   Route guard for pages an anonymous visitor cannot use
  brand/
    Logo.tsx        Mark + wordmark lockup
    WaypointMark.tsx
    colors.ts       Palette for non-CSS consumers (Leaflet vector styles)
  config/
    api.ts          API base URL and the peak layer's fetching limits
    basemaps.ts     Kartverket WMTS layers, URL builder, zoom limits, attribution
    view.ts         Default centre/zoom and the bounds the viewport is kept within
  i18n/
    index.ts        i18next setup, the supported locales, applyLocale()
    nb-NO.ts        Every user-visible string
  routes/
    paths.ts        The routes there are
    MapPage.tsx
    SignInPage.tsx  Email → one-time code → session (registration is the same screen)
    ProfilePage.tsx Display name, locale, and both sign-outs
    NotFoundPage.tsx
  ui/
    AccountNav.tsx  The account corner of the header
    usePageTitle.ts
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
  App.tsx           The shell and its routes
  main.tsx          Router, session provider, i18n
  styles.css
  vite-env.d.ts     Types for the VITE_* environment variables
```

## Routing

`react-router` in `BrowserRouter` mode, with the routes in `src/routes/paths.ts`
and Norwegian paths like the rest of the UI: `/`, `/logg-inn`, `/profil`.

**The path is the router's; the fragment is the map's.** Viewport state lives in
`#zoom/lat/lon` ([HashSync](../src/map/HashSync.tsx)), so hash routing would
have the two writing over each other. The cost is that the server sees a real
path — hence the SPA fallback rewrite in `netlify.toml`, without which a reload
on `/profil` is a 404 before any JavaScript runs.

`<RequireSession>` wraps a route that has nothing to show an anonymous visitor.
It waits out the startup probe before deciding, so a reload does not bounce a
signed-in user, and it carries the route they wanted in the navigation state so
they land there after signing in.

One redirect owns each transition. Signing in is a redirect out of
`<SignInPage>` once the session exists; signing out is `<RequireSession>` seeing
the session go. Neither page also pushes a route of its own — two redirects
racing for one navigation resolve differently depending on which state update
React flushes first.

## The session

The session is an `HttpOnly` cookie
([ADR-0017](https://github.com/rekfar/docs/blob/main/adr/0017-passwordless-email-sign-in.md)),
so there is nothing in JavaScript to read: `SessionProvider` answers "am I
signed in?" by calling `GET /me` once at startup and believing the answer. That
is also why a reload keeps you signed in without anything being persisted here —
the cookie is the state, and the provider is a cache of what the API said about
it. A 401 on any later call clears that cache through `onUnauthorized` in
`src/api/client.ts`, which is what lands an expired session back on sign-in
rather than on an error page.

There is no password anywhere in the client, and no token. See
[api.md](api.md#accounts) for the endpoints and what the client assumes of them.

## Text

All copy lives in `src/i18n/nb-NO.ts` and reaches components through
`useTranslation()` (FR-I18N-1). Nothing user-visible is written in a component,
including the map's own labels — `src/config/basemaps.ts` holds layer ids, and
their names are keys under `map.basemaps.<id>`.

Adding English is a second resource file and a second entry in
`SUPPORTED_LOCALES`; no feature code changes (FR-I18N-2). The profile's language
picker renders that list, which is why it has one option today. `applyLocale`
keeps `<html lang>` in step with the active locale, and the user's own locale
takes over as soon as their profile loads.

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
- Navigating away from the map and back loses the viewport: the router restores
  the path it recorded, and the fragment was written outside its knowledge.
- The locale picker offers one language, because one is what ships.
- The peaks layer cannot be toggled off yet (FR-MAP-4), and peaks are not clustered — over
  a large extent the API caps the result at the 500 highest and the map says so.
