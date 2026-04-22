import { useState, useEffect } from 'react'
import { PROFILE_LEGEND, PREFERRED_COLOR, OTHER_COLOR } from '../utils/classify'
import { MODE_RULES } from '../data/modes'
import type { RideMode } from '../data/modes'
import type { PathLevel } from '../utils/lts'

// Compact inline legend — replaces the old preferred/other two-column panel.
// Shows only the preferred tiers for the selected travel mode, as line-style
// swatches.

type DisplayTier = {
  level: PathLevel
  title: string
  description: string
  dashArray: string | undefined
  color: string
}

// Tier colors. Three strongly distinct greens for bike-infra tiers (1a/1b/2a)
// so users can tell them apart at a glance. Navy for shared-with-cars roads
// (2b/3) so users see at a glance that a different color = "this is just
// a road, not a bike lane."
const COLOR_1A = '#064e3b' // emerald-900 — car-free (darkest)
const COLOR_1B = '#047857' // emerald-700 — bike-priority shared
const COLOR_2A = '#34d399' // emerald-400 — painted lane on quiet street
const COLOR_NO_INFRA = '#6f80b4' // ~40% lighter than blue-900 — no bike infra (2b and 3)

// Display titles match docs/product/path-types-reference.md Table 1.
// All three green bike-infra tiers render as solid lines with decreasing
// weight (1.0× → 0.8× → 0.6×) — the color stepping carries the tier
// distinction; solid keeps the map legible. Navy 2b (solid, 0.6×) vs
// navy 3 (dots, 0.6×) distinguishes the "no bike infra" tiers by dash
// pattern within the same color.
export const SIMPLE_TIERS: DisplayTier[] = [
  { level: '1a', title: 'Car-free',                  description: 'Bike paths, shared foot paths, elevated sidewalk paths', dashArray: undefined, color: COLOR_1A },
  { level: '1b', title: 'Bikeway with minimal cars', description: 'Fahrradstraße, living streets, bike boulevards',         dashArray: undefined, color: COLOR_1B },
  { level: '2a', title: 'Bike route beside cars',    description: 'Painted bike lane or shared bus lane on quiet streets',  dashArray: undefined, color: COLOR_2A },
  { level: '2b', title: 'Quiet residential street',  description: 'Residential street, no bike infra, speed ≤ 30 km/h',     dashArray: undefined, color: COLOR_NO_INFRA },
  { level: '3',  title: 'Higher traffic street',     description: 'Streets 30–50 km/h, ≤ 3 lanes, with or without painted lane', dashArray: '2 4', color: COLOR_NO_INFRA },
]

/** Leaflet dash-array string for a given path level, or undefined (solid). */
export function dashArrayForLevel(level: PathLevel): string | undefined {
  switch (level) {
    case '1a': return undefined // solid
    case '1b': return undefined // solid
    case '2a': return undefined // solid
    case '2b': return undefined // solid (navy, thinner than 1a/1b)
    case '3':  return '2 4'     // dots (navy) — distinguishes from 2b's solid navy
    default:   return undefined // 4 (non-rideable)
  }
}

/**
 * Tier color for a given level. Greens for bike infrastructure (1a/1b/2a),
 * navy blue for shared-road tiers (2b/3) that have no meaningful bike-lane
 * protection. Level 4 is non-rideable and shouldn't be rendered.
 */
export function colorForLevel(level: PathLevel): string {
  switch (level) {
    case '1a': return COLOR_1A
    case '1b': return COLOR_1B
    case '2a': return COLOR_2A
    case '2b': return COLOR_NO_INFRA
    case '3':  return COLOR_NO_INFRA
    default:   return OTHER_COLOR
  }
}

/**
 * Weight multiplier for a level, relative to the caller's base weight.
 * Stepped hierarchy on the bike-infra tiers (1a full, 1b 0.8×, 2a 0.6×)
 * mirrors the color stepping (darkest → mid → lightest emerald). The
 * shared-road tiers (2b, 3) also render at 0.6×.
 */
export function weightMultiplierForLevel(level: PathLevel): number {
  switch (level) {
    case '1a': return 0.75
    case '1b': return 0.75
    case '2a': return 0.6
    case '2b': return 0.6
    case '3':  return 0.6
    default:   return 1
  }
}

// Re-export so consumers can keep the fallback color without re-importing classify.
export { PREFERRED_COLOR, OTHER_COLOR }

function LineSwatch({ dashArray, color }: { dashArray?: string; color: string }) {
  return (
    <svg width="38" height="10" viewBox="0 0 38 10" style={{ flexShrink: 0 }}>
      <line
        x1="2" y1="5" x2="36" y2="5"
        stroke={color}
        strokeWidth="3"
        strokeDasharray={dashArray}
        strokeLinecap="round"
      />
    </svg>
  )
}

interface Props {
  profileKey: string
}

export default function SimpleLegend({ profileKey }: Props) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('simpleLegend.collapsed') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('simpleLegend.collapsed', String(collapsed))
  }, [collapsed])

  // Only show the tiers that are preferred for this mode. kid-starting-out
  // gets just LTS 1a; kid-confident picks up 1b; kid-traffic-savvy adds 2a;
  // etc. Tiers the mode doesn't treat as preferred are omitted entirely —
  // they still appear on the map (colored orange) and in the route-summary
  // distribution plot, but not here.
  const groups = PROFILE_LEGEND[profileKey] ?? []
  const preferredLevels = new Set<PathLevel>()
  for (const group of groups) {
    if (!group.defaultPreferred) continue
    for (const item of group.items) preferredLevels.add(item.level)
  }

  const visibleTiers = SIMPLE_TIERS.filter((t) => preferredLevels.has(t.level))
  if (visibleTiers.length === 0) return null

  const modeLabel = MODE_RULES[profileKey as RideMode]?.label ?? profileKey

  if (collapsed) {
    return (
      <button
        className="simple-legend-toggle simple-legend-collapsed"
        onClick={() => setCollapsed(false)}
        title="Show legend"
        aria-label="Show legend"
      >
        ?
      </button>
    )
  }

  return (
    <div className="simple-legend">
      <div className="simple-legend-header">
        <span className="simple-legend-title">Preferred paths for {modeLabel}</span>
        <button
          className="simple-legend-dismiss"
          onClick={() => setCollapsed(true)}
          title="Hide legend"
          aria-label="Hide legend"
        >
          ×
        </button>
      </div>
      {visibleTiers.map((tier) => (
        <div key={tier.level} className="simple-legend-row">
          <LineSwatch dashArray={tier.dashArray} color={tier.color} />
          <div className="simple-legend-text">
            <div className="simple-legend-tier-title">{tier.title}</div>
            <div className="simple-legend-tier-desc">{tier.description}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
