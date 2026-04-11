/**
 * Google Maps-style viewport selection overlay for downloading map tiles.
 *
 * When active, shows a semi-transparent dark overlay with a clear rectangle
 * in the center (the selection area). The user pans/zooms freely — the
 * selection rectangle stays centered, always showing the inner 70% of the
 * viewport. Tile estimate and Download/Cancel buttons appear below.
 */
import { useState, useEffect, useCallback } from 'react'
import { useMap } from 'react-leaflet'
import { estimateTiles } from '../services/tileCache'
import { getVisibleTiles, isTileCached } from '../services/overpass'
import type { LatLngBounds } from 'leaflet'

interface Props {
  onConfirm: (bbox: { south: number; west: number; north: number; east: number }) => void
  onCancel: () => void
}

/** Margin: 15% on each side → inner 70% of viewport width/height. */
const MARGIN = 0.15
/** Extra bottom margin to leave room for buttons. */
const BOTTOM_MARGIN = 0.25

/** Compute the inner bbox from current map bounds with margins applied. */
function getInnerBbox(bounds: LatLngBounds): { south: number; west: number; north: number; east: number } {
  const south = bounds.getSouth()
  const north = bounds.getNorth()
  const west = bounds.getWest()
  const east = bounds.getEast()
  const latSpan = north - south
  const lngSpan = east - west
  return {
    south: south + latSpan * BOTTOM_MARGIN,
    north: north - latSpan * MARGIN,
    west: west + lngSpan * MARGIN,
    east: east - lngSpan * MARGIN,
  }
}

/** Count total tiles and how many are already in the in-memory cache. */
function countTiles(bbox: { south: number; west: number; north: number; east: number }) {
  const fakeBounds = {
    getSouth: () => bbox.south,
    getNorth: () => bbox.north,
    getWest: () => bbox.west,
    getEast: () => bbox.east,
  } as LatLngBounds
  const tiles = getVisibleTiles(fakeBounds)
  let cached = 0
  for (const t of tiles) {
    if (isTileCached(t.row, t.col)) cached++
  }
  return { total: tiles.length, cached }
}

export default function CacheDrawOverlay({ onConfirm, onCancel }: Props) {
  const map = useMap()
  const [tileInfo, setTileInfo] = useState({ total: 0, cached: 0 })

  const updateTileInfo = useCallback(() => {
    const bbox = getInnerBbox(map.getBounds())
    setTileInfo(countTiles(bbox))
  }, [map])

  useEffect(() => {
    updateTileInfo()
    map.on('moveend', updateTileInfo)
    map.on('zoomend', updateTileInfo)
    return () => {
      map.off('moveend', updateTileInfo)
      map.off('zoomend', updateTileInfo)
    }
  }, [map, updateTileInfo])

  function handleDownload() {
    const bbox = getInnerBbox(map.getBounds())
    onConfirm(bbox)
  }

  const estimate = estimateTiles(getInnerBbox(map.getBounds()))
  const uncached = tileInfo.total - tileInfo.cached

  return (
    <>
      {/* Single div with massive box-shadow creates the dark frame effect */}
      <div className="cache-cutout" />

      {/* Info + buttons below the cutout */}
      <div className="cache-controls">
        <p className="cache-estimate">
          ~{tileInfo.total} tile{tileInfo.total !== 1 ? 's' : ''}
          {tileInfo.cached > 0 && ` (${tileInfo.cached} cached)`}
          {uncached > 0 ? ` · ~${estimate.estimatedSeconds}s` : ' · instant'}
        </p>
        <div className="cache-btn-row">
          <button className="cache-btn cache-btn-download" onClick={handleDownload}>
            Download
          </button>
          <button className="cache-btn cache-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}
