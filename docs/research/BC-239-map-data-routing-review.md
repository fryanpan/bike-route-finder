# BC-239: Map Data Sources & Routing Layer Review

*Reviewed: 2026-04-01*

---

## 1. Data Sources

### Primary: OpenStreetMap (OSM)
The **sole map data source** is OpenStreetMap. Berlin data is sourced from:
- **Geofabrik Berlin extract**: https://download.geofabrik.de/europe/germany/berlin.html
- **Update cadence**: Monthly (per architecture decision 2026-03-31)

### Three OSM services are used:

| Service | URL | Purpose |
|---------|-----|---------|
| **Valhalla** (public OSM instance) | `valhalla1.openstreetmap.de` | Route calculation + per-edge attributes |
| **Overpass API** | `overpass-api.de` | Map overlay: bike infrastructure visualization |
| **Nominatim** | `nominatim.openstreetmap.org` | Geocoding / address search |

**Important**: The project currently uses the **public shared Valhalla instance** (`valhalla1.openstreetmap.de`) — not a self-hosted instance. This means data freshness is not directly controlled by the project and depends on that server's update schedule.

---

## 2. Routing Engine: Valhalla

Valhalla is used with the `bicycle` costing mode. Three rider profiles are defined:

| Profile | `use_roads` | `avoid_bad_surfaces` | `use_hills` | Bike Type |
|---------|-------------|----------------------|-------------|-----------|
| Toddler | 0.0 (avoid roads entirely) | 0.5 | 0.1 | Hybrid |
| Bike Trailer | 0.15 | 0.5 | 0.15 | Hybrid |
| Fast Training | 0.6 | 0.4 | 0.9 | Road |

### Edge attributes available to routing logic (via `trace_attributes`)

| Field | Values | Meaning |
|-------|--------|---------|
| `edge.use` | 0=road, 18=living_street, 20=cycleway, 25=path | Way type |
| `edge.cycle_lane` | 0=none, 1=sharrow, 2=painted, 3=separated, 4=share_busway | Bike lane type |
| `edge.road_class` | 0=motorway … 4=tertiary, 5=unclassified, 6=residential, 7=service | Road hierarchy |
| `edge.bicycle_road` | true/false | Fahrradstrasse (`bicycle_road=yes` in OSM) |
| `edge.bicycle_network` | 0=none, 1=national, 2=regional, 4=local | Network membership |
| `edge.surface` | `asphalt`, `cobblestone`, `compacted`, etc. | Surface type |

---

## 3. Path Type Analysis

### Berlin-Specific Path Types

#### ✅ Mauerweg (separate recreational path)
- **OSM tags**: `highway=cycleway` (dedicated cycle track)
- **Valhalla**: `edge.use = 20` (cycleway) or `25` (path)
- **Classification**: **GREAT** for all profiles
- **Status**: Fully supported. Berlin's Mauerweg is well-mapped in OSM.

#### ✅ Elevated bikeway beside sidewalk (Hochbordradweg)
- **OSM tags**: `cycleway=track` on the road way, or separate `highway=cycleway` way
- **Valhalla**: `edge.cycle_lane = 3` (separated)
- **Classification**: **GOOD** for all profiles
- **Status**: Well supported. The `cycleway=track` tag maps directly to the "separated" classification.

#### ✅ Bike lane beside car traffic, no separation (painted line)
- **OSM tags**: `cycleway=lane`
- **Valhalla**: `edge.cycle_lane = 2` (dedicated/painted)
- **Classification**:
  - Toddler: **AVOID** ("no better than a road without a bike path")
  - Trailer/Training: **OK**
- **Status**: Correctly handled with profile-aware logic.

#### ✅ Bike lane beside car traffic WITH separation (bollards/bumpers)
- **OSM tags**: Typically `cycleway=track`, sometimes `cycleway=lane` + `cycleway:separation=flex_post` or `cycleway:buffer=*`
- **Valhalla**: `edge.cycle_lane = 3` if tagged as track, `2` if tagged as lane
- **Overlay classification**: **GOOD** — `overpass.ts` now checks `cycleway:separation` tags and upgrades `cycleway=lane` + separation to `'good'`
- **Route classification**: Remains **OK** (or AVOID for toddler) because Valhalla `cycle_lane=2` does not expose separation tags — see remaining gaps below
- **Status**: Partially fixed. Map overlay is correct; route segment coloring is limited by Valhalla API.

#### ✅ Fahrradstrasse (bicycle priority roads, cars must defer)
- **OSM tags**: `bicycle_road=yes`
- **Valhalla**: `edge.bicycle_road = true`
- **Classification**: **GREAT** for all profiles
- **Important fix**: Earlier code incorrectly used `edge.bicycle_network` (which tracks NCN/RCN/LCN route memberships) instead of `edge.bicycle_road`. Most Berlin Fahrradstrassen are NOT in a named cycling network, so they were misclassified. This is now corrected.
- **Status**: Correctly handled. `use_living_streets: 1.0` on toddler profile also strongly incentivizes Valhalla to prefer these roads during routing.

#### ✅ Dirt paths in parks (e.g., Engeldam)
- **OSM tags**: `highway=path` with `surface=dirt` or `surface=compacted`
- **Valhalla**: `edge.use = 25` (path)
- **Classification**: **GREAT** (use=25 → great), no surface penalty for `dirt`/`compacted` since those are not in the `BAD_SURFACES` set
- **Status**: Accessible and correctly routed. The `avoid_bad_surfaces=0.5` setting was specifically calibrated (2026-04-01 decision) to avoid cobblestones (surface quality ~0.3) while allowing compacted/dirt park paths (quality ~0.7–0.9).
- **Note**: The Engeldam route (Dresdener Str → Schillingbrücke) was confirmed to use the park dirt path correctly after this calibration.

#### ✅ Paved paths in parks
- **OSM tags**: `highway=path` or `highway=cycleway` with `surface=asphalt` or `surface=paving_stones:smooth`
- **Valhalla**: `edge.use = 20` or `25`
- **Classification**: **GREAT** for all profiles
- **Status**: Fully supported. Smooth surfaces, no penalty.

#### ✅ Dirt paths along canals and rivers (e.g., Spree, Teltow Canal)
- **OSM tags**: `highway=path` with `surface=compacted` or `surface=fine_gravel`
- **Classification**: **GREAT** base; `fine_gravel` is not in BAD_SURFACES so no penalty
- **Status**: Generally accessible. `gravel` IS in classify.ts BAD_SURFACES (one class worse), but `fine_gravel` and `compacted` are not.

#### ✅ Highways (Autobahn, trunk roads)
- **OSM tags**: `highway=motorway`, `highway=trunk`
- **Valhalla**: `edge.road_class = 0` or `1`
- **Classification**: **AVOID** for all profiles (road_class < 4 → avoid)
- **Status**: Correctly excluded from all routes.

#### ✅ Multi-lane stroads (Hauptstraßen)
- **OSM tags**: `highway=primary`, `highway=secondary` (often without protected bike infra)
- **Valhalla**: `edge.road_class = 2` or `3`
- **Classification**: **AVOID** for all profiles (road_class < 4 → avoid in base case)
- **Status**: Correctly handled. If a stroad has `cycleway=track`, it would be classified as GOOD (the track, not the road itself).

#### ✅ Quieter residential streets (Nebenstraßen)
- **OSM tags**: `highway=residential`, `highway=service`
- **Valhalla**: `edge.road_class = 6` or `7`
- **Classification**: **ACCEPTABLE** for all profiles
- **Status**: Well handled. With `use_roads=0.0`, toddler profile will strongly prefer to avoid even residential streets if a cycle path alternative exists.

---

## 4. Data Completeness & Currency for Berlin

### What's well-covered in Berlin OSM
- **Fahrradstrassen**: Berlin has ~100+ designated Fahrradstrassen; OSM coverage is comprehensive
- **Cycleway tracks/lanes**: Berlin's main arterials (Bergmannstr, Oranienstr, etc.) are well mapped
- **Park paths**: Tiergarten, Volkspark Friedrichshain, Treptower Park, Tempelhof paths are mapped
- **Canal paths**: Spree, Landwehrkanal, Teltowkanal towpaths are mapped
- **Mauerweg**: Fully mapped as a named long-distance cycle route

### Data currency caveats
- **Monthly updates** from Geofabrik are planned, but the **public Valhalla instance** has its own update schedule (not controlled by this project)
- New construction (e.g., newly-painted lanes or new Fahrradstrassen) may lag by weeks/months
- Surface quality tags (`surface=*`) are not always kept up-to-date by contributors
- The `cycleway:separation` and `cycleway:buffer` tags (fine-grained protection) are sparsely applied in Berlin OSM compared to the `cycleway=track/lane` primary tags

---

## 5. What Data Is Available to the Routing Engine

### Valhalla has access to (used in costing):
| Available | Used in routing | Used in display |
|-----------|----------------|-----------------|
| `edge.use` (cycleway/path/road) | ✅ Yes (via costing) | ✅ Yes (classifyEdge) |
| `edge.cycle_lane` (none/sharrow/painted/separated/busway) | ✅ Yes | ✅ Yes |
| `edge.road_class` (motorway→service) | ✅ Yes | ✅ Yes |
| `edge.bicycle_road` (Fahrradstrasse) | ✅ Yes (`use_living_streets`) | ✅ Yes |
| `edge.surface` (asphalt/cobblestone/etc.) | ✅ Yes (`avoid_bad_surfaces`) | ✅ Yes |
| `edge.bicycle_network` (NCN/RCN/LCN) | ❌ Not in routing cost | ❌ Not used in display |
| `cycleway:separation`, `cycleway:buffer` | ❌ Not exposed by Valhalla API | ❌ Not used |
| `maxspeed` | ✅ Yes (internal to Valhalla) | ❌ Not in our display |
| `incline`/`smoothness` tags | ✅ Partial (via `avoid_bad_surfaces`) | ❌ Not in our display |

### Overpass map overlay has access to:
The overlay queries these tags directly from OSM (updated 2026-04-01):
- `highway=cycleway`
- `bicycle_road=yes`
- `cycleway=track/lane/opposite_track/opposite_lane/share_busway`
- `highway=living_street`
- `highway=residential` (where `bicycle!=no`)
- `highway=path` (where `bicycle!=no`) — park/canal/river paths
- `highway=footway` (where `bicycle~yes|designated`) — shared foot+bike paths
- `highway=track` (where `bicycle!=no`) — dirt/gravel tracks
- `cycleway:right/left/both=track` — directional separated lanes
- `cycleway:right/left/both=lane` — directional painted lanes
- Separation awareness: `cycleway:separation`, `cycleway:right:separation`, `cycleway:left:separation`, `cycleway:both:separation`, `cycleway:buffer`

---

## 6. Gaps & Status

### ✅ Fixed gaps (BC-239 implementation, 2026-04-01):

1. **BAD_SURFACES inconsistency** — FIXED: `overpass.ts` BAD_SURFACES now includes `gravel` and `unpaved`, matching `classify.ts`. Map overlay and route coloring are now consistent for these surfaces.

2. **Missing path types in overlay** — FIXED: Added `highway=path`, `highway=footway` (with bicycle access), `highway=track` (with bicycle access), and directional `cycleway:right/left/both=track/lane` to the Overpass query. Park paths, canal towpaths, and gravel tracks now appear in the map overlay.

3. **Separation quality not granular (overlay)** — FIXED in overlay: `overpass.ts` now checks `cycleway:separation` (`flex_post`, `separation_kerb`, `guard_rail`), `cycleway:buffer`, and the directional variants (`cycleway:right:separation`, etc.). A `cycleway=lane` with physical separation is now classified as `'good'` instead of `'ok'`/`'avoid'`.

4. **Cycleway on footway missing from overlay** — FIXED: `highway=footway` with `bicycle~yes|designated` is now in the Overpass query, classified as `'great'`.

### Remaining gaps (cannot be fixed in code):

1. **Valhalla does not expose `cycleway:separation` tags**: The public Valhalla instance's `edge` attributes only expose `cycle_lane` (0–4). A painted lane always maps to `cycle_lane=2` regardless of whether it has bollards or a buffer. The route coloring in `classify.ts` therefore cannot distinguish a plain painted lane from a bollard-protected one. This is a Valhalla API limitation — `cycleway:separation` is not part of Valhalla's edge schema. The map overlay (`overpass.ts`) DOES check these tags since it has direct OSM access; only route-segment coloring is affected.

2. **`avoid_bad_surfaces` is a blunt instrument**: Valhalla's `avoid_bad_surfaces` costing parameter penalises rough surfaces globally, but cannot distinguish `cobblestone` (impassable for trailers) from rough `compacted` (rideable). The calibrated value of `0.5` is a best-effort compromise. At the display level, `classify.ts` applies the `BAD_SURFACES` penalty post-routing, which gives finer control for display but does not change the route itself.

3. **No time-of-day routing**: Residential streets are rated ACCEPTABLE at all times. A quiet residential at 8am weekday is meaningfully different from the same street at rush hour. Time-of-day routing is planned for Phase 2.

4. **Data freshness depends on public Valhalla instance**: This project uses `valhalla1.openstreetmap.de`. That server's OSM data update schedule is not controlled by the project. Newly built infrastructure (new Fahrradstrassen, newly painted lanes) may lag weeks to months in routing results, even if the Overpass overlay (queried fresh each time) shows them correctly. Consider self-hosting Valhalla for production.
