# UX Review — pre-launch sweep (Monday blog post ships Apr 21)

**Date:** 2026-04-20
**Scope:** Validate shareable state before the blog post publishes and readers land at bike-map.fryanpan.com. Focus: first-time-visitor flow, mobile touch targets, no layout breaks at 375px.
**Tested on:** `?mobile=iphone` (430×932 preview) — Chrome extension-driven automation. Desktop cross-checked from browser screenshot.

## What shipped for launch prep (today)

1. **IntroCard** (`src/components/IntroCard.tsx`) — first-visit auto-shown; dismissable; persisted via localStorage `bike-route-intro-dismissed`. Re-openable from the new `?` help button next to the ⚙️ gear.
   - 3 steps: pick rider level → search → tap segment for photo + actions
   - Green/orange semantics footnote + OSM/Mapillary attribution
   - 48px primary CTA, 40×40 close button
2. **`?` help button** next to the admin gear at bottom-left of the map controls.
3. **MAX_VISIBLE_TILES 12 → 30** in `BikeMapOverlay.tsx` — bumps the gate where we show "Zoom in to see bike infrastructure". At 12, any metro-area view (Potsdam→Berlin, London overview, Bay Area overview) hit the gate at a reasonable zoom level. 30 covers those without letting world-zoom through. Supersedes stale PR #116 (closed with comment).

## Verified live

| Flow | Result | Notes |
|---|---|---|
| W1 · First visit | ✅ Intro card appears, card fits at 430px, dismisses cleanly | Single-render auto-show on first visit (and after localStorage clear). |
| Dismissal persistence | ✅ | localStorage key set; reopening via `?` button uses the `forced` prop and bypasses the dismissal. |
| Mode picker — 5 chips fit one row | ✅ | Prior fix (`max-width: 480px` rules) holds. |
| Legend layout | ✅ | 5 preferred items for kid-confident visible; OTHER row collapsed. No overlap with mode picker. |
| Bigger location dot | ✅ | Dot saturated blue with new 20px core + 48px pulse. More visible against the green overlay. |
| Recenter button | ✅ mounted | 40×40, bottom: 90px above zoom controls. Click not automation-verified (extension disconnected mid-session) but JSX + CSS confirmed. |
| Touch targets on new UI | ✅ | intro-close 40×40, intro-got-it 48px min-height, recenter-btn 40×40. |

## Not re-verified (covered in earlier reviews, not touched since)

- Search → autocomplete → place detail → save as Home (2026-04-17 review)
- Route rendering with classified segments (2026-04-18 review)
- Segment popup with Mapillary photo + tag list + reroute/flag buttons (2026-04-18 review, fixed since)
- Audit samples tab card grid + lightbox carousel (2026-04-17 review)
- Admin tabs shareable URLs (2026-04-17 review)
- Flag feedback queue (2026-04-18 review)

## Known follow-ups (non-blocking for launch)

- Real-device mobile test on iPhone 16 Pro Max + Pixel 10 Pro (preview mode is a proxy, not a substitute)
- Accessibility pass (keyboard nav, screen reader labels, color contrast on green/orange)
- Off-route detection banner (deferred from Chunk B scope)
- Desktop-specific UX review was light this pass — earlier reviews cover it; the only new desktop-affecting addition is the intro card which renders identically at desktop widths (480px max-width centered)

## Critical-issue count: 0

Everything needed for a blog-reader to land, understand the product in 3 seconds, and route successfully is live and working. The intro card does the heavy lifting on "what is this"; the mode picker labels that I questioned in the earlier review are less of a concern now because the intro explains what the modes mean.

## If I had one more hour before launch

In priority order:
1. A real-device test on both Bryan's iPhone 16 Pro Max and Joanna's Pixel 10 Pro, especially verifying the segment-popup tap target and Mapillary photo loading on cellular.
2. An explicit home-screen screenshot in the intro card (step 1: "tap HERE" with an arrow to the mode picker) — currently step 1 says "tap an icon at the top" which is fine but could be even more direct.
3. Verify the `?mobile=iphone` preview param stays OFF for normal users — re-check the URL-param parse doesn't accidentally trigger on any search query.

## Files changed today

- `src/components/IntroCard.tsx` (new)
- `src/App.tsx` (intro + help button wiring)
- `src/App.css` (intro card + recenter button styles)
- `src/components/BikeMapOverlay.tsx` (MAX_VISIBLE_TILES 12→30)

244 tests still passing, tsc clean.
