# Joanna — user research notes

> Source: 20-min chat with Bryan, 2026-04-29
> Status: live capture, edit freely

## Who she is

- Joanna is the life partner boo
- Bike advocate in San Francisco/California
- We both use bikes as our primary mode of transportation (along with public transit and ferries)
- Used to biking a lot in San Francisco and Berlin (and a few other cities) 
- Fairly confident biker (but less than Bryan boo) Is okay with LTS 3 infra for shorter spurts, but prefers more separation and risk than Bryan boo does
- Has gone on 100mi plus bike rides (e.g. on Highway 1)
- And we've gone together on training rides and ride around Tahoe in the last year 

## Use Cases

- With whom (kid age, riding behind / in front, trailer, etc.): Riding by herself (multiple times a day usually, in SF and Berlin)Riding with Beatrix biking (somewhat often -- maybe once a week)Riding carrying Beatrix (more often -- multiple times a week, especially in Berlin)
- Routine errands (school run, daycare, groceries, …): All of the above and more -- school/daycare, groceries, restaurants, shops, work meetings, hanging out with friends
- One-off / weekend trips: Weekend expeditions to longer bike paths with BeaWhere she can bike herself part of the way, and go in the trailer part of the wayAnd we have the option sometimes of using the train or ferry to go farther away Bike camping

## Use Case 1: Help Plan Route to a Destination 

- Streets to use depend on riding profile (see below)
- In Berlin, Joanna has a map in her head of where the bike corridors are (from 2019 and earlier)But she's less familiar with newer infrastructure quality (e.g. Fahrradstrasse, living streets, separated bikelanes on Kotbusser Damm that are new)
- Wants a quick way to see a overview map that makes it easy for her to plan a route quickly Wants **loading time to be sub-second when she comes back to app**Most important to be able to load the map in < 1 second the second time and beyondSo that when Joanna needs the map, it's there.She gets this with Google Maps, or with a PDF**Initial load taking 5-10s to cache is OK **(with clear loading indicators or good hiding of latency)Does not care about route compute right now -- it's too complicated and not neededDitto with live voice navigationStarts by figuring out where she is now and where the destination isWants to be able to zoom out and get overview and be able to see both the city and general major bike corridorsShe commented that the current OpenStreetMap layers are hard to readAnd doesn't scale very well to be readable at different zoom levelsAnd Google Maps is a lot better, and would prefer to have a Google Maps base layer since it scales well and is easily readable at different zoom levels, with the right detail [🤖 Q: "Google" specifically, or "any base layer that scales"? Google Maps tiles aren't licensable for an OSS overlay like ours; Mapbox / MapTiler / Stadia are the realistic options. If the requirement is legibility-not-OSM-Carto, we have many options. If it's literally Google, we'd need a different commercial path.]Bryan's answer - OK -- we'll need to research and see what's workableCommercial is OK, since this is a personal project with only a few users so farEven a **PDF map **would be fine for this, since if it's vector basedIt'll be highly readable at different zoom levelsOr even **multiple PDF maps** by neighborhood in BerlinHighlight infrastructure so it's **immediately easy to see what's high quality** (route quality rankings for Joanna are below)Current map doesn't do this properly for kids (see below)It groups Protected Bike Lanes (she calls them PBLs, the standard term) like Kotbusser Damm which have many high traffic intersections to contend with that are high stress as car-free which is wrong.  Suggestion -- move PBLs into the same category as a bike route beside cars [🤖 Q: this is a real tier shift — currently we tag separated bike lanes as 1a (car-free / dark green). Joanna's argument is intersection-frequency, not segment-level separation. Two ways we could do it: (a) reclassify ALL OSM-tagged separated bike lanes down to 2a, simple but loses real-world quality variation, or (b) add an intersection-density penalty so PBLs near big junctions demote themselves while quiet PBLs (e.g. canal-side) stay 1a. (b) is more work but matches her actual mental model. Want me to write it up as a proposal?] (e.g. shared bus lane, painted bike lane with quiet streets all have about as many traffic interactions as a well built PBL on a busier street like Kotbusser Damm (which protects you from traffic interactions most of the time, but you have more interactions to deal with near an intersection and that means extra stress)Yeah, I think moving PBLs on busier / bigger streets to LTS 2a is goode.g. Kotbusser Damm, Hasenheide both fit this categoryI noted (this is Bryan) that from my personal experience, Hasenheide also wasn't great for Bea at the intersections, even though the long segments between intersections was fine.  At intersections, the protection stopped and we had to deal with cars and complexity[🤖 Q: this comment + the trailer/pedestrian-conflict comment + the cobblestone-block-count comment all point at the same gap: we score per-edge, but real stress is also a function of intersections, surface continuity, and trailer-width usability. Worth a future pass that adds a "context layer" to scoring (intersection density, pedestrian-mix, surface-roughness contiguity)? Filing the question — not asking for an answer right now, just want to make sure I capture the pattern.]Right, there's a mix of other factors to consider and we need to think about which ones are more universal (or we go towards more personalized maps)?  Which ones have complete enough data to do that type of classification?Worth discussing which ones meet the bar to implementI think LTS has some rules around intersections that might be useful to bring inAnd number and complexity of intersections should affect route qualityAnd also definitely affects travel time (having to cross two streets at a major intersection with slow traffic lights that each take 1 minute or more takes a lot longer than a fast, minor intersection)Wants to be able to look at the map from start to destination and make a general plan that she can hold in her head and not have to look at a bike map or interact with turn by turnFewer turns is good so she can hold the information in her headWants to know where the major landmarks are to orient herself while finding and then remembering the pathBeing able to zoom in and figure out specific streets near areas with gaps is goodOver time, also suggested that personal feedback might be helpful to e.g. her personal feedback of what was actually good or not goodLess useful for her on that specific street -- she usually remembers the good stuff once she sees itBut maybe useful to help tweak how other streets are displayed or ranked over timeThis type of personal feedback (whether explicit, or from people avoiding a street) could also be used to give municipalities more data on what parts of the bike network work or don't work

## Infrastructure Quality

- Joanna cares also about how much traffic stress a route introduces
- She cares less than Bryan about cobblestones -- a block along a route is not a big issue, but would avoid doing multiple blocks. Would like a better way to know that the cobblestones are there, but they shouldn't pop out on a map (i.e. be visible if you're looking at trying to go through a particular street, but shouldn't stand out in the overall map)
- Here's how she'd rank infrastructure (for kids) Car-free paths with almost no traffic interactionMulti-use paths in parksBikeways that are car freeBike priority infrastructure is niceFahrradstrassenLiving streetsElevated sidewalk bike pathsThese are OK for kids -- separated and minimal car interactionsBut often require taking more care to avoid pedestrian interactionsThe tree roots and narrowness don't work as well for going higher speeds (e.g. with trailer)So with trailer, would demote these further down Fully separated bike lanes on streets with traffice.g. Kotbusser Damm is okay, but wouldn't take Bea there.Even though the separated parts are okay, there's a lot of intersections with traffic interactions and those parts are not as fully separated.Should only be included in the kid traffic-savvy modeSidewalks are okay with Beatrix, if needed but not idealEverything else beneath that is not useful for kidsAnd not priority enough to show or consider for her

## Solutions

> Top unmet needs from Joanna's chat, prioritized by estimated user value, with proposed solution options.

| #   | Need                                                         | Value  | Decision + plan                                             |
| --- | ------------------------------------------------------------ | ------ | ------------------------------------------------------------ |
| 1   | Sub-second map load on return visit (initial 5–10s OK)       | High   | **Green-lit.** Simplest path that hits the goal: service-worker offline-first for tiles + the overlay snapshot, with IndexedDB stale-while-revalidate underneath. Offline is a free byproduct (Bryan: "nice bonus"). |
| 2   | Base map that stays legible at all zoom levels               | High   | **Pivoted (Bryan, 2026-04-29):** make map rendering pluggable via a `MapEngine` interface, ship 3 engines: (a) **Leaflet + OSM Carto** (existing), (b) **Leaflet + MapTiler "Streets v2 light"** (drop-in raster swap), (c) **Google Maps JavaScript API** (allowed for overlay use case — only Tile-API + Leaflet combo is forbidden by Google ToS). User picks via Admin Settings. Engine abstraction must cover BOTH base tiles AND overlay/route polyline rendering so the same rider sees consistent rendering across modes. |
| 3   | High-stress PBLs (Kotbusser Damm, Hasenheide, Valencia) shouldn't render as 1a car-free | High   | **Green-lit. Global rule.** Classifier rule in `classifyEdge`: separated cycleway tag + parent highway in {primary, secondary, tertiary} + speed > 30 km/h → demote to 2a. Test against Berlin (Kotbusser Damm, Hasenheide) AND SF (Valencia). Validate via routing benchmark before shipping. |
| 4   | Intersection density / complexity should affect route quality and time | Medium | **Green-lit. Ship narrow first cut:** the unsignalized-major-road penalty (+50s and ×2 cost when entering a node with no signal where the crossed edge is primary/trunk ≥ 50 km/h). Implementation lives in `buildRoutingGraph`, not `classifyEdge`. See "Research" section below for the full Furth-anchored framework + defer pile. |
| 5a  | Carrying-kid (trailer) should demote elevated sidewalk paths (pedestrian conflicts + tree roots) | Medium | **Green-lit.** `PROFILE_LEGEND['carrying-kid']`: move "Elevated sidewalk path" out of the preferred 1a group into non-preferred. Joanna's explicit ask. |
| 5b  | Training mode picks low-quality routes when good ones exist (Rudower investigation) | Medium | **Revised after Bryan's review.** Original guess (promote elevated sidewalk for training) **rejected** — Bryan: "elevated sidewalks cannot be used for fast training rides — tree roots, pedestrians, narrow paths, slow-biker dodging at 25–30 km/h." **Real fix:** training's `MODE_RULE` has *empty* `levelMultipliers`, so accepted levels 1a–3 all cost the same per km — A* picks shortest, ignoring tier quality. Add `levelMultipliers: { '3': 1.5, '2b': 1.2 }` to training so a 1.5km bike-path detour beats a 1km major-road segment. (Mirror of how kid-confident already nudges away from worse infra.) |
| 6   | Cobblestones visible when looking at a specific street, suppressed at city overview | Low    | Zoom-keyed visibility rule in `BikeMapOverlay`: cobble marker shown at zoom ≥ 16 or when on the selected route; hidden otherwise. |
| 7   | Personal feedback signal (good/bad streets, aggregated for municipalities) | Defer  | Park until ≥10 active users. v2 product surface. |
| 8   | Mobile tap targets too thin to hit reliably — viewing a street's info is hard on phone | High   | **Green-lit (Bryan, 2026-04-29).** Add a transparent wider hit polyline (~24px weight) layered over each visible polyline in both modes — overlay (`BikeMapOverlay`) and route segments (`Map.tsx`'s `RouteDisplay`). Visible weight unchanged; tap area widens. Same trick for both raster route polylines and canvas overlay polylines. |

## Research: intersection-stress scoring (#4)

> Source: in-depth research agent, 2026-04-29. Anchored to Furth's Mineta-Berkeley LTS framework.

### Furth's intersection rules
- **Route LTS = max of segment LTS *and* approach LTS.** A green corridor with one LTS-4 crossing is an LTS-4 route. (Mekuria/Furth/Nixon §3.)
- **Approach LTS** keys off the *crossed* street: number of through lanes + speed + presence of signal. 1–2 lanes ≤ 35 mph at a signal = LTS 1; 4+ lanes ≥ 35 mph unsignalized = LTS 4.
- **Unsignalized-crossing penalty is the headline rule.** Furth Table 1: an unsignalized crossing of a multi-lane higher-speed road bumps experienced LTS by 1–2 tiers vs. a signal/beacon. Signals largely neutralize lane-count stress up to ~4 lanes.
- Mixing-zone / right-hook conflicts add 1 tier — out of scope for OSM-only data.

### OSM data we can use today

| Signal | Berlin completeness | SF completeness | Usable now? |
|---|---|---|---|
| `highway=traffic_signals` on intersection node | High (~80–90% inner-city) | Moderate (~50–70%; SFMTA signals routinely missing) | **Yes** — highest-leverage bit |
| `crossing=traffic_signals` / `marked` / `unmarked` | Moderate (~60% on cycleway crossings) | Low (~30–40%) | **Yes for Berlin**, weak in SF |
| `highway=stop` / `give_way` | Low (~20%) | Very low (<15%) | **No** — too sparse |
| Adjacent-edge complexity (node degree, distinct highway-class edges meeting) | Computed from graph; high tagging | High | **Yes** — derived, no tag dependency |
| Crossed-road class & speed (read from the *other* edge at the node) | High for class, medium maxspeed | High for class, medium maxspeed | **Yes** |
| `crossing:island=yes` / `traffic_calming=*` | Sparse | Sparse | **No** |
| Per-light wait time / signal cycle | Not in OSM | Not in OSM | **No** |

### Smallest viable implementation
Add **node-level approach-stress costs** in `buildRoutingGraph` (`src/services/clientRouter.ts`). Extend `EdgeData` with `approachPenaltyS: number`; compute the penalty per *destination* node from the node's incident edges (one extra pass before the routing loop). Penalty seconds:

- **0s** if degree ≤ 2 (mid-way node) or all neighbors are bike-only paths
- **+8s** if `traffic_signals` present and crossed road is ≤ secondary
- **+25s** if no signal and crossed edge is tertiary/secondary/primary at maxspeed ≥ 40 km/h
- **+50s and `costMultiplier ×= 2`** if no signal AND crossed road is primary/trunk ≥ 50 km/h — the Hasenheide-onto-Hermannplatz case

Magnitudes calibrated so a 25 s penalty ≈ 100 m detour at kid-confident's 16 km/h. Computation is `O(V+E)` per `buildRoutingGraph` call. **No change to `classifyEdge`** — the per-edge classifier stays simple; intersection logic lives in graph construction where node context exists.

### Defer pile
Per-light wait times, time-of-day variation, mixing-zone geometry, individual rider stress thresholds, turn-conflict detection, pedestrian-island presence. Joanna's "wait at slow lights affects travel time" lands here — real effect, but needs per-light timing OSM doesn't carry. A future Layer 2 region overlay could let cities mark named bad junctions (`Hermannplatz`, `Kottbusser Tor`, `Market & Octavia`) as fixed +60s penalties, similar to how named corridors get demoted today.

### Recommended next step
Implement only the unsignalized-major-road penalty (the +50s / ×2 case) as a one-spot edit in `buildRoutingGraph`, then run `bun scripts/benchmark-routing.ts` — expect kid-confident routes through Kreuzberg to detour off the Hasenheide/Gneisenaustraße corner toward Bergmannstraße, with avg-preferred-% rising 2–4pp without dropping routes-found.

## Followups / tickets

### TICKET: training mode under-uses preferred infrastructure on Brandenburg Gate → Rudower Ch 12

**Status:** investigated 2026-04-29. Root cause identified.

**Repro:** `bun scripts/debug-rudower-ch.ts`. Original ran with start = Brandenburg Gate (saved Home in localStorage); Bryan corrected — actual start is **Dresdener Str 112, Kreuzberg (~52.502, 13.435)**. Re-run with the corrected start before merging the routing fix.

**Findings (training mode, 19.7 km / 67 min route):**

| Item | Tier | Length | Preferred? |
|---|---|---|---|
| Painted bike lane on major road | 3 | 6.63 km | no |
| Quiet street | 2b | 5.26 km | no |
| Bike path | 1a | 3.23 km | yes |
| (walking) | – | 1.60 km | – |
| Shared use path | 1a | 1.36 km | yes |
| Painted bike lane on quiet street | 2a | 1.09 km | yes |
| Fahrradstrasse / Living street | 1b | 0.51 km | yes |

For comparison kid-traffic-savvy on the same start/end gets 96% preferred (18.32 km on preferred, only 0.10 km other).

**Three issues, distinct fixes:**

1. **Training's `levelMultipliers` is empty — root cause of the bad routing.** Training accepts levels 1a–3 at the *same* speed, so the cost function (`distance/speed`) treats a 1km major-road painted lane and a 1.2km bike path as equivalent. A* picks the shortest. Fix: add `levelMultipliers: { '3': 1.5, '2b': 1.2 }` to training's `MODE_RULE`. (Mirrors kid-confident's nudge.) NOT promoting elevated sidewalks — Bryan ruled that out: tree roots + pedestrians + slow-biker dodging make elevated sidewalks unsuitable for 25–30 km/h training pace.

2. **Kotbusser Damm OSM-tagging gap.** The route DOES use named Kotbusser Damm ways (2/2), but those are tagged `highway=secondary` with empty `cycleway*` fields, so they classify as level-3 "Painted bike lane on major road" and render orange. Bryan confirms the actual infrastructure is parking-separated PBL — high quality. The PBL is likely on a parallel unnamed `highway=cycleway` way alongside; we just can't identify it as "Kotbusser Damm" by name. After fix #1 lands, the routing should naturally pick that cycleway corridor even without a name match. Filed as separate "OSM data quality + parallel-cycleway detection" ticket.

3. **Mauerweg geography corrected.** Original analysis said Mauerweg was off-route. That was wrong. Mauerweg's NORTHERN ways (centroid 52.63°N) are off-route for a SE trip, but Berliner Mauerweg's southern leg through Treptower Park / Plänterwald / Adlershof IS on the corridor. Reason we missed it: in OSM, Berliner Mauerweg is structured as a `route=bicycle` *relation*; individual way segments often don't carry `name=Mauerweg`. Our Overpass query doesn't fetch relations, so we identify Mauerweg ways only by name string. The router likely IS using some southern unnamed Mauerweg ways (training route includes 1.36 km Shared use path + 3.23 km Bike path) — we just can't label them. Filed as separate "fetch route relations in Overpass query" ticket.

**Recommended action:** ship fix #1 (training `levelMultipliers`). File #2 and #3 as separate tickets. Close this ticket once #1 lands and benchmark confirms training preferred-% lifts on the corrected Dresdener-Str → Rudower start/end.
