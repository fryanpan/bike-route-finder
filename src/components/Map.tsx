import L from 'leaflet'
import { Marker, MapContainer, Polyline, TileLayer, Tooltip, useMapEvents } from 'react-leaflet'
import { SAFETY } from '../utils/classify'
import BikeMapOverlay from './BikeMapOverlay'
import type { Route, RouteSegment } from '../utils/types'

// Fix Leaflet default icons broken by Vite's asset bundling
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png'
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIcon2xUrl,
  shadowUrl: markerShadowUrl,
})

const startIcon = L.divIcon({
  html: '<div class="pin pin-start">A</div>',
  className: '',
  iconSize: [30, 38],
  iconAnchor: [15, 38],
})
const endIcon = L.divIcon({
  html: '<div class="pin pin-end">B</div>',
  className: '',
  iconSize: [30, 38],
  iconAnchor: [15, 38],
})
const waypointIcon = L.divIcon({
  html: '<div class="pin pin-waypoint">+</div>',
  className: '',
  iconSize: [26, 26],
  iconAnchor: [13, 26],
})

function makeSegmentIcon(emoji: string): L.DivIcon {
  return L.divIcon({
    html: `<div class="seg-icon">${emoji}</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

function ClickHandler({ onClick }: { onClick: (latlng: L.LatLng) => void }) {
  useMapEvents({ click: (e) => onClick(e.latlng) })
  return null
}

function midpoint(coords: [number, number][]): [number, number] {
  return coords[Math.floor(coords.length / 2)]
}

function RouteDisplay({ route }: { route: Route | null }) {
  if (!route) return null

  if (route.segments?.length) {
    return (
      <>
        {route.segments.map((seg: RouteSegment, i: number) => {
          const s = SAFETY[seg.safetyClass] ?? SAFETY.acceptable
          return (
            <Polyline
              key={i}
              positions={seg.coordinates}
              color={s.color}
              weight={6}
              opacity={0.9}
            >
              <Tooltip sticky direction="top" offset={[0, -6]}>
                <span style={{ fontSize: 13 }}>{s.icon} {s.label}</span>
              </Tooltip>
            </Polyline>
          )
        })}
        {route.segments
          .filter((seg) => seg.coordinates.length >= 4)
          .map((seg, i) => {
            const s = SAFETY[seg.safetyClass] ?? SAFETY.acceptable
            return (
              <Marker
                key={`icon-${i}`}
                position={midpoint(seg.coordinates)}
                icon={makeSegmentIcon(s.icon)}
              />
            )
          })}
      </>
    )
  }

  return (
    <Polyline
      positions={route.coordinates}
      color="#2563eb"
      weight={5}
      opacity={0.85}
    />
  )
}

function Legend({
  segments,
  overlayOn,
}: {
  segments: RouteSegment[] | null
  overlayOn: boolean
}) {
  const classes = segments
    ? [...new Set(segments.map((s) => s.safetyClass))]
    : overlayOn
    ? (Object.keys(SAFETY) as (keyof typeof SAFETY)[])
    : []

  if (!classes.length) return null

  return (
    <div className="map-legend">
      {classes.map((cls) => {
        const s = SAFETY[cls]
        return (
          <div key={cls} className="legend-item">
            <span className="legend-dot" style={{ background: s.color }} />
            <span className="legend-text">{s.icon} {s.label}</span>
          </div>
        )
      })}
    </div>
  )
}

interface Props {
  startPoint: { lat: number; lng: number; shortLabel?: string } | null
  endPoint: { lat: number; lng: number; shortLabel?: string } | null
  route: Route | null
  waypoints: Array<{ lat: number; lng: number }>
  onMapClick: (latlng: L.LatLng) => void
  onRemoveWaypoint: (index: number) => void
  overlayEnabled: boolean
  onOverlayStatusChange: (status: string) => void
}

export default function Map({
  startPoint,
  endPoint,
  route,
  waypoints,
  onMapClick,
  onRemoveWaypoint,
  overlayEnabled,
  onOverlayStatusChange,
}: Props) {
  const routeSegments = route?.segments ?? null

  return (
    <MapContainer
      center={[52.52, 13.405]}
      zoom={13}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ClickHandler onClick={onMapClick} />

      <BikeMapOverlay enabled={overlayEnabled} onStatusChange={onOverlayStatusChange} />

      <RouteDisplay route={route} />

      {startPoint && (
        <Marker position={[startPoint.lat, startPoint.lng]} icon={startIcon}>
        </Marker>
      )}

      {endPoint && (
        <Marker position={[endPoint.lat, endPoint.lng]} icon={endIcon}>
        </Marker>
      )}

      {waypoints.map((wp, i) => (
        <Marker key={i} position={[wp.lat, wp.lng]} icon={waypointIcon}
          eventHandlers={{ click: () => onRemoveWaypoint(i) }}
        >
        </Marker>
      ))}

      <Legend segments={routeSegments} overlayOn={overlayEnabled} />
    </MapContainer>
  )
}
