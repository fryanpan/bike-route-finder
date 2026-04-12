# Family Bike Map

A bike route planner built for families with young children. Routes through safe, car-free infrastructure that existing routing engines miss.

**Live at [bike-map.fryanpan.com](https://bike-map.fryanpan.com)**

## The problem

Google Maps, Apple Maps, and every bike routing engine treat all bike infrastructure the same. A painted line on a busy 4-lane road counts as "bike-friendly" — the same as a car-free Fahrradstrasse. For a parent riding with a 4-year-old, these are completely different.

## What this does differently

**Routes on what you can see.** The map shows bike infrastructure colored by safety (green = car-free paths, orange = roads with traffic). The routing engine uses the exact same data and classification — so the route matches what the map shows. No surprises.

**Speed-based costing.** Instead of arbitrary penalty multipliers, the router uses realistic speeds: a toddler bikes at 10 km/h on a Fahrradstrasse but walks at 3 km/h past a busy intersection. The router naturally finds routes that minimize total time by maximizing time on safe, fast infrastructure.

**Per-segment classification.** Every road segment is classified using OpenStreetMap tags: highway type, cycleway type, surface, separation, speed limit. The same classifier drives the map overlay, the routing cost function, and the quality metrics.

**Client-side routing.** Routes are computed in the browser using cached OSM data — no server round-trips, no rate limits, works offline. The graph (30-60K nodes for a city) routes in 10-30ms.

## Use cases

**Family mobility** — Getting anywhere in the city with a child on their own bike. Cafe, museum, park, friend's house. The route should be 90%+ on safe infrastructure, with short walking segments to bridge gaps.

**Cargo bike with trailer** — Wide smooth paths, avoid narrow bollard-blocked bike paths and cobblestones.

**Training ride** — Smooth asphalt, okay with traffic at 30 km/h. Avoid tram tracks, narrow bike paths, bumpy paving stones.

## Benchmark results

22 Berlin test routes, toddler mode:

| Engine | Avg preferred infrastructure |
|--------|:---:|
| **Family Bike Map** | **57%** |
| BRouter (safety profile) | 40% |
| Valhalla (use_roads=0) | 35% |

The client router wins 13 out of 16 head-to-head comparisons against Valhalla, finding Fahrradstrassen and car-free paths that Valhalla routes through painted bike lanes instead.

## Features

- **Client-side A* routing** on cached OpenStreetMap data (ngraph.path)
- **Three travel modes**: toddler, trailer, training — each with different speed/safety profiles
- **Bike infrastructure overlay** with per-segment classification
- **Live GPS navigation** with auto-advance, distance-based speech, segment feedback
- **City caching** — download any area for offline routing (Google Maps-style viewport selection)
- **Classification audit tool** — scan cities, review infrastructure with Mapillary imagery, set per-region rules
- **Route quality scoring** — % preferred infrastructure, gap healing at intersections

## Tech stack

- React + Leaflet (frontend)
- Cloudflare Workers + KV + D1 (backend, no separate server)
- Valhalla (fallback routing)
- OpenStreetMap / Overpass API (infrastructure data)
- ngraph.path (client-side A* pathfinding)

## Development

```bash
bun install
bun run dev     # local dev server
bun test        # run tests
bun run build   # production build
```

Requires a Cloudflare account for deployment. See `wrangler.toml` for configuration.

## License

MIT
