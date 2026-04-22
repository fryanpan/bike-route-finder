# Path types, travel modes, and OSM mappings

Reference doc — three tables tying the **display categories** (Simple legend tiers), the **per-mode preferences**, and the **raw OSM tags** to each other. Canonical sources: `src/utils/lts.ts`, `src/utils/classify.ts`, `src/services/overpass.ts`, `src/components/SimpleLegend.tsx`.

## 1. Path-type categories (LTS path levels)

The app renders every bike-relevant way using one of six path levels. Levels 1a–3 are derived from Peter Furth's Level of Traffic Stress criteria; 4 is non-rideable.

| Level | Legend title              | Meaning                                                      | Map color             | Line style       | Line weight |
| ----- | ------------------------- | ------------------------------------------------------------ | --------------------- | ---------------- | ----------- |
| 1a    | Car-free                  | Bike paths, shared foot paths, elevated sidewalk paths — no car interaction | deep forest `#004529` | solid            | 0.75×       |
| 1b    | Bikeway with minimal cars | Shared streets engineered for bike priority: Fahrradstraße, living streets, bike boulevards, SF Slow Streets | mid green `#238443`   | solid            | 0.75×       |
| 2a    | Bike route beside cars    | Painted bike lane or shared bus lane on a quiet street (speed ≤ 30 km/h) | blue `#2b8cbe`        | solid            | 0.75×       |
| 2b    | Quiet residential street  | Quiet residential street with no bike infra, speed ≤ 30 km/h.  Separate category because I don’t know how reliably “quiet” these are | pink `#e78ac3`        | solid            | 0.75×       |
| 3     | Higher traffic street     | Streets with speed limit between 30-50kmh, with or without a painted bike lane.  And 3 lanes or less in each direction.This is close to but slightly less nuanced than LTS at the moment | yellow `#ffd92f`      | solid            | 0.75×       |
| 4     | (not shown)               | Primary / trunk / motorway without a protected bike path (higher speeds or more lanes than level 3) | —                     | —                | hidden      |

Rough-surface override: any path whose `surface` tag is in the mode's bad-surface set (cobblestone, gravel, dirt, and for higher-speed modes also paving_stones) **keeps its underlying path level** (1a / 1b / 2a / 2b / 3) and gets a **5× routing cost multiplier** applied on top. Rough-surface paths are **hidden from the overlay** (not shown in discovery mode) but remain in the routing graph, so a route can still traverse them if no better option exists — the 5× multiplier ensures they're used only as a last resort. This decouples "what infrastructure this is" (path level) from "how annoying this is to ride" (surface penalty), and keeps the discovery view focused on paths you'd actually enjoy riding. 

## 2. Travel mode preferences

Each travel mode treats a subset of path levels as preferred. Preferred levels show on the map in tier green (or navy for 2b/3). Non-preferred levels are hidden unless `?showOtherPaths=1`. The legend also only lists a mode's preferred tiers.

| Mode              | 1a  | 1b  | 2a  | 2b  | 3   | Notes                                                        |
| ----------------- | --- | --- | --- | --- | --- | ------------------------------------------------------------ |
| Kid starting out  | yes | —   | —   | —   | —   | Fully car-free only. Fahrradstraßen bridge-walked, not ridden. Default on first launch. |
| Kid confident     | yes | yes | —   | —   | —   | Adds bike-priority shared streets (Fahrradstraße / Living street / Bike boulevard). |
| Kid traffic-savvy | yes | yes | yes | yes | —   | Adds painted lanes on quiet streets AND quiet residential w/o bike infra. 2a + 2b ride at 1.5× cost of 1a/1b. |
| Carrying kid      | yes | yes | yes | yes | —   | Adult pilots. 2a + 2b ride at 1.2× cost of 1a/1b. LTS 3 rejected — most carrying-kid riders strongly avoid higher-traffic infra. |
| Training          | yes | yes | yes | yes | yes | Adult fitness. Accepts any LTS ≤ 3 at full speed (no cost multipliers). |

## 3. Raw OSM tags → path-level → display name

Maps OSM tag combinations (from `classifyEdge`) to a path level and shows the display item name from `classifyOsmTagsToItem`.

| OSM tags                                                     | Key rules                                                    | Path level | Display name                      |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ---------- | --------------------------------- |
| `highway=cycleway`                                           | Dedicated bike path                                          | 1a         | Bike path                         |
| `highway=path` + bike access                                 | Shared use path                                              | 1a         | Shared use path                   |
| `highway=footway` + bike access                              | Shared foot path                                             | 1a         | Shared use path                   |
| `cycleway=track`, `cycleway:*=track`                         | Curb-separated cycle track along a road                      | 1a         | Elevated sidewalk path            |
| `cycleway=lane` + `separation=*`                             | Physically separated lane                                    | 1a         | Elevated sidewalk path            |
| `bicycle_road=yes`, `cyclestreet=yes`                        | Fahrradstraße — bikes have priority                          | 1b         | Fahrradstrasse                    |
| `highway=living_street`                                      | Spielstraße / woonerf — cars-are-guests                      | 1b         | Living street                     |
| `highway=residential` + `motor_vehicle=destination`          | SF Slow Street / bike boulevard — through traffic diverted   | 1b         | Bike boulevard                    |
| `highway=track`                                              | Forest / farm track — motor traffic rare                     | 1a         | Bike path                         |
| `cycleway=lane`, `cycleway:*=lane`, speed ≤ 30               | Painted bike lane on a quiet street                          | 2a         | Painted bike lane on quiet street |
| `cycleway=share_busway`, speed ≤ 30                          | Shared bus lane on a quiet street                            | 2a         | Shared bus lane on quiet street   |
| `cycleway=lane` but speed > 30                               | Painted lane on an arterial (e.g. Köpenicker, Heinrich-Heine) | 3          | Painted bike lane on major road   |
| `highway=residential` without bike infra, speed ≤ 30         | Quiet residential street, no lane / not slow-street          | 2b         | Quiet street                      |
| `highway=unclassified` / `tertiary` without bike infra       | Shared road, bike access permitted                           | 3          | Major road                        |
| `highway=primary` / `trunk` / `motorway` without protected path | Non-rideable for our purposes                                | 4          | (hidden)                          |
| Any of above with bad `surface` tag for the mode             | Reclassified for routing cost; overlay style unchanged       | —          | Rough surface                     |

### Surface handling (binary: rough or not)

One list, same for every mode, used for both overlay-hide and the 5×
routing cost penalty (per 2026-04-23 simplification). Riders experience
these surfaces the same way regardless of mode, so per-mode splitting
was dropped.

**Rough** — hidden from the overlay + 5× routing cost:

| OSM `surface=*` | Why rough |
|---|---|
| `mud` | Wet/soft, often unrideable |
| `sand` | Wheels sink |
| `grass` | Soft and slow |
| `gravel` | Coarse loose stones, bumpy |
| `pebblestone` | Small round pebbles, very loose |
| `woodchips` | Loose wood chips, slow and shifting |
| `cobblestone` | Rounded stones, classic bumpy European pavement |
| `unhewn_cobblestone` | Raw-cut cobbles, bumpiest variant |
| `cobblestone:flattened` | Flattened cobbles, still bumpy |
| `sett` | Cut stone blocks, less bumpy than cobblestone but still rough |

Plus any way tagged `smoothness=bad` / `very_bad` / `horrible` /
`very_horrible` / `impassable` is treated as rough regardless of
surface tag.

**Not rough** — visible on the map + normal routing cost:

| OSM `surface=*` | Notes |
|---|---|
| `asphalt` | Standard smooth asphalt |
| `concrete` | Concrete pavement |
| `concrete:plates` | Large concrete slabs (some seams) |
| `concrete:lanes` | Concrete in strips with joints |
| `paved` | Generic "paved" (usually asphalt) |
| `paving_stones` | Rectangular modular pavers — Berlin bike-path standard |
| `compacted` | Compacted gravel/rock, firm — typical compacted forest path |
| `fine_gravel` | Small chips, smooth — typical maintained forest/park path |
| `dirt` | Natural dirt (wide forest double-tracks ride fine) |
| `earth` | Natural earth |
| `ground` | Natural ground |
| `unpaved` | Generic unpaved |
| `wood` | Wooden boards (boardwalks) |
| `metal` | Metal grating |
| any other / untagged | Assumed not rough |
