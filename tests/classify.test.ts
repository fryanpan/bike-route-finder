import { describe, it, expect } from 'bun:test'
import { classifyEdge, worsen } from '../src/utils/classify'
import type { ValhallaEdge } from '../src/utils/types'

// ── Fahrradstrasse (bicycle_road=yes) ─────────────────────────────────────────

describe('classifyEdge — Fahrradstrasse', () => {
  it('classifies bicycle_road=yes as great for all profiles', () => {
    const edge: ValhallaEdge = { bicycle_road: true, road_class: 6 }
    expect(classifyEdge(edge, 'toddler')).toBe('great')
    expect(classifyEdge(edge, 'trailer')).toBe('great')
    expect(classifyEdge(edge, 'training')).toBe('great')
  })
})

// ── Car-free paths and cycleways ──────────────────────────────────────────────

describe('classifyEdge — car-free paths (use=20 cycleway, use=25 path)', () => {
  it('classifies use=20 (cycleway) as great', () => {
    const edge: ValhallaEdge = { use: 20 }
    expect(classifyEdge(edge, 'toddler')).toBe('great')
  })

  it('classifies use=25 (path/trail e.g. Engeldam) as great', () => {
    const edge: ValhallaEdge = { use: 25 }
    expect(classifyEdge(edge, 'toddler')).toBe('great')
    expect(classifyEdge(edge, 'trailer')).toBe('great')
  })

  it('classifies dirt path (use=25, surface=dirt) as great — dirt is NOT a bad surface', () => {
    // surface=dirt is NOT in the BAD_SURFACES set; it is a rideable park trail.
    // This confirms that Engeldam-style paths display correctly even if they have a dirt surface.
    const edge: ValhallaEdge = { use: 25, surface: 'dirt' }
    expect(classifyEdge(edge, 'toddler')).toBe('great')
    expect(classifyEdge(edge, 'trailer')).toBe('great')
  })
})

// ── Separated bike track alongside road (cycleway=track) ─────────────────────

describe('classifyEdge — separated track (cycle_lane=3)', () => {
  it('classifies elevated separated path as good for all profiles', () => {
    const edge: ValhallaEdge = { cycle_lane: 3 }
    expect(classifyEdge(edge, 'toddler')).toBe('good')
    expect(classifyEdge(edge, 'trailer')).toBe('good')
    expect(classifyEdge(edge, 'training')).toBe('good')
  })
})

// ── Painted road bike lane (cycleway=lane) ────────────────────────────────────

describe('classifyEdge — painted road lane (cycle_lane=2)', () => {
  it('classifies painted lane as avoid for toddler', () => {
    const edge: ValhallaEdge = { cycle_lane: 2 }
    expect(classifyEdge(edge, 'toddler')).toBe('avoid')
  })

  it('classifies painted lane as ok for trailer and training', () => {
    const edge: ValhallaEdge = { cycle_lane: 2 }
    expect(classifyEdge(edge, 'trailer')).toBe('ok')
    expect(classifyEdge(edge, 'training')).toBe('ok')
  })
})

// ── Bad surfaces (cobblestones) ───────────────────────────────────────────────

describe('classifyEdge — bad surfaces', () => {
  it('worsens classification on cobblestone for toddler and trailer', () => {
    // A separated track on cobblestones should drop from good → ok
    const edge: ValhallaEdge = { cycle_lane: 3, surface: 'cobblestone' }
    expect(classifyEdge(edge, 'toddler')).toBe('ok')
    expect(classifyEdge(edge, 'trailer')).toBe('ok')
  })

  it('does NOT worsen classification on cobblestone for training profile', () => {
    const edge: ValhallaEdge = { cycle_lane: 3, surface: 'cobblestone' }
    expect(classifyEdge(edge, 'training')).toBe('good')
  })

  it('worsens sett (Kopfsteinpflaster) for toddler', () => {
    // Great path on sett → good (one level worse)
    const edge: ValhallaEdge = { use: 20, surface: 'sett' }
    expect(classifyEdge(edge, 'toddler')).toBe('good')
  })

  it('does NOT treat dirt or compacted as bad surfaces', () => {
    // dirt / compacted are rideable park surfaces — should not be penalised
    const dirt: ValhallaEdge = { cycle_lane: 3, surface: 'dirt' }
    const compacted: ValhallaEdge = { cycle_lane: 3, surface: 'compacted' }
    expect(classifyEdge(dirt, 'toddler')).toBe('good')
    expect(classifyEdge(compacted, 'toddler')).toBe('good')
  })
})

// ── Road class fallback ───────────────────────────────────────────────────────

describe('classifyEdge — road class fallback', () => {
  it('classifies residential (road_class=6) as acceptable', () => {
    const edge: ValhallaEdge = { road_class: 6 }
    expect(classifyEdge(edge, 'toddler')).toBe('acceptable')
  })

  it('classifies tertiary (road_class=4) as caution', () => {
    const edge: ValhallaEdge = { road_class: 4 }
    expect(classifyEdge(edge, 'toddler')).toBe('caution')
  })

  it('classifies primary (road_class=1) as avoid', () => {
    const edge: ValhallaEdge = { road_class: 1 }
    expect(classifyEdge(edge, 'toddler')).toBe('avoid')
  })
})

// ── null / undefined edge ─────────────────────────────────────────────────────

describe('classifyEdge — null edge', () => {
  it('returns acceptable for null edge', () => {
    expect(classifyEdge(null)).toBe('acceptable')
    expect(classifyEdge(undefined)).toBe('acceptable')
  })
})

// ── worsen helper ─────────────────────────────────────────────────────────────

describe('worsen', () => {
  it('degrades each class by one level', () => {
    expect(worsen('great')).toBe('good')
    expect(worsen('good')).toBe('ok')
    expect(worsen('ok')).toBe('acceptable')
    expect(worsen('acceptable')).toBe('caution')
    expect(worsen('caution')).toBe('avoid')
  })

  it('cannot degrade below avoid', () => {
    expect(worsen('avoid')).toBe('avoid')
  })
})
