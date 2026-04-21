import { useState, useEffect } from 'react'
import { PROFILE_LEGEND, PREFERRED_COLOR, OTHER_COLOR } from '../utils/classify'
import type { PathLevel } from '../utils/lts'

// Compact inline legend — replaces the old preferred/other two-column panel.
// Shows the three preferred tiers (LTS 1a/1b/2a) as line-style swatches.
// Users learn at a glance that solid = Car-free, dashes = Bike-priority with
// minimal cars, dots = Bike route beside cars.
//
// Deliberately omits the Simple / By Path Type toggle for v1 launch — Simple
// mode is what every user will see by default; power-user By Path Type mode
// is tracked as task #103 follow-up.

type DisplayTier = {
  level: PathLevel
  title: string
  description: string
  dashArray: string | undefined
}

// Display titles that match the spec in docs/product/plans/2026-04-21-path-categories-plan.md.
export const SIMPLE_TIERS: DisplayTier[] = [
  { level: '1a', title: 'Car-free',                 description: 'Bike paths, shared foot paths, elevated sidewalk paths', dashArray: undefined },
  { level: '1b', title: 'Bikeway with minimal cars', description: 'Fahrradstraße, living streets, bike boulevards', dashArray: '12 6' },
  { level: '2a', title: 'Bike route beside cars',    description: 'Painted bike lane, shared bus lane on quiet streets', dashArray: '2 4' },
]

/** Leaflet dash-array string for a given path level, or undefined (solid). */
export function dashArrayForLevel(level: PathLevel): string | undefined {
  switch (level) {
    case '1a': return undefined
    case '1b': return '12 6'
    case '2a': return '2 4'
    default:   return undefined // 2b/3/4 use solid orange
  }
}

/** Color for a rendering tier. Green for preferred (1a/1b/2a), orange for other. */
export function colorForLevel(level: PathLevel, isPreferred: boolean): string {
  if (isPreferred) return PREFERRED_COLOR
  return OTHER_COLOR
}

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

  // Which of the 3 simple tiers are "preferred" for this mode? For kid-starting-out,
  // only 1a is preferred (solid shows green, 1b/2a show orange-style swatch since
  // those levels aren't preferred). For kid-confident: 1a+1b preferred. And so on.
  const groups = PROFILE_LEGEND[profileKey] ?? []
  const preferredLevels = new Set<PathLevel>()
  for (const group of groups) {
    if (!group.defaultPreferred) continue
    for (const item of group.items) preferredLevels.add(item.level)
  }

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
        <span className="simple-legend-title">On the map</span>
        <button
          className="simple-legend-dismiss"
          onClick={() => setCollapsed(true)}
          title="Hide legend"
          aria-label="Hide legend"
        >
          ×
        </button>
      </div>
      {SIMPLE_TIERS.map((tier) => {
        const isPreferred = preferredLevels.has(tier.level)
        const color = colorForLevel(tier.level, isPreferred)
        return (
          <div key={tier.level} className="simple-legend-row">
            <LineSwatch dashArray={tier.dashArray} color={color} />
            <div className="simple-legend-text">
              <div className="simple-legend-tier-title">{tier.title}</div>
              <div className="simple-legend-tier-desc">{tier.description}</div>
            </div>
          </div>
        )
      })}
      <div className="simple-legend-footer">
        <LineSwatch color={OTHER_COLOR} />
        <span>Other streets — accepted but less preferred</span>
      </div>
    </div>
  )
}
