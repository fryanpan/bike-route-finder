# carrying-kid drops LTS 3 — benchmark delta (2026-04-22)

Bryan's call: "Leave level 3 off of the carrying kid mode — most people
don't like that infra." Tighter than the 2026-04-21 pass that promoted
LTS 3 into carrying-kid's preferred set with a 1.5× cost.

## Change

**`src/data/modes.ts`** `MODE_RULES['carrying-kid']`:
- `acceptedLevels`: `['1a', '1b', '2a', '2b', '3']` → `['1a', '1b', '2a', '2b']`
- `levelMultipliers`: `{ '2a': 1.2, '2b': 1.2, '3': 1.5 }` → `{ '2a': 1.2, '2b': 1.2 }`

**`src/utils/classify.ts`** `PROFILE_LEGEND['carrying-kid']`: the `Major
road` / `Painted bike lane on major road` items moved from the preferred
bucket to `defaultPreferred: false`.

Connectivity: LTS 3 edges still enter the graph as bridge-walks at
`walkingSpeedKmh` (4 km/h for carrying-kid), consistent with the existing
bridge-walk invariant. Routes can still cross an unavoidable LTS 3 gap
on foot when nothing better exists.

## Berlin — before / after

BEFORE = prior run (2026-04-21 live-review benchmark), LTS 3 preferred at 1.5×.
AFTER  = `bun scripts/benchmark-routing.ts --no-external --city=berlin` @ HEAD.

| Mode | Routes | Pref BEFORE | Pref AFTER | Δ | Walk BEFORE | Walk AFTER | Δ |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| kid-starting-out | 20/22 | 57% | 57% | — | 42% | 42% | — |
| kid-confident | 20/22 | 68% | 68% | — | 31% | 31% | — |
| kid-traffic-savvy | 20/22 | 90% | 90% | — | 12% | 12% | — |
| **carrying-kid** | 20/22 | 98% | **89%** | **−9pp** | 6% | **16%** | **+10pp** |
| training | 20/22 | 100% | 100% | — | 6% | 6% | — |

Only carrying-kid moves, as expected. +10pp walk reflects the LTS 3
crossings now bridge-walked instead of ridden. -9pp preferred = those
LTS 3 segments no longer count as preferred.

### Level breakdown for carrying-kid (Berlin)

|  | 1a | 1b | 2a | 2b | 3 | 4 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| BEFORE | 24% | 16% | 6% | 33% | 20% | 0% |
| AFTER  | 27% | 12% | 6% | 46% | 10% | 0% |

Router shifted ~10pp of route distance from LTS 3 onto LTS 2b (quiet
residentials) + slightly more LTS 1a. 10% LTS 3 remains as bridge-walk
distance on unavoidable crossings. That's the intent: avoid LTS 3 when
any alternative exists, cross it on foot when it's the only option.

## San Francisco — before / after

| Mode | Routes | Pref BEFORE | Pref AFTER | Δ | Walk BEFORE | Walk AFTER | Δ |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| kid-starting-out | 9/17 | 32% | 32% | — | 66% | 66% | — |
| kid-confident | 9/17 | 51% | 51% | — | 47% | 47% | — |
| kid-traffic-savvy | 9/17 | 100% | 100% | — | 0% | 0% | — |
| **carrying-kid** | 9/17 | 94% | **89%** | **−5pp** | 0% | **0%** | — |
| training | 9/17 | 98% | 98% | — | 2% | 2% | — |

SF carrying-kid impact is smaller (-5pp) because the SF grid has less
LTS 3 in the typical carrying-kid corridor — most SF residentials the
router picks are LTS 2b (Quiet street) or 2a (painted lane on quiet
street). The LTS 3 drop mostly shifts onto 2b.

## Tests + typecheck

- `bunx tsc --noEmit` — clean
- `bun test` — 248 passed, 0 failed
- `tests/classify.test.ts` — updated `getDefaultPreferredItems` assertion for
  carrying-kid to expect LTS 3 items NOT in the preferred set.

## Connectivity invariant

Per `.claude/rules/routing-changes.md`: routes-found count unchanged
(Berlin 20/22, SF 9/17 — same failures as before, outside-bbox pairs).
No new hard rejections; LTS 3 edges still enter the graph as bridge-walks.
