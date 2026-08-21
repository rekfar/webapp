import { useState } from 'react'
import {
  CircleMarker,
  MapContainer,
  ScaleControl,
  TileLayer,
  Tooltip,
  ZoomControl,
} from 'react-leaflet'
import type { LatLng } from 'leaflet'

import {
  DEFAULT_BASEMAP_ID,
  KARTVERKET_ATTRIBUTION,
  MAX_NATIVE_ZOOM,
  MAX_ZOOM,
  getBasemap,
  tileUrlTemplate,
} from '../config/basemaps'
import { DEFAULT_CENTER, DEFAULT_ZOOM, MAX_BOUNDS, MIN_ZOOM } from '../config/view'
import { BRAND } from '../brand/colors'
import { BasemapSwitcher } from './BasemapSwitcher'
import { HashSync, parseHash } from './HashSync'
import { LocateControl } from './LocateControl'
import { Overlay } from './Overlay'
import { PeaksLayer } from './PeaksLayer'
import { PeaksProvider } from './PeaksProvider'
import { PeaksStatus } from './PeaksStatus'
import { StatusBar } from './StatusBar'

export function MapView() {
  const [basemapId, setBasemapId] = useState(DEFAULT_BASEMAP_ID)
  const [userPosition, setUserPosition] = useState<LatLng | null>(null)

  const basemap = getBasemap(basemapId)

  // Read once at mount; HashSync owns the URL from then on.
  const initialView = parseHash(window.location.hash)
  const center = initialView
    ? ([initialView.lat, initialView.lon] as [number, number])
    : DEFAULT_CENTER
  const zoom = initialView ? initialView.zoom : DEFAULT_ZOOM

  return (
    <MapContainer
      className="map"
      center={center}
      zoom={zoom}
      minZoom={MIN_ZOOM}
      maxZoom={MAX_ZOOM}
      maxBounds={MAX_BOUNDS}
      maxBoundsViscosity={0.75}
      zoomControl={false}
      // An extent can hold up to PEAKS_LIMIT peak markers. On canvas they are one
      // element between them; as SVG they would be that many DOM nodes.
      preferCanvas
    >
      {/*
        `key` forces a fresh TileLayer when the basemap changes, so tiles from
        the previous layer are dropped instead of lingering underneath.
      */}
      <TileLayer
        key={basemap.id}
        url={tileUrlTemplate(basemap.layer)}
        attribution={KARTVERKET_ATTRIBUTION}
        maxNativeZoom={MAX_NATIVE_ZOOM}
        maxZoom={MAX_ZOOM}
        // Keep a ring of tiles around the viewport so panning does not refetch
        // everything — Kartverket asks that the open cache is used gently.
        keepBuffer={3}
      />

      {userPosition && (
        <CircleMarker
          center={userPosition}
          radius={7}
          pathOptions={{ color: '#ffffff', weight: 2, fillColor: BRAND.rust, fillOpacity: 1 }}
        >
          <Tooltip direction="top" offset={[0, -8]}>
            Din posisjon
          </Tooltip>
        </CircleMarker>
      )}

      <ZoomControl position="topright" />
      <ScaleControl position="bottomleft" imperial={false} />
      <HashSync />

      {/* The provider owns one fetch loop; the layer draws it and the chip reports it. */}
      <PeaksProvider>
        <PeaksLayer />

        <Overlay position="bottom-left">
          <PeaksStatus />
          <StatusBar />
        </Overlay>
      </PeaksProvider>

      <Overlay position="top-left">
        <BasemapSwitcher value={basemapId} onChange={setBasemapId} />
      </Overlay>

      <Overlay position="right">
        <LocateControl onLocated={setUserPosition} />
      </Overlay>
    </MapContainer>
  )
}
