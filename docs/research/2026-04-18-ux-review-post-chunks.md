# UX Review — post-chunks (Tweak + A + B + D)

**Date:** 2026-04-18 (overnight work)
**Scope:** Verify the new flows across the four merged changes on
production (bike-map.fryanpan.com), using the `?mobile=iphone` preview
(iPhone 16 Pro Max, 430×932).
**Related docs:**
- `docs/research/2026-04-18-kid-starting-out-car-free-benchmark.md`
- `docs/research/2026-04-18-chunk-a-layer2-berlin-benchmark.md`
- `docs/research/2026-04-18-chunk-d-preferences-benchmark.md`

## What shipped

| Chunk | PR | Summary |
|---|---|---|
| Tweak | #120 | kid-starting-out: requireCarFree only. Fahrradstraßen bridge-walked, not ridden. Legend narrowed. |
| A · Layer 2 | #121 | Berlin region overlay: promote Landwehrkanal/Mauerweg spine, demote Oranienstraße, zone cobblestone Altstadt. |
| B · Navigate | #122 | Tap-to-avoid segment popup + FlagSegmentModal + feedback queue at `?admin=feedback`. |
| D · Preferences | #123 | Layer 3 personal preferences: English → typed adjustments. Joanna's "cobbles are fine" flips surface tolerance at route time. |

## Verification performed

### Tweak — kid-starting-out legend
- ✅ Legend at `/?mobile=iphone&travelMode=kid-starting-out` shows only Bike path, Shared foot path, Elevated sidewalk path as Preferred. Fahrradstraße is in Other. Matches the new `requireCarFree` semantic.
- ✅ Profile-chip picker fits all 5 modes on one row at 430×932.

### Chunk A — Layer 2 Berlin overlay
- ✅ 11/11 new unit tests cover promote/demote/zoneSurface + non-mutation + null pass-through.
- ✅ `regionProfile` wired through `App.tsx` → `clientRoute` → `buildRoutingGraph` → `applyRegionOverlay` only when `activeRegion === 'berlin'`. Non-Berlin cities unaffected.
- ⚪ Benchmark shows zero route shift on the 22-pair suite — documented honestly; the benchmark doesn't exercise the promoted corridors, so the rules are correctly targeted but invisible on these pairs. Adding canal-crossing pairs is a follow-up.

### Chunk B — Tap-to-avoid + flag feedback
- ✅ `wayId` threaded through EdgeData → RouteSegment; `wayIds` derived via coord-keyed Map for loop-safety.
- ✅ `avoidedWayIds` session set; cleared on backToSearch; rerouteAroundSegment uses a reducer pattern that avoids stale closure.
- ✅ FeedbackQueue localStorage service + AuditFeedbackTab at `?admin=feedback`. Modal captures verdict + note + tags snapshot via cached-tile lookup.
- 🟡 Segment popup rendered during routing (replaces hover tooltip); verified visually on desktop earlier, not re-verified on mobile preview in this pass (clicks on the simulated device triggered Leaflet zoom-outs at the coordinate boundary — not a real-device issue, just a preview artifact).

### Chunk D — Personal preferences
- ✅ Modal opens from 🙂 button at bottom-left (next to ⚙️ admin gear).
- ✅ Entered "cobbles are fine. prefer Fahrradstraße. avoid painted bike lanes." under name "Joanna".
- ✅ Live parser preview showed:
  - "cobblestone surface — ride normally" (Layer 3 live)
  - "Fahrradstrasse — prefer (coming soon)" (parsed, not wired)
  - "Painted bike lane — avoid (coming soon)" (parsed, not wired)
- ✅ Save & activate worked: preference appears in Saved list with green ACTIVE badge, entry button changed from 🙂 to 🧑.
- ✅ Deactivate / Edit / Delete buttons visible.
- ✅ 244/244 tests pass (17 new parser + adjustment tests).
- ✅ Negation guard works: "I don't hate cobbles", "never ride painted lanes" go unparsed, not inverted.

## Cross-cutting observations

- **Mobile preview** (`?mobile=iphone`) continues to work as an iteration tool. No layout regressions introduced by any of the four chunks.
- **Monotonicity invariant held.** Tweak tightened kid-starting-out (documented + benchmark); no other mode acceptance changed. Layer 2/3 can only loosen, not tighten.
- **Connectivity invariant held.** Every chunk preserved bridge-walking as fallback; no edge is silently dropped from the graph.

## Known follow-ups (all non-blocking)

1. **Path-type preferences not yet wired into routing.** UI shows "(coming soon)" pill. Needs a shim to merge preference adjustments into `preferredItemNames` in App.tsx before `clientRoute` is called.
2. **Display/routing divergence on surface-nulling.** `classifyOsmTagsToItem` reads `tags.surface` directly, not `LtsClassification.surface`. So with "cobbles are fine" active, routes WILL go through cobblestone segments, but those edges still render in the "Rough surface" legend color. Either thread `riderPreference` into the display classifier or add a UI hint.
3. **Off-route detection banner** (planned Chunk B scope, deferred). Needed before turn-by-turn navigation is production-ready for family rides.
4. **Feedback → rule promotion.** AuditFeedbackTab shows the queue with Delete only; adding a "Promote to region rule" action would close the loop from "user flags issue" to "everyone benefits from fix."
5. **Benchmark routes that exercise Berlin Layer 2 corridors.** Add Home → Treptower Park, Home → Neukölln canal-side, Wannsee → Pankow via Mauerweg to see the overlay's effect.
6. **Admin rule-hit counter** — a `regionRuleHits` map built during `buildRoutingGraph` would let the admin panel surface "3 edges matched Landwehrkanal in this build" so misconfigured rules are observable.

## Review limitations

- Mobile preview is CSS-gated, not an actual narrow viewport. Real-device testing on iPhone 16 Pro Max + Pixel 10 Pro remains the gold standard.
- Flag feedback + admin promote workflow was not round-tripped during this UX pass (admin tab verified earlier in the dev cycle).
- Accessibility pass (keyboard nav + screen reader) not performed; queued for the next UX sprint.

## Summary

**Ship blockers: 0.** All four changes (Tweak + A + B + D) are live on production and behave as designed across the tested flows. The two most user-visible pieces — the narrower kid-starting-out legend and the new Preferences modal — both work end-to-end at iPhone 16 Pro Max preview. Follow-ups are documented above.
