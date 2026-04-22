// "Compare on external router" links for benchmark sanity-checking.
// Hidden by default; admin-settings toggle `showExternalRouterLinks`
// reveals it in the route panel. Opens the same start/end/waypoints on:
//   - BRouter.de web (trekking profile — their family-ish bike profile)
//   - osm.org directions with engine=fossgis_valhalla_bicycle
//     (OpenStreetMap.org's embedded Valhalla demo, bicycle mode)

import type { RideMode } from '../data/modes'

interface LatLng { lat: number; lng: number }

interface Props {
  start: LatLng
  end: LatLng
  waypoints: LatLng[]
  mode: RideMode
}

// BRouter's web app reads `lonlats` in `lon,lat;lon,lat;...` order. Their
// closest-to-safe profile is `safety`; `trekking` is the default quiet-road
// profile most comparable to our kid-starting-out / confident modes.
function brouterProfile(mode: RideMode): string {
  switch (mode) {
    case 'kid-starting-out':
    case 'kid-confident':
      return 'safety'
    case 'kid-traffic-savvy':
    case 'carrying-kid':
      return 'trekking'
    case 'training':
      return 'fastbike'
    default:
      return 'trekking'
  }
}

function buildBrouterUrl(start: LatLng, end: LatLng, waypoints: LatLng[], mode: RideMode): string {
  const all = [start, ...waypoints, end]
  const lonlats = all.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(';')
  const mid = all[Math.floor(all.length / 2)]
  const params = new URLSearchParams({
    lonlats,
    profile: brouterProfile(mode),
  })
  // BRouter uses a hash fragment for the map view + query.
  return `https://brouter.de/brouter-web/#map=13/${mid.lat.toFixed(5)}/${mid.lng.toFixed(5)}/standard&${params.toString()}`
}

function buildOsmValhallaUrl(start: LatLng, end: LatLng, waypoints: LatLng[]): string {
  // osm.org's directions UI exposes FOSSGIS's Valhalla in bicycle mode.
  // Route format: "lat1,lon1;lat2,lon2;..." (note: lat first, unlike BRouter).
  const all = [start, ...waypoints, end]
  const route = all.map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join(';')
  const params = new URLSearchParams({
    engine: 'fossgis_valhalla_bicycle',
    route,
  })
  return `https://www.openstreetmap.org/directions?${params.toString()}`
}

export default function RouteCompareLinks({ start, end, waypoints, mode }: Props) {
  const brouterUrl = buildBrouterUrl(start, end, waypoints, mode)
  const valhallaUrl = buildOsmValhallaUrl(start, end, waypoints)

  return (
    <div className="route-compare-links">
      <span className="route-compare-label">Compare routes on:</span>
      <a href={brouterUrl} target="_blank" rel="noopener noreferrer" className="route-compare-btn">
        BRouter
      </a>
      <a href={valhallaUrl} target="_blank" rel="noopener noreferrer" className="route-compare-btn">
        Valhalla (osm.org)
      </a>
    </div>
  )
}
