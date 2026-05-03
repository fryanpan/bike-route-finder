import { describe, it, expect } from 'bun:test'
import { simplifyPath, degreesPerPixel } from '../src/utils/simplifyPath'

describe('degreesPerPixel', () => {
  it('returns canonical Web-Mercator pixel size', () => {
    // At zoom 0, the whole world (360°) fits in a single 256-px tile.
    expect(degreesPerPixel(0)).toBeCloseTo(360 / 256, 6)
    // Each zoom level halves the per-pixel degree count.
    expect(degreesPerPixel(1)).toBeCloseTo(360 / 512, 6)
    expect(degreesPerPixel(10)).toBeCloseTo(360 / (1024 * 256), 9)
  })
})

describe('simplifyPath', () => {
  it('returns input unchanged when fewer than 3 vertices', () => {
    const coords: [number, number][] = [[52.5, 13.4], [52.6, 13.5]]
    expect(simplifyPath(coords, 10)).toEqual(coords)
  })

  it('returns input unchanged at street-level zoom (>= 16)', () => {
    // At z>=16, taps land precisely; we want full vertex detail.
    const coords: [number, number][] = [
      [52.5, 13.4],
      [52.5001, 13.4001],
      [52.5002, 13.4002],
      [52.5003, 13.4003],
    ]
    expect(simplifyPath(coords, 16).length).toBe(coords.length)
    expect(simplifyPath(coords, 18).length).toBe(coords.length)
  })

  it('drops collinear midpoints at low zoom', () => {
    // Three points on a perfectly straight line — middle should be
    // dropped at any tolerance > 0.
    const coords: [number, number][] = [
      [52.5, 13.4],
      [52.55, 13.45],
      [52.6, 13.5],
    ]
    const out = simplifyPath(coords, 10)
    expect(out).toHaveLength(2)
    expect(out[0]).toEqual([52.5, 13.4])
    expect(out[1]).toEqual([52.6, 13.5])
  })

  it('preserves sharp turns at low zoom (Douglas-Peucker, not radial-distance)', () => {
    // L-shape with a clear corner — DP must keep the corner vertex
    // because dropping it would change the visible shape.
    const coords: [number, number][] = [
      [52.5, 13.4],
      [52.5, 13.5], // corner
      [52.6, 13.5],
    ]
    const out = simplifyPath(coords, 10)
    expect(out).toHaveLength(3)
    expect(out[1]).toEqual([52.5, 13.5])
  })

  it('produces a strictly shorter result on noisy paths at low zoom', () => {
    // 30 vertices wandering ~1 m around a straight line — at z=10
    // (~150 m / pixel) all the wandering is sub-pixel, so DP should
    // reduce hard.
    const coords: [number, number][] = []
    for (let i = 0; i < 30; i++) {
      coords.push([52.5 + i * 0.001, 13.4 + (Math.sin(i) * 0.000005)])
    }
    const out = simplifyPath(coords, 10)
    expect(out.length).toBeLessThan(coords.length / 4)
  })

  it('keeps roughly the same shape at z=14 (zoomed in enough to see detail)', () => {
    // Same noisy path, but at zoom 14 (~10 m / pixel). The 1 m wander
    // is still sub-pixel so most should drop, but more vertices
    // survive than at z=10.
    const coords: [number, number][] = []
    for (let i = 0; i < 30; i++) {
      coords.push([52.5 + i * 0.001, 13.4 + (Math.sin(i) * 0.000005)])
    }
    const lowZoom = simplifyPath(coords, 10)
    const highZoom = simplifyPath(coords, 14)
    // Higher zoom retains at least as many vertices as lower zoom.
    expect(highZoom.length).toBeGreaterThanOrEqual(lowZoom.length)
  })
})
