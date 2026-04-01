import type { SafetyClass, OsmWay } from '../utils/types'
import type { LatLngBounds } from 'leaflet'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

function buildQuery(bbox: { south: number; west: number; north: number; east: number }): string {
  const { south, west, north, east } = bbox
  const b = `${south},${west},${north},${east}`
  return `
[out:json][timeout:15];
(
  way["highway"="cycleway"](${b});
  way["bicycle_road"="yes"](${b});
  way["cycleway"="track"](${b});
  way["cycleway"="lane"](${b});
  way["cycleway"="opposite_track"](${b});
  way["cycleway"="opposite_lane"](${b});
  way["cycleway"="share_busway"](${b});
  way["highway"="living_street"](${b});
  way["highway"="residential"]["bicycle"!="no"](${b});
);
out geom;
`
}

const BAD_SURFACES = new Set([
  'cobblestone', 'paving_stones', 'sett', 'unhewn_cobblestone',
  'cobblestone:flattened',
])

/**
 * Map raw OSM tags to a safety class (mirrors classify.ts logic for Valhalla edges).
 * Used for the Overpass-based bike map overlay where we have direct OSM tag access.
 *
 * Note: unlike classifyEdge(), we CAN directly check bicycle_road=yes here,
 * since Overpass returns raw OSM tags.
 */
function classifyOsmTags(tags: Record<string, string>): SafetyClass {
  const highway = tags.highway ?? ''
  const cycleway = tags.cycleway ?? ''
  const bicycleRoad = tags.bicycle_road === 'yes'
  const surface = tags.surface ?? ''
  const badSurface = BAD_SURFACES.has(surface)

  if (highway === 'cycleway' || bicycleRoad) return badSurface ? 'ok' : 'great'
  if (cycleway === 'track') return badSurface ? 'ok' : 'good'
  if (cycleway === 'opposite_track') return 'good'
  if (cycleway === 'lane' || cycleway === 'opposite_lane') return badSurface ? 'acceptable' : 'ok'
  if (cycleway === 'share_busway') return 'acceptable'
  if (highway === 'living_street') return 'acceptable'
  if (highway === 'residential') return badSurface ? 'caution' : 'acceptable'

  return 'acceptable'
}

interface OverpassElement {
  type: string
  id: number
  tags?: Record<string, string>
  geometry?: Array<{ lat: number; lon: number }>
}

/**
 * Query bike infrastructure for the visible map bounds.
 * Returns null if the area is too large (zoom in more); throws on network error.
 */
export async function fetchBikeInfra(bounds: LatLngBounds): Promise<OsmWay[] | null> {
  const bbox = {
    south: bounds.getSouth(),
    west: bounds.getWest(),
    north: bounds.getNorth(),
    east: bounds.getEast(),
  }

  // Refuse to query if the area is too large (> ~15 km²) to avoid hammering Overpass
  const latSpan = bbox.north - bbox.south
  const lngSpan = bbox.east - bbox.west
  if (latSpan > 0.15 || lngSpan > 0.2) {
    return null // zoom in more
  }

  const query = buildQuery(bbox)
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  if (!response.ok) throw new Error('Overpass query failed')

  const data = await response.json() as { elements: OverpassElement[] }

  return data.elements
    .filter((el): el is OverpassElement & { geometry: NonNullable<OverpassElement['geometry']> } =>
      el.type === 'way' && el.geometry != null,
    )
    .map((el) => ({
      safetyClass: classifyOsmTags(el.tags ?? {}),
      coordinates: el.geometry.map((pt): [number, number] => [pt.lat, pt.lon]),
      osmId: el.id,
      tags: el.tags ?? {},
    }))
}
