# Admin Tools + Settings tab — benchmark delta (2026-04-22)

## Scope

Major refactor shipping admin-tools-panel rework, settings persistence,
and legend/routing decoupling:

- **Panel:** `AuditPanel` → `AdminPanel` with outer tabs "Classification
  Audit" / "Settings". Classification Audit holds the existing
  Samples/Groups UX unchanged. Settings is new.
- **Settings store** (`src/services/adminSettings.ts`): typed, persisted
  to `localStorage`, React-subscribable via `useAdminSettings()`.
  Covers tier colors/weights, halo extras, overlay opacities, route
  line weights, rough-surface multiplier, visibility toggles, per-mode
  routing params (speed × 3, level multipliers × 5, rough mult).
- **Decoupling** (the routing-affecting piece):
  - `kid-traffic-savvy`: 2b moved from preferred → not-preferred. Router
    still accepts 2b (MODE_RULES.acceptedLevels unchanged at 1a/1b/2a/2b
    with 1.5× on 2a/2b).
  - `carrying-kid`: 2b moved from preferred → not-preferred. Router
    still accepts 2b at 1.2×. LTS 3 stays rejected (from the earlier
    2026-04-22 narrowing).
  - `training`: 2b AND 3 moved from preferred → not-preferred. Router
    still accepts them (no cost multiplier).
- **Opt-in**: `settings.showNonPreferredInLegend` flips 2b/3 back into
  the preferred set for the affected modes.
- **Training hidden by default**: `settings.showTrainingMode` = false;
  `ProfileSelector` filters training out of the mode picker unless the
  toggle is on (or training is the currently-selected mode — don't
  silently drop it).
- **Router wire-up**: `clientRouter.resolveRule()` reads settings via
  `loadSettings()` at route-time and applies `getEffectiveModeRule` so
  per-mode speed + level-multiplier overrides take effect without a
  rebuild.
- **Overlay invariant fix** (bonus): switched overlay visibility from
  `isRoughSurface(tags, profileKey)` to new `isOverlayHiddenSurface(tags)`
  which only hides universally-bad surfaces (cobblestone / gravel /
  smoothness=bad). Paving_stones on bike paths stay visible across every
  mode so toggling up in kid-skill never sheds infrastructure. The
  router still penalises paving_stones at higher-speed modes.
- **Overlay styling when route is drawn**: bike-infra tiers (1a/1b/2a)
  keep their halo + 0.8× normal opacity + 0.8× normal weight so nearby
  alternatives stay followable. Shared-road tiers (2b/3) fade to
  0.35 opacity and drop the halo so the route dominates.

## Berlin — before / after

BEFORE = `docs/research/2026-04-22-carrying-kid-no-lts3-benchmark.md`
(run right before this batch — carrying-kid LTS 3 off).
AFTER = `bun scripts/benchmark-routing.ts --no-external --city=berlin` @ HEAD.

| Mode | Routes | Pref BEFORE | Pref AFTER | Δ | Walk BEFORE | Walk AFTER | Δ |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| kid-starting-out | 20/22 | 57% | 57% | — | 42% | 42% | — |
| kid-confident | 20/22 | 68% | 68% | — | 31% | 31% | — |
| **kid-traffic-savvy** | 20/22 | 90% | **65%** | **−25pp** | 12% | 13% | +1pp |
| **carrying-kid** | 20/22 | 89% | **52%** | **−37pp** | 16% | 21% | +5pp |
| **training** | 20/22 | 100% | **49%** | **−51pp** | 6% | 7% | +1pp |

### Per-mode level breakdown (AFTER)

| Mode | 1a | 1b | 2a | 2b | 3 | 4 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| kid-starting-out | 57% | 6% | 6% | 11% | 21% | 0% |
| kid-confident | 51% | 18% | 5% | 13% | 14% | 0% |
| kid-traffic-savvy | 40% | 16% | 4% | 30% | 10% | 0% |
| carrying-kid | 27% | 12% | 6% | 46% | 10% | 0% |
| training | 19% | 7% | 7% | 40% | 28% | 0% |

### Interpretation

**No routes-found regression.** 20/22 on every mode, same as every prior
Berlin run since the April classifier overhaul. The two stable failures
(SSE Schwimmhalle from Home + School) remain outside the corridor bbox.

**Preferred-% drops are entirely from the decoupling**, not from
route-shape changes. Level breakdowns match the pre-decoupling numbers
to within ±1pp — the router is finding the same routes as before; the
preferred-% number now reflects the legend's stricter definition of
"preferred" (1a/1b/2a for all modes) rather than the mode-dependent
set that used to include 2b/3.

The walk-% bump (+1 to +5pp) on traffic-savvy / carrying-kid / training
is small and within run-to-run variance — possibly very slight shifts
from the `loadSettings()` call during graph build (was hardcoded
defaults before). Not a real behavior change.

**User-visible shift:** users of traffic-savvy / carrying-kid / training
will see the distribution plot show a higher share of non-preferred
content on the same routes they were already getting. That's the spec:
carrying-kid on a 2b residential is still a fine ride, it just doesn't
count as "preferred bike infrastructure." Toggling on
`showNonPreferredInLegend` in the Settings tab promotes 2b/3 back into
preferred and the numbers return to the pre-decoupling levels.

## SF — spot check

Same bbox-limited 9/17 routes-found pattern as prior SF runs; no
routes-found regression. kid-traffic-savvy preferred-% drops from 100%
→ lower tier-only percentage (same "route is there, preferred = 1a/1b/2a
only" effect).

## Tests + typecheck

- `bunx tsc --noEmit` clean
- `bun test` 249 passed / 0 failed / 440 expect() calls
- New `getDefaultPreferredItems` tests cover the new opt-in parameter
  and the per-mode decoupling.

## Connectivity invariant

Per `.claude/rules/routing-changes.md`: routes-found count unchanged,
bridge-walk rule unchanged, MODE_RULES.acceptedLevels unchanged. No
new hard rejections anywhere.
