import { useState, useEffect } from 'react'
import { PROFILE_LEGEND, PREFERRED_COLOR, OTHER_COLOR, getEffectiveProfileLegend } from '../utils/classify'
import { MODE_RULES } from '../data/modes'
import type { RideMode } from '../data/modes'
import { PATH_LEVEL_LABELS, type PathLevel } from '../utils/lts'
import { useAdminSettings, DEFAULT_SETTINGS } from '../services/adminSettings'

// Compact inline legend — only shows the preferred tiers for the selected
// travel mode. Colors + weights come from adminSettings (hot-editable via
// Admin Tools → Settings); tier titles + descriptions come from the
// canonical PATH_LEVEL_LABELS table in utils/lts.ts.

type DisplayTier = {
  level: PathLevel
  title: string
  description: string
}

// Levels rendered in the SimpleLegend (omits LTS 4 — never preferred,
// always rejected by every mode). All title + description text comes
// from PATH_LEVEL_LABELS so the legend can't drift from the audit and
// segment-popup descriptions of the same tier.
const SIMPLE_LEGEND_LEVELS: PathLevel[] = ['1a', '1b', '2a', '2b', '3']

export const SIMPLE_TIERS: DisplayTier[] = SIMPLE_LEGEND_LEVELS.map((level) => ({
  level,
  title: PATH_LEVEL_LABELS[level].legendTitle,
  description: PATH_LEVEL_LABELS[level].displayDescription,
}))

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
