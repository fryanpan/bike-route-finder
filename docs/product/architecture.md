# Technical Architecture

## System Overview

```mermaid
graph TB
    subgraph "Browser (React SPA)"
        UI[Map UI<br/>React + Leaflet]
        ClientRouter[Client Router<br/>ngraph.path A*]
        TileCache[Tile Cache<br/>In-memory + IndexedDB]
        Overlay[Map Overlay<br/>BikeMapOverlay.tsx]
        Painter[Route Painter<br/>Map.tsx]
        Bar[Quality Bar<br/>DirectionsPanel.tsx]
        Legend[Legend<br/>SimpleLegend.tsx]
        Admin[Admin Panel<br/>AuditPanel.tsx]
    end

    subgraph "Cloudflare"
        Worker[Worker<br/>API proxy + D1 + KV]
        EdgeCache[Edge Cache<br/>30-day TTL]
        D1[(D1 Database<br/>route logs)]
        KV[(KV Store<br/>region rules)]
    end

    subgraph "External APIs"
        Overpass[Overpass API<br/>OSM infrastructure data]
        Nominatim[Nominatim<br/>geocoding]
        Mapillary[Mapillary<br/>street imagery]
        StreetView[Google Street View<br/>single-image popovers]
    end

    TileCache -->|OsmWay data| ClientRouter
    TileCache -->|OsmWay data| Overlay
    TileCache -->|OsmWay data| Admin
    ClientRouter -->|Route segments| Painter
    ClientRouter -->|Route segments| Bar
    UI -->|read state| Legend
    TileCache -->|cache miss| Worker
    Worker -->|proxy + cache| Overpass
    Worker -->|proxy| Nominatim
    Worker -->|proxy + key| Mapillary
    Worker -->|proxy + key| StreetView
    UI -->|route log| D1
    UI -->|rules| KV
    EdgeCache -->|30-day TTL| Overpass
```

## Classification — single source of truth

Three pure functions classify OSM tags. Different consumers want different outputs, but all consumers go through the **same primitives**.

```mermaid
graph TD
    classDef classifier fill:#dbeafe,stroke:#1e40af,color:#0c1d3d
    classDef helper fill:#dcfce7,stroke:#15803d,color:#0f2e1d
    classDef rule fill:#fef3c7,stroke:#a16207,color:#3a290b
    classDef table fill:#f3e8ff,stroke:#7e22ce,color:#1f0a30

    Tags["OSM Tags<br/>(highway, cycleway,<br/>surface, maxspeed, …)"]
    Mode["Travel mode<br/>(kid-confident, …)"]
    Rules["Region rules<br/>(Cloudflare KV)"]

    Tags --> CE["classifyEdge<br/>utils/lts.ts<br/><br/>→ pathLevel (1a/1b/2a/2b/3/4)<br/>→ carFree, bikePriority, bikeInfra<br/>→ speedKmh, surface, smoothness"]:::classifier
    Tags --> CIT["classifyOsmTagsToItem<br/>services/overpass.ts<br/><br/>→ itemName | null<br/>(e.g. 'Bike path',<br/>'Fahrradstrasse')"]:::classifier
    Mode --> CIT
    Rules --> CIT

    PROFILE["PROFILE_LEGEND<br/>utils/classify.ts<br/><br/>per-mode tier table:<br/>itemName → level (1a/1b/2a/…)<br/>+ icon + defaultPreferred"]:::table
    LABELS["PATH_LEVEL_LABELS<br/>utils/lts.ts<br/><br/>per-tier display props:<br/>level → short, legendTitle,<br/>defaultColor, defaultWeight"]:::table

    CIT --> GDPL["getDisplayPathLevel<br/>utils/classify.ts<br/><br/>itemName → legend's level<br/>fallback to classifyEdge.pathLevel"]:::helper
    CE --> GDPL
    PROFILE --> GDPL

    LABELS --> CFL["colorForLevel<br/>SimpleLegend.tsx<br/><br/>level + adminSettings.tiers<br/>→ hex color"]:::helper

    CE --> AMR["applyModeRule<br/>data/modes.ts<br/><br/>classification + ModeRule<br/>→ accept/reject/walk + cost"]:::rule
```

**Architectural rule (post-2026-04-28):**
- `classifyEdge` (LTS-tier-derived from raw tags) is the **routing classifier**. `applyModeRule` reads it for accept/reject + edge-cost decisions.
- `classifyOsmTagsToItem` (legend-item-derived from raw tags) is the **identity classifier**. It answers "what kind of infrastructure is this?" e.g. 'Bike path' vs 'Fahrradstrasse'.
- `getDisplayPathLevel(itemName, mode, fallbackPathLevel)` is the **display classifier**. The legend's `PROFILE_LEGEND[item].level` is canonical when an itemName matches; classifyEdge is the fallback for unclassified ways. Every display surface (overlay, route polyline, quality bar) goes through this.
- `colorForLevel(level)` reads `PATH_LEVEL_LABELS[level].defaultColor` (or admin override). Single hex per tier.

This means: if a way maps to 'Bike path' (a 1a item per the legend), it renders dark green in the legend, the overlay, the route polyline, AND the bar — even if `classifyEdge`'s LTS rules would have called the same way pathLevel='3'.

## Per-consumer flow

```mermaid
graph LR
    classDef ui fill:#e0f2fe,stroke:#0284c7,color:#0c2740
    classDef func fill:#dcfce7,stroke:#15803d,color:#0f2e1d
    classDef data fill:#fef3c7,stroke:#a16207,color:#3a290b

    Tags[OSM tags]:::data
    Coords[Route coords]:::data

    %% Overlay
    subgraph S1["1. Overlay (BikeMapOverlay)"]
      O1[classifyEdge → pathLevel filter]:::func
      O2[classifyOsmTagsToItem → itemName]:::func
      O3[getDisplayPathLevel]:::func
      O4[colorForLevel → per-way color]:::func
      OUT1[Colored tile polylines]:::ui
      O1 --> O2 --> O3 --> O4 --> OUT1
    end
    Tags --> O1

    %% Routing
    subgraph S2["2. Routing (clientRouter A*)"]
      R1[classifyEdge → LTS classification]:::func
      R2[applyModeRule → accept/reject/walk + cost]:::func
      R3[A* on graph → optimal path]:::func
      R4[classifyOsmTagsToItem → itemName per segment]:::func
      R5[getDisplayPathLevel → seg.pathLevel for display]:::func
      OUT2[Route + segments]:::ui
      R1 --> R2 --> R3 --> R4 --> R5 --> OUT2
    end
    Tags --> R1

    %% Painter
    subgraph S3["3. Route polyline (Map.tsx)"]
      P1[seg.pathLevel + isPreferred]:::func
      P2[colorForLevel → polyline color]:::func
      OUT3[Tier-colored route on map]:::ui
      P1 --> P2 --> OUT3
    end
    OUT2 --> P1

    %% Quality bar
    subgraph S4["4. Quality bar (DirectionsPanel)"]
      Q1[computeRouteQuality<br/>distance-weighted by tier]:::func
      Q2[colorForLevel per tier slice]:::func
      OUT4[Tier breakdown bar + labels]:::ui
      Q1 --> Q2 --> OUT4
    end
    OUT2 --> Q1

    %% Legend
    subgraph S5["5. Legend (SimpleLegend)"]
      L1[PROFILE_LEGEND for active mode]:::func
      L2[colorForLevel per visible tier]:::func
      OUT5[Tier swatches with names]:::ui
      L1 --> L2 --> OUT5
    end

    %% Benchmark
    subgraph S6["6. Benchmark (scripts/render-route-comparisons.ts)"]
      B1[For each route coord:<br/>nearest OsmWay via spatial grid]:::func
      B2[classifyOsmTagsToItem → itemName]:::func
      B3[itemName ∈ preferredItemNames<br/>→ distance-weighted preferredPct]:::func
      OUT6[Per-router preferred%, distance,<br/>multiplier vs shortest]:::ui
      B1 --> B2 --> B3 --> OUT6
    end
    Tags --> B1
    Coords --> B1

    %% Admin
    subgraph S7["7. Admin panel (AuditPanel)"]
      A1[Group ways by tag-signature]:::func
      A2[classifyOsmTagsToItem → itemName per group]:::func
      A3[applyModeRule → verdict<br/>accepted/bridge-walked/rejected]:::func
      OUT7[Audit groups with counts<br/>+ classification + verdict]:::ui
      A1 --> A2 --> A3 --> OUT7
    end
    Tags --> A1
```

**Key observations**:

- **Routing (2) and display (3, 4) share segments** — the route's `seg.pathLevel` is set by `getDisplayPathLevel` in clientRouter, so the polyline painter, the quality bar, and the legend all see the same canonical tier per segment.
- **Overlay (1) doesn't depend on routing** — it classifies every visible OSM way independently, but uses the **same** `getDisplayPathLevel` helper as the route, so identical ways color identically.
- **Benchmark (6) is intentionally independent of routing internals** — it does its own coord-to-way matching and reads `classifyOsmTagsToItem` directly. By design: a benchmark that piggybacked on `clientRouter`'s output would be self-validating.
- **Admin panel (7) reads the routing classifier directly** — `applyModeRule` produces the verdict (accepted / bridge-walked / rejected) that the user sees per audit group. This is the source of truth for "would the router accept this tag combination?"

## Routing internals

```mermaid
flowchart TD
    Start[User searches A→B] --> Fetch[Fetch/cache Overpass tiles<br/>for the corridor]
    Fetch --> Build[Build directed graph<br/>edges = OsmWay segments]
    Build --> Apply[applyModeRule per edge<br/>→ accept / bridge-walk / reject]
    Apply --> Snap[findNearestNode role-aware<br/>+ directed-reachability BFS]
    Snap --> AStar[A* on the graph<br/>cost = distance / speed]
    AStar --> Found{Path found?}
    Found -->|No| Null[Return null<br/>UI shows 'No route found']
    Found -->|Yes| Build2[Build route segments<br/>set seg.pathLevel via getDisplayPathLevel]
    Build2 --> Heal[healSegmentGaps<br/>≤30m gaps adopt surrounding<br/>itemName + pathLevel]
    Heal --> Display[Hand to UI: route + segments]
```

### Cost model

The router uses **time as cost** — `cost = distance / speed`, where speed depends on the mode rule's classification of the edge.

| Edge fate | Speed used | Result |
|---|---|---|
| Accepted by `applyModeRule` | mode's `ridingSpeedKmh` (or `slowSpeedKmh` for non-bike-priority residential) | Cheap edge — router prefers |
| `applyModeRule` rejects but `isBridgeWalkable` true | mode's `walkingSpeedKmh` (3 km/h) | Expensive edge — only used as bridge across short gaps |
| `applyModeRule` rejects + not walkable (motorway / `sidewalk=no`) | n/a — edge not added | Genuinely unusable |

This composes cleanly without arbitrary penalty multipliers — a 200 m walk-bridge is more expensive than a 1 km cycleway detour by construction.

### Reachability (post-2026-04-24 fix)

`findNearestNode` is **role-aware** (start needs ≥1 outgoing edge, end needs ≥1 incoming edge) and **reachability-restricted** (the end-snap is constrained to nodes in the directed-reachable set from the start, computed via BFS). Without these, ~25% of SF benchmark samples returned null even though a viable endpoint was 20-100 m away. See `docs/process/learnings.md`.

## Data flow (route request)

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Cache as Tile Cache
    participant Router as Client Router
    participant Worker
    participant Overpass

    User->>App: Search destination
    App->>Cache: Need tiles for corridor?
    Cache-->>App: Some cached, some missing
    App->>Worker: Fetch missing tiles
    Worker->>Overpass: Query (or serve 30-day edge cache)
    Overpass-->>Worker: OSM ways
    Worker-->>App: Ways data
    App->>Cache: Store tiles (memory + IndexedDB)
    App->>Router: Route on graph
    Router->>Cache: Read all corridor tiles
    Router->>Router: Build graph, apply mode rule, A*
    Router-->>App: Route + segments (seg.pathLevel via getDisplayPathLevel)
    App->>App: Heal short gaps, compute quality bar
    App->>App: Display polyline (uses seg.pathLevel)
    App->>Worker: Log route to D1
```

## Travel modes

Five public modes, defined in `src/data/modes.ts`. Each has a `ModeRule` that drives `applyModeRule` (accept/reject/cost) and a `PROFILE_LEGEND` entry that drives the legend + display tier:

| Mode | Legend-preferred tiers | Router behavior |
|---|---|---|
| **kid-starting-out** | 1a only | Strict — only fully car-free paths; everything else is bridge-walk |
| **kid-confident** | 1a + 1b | Adds bike-priority shared streets (Fahrradstraße, living streets) |
| **kid-traffic-savvy** | 1a + 1b + 2a | Adds painted lanes on quiet streets |
| **carrying-kid** | 1a + 1b + 2a + 2b | Adds quiet residential without bike infra |
| **training** *(admin-flagged off in prod)* | 1a + 1b + 2a + 2b + 3 | Adds higher-traffic streets |

Stamina is orthogonal — `ModeRule` doesn't cap distance. Families judge that themselves.

## Key files

| File | Purpose |
|------|---------|
| `src/utils/lts.ts` | `classifyEdge`, `PathLevel`, `PATH_LEVEL_LABELS` (single legend table) |
| `src/utils/classify.ts` | `PROFILE_LEGEND`, `getDisplayPathLevel`, `getLegendItem`, `computeRouteQuality`, `healSegmentGaps`, `PREFERRED_COLOR`/`OTHER_COLOR`/`WALKING_COLOR` |
| `src/data/modes.ts` | `MODE_RULES`, `applyModeRule` |
| `src/services/overpass.ts` | Overpass query + 30-day edge cache + `classifyOsmTagsToItem` |
| `src/services/clientRouter.ts` | Client-side A*, `findNearestNode` (role-aware + reachability-restricted), graph builder |
| `src/services/routeScorer.ts` | Re-classify a route's coords against tile data (post-build enrichment) |
| `src/services/audit.ts` | City scan, tag grouping, classification audit |
| `src/services/rules.ts` | Per-region classification rules (KV) |
| `src/components/Map.tsx` | Leaflet map, route polyline painter |
| `src/components/BikeMapOverlay.tsx` | Per-way bike infrastructure overlay |
| `src/components/SimpleLegend.tsx` | `colorForLevel`, tier swatches; `SIMPLE_TIERS` derived from `PATH_LEVEL_LABELS` |
| `src/components/DirectionsPanel.tsx` | Quality bar (uses `computeRouteQuality`), navigation, segment popups |
| `src/components/AdminPanel.tsx` | Audit + Settings + Routing Benchmarks tabs |
| `src/components/AdminBenchmarksTab.tsx` | Lists past benchmark runs from `public/route-compare/history.jsonl` |
| `src/services/adminSettings.ts` | Tier color/weight overrides + per-mode routing knobs (default tiers derive from `PATH_LEVEL_LABELS`) |
| `src/worker.ts` | Cloudflare Worker: Overpass / Mapillary / Street View / Nominatim proxies, D1 logging, KV rules, Sentry capture |
| `scripts/render-route-comparisons.ts` | Benchmark generator: client + Valhalla + BRouter + Google routes, distance-weighted preferred%, per-mode summary, charts |
| `scripts/fetch-google-routes.ts` | One-time fetch of Google Directions bicycling routes for the benchmark fixture set |

## Infrastructure

| Service | Purpose | Cost |
|---------|---------|------|
| Cloudflare Pages + Workers | SPA hosting + API proxy | Free tier |
| Cloudflare KV | Region classification rules | Free tier |
| Cloudflare D1 | Route logs, segment feedback | Free tier |
| Cloudflare Edge Cache | 30-day Overpass tile cache | Free |
| Sentry | Error tracking (frontend + Worker) | Free tier |
| Userback | User-initiated feedback widget | Free tier (paid plan for prod) |
| PostHog | Session analytics | Free tier |
| Mapillary | Bulk audit street imagery | Free API |
| Google Street View Static | Single-image segment popovers | $7 / 1000 (under free $200 monthly credit) |
| Overpass (public) | OSM infrastructure data | Free |
| Nominatim (public) | Geocoding | Free |

## Architecture rules

1. **Single classification source.** Display tier comes from `getDisplayPathLevel(itemName, mode, fallback)`. Routing tier (for cost decisions) comes from `classifyEdge`. The two are bridged via `getDisplayPathLevel`'s fallback when no legend-item match. New display surfaces MUST use this helper, not call `classifyEdge` directly.
2. **One legend table.** `PATH_LEVEL_LABELS` in `utils/lts.ts` carries `short`, `legendTitle`, `description`, `displayDescription`, `defaultColor`, `defaultWeight`. Other surfaces (admin tier defaults, SimpleLegend) derive from it; nothing redeclares hex codes inline.
3. **Never push to main.** Always branch → PR → CI → merge.
4. **Tile cache is the routing graph.** What you see on the overlay IS what the router routes on (modulo the `applyModeRule` accept/reject logic).
5. **Speed IS the penalty.** No arbitrary multipliers in cost. Walking is slow → high cost → router finds detours.
6. **Heal intersection gaps.** Short non-preferred segments between preferred segments adopt the surrounding `itemName` AND `pathLevel` (post-2026-04-28 fix — was just `itemName`, leaving pathLevel stale).
7. **Routing changes require a benchmark.** Per `.claude/rules/routing-changes.md`, edits to `clientRouter.ts`, `modes.ts`, `lts.ts`, `classify.ts`, or `overpass.ts`'s query must run `bun scripts/render-route-comparisons.ts` and commit a `docs/research/YYYY-MM-DD-routing-benchmark-results.md`. Display-only changes (no edge-cost / graph / routes-returned change) are exempt.
8. **One benchmark folder, frozen.** `public/route-compare/2026-04-24-0.1.184-local-5478dd5-dirty/` is pinned to the launch blog post — do not regenerate.
9. **City-agnostic.** Tile fetching, caching, routing, and the benchmark all work for any city, not just Berlin.

## See also

- `docs/process/learnings.md` — non-obvious gotchas worth keeping fresh in mind
- `docs/research/2026-04-24-findnearestnode-reachability-fix.md` — diagnosis and benchmark for the `findNearestNode` directed-reachability fix (client router went 77% → 100% success)
- `docs/research/2026-04-25-ux-review-prod-walkthrough.md` — pre-launch UX walkthrough findings + triage
- `docs/research/family-safety/` — research backing the LTS framework, mode rules, and city profiles
