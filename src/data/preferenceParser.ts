/**
 * English → PreferenceAdjustment parser.
 *
 * Deterministic, rule-based. Handles a small canon of common phrasings
 * for MVP. Anything it can't understand goes into the "unparsed" list
 * so the UI can show the user what was actually understood. Future:
 * wire an LLM path behind a feature flag.
 *
 * Input is lowercased line-by-line. Each line can produce 0 or 1
 * adjustments. Multiple surfaces / path-types per line are not
 * supported.
 */

import type { PreferenceAdjustment } from './preferences'

interface Canon {
  // Regex over a lowercased line. Must include "\bsubject\b"-style
  // tokens so partial-word matches don't trigger.
  match: RegExp
  build: (match: RegExpMatchArray) => PreferenceAdjustment | null
}

// Surfaces the parser recognizes. Maps common English names to OSM surface
// tag values.
const SURFACE_ALIASES: Record<string, string> = {
  'cobble': 'cobblestone',
  'cobbles': 'cobblestone',
  'cobblestone': 'cobblestone',
  'cobblestones': 'cobblestone',
  'sett': 'sett',
  'setts': 'sett',
  'paving': 'paving_stones',
  'paving stone': 'paving_stones',
  'paving stones': 'paving_stones',
  'gravel': 'gravel',
  'fine gravel': 'fine_gravel',
  'dirt': 'dirt',
  'mud': 'mud',
}

const surfaceTokens = Object.keys(SURFACE_ALIASES).join('|')

// Path-type names the parser recognizes. These correspond to
// PROFILE_LEGEND item names.
const PATH_TYPES: Record<string, string> = {
  'fahrradstrasse': 'Fahrradstrasse',
  'fahrradstraße': 'Fahrradstrasse',
  'bike path': 'Bike path',
  'cycle path': 'Bike path',
  'cycleway': 'Bike path',
  'radweg': 'Bike path',
  'shared foot path': 'Shared foot path',
  'foot path': 'Shared foot path',
  'park path': 'Shared foot path',
  'painted bike lane': 'Painted bike lane',
  'painted lane': 'Painted bike lane',
  'bike lane': 'Painted bike lane',
  'living street': 'Living street',
  'bus lane': 'Shared bus lane',
}

// Allow optional trailing 's' for plural forms ("bike paths", "cobbles").
// Longest-first so "cycle path" wins over "path".
const pathTokens = Object.keys(PATH_TYPES)
  .sort((a, b) => b.length - a.length)
  .map((t) => `${t}s?`)
  .join('|')

/** Normalize plural→singular before looking up in PATH_TYPES. */
function lookupPathType(phrase: string): string | undefined {
  const lower = phrase.toLowerCase()
  if (PATH_TYPES[lower]) return PATH_TYPES[lower]
  if (lower.endsWith('s')) {
    const singular = lower.slice(0, -1)
    if (PATH_TYPES[singular]) return PATH_TYPES[singular]
  }
  return undefined
}

// Canonical patterns. Order matters: earlier patterns win. Patterns
// keep subject + modifier adjacent (≤ a few words apart) so compound
// phrasings like "fine gravel" inside a different fragment's subject
// don't trip the wrong rule.
const CANON: Canon[] = [
  // "cobbles are fine" / "paving stones are ok" / "gravel no problem"
  {
    match: new RegExp(`\\b(${surfaceTokens})\\b\\s+(?:(?:are|is|=)\\s+)?(fine|ok|okay|no problem)\\b`),
    build: (m) => {
      const surface = SURFACE_ALIASES[m[1]]
      return surface ? { kind: 'surface', surface, tolerance: 'ok' } : null
    },
  },
  // "i don't mind cobbles" / "don't mind paving stones"
  {
    match: new RegExp(`\\b(don'?t|do not) mind\\b\\s+(${surfaceTokens})\\b`),
    build: (m) => {
      const surface = SURFACE_ALIASES[m[2]]
      return surface ? { kind: 'surface', surface, tolerance: 'ok' } : null
    },
  },
  // "i hate cobblestones" / "avoid cobbles" / "skip paving stones"
  {
    match: new RegExp(`\\b(hate|avoid|skip)\\b\\s+(?:\\w+\\s+){0,2}(${surfaceTokens})\\b`),
    build: (m) => {
      const surface = SURFACE_ALIASES[m[2]]
      return surface ? { kind: 'surface', surface, tolerance: 'rough' } : null
    },
  },
  // "love cobbles" / "like gravel" / "enjoy paving stones" — positive
  // affirmations treated as tolerance=ok for that surface.
  {
    match: new RegExp(`\\b(love|like|enjoy)\\b\\s+(${surfaceTokens})\\b`),
    build: (m) => {
      const surface = SURFACE_ALIASES[m[2]]
      return surface ? { kind: 'surface', surface, tolerance: 'ok' } : null
    },
  },
  // "prefer Fahrradstraße" / "prefer bike paths" / "love cycleways"
  {
    match: new RegExp(`\\b(prefer|love|like)\\b\\s+(?:\\w+\\s+){0,2}(${pathTokens})\\b`),
    build: (m) => {
      const item = lookupPathType(m[2])
      return item ? { kind: 'path-type', item, pref: 'prefer' } : null
    },
  },
  // "avoid painted bike lanes" / "hate painted lanes" / "skip bus lane"
  {
    match: new RegExp(`\\b(avoid|hate|skip)\\b\\s+(?:\\w+\\s+){0,2}(${pathTokens})\\b`),
    build: (m) => {
      const item = lookupPathType(m[2])
      return item ? { kind: 'path-type', item, pref: 'avoid' } : null
    },
  },
]

export interface ParseResult {
  adjustments: PreferenceAdjustment[]
  unparsed: string[]
}

/** Detects negation words that invert a phrase's intent. */
const NEGATION = /\b(don'?t|do not|doesn'?t|does not|never|won'?t|not)\b/i

/**
 * Parse a free-text English block into typed preference adjustments.
 *
 * Splits on sentence + clause boundaries (newline, period, semicolon,
 * comma, and also "and" / "but" / "then") so compound phrasings like
 * "avoid gravel but love fine gravel" become two independent
 * fragments. This avoids surface-token collisions (e.g. the second
 * "gravel" in "fine gravel" getting matched by a rule aimed at the
 * first "gravel").
 *
 * Fragments containing a negation word are refused — safer to leave
 * them unparsed than risk mis-inverting the user's intent.
 */
export function parsePreferenceText(raw: string): ParseResult {
  const adjustments: PreferenceAdjustment[] = []
  const unparsed: string[] = []
  const frags = raw
    .split(/[\n;.]+|,\s*(?=[a-z])|\s+(?:and|but|also|then)\s+/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  for (const frag of frags) {
    const lower = frag.toLowerCase()

    // Refuse negated fragments entirely — the canon covers positive
    // statements only. "I don't hate cobbles" goes to unparsed rather
    // than inverted to "ok" (too brittle to infer).
    if (NEGATION.test(lower)) {
      // Two exceptions: "don't mind X" is an idiomatic positive ("ok")
      // already handled by rule 2 below; don't refuse those.
      if (!/\b(don'?t|do not) mind\b/.test(lower)) {
        unparsed.push(frag)
        continue
      }
    }

    let matched = false
    for (const rule of CANON) {
      const m = lower.match(rule.match)
      if (m) {
        const adj = rule.build(m)
        if (adj) {
          adjustments.push(adj)
          matched = true
          break
        }
      }
    }
    if (!matched) unparsed.push(frag)
  }

  return { adjustments, unparsed }
}
