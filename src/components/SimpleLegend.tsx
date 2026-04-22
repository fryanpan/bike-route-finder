import { useState, useEffect } from 'react'
import { PROFILE_LEGEND, PREFERRED_COLOR, OTHER_COLOR, getEffectiveProfileLegend } from '../utils/classify'
import { MODE_RULES } from '../data/modes'
import type { RideMode } from '../data/modes'
import type { PathLevel } from '../utils/lts'
import { useAdminSettings, DEFAULT_SETTINGS } from '../services/adminSettings'

// Compact inline legend — only shows the preferred tiers for the selected
// travel mode. Colors + weights come from adminSettings (hot-editable via
// Admin Tools → Settings).

type DisplayTier = {
  level: PathLevel
  title: string
  description: string
}

// Tier metadata (title + fallback description). Fallback descriptions are
// only shown when the mode's preferred set at that tier is empty or can't
// be derived — normally the description is built at render time from the
// ACTUAL preferred item names in that mode's PROFILE_LEGEND.
export const SIMPLE_TIERS: DisplayTier[] = [
  { level: '1a', title: 'Car-free',                  description: 'Bike paths, shared foot paths, elevated sidewalk paths' },
  { level: '1b', title: 'Bikeway with minimal cars', description: 'Fahrradstraße, living streets, bike boulevards' },
  { level: '2a', title: 'Bike route beside cars',    description: 'Painted bike lane or shared bus lane on quiet streets' },
  { level: '2b', title: 'Quiet residential street',  description: 'Residential street, no bike infra, speed ≤ 30 km/h' },
  { level: '3',  title: 'Higher traffic street',     description: 'Streets 30–50 km/h, ≤ 3 lanes, with or without painted lane' },
]

/**
 * Tier color for a given level — read from the CURRENT admin settings if
 * a settings snapshot is provided, else the compile-time default.
 */
export function colorForLevel(level: PathLevel, tiers = DEFAULT_SETTINGS.tiers): string {
  return tiers[level]?.color ?? OTHER_COLOR
}

/**
 * Weight multiplier for a level, relative to the caller's base weight.
 * Reads from the provided settings snapshot, else the compile-time default.
 */
export function weightMultiplierForLevel(level: PathLevel, tiers = DEFAULT_SETTINGS.tiers): number {
  return tiers[level]?.weight ?? 1
}

// Re-export so consumers can keep the fallback color without re-importing classify.
export { PREFERRED_COLOR, OTHER_COLOR }

function LineSwatch({ color }: { color: string }) {
  return (
    <svg width="38" height="10" viewBox="0 0 38 10" style={{ flexShrink: 0 }}>
      <line
        x1="2" y1="5" x2="36" y2="5"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

interface Props {
  profileKey: string
}

export default function SimpleLegend({ profileKey }: Props) {
  const settings = useAdminSettings()
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('simpleLegend.collapsed') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('simpleLegend.collapsed', String(collapsed))
  }, [collapsed])

  // Only show the tiers that are preferred for this mode. When the user
  // opts in to `showNonPreferredInLegend`, 2b/3 are promoted into the
  // preferred set and show up here too. Routing acceptance is driven by
  // MODE_RULES.acceptedLevels and is independent of this flag.
  const groups = settings.showNonPreferredInLegend
    ? getEffectiveProfileLegend(profileKey, true)
    : (PROFILE_LEGEND[profileKey] ?? [])
  const preferredLevels = new Set<PathLevel>()
  for (const group of groups) {
    if (!group.defaultPreferred) continue
    for (const item of group.items) preferredLevels.add(item.level)
  }

  // Per-tier description = the actual preferred item names at that tier
  // for the selected mode, joined with commas. carrying-kid's 1a row
  // therefore shows "Bike path, Shared use path" (not "… elevated
  // sidewalk paths") because carrying-kid opts out of Elevated sidewalk.
  const preferredItemsByLevel = new Map<PathLevel, string[]>()
  for (const group of groups) {
    if (!group.defaultPreferred) continue
    for (const item of group.items) {
      const list = preferredItemsByLevel.get(item.level) ?? []
      list.push(item.name)
      preferredItemsByLevel.set(item.level, list)
    }
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
      {visibleTiers.map((tier) => {
        const items = preferredItemsByLevel.get(tier.level) ?? []
        const desc = items.length > 0 ? items.join(', ') : tier.description
        return (
          <div key={tier.level} className="simple-legend-row">
            <LineSwatch color={colorForLevel(tier.level, settings.tiers)} />
            <div className="simple-legend-text">
              <div className="simple-legend-tier-title">{tier.title}</div>
              <div className="simple-legend-tier-desc">{desc}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
