# Existing Tools Research

Source: Notion doc "Bicycle Route Mapping Solution"

## Official Maps

### 1. InfraVelo Projektkarte ★ Best official map
- URL: https://www.infravelo.de/karte/
- **Description**: Official Berlin bike infrastructure map
- **Features**:
  - Toggle layers for: Fahrradstraßen, protected bike lanes, structurally separated paths
  - Filter by completed vs. planned infrastructure
  - Shows all 24 new Fahrradstraßen being added in Mitte
- **Bryan's Assessment**:
  - ✅ Has decent data for separated bike paths and Fahrradstrasse
  - ✅ Can save a bookmark to a view with only relevant layers enabled
  - ❌ UX is hard to use (very cluttered and hard to read), makes manual routefinding difficult
  - ❌ Has no routefinding of its own
  - ❌ No ability to consider additional characteristics (e.g., quiet streets at certain times)
  - ❌ Doesn't help connect gaps in the network

### 2. CyclOSM
- URL: https://www.cyclosm.org/#map=13/52.5200/13.4050/cyclosm
- **Description**: OpenStreetMap rendering specifically for cyclists
- **Features**:
  - Color-codes: separated tracks vs painted lanes vs shared roads
  - Shows surface types (useful for avoiding cobblestones with trailer)
- **Bryan's Assessment**:
  - ✅ Has a ton of data
  - ❌ Essentially unusable in the form above
  - ❌ Too many layers with colors that are too similar
  - ❌ Has no automated route finding

### 3. BBBike Route Planner
- URL: https://www.bbbike.org/Berlin/
- **Description**: Bike-friendly route planner
- **Features**:
  - Enter start/end points to find safe routes that favor cycling infrastructure
- **Bryan's Assessment**:
  - ❌ Has no map functionality
  - ❌ Gives a giant list of routes with no confidence it's done something reasonable
  - ❌ Virtually unusable — looks like a tool from 20+ years ago missing all key modern expectations
  - ❌ Worse than using Mapquest print-yourself maps from the 90s
  - ⚠️  But maybe the underlying logic is decent?

### 4. ADFC Berlin on Komoot
- URL: https://www.komoot.com/de-de/user/adfcberlin
- **Description**: ADFC (German Cycling Club) publishes curated family-friendly collections
- **Features**:
  - Turn-by-turn navigation in mobile app
  - Free to follow; paid for offline maps and GPX export
- **Bryan's Assessment**:
  - ❌ Didn't find family-friendly collections?

### 5. ADFC Fahrradplan Berlin (Paper Map)
- **Description**: Physical paper map (~€6.90)
- **Where**: ADFC shop, Brunnenstraße 28, Berlin
- **Features**:
  - Color-codes every street by cycling suitability
  - Laminated, waterproof versions available
- **Bryan's Question**: Is there a PDF online available somewhere?

## Recommended Workflow (from Notion)

1. Use **InfraVelo** to browse official infrastructure and identify safe corridors
2. Use **CyclOSM** to check surface details and confirm separated paths
3. Use **BBBike** to plan specific A→B routes
4. Follow **ADFC on Komoot** for pre-made family routes
5. Buy **ADFC paper map** for overview and offline reference

## Optional: Custom uMap

- URL: https://umap.openstreetmap.fr/
- **Description**: Free, open-source map builder using OpenStreetMap
- **Use cases**:
  - Consolidate documented routes on one shareable map
  - Add personal field notes and photos from trips
  - Mark favorite stops (playgrounds, cafés, ice cream shops)

### Overpass Turbo Query for Fahrradstraße

```
[out:json][timeout:25];
area["name"="Berlin"]->.a;
(
  way["bicycle_road"="yes"](area.a);
);
out geom;
```

Run at https://overpass-turbo.eu/, export as GeoJSON, import to uMap

## Bike Citizens (added 2026-04-18)

Austrian bike-nav app (Graz/Vienna). The closest product-shape match
to family-bike-map — urban, OSM-based, safety-biased routing. Same
general shape, different target audience: they build for adult
commuters, we build for families.

- **URLs**: https://www.bikecitizens.net/ · https://apps.apple.com/us/app/bike-citizens-cycling-app-gps/id517332958 · https://wiki.openstreetmap.org/wiki/Bike_Citizens · https://road.cc/content/tech-news/228201-cycling-app-week-bike-citizens
- **Founded**: 2011 as BikeCityGuide, launched iOS April 2012
- **Platform**: iOS, Android, web planner at `map.bikecitizens.net`
- **Pricing**: Free tier (multi-stop + voice nav + 7km offline radius). Premium $3.49/mo or $27.99/yr (global + wider offline + more customization). Quirky "Cycle to Free" unlock: 100km in a city over 30 days unlocks its guide.
- **Coverage**: ~450 cities, strongest in DACH (Austria + Germany, all German cities >100k pop). Partial EU, AU, US. **No Canada.** US reviewers consistently complain routing is thin or "useless" there.

### Routing engine + data model
- OSM-based. Routes contribute back to OSM upstream (no private overlay for errors).
- Three named profiles — **Comfortable** (prioritizes cycle infra + residential, accepts detours to dodge busy roads), **Normal** (balanced), **Fast** (experienced rider, OK sharing lanes with cars).
- Additional knobs: bike type (city / MTB / road / e-bike), asphalt-only, avoid tram tracks.
- Point-to-point with multi-stop waypoints. **No scenic / discovery / reachability mode.**
- Exact routing engine not publicly disclosed (not OSRM/Valhalla/BRouter/GraphHopper per name); OSM wiki lists Python/Java/C/C++ as their stack.

### Family / kid features
- **None.** Nothing in FAQ, App Store listing, or government-facing materials mentions kids, family mode, child seats, or cargo-bike-with-child.
- Closest adjacency: **Bike2School** program sold to cities (Dortmund, Hannover) — gamified tracking/challenge app, not a routing mode.
- **This is the positioning gap for family-bike-map to exploit.**

### Crowdsourcing
- Map errors go upstream to OSM. Slow, generic, doesn't re-enter the classifier.
- **PING** is a structured cyclist-to-city feedback tool, but PING reports flow to municipal dashboards, not back into routing cost.
- Anonymized GPS heatmaps are sold to cities as a planning analytics product, not exposed as a routing signal.

### Known complaints (from reviews)
- US/Canada coverage is thin. Multiple "useless" reviews.
- Occasional bad turns (parking lots, wrong directional commands).
- London rider reported awkward intersections / dog-legs.
- One experienced rider: "like Strava heatmaps" — fine for 15-20 mph city riding, wrong for sport.
- Value-for-money pushback on the subscription tier.
- App Store rating: 4.5/5 (149 reviews); JustUseApp safety score 62.9/100 (145 reviews).

### What matters for family-bike-map positioning

1. **Three profiles, zero for kids.** "Comfortable" is pitched at adult commuters who prefer less stress, not at a parent shepherding a 5-year-old. Our kid-starting-out / kid-confident / kid-traffic-savvy hierarchy is genuinely differentiated.
2. **Crowdsourcing is their strategic weakness.** Errors go to OSM (slow). PING is municipality-facing (doesn't touch routing). If we close a tight loop where parents flag a segment and it shifts routing within days, that's a real moat.
3. **Heatmaps are their discovery story.** A family-filtered heatmap ("show me where other families ride") would be a natural product extension — they don't filter heatmaps by rider type.
4. **North America is wide open.** Their US/Canada gap is the loudest review complaint. SF is not a Bike Citizens stronghold.
5. **DACH-local tags are implied but not documented.** "Comfortable" clearly preferences Fahrradstraße but the granularity of their classifier (bikePriority vs. carFree) is not public. If we publish ours, that's technical credibility.

### Unverified
- Exact routing engine.
- Whether Fahrradstraße gets a dedicated cost bucket vs. generic "bike infrastructure."
- Whether PING feedback ever closes the loop into live routing.

## Gap Analysis

### What Exists
- Comprehensive infrastructure data (OSM, InfraVelo)
- Basic bike routing (BBBike)
- Curated routes (Komoot/ADFC)
- Visual infrastructure maps (CyclOSM, InfraVelo)

### What's Missing
- **Usable routing UI**: BBBike is outdated, InfraVelo/CyclOSM have no routing
- **Granular preferences**: Can't specify priority order (Fahrradstrasse > separated > quiet streets)
- **Rider profiles**: No distinction between "solo adult" vs "with kids"
- **Gap filling**: No help connecting network gaps with acceptable alternatives
- **Time-aware routing**: Can't specify time-of-day preferences
- **Feedback loop**: Routes don't improve based on user experience
- **Route tweaking**: Can't manually adjust suggested routes and provide feedback
