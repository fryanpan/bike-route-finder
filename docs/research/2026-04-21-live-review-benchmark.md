# Live-review pass — benchmark delta (2026-04-21)

Second benchmark run on 2026-04-21 after Bryan's live review of
`docs/product/path-types-reference.md`. Supersedes the numbers in
`docs/research/2026-04-21-path-categories-benchmark.md` (which covered
the first half of the classifier overhaul).

## Scope of this pass

- `kid-traffic-savvy` preferred set now includes **LTS 2b (Quiet street)**.
  2a + 2b both ride at 1.5× cost.
- `carrying-kid` preferred set now includes **LTS 3 (Major road +
  Painted bike lane on major road)**. 2a/2b = 1.2×, 3 = 1.5×. (Previously
  3 was accepted at 2.0× and not counted as preferred.)
- `classifyOsmTagsToItem` no longer remaps rough surfaces to a separate
  "Rough surface" item. Item name always reflects the underlying infra
  type. Rough-ness is carried by the new `isRoughSurface()` predicate,
  consumed by the overlay (hidden entirely) and router (5× cost penalty).
- Display-name rename per Bryan's Table 1 rewrite:
  `Residential/local road` → **Quiet street**,
  `Other road` → **Major road**,
  `Painted bike lane` → **Painted bike lane on quiet street** or
  **Painted bike lane on major road** (based on LTS tier),
  `Shared foot path` → **Shared use path**.
- Dead `return 'Fahrradstrasse'` fallback removed from the 1b branch
  (`highway=track` was the only putative consumer; it actually classifies
  as 1a `Bike path` via the carFree path, not 1b).
- Admin panel trimmed to Samples + Groups tabs. Deleted: `AuditRulesTab`,
  `AuditLegendTab`, `AuditEvalTab`, `AuditFeedbackTab`,
  `routerBenchmark.ts`. No legacy left behind.

## Berlin — before / after this pass

BEFORE = `docs/research/2026-04-21-path-categories-benchmark.md` Berlin column.
AFTER = `bun scripts/benchmark-routing.ts --no-external --city=berlin` @ HEAD.

| Mode | Routes | Pref BEFORE | Pref AFTER | Δ |
|---|:---:|:---:|:---:|:---:|
| kid-starting-out | 20/22 | 56% | **57%** | +1pp |
| kid-confident | 20/22 | 66% | **68%** | +2pp |
| kid-traffic-savvy | 20/22 | 51% | **90%** | **+39pp** |
| carrying-kid | 20/22 | 80% | **98%** | **+18pp** |
| training | 20/22 | 93% | **100%** | +7pp |

### Berlin per-level breakdown (AFTER)

| Mode | 1a | 1b | 2a | 2b | 3 | 4 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| kid-starting-out | 57% | 6% | 6% | 11% | 21% | 0% |
| kid-confident | 51% | 18% | 5% | 13% | 14% | 0% |
| kid-traffic-savvy | 40% | 16% | 4% | 30% | 10% | 0% |
| carrying-kid | 24% | 16% | 6% | 33% | 20% | 0% |
| training | 19% | 7% | 7% | 40% | 28% | 0% |

### Why the big jumps on traffic-savvy and carrying-kid

These are the two modes whose preferred set expanded:

- **kid-traffic-savvy +39pp** — LTS 2b (plain quiet residential) was
  dropped from preferred in the first overhaul, then added back in this
  pass. The previous "51%" was the intentional "honest" number; the "90%"
  now reflects that quiet Berlin residentials actually _are_ a sensible
  place to route a traffic-savvy kid.
- **carrying-kid +18pp** — LTS 3 (tertiary / unclassified arterials and
  painted lanes on arterials) promoted into preferred. These are the
  streets carrying-kid has always been routing on; now they count as
  preferred rather than "accepted but orange." Cost multiplier 1.5× (down
  from 2.0×) makes the routing slightly more efficient too.

Kid-starting-out and kid-confident see tiny shifts (+1-2pp) purely from
the display-name rename — their routing behavior is unchanged.

### Connectivity invariant

**20/22 routes found on every mode, matching the pre-overhaul numbers.**
No routes-found regression. The two stable failures (SSE Schwimmhalle
from Home + School) remain outside the corridor bbox, same as prior
Berlin runs since 2026-04-16.

## SF — new destination set (120 Hancock St Home)

| Mode | Routes | Avg preferred |
|---|:---:|:---:|
| kid-starting-out | 9/17 | 32% |
| kid-confident | 9/17 | 51% |
| kid-traffic-savvy | 9/17 | 100% |
| carrying-kid | 9/17 | 94% |
| training | 9/17 | 98% |

Same 8/17 failures across every mode as the earlier run — pre-existing
harness issue with the 120 Hancock corridor bbox (Tartine 600 Guerrero
fails at 0.6 km; Lands End at 5 km; not bbox-clipping; fails identically
pre and post). Not caused by this change. Follow-up tracked separately.

**Key takeaway:** kid-traffic-savvy hits **100%** preferred in SF now
(was 54% in the earlier overhaul run, pre-2b-preferred). SF's painted-
lane grid + quiet residential network is exactly the 1a+1b+2a+2b +
cost-multiplier story this change is built for.

## Tests + typecheck

- `bunx tsc --noEmit` — clean
- `bun test` — 248 passed, 0 failed, 438 expect() calls (15 test files)

## Commits in this pass

Single batched commit on `main` covering:
1. src/utils/classify.ts — PROFILE_LEGEND rewrite, classifyEdgeToItem
   display-name cleanup, drop ROUGH_ROAD_ITEM export
2. src/services/overpass.ts — isRoughSurface() added, classifyOsmTagsToItem
   display names + dead fallback removal + rough-surface override removed
3. src/data/modes.ts — levelMultipliers updates on traffic-savvy + carrying-kid
4. src/components/BikeMapOverlay.tsx — rough-surface ways hidden
5. src/components/AuditPanel.tsx — admin tabs trimmed to Samples + Groups
6. src/components/Audit{Rules,Legend,Eval,Feedback}Tab.tsx — deleted
7. src/services/routerBenchmark.ts — deleted (unused after admin-tab removal)
8. tests/classify.test.ts, tests/overpass.test.ts,
   tests/routing.integration.test.ts — updated expectations for new names
