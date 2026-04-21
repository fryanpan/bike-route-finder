# Remote-Branch Cleanup Plan — 2026-04-20

After `git fetch --prune`, the `origin` remote has **50 non-main branches**.
Every single one has an associated PR (nothing ambiguous to adjudicate), so
the cleanup reduces to a single decision:

**Recommendation: delete all 50 branches.** 49 are squash-merge leftovers
whose content is already on `main`; 1 is a closed-superseded PR whose fix
landed via a different PR.

Do NOT delete anything without Bryan's explicit approval. Delete commands
at the bottom.

## Bucket A — Squash-merge leftovers (49 branches, safe to delete)

These branches had a PR that was **merged** to main. GitHub's squash-merge
keeps the branch alive after merging (it doesn't match git's merge graph,
so `git branch -r --merged` reports 0 matches, even though the content is
fully upstream).

Grouped by week (newest first), ordered by PR number descending.

### Week of 2026-04-13 (PRs #110–#115)

| Branch | Date | Author | Subject | PR |
|---|---|---|---|---|
| fix/prime-race-and-tilestore-tests | 2026-04-15 | Bryan Chan | fix(cache): gate overlay on IDB prime + unit-test tileStore helpers | #115 |
| feat/lazy-tile-cache | 2026-04-15 | Bryan Chan | feat(cache): lazy per-tile IndexedDB persistence + brainstorm doc | #114 |
| fix/picker-icons-and-banner | 2026-04-15 | Bryan Chan | fix(picker): redraw bike-shaped icons + drop labels + filter stale profiles | #113 |
| feat/wire-mode-icons | 2026-04-15 | Bryan Chan | fix(picker): redraw bike-shaped icons + drop labels + filter stale profiles | #112 |
| feat/layer-1.5-mode-rules | 2026-04-15 | Bryan Chan | Merge remote-tracking branch 'origin/main' into feat/layer-1.5-mode-rules | #111 |
| feat/three-layer-scoring-5-modes | 2026-04-13 | Bryan Chan | docs: pre-stage blog launch material for Wed Apr 15 | #110 |

### Earlier April (PRs #9–#67)

| Branch | Date | Author | Subject | PR |
|---|---|---|---|---|
| docs/routing-safety-research | 2026-04-09 | Bryan Chan | docs: routing engine and safety scoring research synthesis | #67 |
| bc-277-hover-popover-improvements | 2026-04-06 | Product Engineer | feat: improve map hover popover — layout, classification, Mapillary image | #55 |
| product-engineer/propagate-2026-04-04 | 2026-04-04 | Product Engineer | chore: propagate template updates from product-engineer | #48 |
| ticket/BC-272 | 2026-04-04 | Agent | feat(BC-272): move travel mode to bottom on mobile, remove bike layer toggle | #47 |
| feat/bc-270-search-revamp | 2026-04-04 | Bryan Chan | refactor: review fixes — consolidate MapMoveController, extract getPlaceDetail | #43 |
| ticket/BC-271 | 2026-04-04 | Product Engineer | feat(BC-271): complete mobile search UX with swap, auto-collapse, clear | #42 |
| feat/bc-270-better-search | 2026-04-04 | Bryan Chan | feat(BC-271): complete mobile search UX with swap, auto-collapse, clear | #41 |
| ticket/BC-268 | 2026-04-04 | BC-268 Agent | fix(BC-268): show all route segments and improve route prominence | #40 |
| ticket/BC-267 | 2026-04-04 | Claude Agent | fix(BC-267): load bike map tiles immediately on initial render | #39 |
| ticket/BC-266 | 2026-04-04 | BC-266 Agent | feat(BC-266): add quick options to End SearchBar with Google Maps vertical list UI | #38 |
| feedback/ios-performance-fix | 2026-04-04 | Claude Agent | docs(retro): iOS rendering performance fix session notes | #37 |
| feedback/fix-non-berlin-routing | 2026-04-04 | Claude Agent | docs: add retro for non-Berlin routing fix | #36 |
| ticket/profile-independent-cache | 2026-04-04 | Claude Agent | feat(overlay): profile-independent tile cache — instant mode switching | #35 |
| ticket/overpass-fix | 2026-04-04 | Claude Agent | fix(worker): declare caches.default type for Cloudflare Workers | #34 |
| ticket/BC-260 | 2026-04-03 | BC Agent | feat(BC-260): set initial map zoom to 14 (~2.5km radius) on location | #33 |
| worktree-bike-map | 2026-04-03 | Bryan Chan | merge: resolve conflicts with main after PR #31 squash | #32 |
| ticket/BC-257 | 2026-04-02 | Claude Agent | feat(BC-257): remove per-item color dots from legend | #29 |
| ticket/BC-256 | 2026-04-02 | BC-256 Agent | feat(BC-256): path color coding (green/orange) and legend visibility controls | #28 |
| ticket/BC-255 | 2026-04-02 | BC-255 Agent | chore: skip routing integration tests in CI by default | #27 |
| ticket/BC-253 | 2026-04-02 | Claude Agent | feat(BC-253): route auto-fit, 'Bike Route Planner' title, cobblestone avoidance | #26 |
| ticket/BC-252 | 2026-04-02 | Claude Agent | feat(BC-252): convert bike map button to on-map toggle, default ON, zoom to 5km | #24 |
| ticket/BC-251 | 2026-04-02 | Claude Agent | feat(BC-251): rename title to 'Family Bike Map', center map on user location | #23 |
| ticket/BC-250 | 2026-04-02 | Claude Agent | feat(BC-250): show current location on map, quick-select start options | #22 |
| ticket/BC-249 | 2026-04-02 | BC-249 Agent | feat(BC-249): tile-based bike map caching for smooth pan/zoom | #21 |
| ticket/BC-248 | 2026-04-02 | BC-248 Agent | feat(BC-248): UI improvements for map mode overlays and buttons | #20 |
| ticket/BC-247 | 2026-04-02 | Claude Agent | fix(BC-247): map interactions, path type display, and UI layout | #19 |
| ticket/BC-246 | 2026-04-02 | PE Agent | feat(BC-246): move mode selector onto map, redesign mode icons | #18 |
| ticket/BC-244 | 2026-04-02 | Agent | fix: update integration test return type annotation great → good | #17 |
| ticket/BC-243 | 2026-04-01 | BC-243 Agent | feat(BC-243): three-color status indicator system | #16 |
| ticket/BC-242 | 2026-04-01 | BC-242 Agent | docs: add BC-242 retrospective | #15 |
| ticket/BC-241 | 2026-04-01 | Claude Agent | fix(classify): use Valhalla string API values; add integration tests | #14 |
| ticket/BC-240 | 2026-04-01 | BC-240 Agent | BC-240: fix map color consistency, zoom loading, edit mode, icon labeling | #13 |
| feedback/engeldam-routing | 2026-04-01 | PE Agent | fix: lower avoid_bad_surfaces to allow Engeldam park paths in routing | #12 |
| feedback/categorical-colors | 2026-04-01 | Claude Agent | fix: align categorical legend/quality-bar colors with SAFETY palette | #11 |
| feedback/edit-mode-button | 2026-04-01 | Claude Agent | feat: hide map editing behind edit mode toggle button | #10 |
| ticket/bc-poi-search-fix | 2026-04-01 | PE Agent | fix: use POI name instead of road for landmark/POI search results | #9 |
| feedback/map-perf-optimization | 2026-04-01 | Product Engineer Agent | perf: improve map view load time via lazy loading, bundle splitting, caching | #8 |
| ticket/BC-231 | 2026-04-01 | Claude Agent | feat: BC-231 support exact address search queries | #7 |
| ticket/BC-230 | 2026-04-01 | Claude Agent | feat: BC-230 UI/UX redesign based on prototype feedback | #6 |
| feat/unified-worker | 2026-04-01 | Bryan Chan | ci: retrigger | #5 |
| ticket/BC-222 | 2026-04-01 | Claude Agent | feat: make bike map overlay coloring respect selected profile | #3 |
| ticket/vision-update-rider-profiles | 2026-03-31 | Product Engineer Agent | Consolidate vision docs and add specific rider profiles | #2 |
| ticket/BC-216 | 2026-03-31 | Product Engineer Agent | Add high-level vision summary | #1 |

## Bucket B — Closed-superseded (1 branch, safe to delete)

| Branch | Date | Author | Subject | PR | Status |
|---|---|---|---|---|---|
| fix/raise-max-visible-tiles | 2026-04-15 | Bryan Chan | fix(overlay): raise MAX_VISIBLE_TILES 12 → 30 for metro-area views | #116 | CLOSED, superseded |

Verified: `src/components/BikeMapOverlay.tsx:16` currently has
`const MAX_VISIBLE_TILES = 30` in main, so the fix from #116 landed via a
different PR. Branch is redundant.

## Bucket C — Needs human call (0 branches)

None. Every branch has a PR with a definitive state.

## Execute (after Bryan's approval)

One single command will delete all 50. git-push delete is a no-op for
local refs — it only removes the remote ref — so this doesn't touch any
local work Bryan has.

```bash
git push origin --delete \
  bc-277-hover-popover-improvements \
  docs/routing-safety-research \
  feat/bc-270-better-search \
  feat/bc-270-search-revamp \
  feat/layer-1.5-mode-rules \
  feat/lazy-tile-cache \
  feat/three-layer-scoring-5-modes \
  feat/unified-worker \
  feat/wire-mode-icons \
  feedback/categorical-colors \
  feedback/edit-mode-button \
  feedback/engeldam-routing \
  feedback/fix-non-berlin-routing \
  feedback/ios-performance-fix \
  feedback/map-perf-optimization \
  fix/picker-icons-and-banner \
  fix/prime-race-and-tilestore-tests \
  fix/raise-max-visible-tiles \
  product-engineer/propagate-2026-04-04 \
  ticket/BC-216 \
  ticket/BC-222 \
  ticket/BC-230 \
  ticket/BC-231 \
  ticket/BC-240 \
  ticket/BC-241 \
  ticket/BC-242 \
  ticket/BC-243 \
  ticket/BC-244 \
  ticket/BC-246 \
  ticket/BC-247 \
  ticket/BC-248 \
  ticket/BC-249 \
  ticket/BC-250 \
  ticket/BC-251 \
  ticket/BC-252 \
  ticket/BC-253 \
  ticket/BC-255 \
  ticket/BC-256 \
  ticket/BC-257 \
  ticket/BC-260 \
  ticket/BC-266 \
  ticket/BC-267 \
  ticket/BC-268 \
  ticket/BC-271 \
  ticket/BC-272 \
  ticket/bc-poi-search-fix \
  ticket/overpass-fix \
  ticket/profile-independent-cache \
  ticket/vision-update-rider-profiles \
  worktree-bike-map
```

Restoration is cheap if any deletion turns out to be wrong: every branch's
tip commit is preserved on its associated PR page, and a `git fetch --all`
after re-pushing with `git push origin <sha>:refs/heads/<name>` recreates it.

## Future hygiene

To prevent the next 50-branch pile-up, enable GitHub's **"Automatically
delete head branches"** setting (Settings → General → Pull Requests). This
deletes the source branch on merge/close automatically, so squash-merges
don't leave phantom branches around.
