# Path Categories + Progressive Kid Modes

**Date:** 2026-04-21
**Status:** Awaiting sign-off on open questions (see §8)
**Context:** Pre-launch classification overhaul. Current state: every "preferred" infra in kid-traffic-savvy renders the same green, which overstates the safety of plain residentials and painted lanes vs. cycleways. See conversation 2026-04-21 for the diagnosis.

## 1. Goal

Introduce a 6-category path classification that (a) progressively expands as kid skill increases, (b) drives both display and routing from one source of truth, and (c) replaces the binary preferred/other legend with a tiered system that preserves visual hierarchy.

Ship before launch (2026-04-21 EOD). Scope is bounded by the benchmark-parity requirement — no regressions vs. 2026-04-20 Berlin + SF baselines.

## 2. Path categories (display-facing)

Progressive inclusion: each category is a strict superset of the previous for accept-for-riding purposes.

| # | Category | Includes internal path types | Line style |
|---|---|---|---|
| 1 | Car-free | Bike path, Shared foot path, Elevated sidewalk path | **solid** |
| 2 | Bikeway with minimal cars | Cat 1 + Fahrradstraße + Living street + Bike boulevard | **long dash** |
| 3 | Bike route beside cars | Cat 2 + Painted bike lane + Shared bus lane | **dots** |
| 4 | Other LTS 2 | Quiet residentials (maxspeed ≤ 30 AND lanes ≤ 2) | (none in kid modes — see §8 Q1) |
| 5 | LTS 3 | Busy residentials, tertiary + painted lane on ≤50 km/h, etc. | n/a — routing-only |
| 6 | LTS 4 | Primary, secondary at ≥50 km/h without bike infra, trunk | n/a — routing-only |

### Internal path types → category mapping

| Path type | Cat | OSM match |
|---|---|---|
| Bike path | 1 | `highway=cycleway` OR `highway=path` + `bicycle!=no` OR `highway=track` |
| Shared foot path | 1 | `highway=footway` + `bicycle=yes\|designated` |
| Elevated sidewalk path | 1 | `cycleway=track` OR painted lane with physical separation |
| Fahrradstraße | 2 | `bicycle_road=yes` OR `cyclestreet=yes` |
| Living street | 2 | `highway=living_street` |
| Bike boulevard | 2 | `highway=residential` + `motor_vehicle=destination\|permissive` (global pattern: SF Slow Streets, Berkeley BBs, Portland greenways, UK LTNs) |
| Painted bike lane | 3 | `cycleway=lane\|opposite_lane` (no separation) |
| Shared bus lane | 3 | `cycleway=share_busway` |
| Other LTS 2 residential | 4 | `highway=residential` + no bike infra + (maxspeed ≤ 30 OR unset) + lanes ≤ 2 |
| LTS 3 (display as "Other road") | 5 | see `classifyEdge` in `src/utils/lts.ts` |
| LTS 4 | 6 | see `classifyEdge` |

Rough surface (`surface ∈ ALWAYS_BAD_SURFACES` OR `smoothness ∈ BAD_SMOOTHNESS`) is a cross-cutting flag, not a category.

## 3. Mode rules

| Mode | Accepts | Riding speed | Cost multipliers |
|---|---|---|---|
| kid-starting-out | Cat 1 only | 5 km/h | Sidewalks (bridge-walk) at 1 km/h |
| kid-confident | Cat 1–2 | 10 km/h | Sidewalks at 2 km/h |
| kid-traffic-savvy | Cat 1–3 | 15 km/h | Cat 4 accepted at 15 km/h × 1.5. No sidewalk riding. Bridge-walks at 3 km/h (existing fallback). |
| carrying-kid | Cat 1–4 | 20 km/h | Cat 5 accepted at 20 km/h × 2.0 |
| training | Cat 2–5 (not Cat 1 elevated paths; Cat 6 rejected) | 30 km/h | No elevated sidewalk paths (narrow, pedestrian-heavy) |

**Universal:** Rough surface → accepted speed unchanged, cost × 5.0.

**Bridge-walks preserved:** per `.claude/rules/routing-changes.md`, hard-rejection is reserved for motorway/trunk and `sidewalk=no`. All other rejected edges re-enter the graph as bridge-walks at `walkingSpeedKmh` so A* can use them as last-resort crossings. "No sidewalk riding" in kid-traffic-savvy means sidewalks are not chosen as primary infra (no routing preference), but the bridge-walk fallback still exists for unavoidable gaps.

## 4. Legend UI

Two modes, user-selectable, persisted in `localStorage`:

**Simple** (default) — 3 visible categories: Car-free, Bikeway with minimal cars, Bike route beside cars. Same line style rules (solid/long-dash/dots).

**By Path Type** — every path type in a distinct color. Line style still follows the parent category (so a Fahrradstraße and a Bike boulevard both long-dash but with different hues). Power-user mode.

**No floating legend panel.** Instead:

- **Map mode**: per visible tile, pick one edge of each category that's present and label it inline on the map. Stable across pan/zoom within the tile. Tiles that lack a category show no label for that category. Tap-any-edge → popup with category + path type as the always-available fallback.
- **Routing mode**: route path renders with the selected legend directly on the drawn route. No per-edge labels.

Toggle placement: in the settings panel next to the travel-mode selector, not on the map itself.

## 5. Benchmark evaluation

Per `.claude/rules/routing-changes.md`, every nontrivial routing change requires a benchmark run. This change qualifies.

**Metrics (already computed or to add):**

| Metric | Already in harness | Needs work |
|---|---|---|
| % routes-found (per mode) | ✓ | — |
| Avg distance km | ✓ | — |
| Avg time min | ✓ | — |
| % on preferred | ✓ | Split into Cat-1 %, Cat-2 %, Cat-3 % |
| % walking (bridge-walk) | ✓ | — |
| Route cost (self-reported by each router) | — | Add: each router's total cost for same pair |
| Normalized cost | — | Add: distance / mode's riding speed as cross-router proxy |

**Cross-router comparison:**
- clientRouter vs. Valhalla vs. BRouter on the same (origin, dest, mode).
- Our router's self-cost is `sum(distance / speed)` already.
- Valhalla and BRouter report their own cost functions — log them alongside and interpret relative to distance.

**Evaluation cities:**
- Berlin (existing 22 routes × 5 modes)
- San Francisco (new: 17 routes × 5 modes, origin = 120 Hancock St). See `scripts/benchmark-routing.ts` SF config.

## 6. Implementation order

1. **Destination wiring** (task #93) — update `scripts/benchmark-routing.ts` SF config to 17 destinations + single origin. No behavior change.
2. **Baseline benchmark** (task #94) — `bun scripts/benchmark-routing.ts --no-external --city=sf` and same for Berlin. Snapshots current numbers pre-overhaul.
3. **Add `pathCategory` to `LtsClassification`** — in `src/utils/lts.ts`, compute category 1–6 from existing `classifyEdge` output. Purely additive; doesn't change routing yet.
4. **Unify display classifier** — rewrite `classifyOsmTagsToItem` in `src/services/overpass.ts` to return `{ category, pathType }`. Delete the parallel string-matching logic.
5. **Extend `PROFILE_LEGEND`** — add `tier` field on items. Add Bike boulevard item. Add `'Other road'` item (renders orange, not in preferred set for anyone).
6. **Rewrite mode rules** — in `src/data/modes.ts`, replace `ltsAccept` + `ltsConditions` with `acceptedCategories: 1..6[]` + `categoryMultipliers: { [cat]: number }`. Keep bridge-walk behavior.
7. **Update `clientRouter.ts`** — consume `categoryMultipliers` when computing edge cost. Cost = `distance / speed × (multiplier for category) × (5.0 if rough surface else 1.0)`.
8. **Legend rewrite** — Simple / By Path Type toggle, localStorage persistence, inline per-tile labels. Delete floating legend panel.
9. **Re-run benchmark** — both cities. Compare %-by-category, route cost, walk %, routes-found. Diff against baseline.
10. **Write results doc** — `docs/research/2026-04-21-path-categories-benchmark.md` with before/after delta and interpretation per `.claude/rules/routing-changes.md`.
11. **Commit plan + code as one PR**.

## 7. Risks

- **Bridge-walk connectivity invariant** (highest risk). The April 16 regression dropped kid-confident from 16/16 to 5/22 when rejected edges stopped becoming bridge-walks. New mode-rule model must preserve this. Test: `clientRoute(LTS-4-crossing-pair, kid-confident)` must return a route, not fail.
- **Multiplier tuning.** 1.5× (Cat 4 traffic-savvy) / 2.0× (Cat 5 carrying-kid) / 5.0× (rough surface) are initial guesses. Benchmark will tell us if any produce weird detours. Plan is to ship these numbers and tune in a follow-up if benchmarks diverge.
- **Per-tile label UX.** Leaflet has no native collision avoidance. If overlap is bad on mobile, fall back to 1 label per category per viewport (not per tile).
- **Training mode change.** Excluding elevated bike paths is new behavior — could drop some Berlin training routes that used curb-separated sidewalk tracks. Accepted intentionally, verified by benchmark.
- **OSM data completeness.** Bike boulevards depend on `motor_vehicle=destination` tagging. OSM coverage is uneven; some real-world Slow Streets may not be tagged and will fall into Cat 4. Accept as known limitation; document.

## 8. Open questions (pick before coding)

**Q1. Cat 4 rendering on the map for kid modes.** When a kid-mode user is looking at a map, do plain residentials render as overlay infrastructure at all?

- **Option A (proposed):** no overlay line in kid modes — Cat 4 appears only as the base OSM tile color. Carrying-kid + training show Cat 4 in a 4th style (e.g. gray dotted).
- **Option B:** always render Cat 4 in all modes but with a subtle style so it doesn't compete with Cat 1–3.

Going with A unless pushed back.

**Q2. Kid-starting-out / kid-confident walking speed** (1 km/h / 2 km/h from Bryan's spec) — is this the bridge-walk fallback speed, or the speed when a sidewalk is the *primary chosen infra*?

- **Proposed interpretation:** 1 km/h / 2 km/h = riding speed when sidewalk is chosen as primary. Bridge-walk fallback stays at 2 km/h / 2 km/h to preserve the April-16-regression-preventing connectivity invariant.
- **Implication:** a kid-starting-out route that chooses to walk 200 m on a sidewalk costs 12 min (at 1 km/h); a 50 m bridge-walk across an LTS 4 gap costs ~1.5 min (at 2 km/h).

Going with this unless pushed back.

**Q3. Inline label placement UX.**

- **Proposed:** 1 label per category per visible map tile, stable within the tile. Tap-any-edge for popup-with-category as universal fallback.
- **Fallback if this is too noisy on mobile:** 1 label per category per viewport.

Going with per-tile first; swap to viewport if benchmarks or testing show it's cluttered.

**Q4. Legend persistence + default.**

- **Proposed:** default to Simple. Persist choice in `localStorage` under `legendMode: 'simple' | 'by-path-type'`. Toggle lives in the settings panel next to travel mode.

Going with this.

**Q5. `carrying-kid` label rename to "Biking with trailer" (from Bryan's spec)?**

- Internal `RideMode` key stays `carrying-kid` (too invasive to rename). UI label updates to "Biking with trailer" or similar.

Flagging for Bryan's call on display copy; key stays the same either way.

## 9. Files affected

- `src/utils/lts.ts` — add `pathCategory: 1..6` to `LtsClassification`
- `src/utils/classify.ts` — legend tier field, new items, `PATH_CATEGORIES` constant
- `src/services/overpass.ts` — `classifyOsmTagsToItem` returns category + pathType
- `src/data/modes.ts` — replace `ltsAccept` + `ltsConditions` with category model
- `src/services/clientRouter.ts` — consume `categoryMultipliers`; rough-surface 5× multiplier
- `src/services/routerBenchmark.ts` — `%-by-category`, route cost fields
- `scripts/benchmark-routing.ts` — SF config update; cross-router cost logging
- `src/components/Legend.tsx` (and/or `BikeMapOverlay.tsx`) — UI rewrite, inline labels, style-by-category
- `src/components/Map.tsx` — route rendering with new line styles
- Deleted: binary preferred/other legend code paths

## 10. Task tracking

- #93 Replace SF benchmark destinations with Bryan's 17-pair list
- #94 Run SF baseline benchmark before classifier fix
- #95 Add Bike boulevard legend item (folded into this plan as step 5)
- #96 Demote LTS-3 residentials in display classifier (folded into this plan as step 4)
- #97 Re-run SF benchmark + write results doc
- (new) #NN — Add `pathCategory` to `LtsClassification`
- (new) #NN — Rewrite `PROFILE_LEGEND` with tier field
- (new) #NN — Rewrite mode rules in category model
- (new) #NN — Legend UI rewrite with Simple / By Path Type
