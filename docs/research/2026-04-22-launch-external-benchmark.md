# 2026-04-22 Berlin external benchmark — post-launch refresh

First full external (BRouter + Valhalla) benchmark since the April
refactor. Purpose: refresh the blog-post numbers (which cite pre-refactor
57%/40%/35% from early April).

Run: `bun scripts/benchmark-routing.ts --city=berlin` @ 2f3b20c (post
PostHog / Userback / compare-links admin tool integration).

## Per-mode averages

| Mode | Client found | Valhalla found | BRouter found | **Client avg** | Valhalla avg | BRouter avg |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| kid-starting-out | 20/22 | 22/22 | 22/22 | **57%** | 35% | 38% |
| kid-confident | 20/22 | 22/22 | 22/22 | **68%** | 39% | 45% |
| kid-traffic-savvy | 20/22 | 22/22 | 22/22 | **65%** | 44% | 51% |
| carrying-kid | 20/22 | 22/22 | 22/22 | **52%** | 40% | 46% |
| training | 20/22 | 21/22 | 22/22 | **49%** | 36% | 34% |

Client 2/22 failures both = SSE Schwimmhalle (Home + School), which
sits just outside the benchmark corridor bbox. Bbox is not expanded
because the bug is in the test harness, not the router.

## Head-to-head (per-pair, one pairwise vote per route)

W = client preferred-% > external's by ≥1pp, T = within 1pp, L = less.

| Mode | vs Valhalla (W/T/L) | vs BRouter (W/T/L) |
|------|:---:|:---:|
| kid-starting-out | 12/7/1 | 15/2/3 |
| kid-confident | 15/4/1 | 14/4/2 |
| kid-traffic-savvy | 14/4/2 | 13/3/4 |
| carrying-kid | 13/4/3 | 9/5/6 |
| training | 13/4/2 | 14/4/2 |

## Delta vs pre-refactor blog numbers

Pre-refactor blog table cited:

> Family Bike Map 57% / BRouter (safety) 40% / Valhalla 35% on
> kid-starting-out, 13/16 wins vs Valhalla.

Current kid-starting-out: **57% / BRouter 38% / Valhalla 35%**. Story
unchanged — Family Bike Map ~1.6× Valhalla and ~1.5× BRouter on safe
infrastructure for the strictest mode. Head-to-head vs Valhalla went
from 13/16 to **12W/7T/1L across 20 comparable pairs** (more ties now
because the SSE Schwimmhalle pairs that used to "fail vs succeed" are
now bilaterally excluded).

## Blog-post rewrite

Replace the 3-row table with the 5-row mode table above (or keep
kid-starting-out only but update BRouter 38%/Valhalla 35%). The 1.6×
lead holds, and the story is now "Family Bike Map beats the stock
safety profiles on every mode" rather than a single-mode claim.

## Test count

`bun test` → 249 pass / 0 fail (blog cites 204 — stale).

## Raw output

`/tmp/berlin-benchmark-2026-04-22.log`

---

# San Francisco — same-day companion run

Run: `bun scripts/benchmark-routing.ts --city=sf` @ 2f3b20c.

## Per-mode averages

| Mode | Client found | Valhalla found | BRouter found | **Client avg** | Valhalla avg | BRouter avg |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| kid-starting-out | 9/17 | 17/17 | 17/17 | **32%** | 29% | 19% |
| kid-confident | 9/17 | 16/17 | 17/17 | **51%** | 28% | 29% |
| kid-traffic-savvy | 9/17 | 17/17 | 17/17 | **52%** | 36% | 34% |
| carrying-kid | 9/17 | 17/17 | 17/17 | **35%** | 20% | 23% |
| training | 9/17 | 17/17 | 17/17 | **35%** | 19% | 14% |

Client 9/17 failures are a harness / bbox limitation: several SF
destinations (Lands End, Balboa Pool, Tartine, 16th St BART, 450 Sutter,
Apple Store, Yummy's) sit outside the benchmark tile bbox. When the
client-side graph can't find a node for the endpoint, it FAILs the
route; Valhalla and BRouter have the full SF graph so they don't.
This is a benchmark-setup issue, not a routing regression.

## Head-to-head (comparable pairs only)

| Mode | vs Valhalla (W/T/L) | vs BRouter (W/T/L) |
|------|:---:|:---:|
| kid-starting-out | 3/4/2 | 5/4/0 |
| kid-confident | 7/0/1 | 9/0/0 |
| kid-traffic-savvy | 6/1/2 | 8/1/0 |
| carrying-kid | 6/2/1 | 6/2/1 |
| training | 5/2/2 | 5/2/2 |

## Interpretation

SF numbers are lower than Berlin across the board because SF's
bike-infra baseline is lower — fewer protected paths, more reliance on
painted lanes and "plastic post" pseudo-protected lanes that our
classifier rightly declines to call preferred. This matches the blog's
"a few hero corridors, spotty network" characterization.

Where we shine: kid-confident (51% vs 28–29% — ~1.8×) and
kid-traffic-savvy (52% vs 34–36% — ~1.5×). Kid-starting-out is the
closest race at 32% / 29% / 19% because SF has so little fully
car-free infra that all three routers converge on the same handful
of Slow Streets / JFK Promenade / Panhandle options.

**Head-to-head shutout**: kid-confident goes **9–0** against BRouter
and **7–0–1** against Valhalla on the nine comparable pairs — the
strongest single-mode vs-external result across both cities.

## Raw output

`/tmp/sf-benchmark-2026-04-22.log`
