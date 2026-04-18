export interface MapillaryImage {
  id: string
  thumbUrl: string
  lat: number
  lng: number
}

const MAPILLARY_API = 'https://graph.mapillary.com/images'

/** Degrees per metre at Berlin latitude — rough, good enough for bbox queries. */
const METERS_TO_LAT = 1 / 111_000
const METERS_TO_LNG = 1 / (111_000 * Math.cos((52.5 * Math.PI) / 180))

/**
 * Fetch the nearest Mapillary street-level image to the given point.
 *
 * Progressive widening: first try a 100m box, then 250m, then 500m.
 * Berlin has dense Mapillary coverage along roads, but the click point
 * often falls a few meters off the road centerline (sidewalk, grass
 * buffer) and the 50m bbox the prior version used would miss. Wider
 * fallbacks mean far fewer "no image" states while still picking the
 * nearest image to the click.
 *
 * Returns null if no token is configured, no images exist within 500m,
 * or the API errors.
 */
export async function getStreetImage(lat: number, lng: number): Promise<MapillaryImage | null> {
  const token = import.meta.env.VITE_MAPILLARY_TOKEN
  if (!token) return null

  for (const radiusM of [100, 250, 500]) {
    const latDelta = radiusM * METERS_TO_LAT
    const lngDelta = radiusM * METERS_TO_LNG
    const bbox = `${lng - lngDelta},${lat - latDelta},${lng + lngDelta},${lat + latDelta}`
    const params = new URLSearchParams({
      bbox,
      limit: '25',   // pull several so we can pick the truly nearest
      fields: 'id,thumb_1024_url,computed_geometry',
      access_token: token,
    })

    try {
      const resp = await fetch(`${MAPILLARY_API}?${params}`)
      if (!resp.ok) return null

      const body = (await resp.json()) as {
        data: Array<{
          id: string
          thumb_1024_url: string
          computed_geometry: { coordinates: [number, number] }
        }>
      }

      if (!body.data || body.data.length === 0) continue // try a wider bbox

      // Pick the image with the smallest squared distance to the click.
      let best: MapillaryImage | null = null
      let bestSq = Infinity
      for (const img of body.data) {
        const [ilng, ilat] = img.computed_geometry.coordinates
        const dLat = (ilat - lat) / METERS_TO_LAT
        const dLng = (ilng - lng) / METERS_TO_LNG
        const sq = dLat * dLat + dLng * dLng
        if (sq < bestSq) {
          bestSq = sq
          best = {
            id: img.id,
            thumbUrl: img.thumb_1024_url,
            lat: ilat,
            lng: ilng,
          }
        }
      }
      return best
    } catch {
      return null
    }
  }

  return null
}
