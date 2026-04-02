import { describe, it, expect } from 'bun:test'
import { tileKey, latLngToTile, getVisibleTiles, isTileCached, getCachedTile } from '../src/services/overpass'

// Minimal LatLngBounds stub
function makeBounds(south: number, west: number, north: number, east: number) {
  return {
    getSouth: () => south,
    getNorth: () => north,
    getWest:  () => west,
    getEast:  () => east,
  } as any
}

describe('tileKey', () => {
  it('produces a stable string key', () => {
    expect(tileKey(52, 13, 'toddler')).toBe('52:13:toddler')
    expect(tileKey(-1, -2, 'trailer')).toBe('-1:-2:trailer')
  })

  it('differs by profile', () => {
    expect(tileKey(52, 13, 'toddler')).not.toBe(tileKey(52, 13, 'trailer'))
  })
})

describe('latLngToTile', () => {
  it('maps Berlin center to correct tile', () => {
    // lat 52.52, lng 13.405 → row=floor(52.52/0.1)=525, col=floor(13.405/0.1)=134
    const { row, col } = latLngToTile(52.52, 13.405)
    expect(row).toBe(525)
    expect(col).toBe(134)
  })

  it('handles exact boundary (lat exactly on tile edge)', () => {
    const { row } = latLngToTile(52.5, 13.0)
    expect(row).toBe(525)
  })

  it('handles negative longitude', () => {
    const { col } = latLngToTile(37.77, -122.42)
    expect(col).toBe(-1225)
  })
})

describe('getVisibleTiles', () => {
  it('returns a single tile for a bbox within one tile', () => {
    // Bounds entirely inside tile row=525, col=134 (52.5–52.6, 13.4–13.5)
    const bounds = makeBounds(52.51, 13.41, 52.59, 13.49)
    const tiles = getVisibleTiles(bounds)
    expect(tiles).toHaveLength(1)
    expect(tiles[0]).toEqual({ row: 525, col: 134 })
  })

  it('returns 4 tiles for a bbox spanning 2×2 tiles', () => {
    // Bounds: 52.55–52.65 spans rows 525 and 526; 13.45–13.55 spans cols 134 and 135
    const bounds = makeBounds(52.55, 13.45, 52.65, 13.55)
    const tiles = getVisibleTiles(bounds)
    expect(tiles).toHaveLength(4)
    const rows = [...new Set(tiles.map((t) => t.row))].sort((a, b) => a - b)
    const cols = [...new Set(tiles.map((t) => t.col))].sort((a, b) => a - b)
    expect(rows).toEqual([525, 526])
    expect(cols).toEqual([134, 135])
  })

  it('returns a 3×2 grid for a wider bbox', () => {
    const bounds = makeBounds(52.51, 13.31, 52.69, 13.59)
    const tiles = getVisibleTiles(bounds)
    // rows: 525, 526  cols: 133, 134, 135
    expect(tiles).toHaveLength(6)
  })
})

describe('isTileCached / getCachedTile', () => {
  it('returns false/undefined before any fetch', () => {
    expect(isTileCached(9999, 9999, 'toddler')).toBe(false)
    expect(getCachedTile(9999, 9999, 'toddler')).toBeUndefined()
  })
})
