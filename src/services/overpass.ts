import type { SafetyClass, OsmWay } from '../utils/types'
import { worsen } from '../utils/classify'
import type { LatLngBounds } from 'leaflet'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

// Simple in-memory cache keyed by bbox + profile. Avoids redundant Overpass
// requests when the user pans back to an area or toggles the overlay off/on.
const _cache = new Map<string, OsmWay[]>()

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
 * Map raw OSM tags to a safety class, mirroring classify.ts profile-aware logic.
 *
 * Profile differences (same rules as classifyEdge in classify.ts):
 *  toddler  — painted bike lanes (cycleway=lane) → avoid; share_busway → caution
 *  trailer  — painted lanes → ok; share_busway → acceptable
 *  training — same as trailer; tolerates bad surfaces (no worsening)
 */
function classifyOsmTags(tags: Record<string, string>, profileKey?: string): SafetyClass {
  const highway = tags.highway ?? ''
  const cycleway = tags.cycleway ?? ''
  const bicycleRoad = tags.bicycle_road === 'yes'
  const surface = tags.surface ?? ''
  const badSurface = BAD_SURFACES.has(surface)

  const base = classifyOsmBase(highway, cycleway, bicycleRoad, profileKey)

  // Bad surfaces worsen the class by one step — except for the training profile
  if (badSurface && profileKey !== 'training') return worsen(base)
  return base
}

function classifyOsmBase(
  highway: string,
  cycleway: string,
  bicycleRoad: boolean,
  profileKey?: string,
): SafetyClass {
  if (highway === 'cycleway' || bicycleRoad) return 'great'
  if (cycleway === 'track' || cycleway === 'opposite_track') return 'good'

  if (cycleway === 'lane' || cycleway === 'opposite_lane') {
    // toddler treats painted road lanes as no better than an unprotected road
    return profileKey === 'toddler' ? 'avoid' : 'ok'
  }

  if (cycleway === 'share_busway') {
    return profileKey === 'toddler' ? 'caution' : 'acceptable'
  }

  if (highway === 'living_street') return 'acceptable'
  if (highway === 'residential') return 'acceptable'

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
 * profileKey controls which safety classification rules are applied.
 */
export async function fetchBikeInfra(bounds: LatLngBounds, profileKey?: string): Promise<OsmWay[] | null> {
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

  const cacheKey = [
    bbox.south.toFixed(4),
    bbox.north.toFixed(4),
    bbox.west.toFixed(4),
    bbox.east.toFixed(4),
    profileKey ?? '',
  ].join(':')
  if (_cache.has(cacheKey)) return _cache.get(cacheKey)!

  const query = buildQuery(bbox)
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  if (!response.ok) throw new Error('Overpass query failed')

  const data = await response.json() as { elements: OverpassElement[] }

  const result = data.elements
    .filter((el): el is OverpassElement & { geometry: NonNullable<OverpassElement['geometry']> } =>
      el.type === 'way' && el.geometry != null,
    )
    .map((el) => ({
      safetyClass: classifyOsmTags(el.tags ?? {}, profileKey),
      coordinates: el.geometry.map((pt): [number, number] => [pt.lat, pt.lon]),
      osmId: el.id,
      tags: el.tags ?? {},
    }))

  _cache.set(cacheKey, result)
  return result
}
