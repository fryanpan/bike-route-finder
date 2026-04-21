# Future Work

Post-launch ideas Bryan surfaced 2026-04-21. Not scoped to any sprint; logged so they don't get lost.

## 1. Replica — aggregated cell-phone tracking for route popularity

[Replica](https://replicahq.com/) sells aggregated, de-identified mobility data derived from cell-phone and telematics sources. Could answer questions we can't answer from OSM alone:

- Where do people actually ride today? (Revealed-preference data vs. our model's inferred preference)
- Which "good" routes get no traffic because of a gap we're not modeling?
- Which "bad" routes get lots of traffic because they're the only viable option?

**Use cases:**
- Validate our LTS classification against actual rider behavior at the corridor level.
- Seed Layer 2 city profile promote/demote rules from revealed preference instead of hand-curated research.
- Identify underserved corridors where infra investment would unlock the most new kid-friendly routes.

**Open questions:**
- Cost and licensing terms (Replica is a paid B2B product)
- Data aggregation level — per-street or per-zone? We need street-level to be useful
- Freshness — is the data recent enough to catch new Slow Streets / bike lanes?

## 2. SF school routing — city + national priority

Routing kids to school is an explicit city priority in SF (Safe Routes to School programs) and a national one (federal Safe Routes to School funding). This is a natural wedge for family-bike-map.

**Research questions:**
- Where do SF students come from geographically? SFUSD assigns schools based on home-to-school bands, not strict neighborhood. Many students have ≥1 mile commutes across neighborhoods with very different infrastructure quality.
- What are the top 10 SFUSD elementary schools by enrollment, and what do their catchment areas look like?
- Are there school-specific bike trains / walking buses we could surface on the map?

**Product direction:**
- Batch benchmark: for each school, route from every ZIP code in the catchment. Produce a school-level "family bikeability" score.
- Partner with SFMTA's Safe Routes program or SF Bicycle Coalition to validate the scoring methodology.
- Potential positioning: "find a school that's actually bikeable from your neighborhood."

## 3. Mid-ride feedback

Today's feedback plugin only collects post-ride text feedback. Real-time feedback during a ride would capture specific moments the rider wants to flag — without requiring them to remember later.

**Ideas:**
- Physical button (handlebar-mounted) that pings "something happened here" at a GPS point
- Voice note triggered by phone shake or Siri shortcut — saves audio + timestamp + coords
- Predefined reaction emojis on a persistent overlay ("scary", "safe", "blocked", "great")

**Open questions:**
- Battery / UX cost of keeping the app active during a ride
- Whether Apple Watch integration makes this dramatically easier
- How to prevent feedback spam (single-use token? confidence rating?)

## 4. 311 integration for bad-route reporting

SF, NYC, Oakland, Berkeley all have 311 systems for reporting infrastructure issues. We could generate pre-filled 311 reports from feedback events.

**Flow:**
- User tags a road as "scary" in our app → app generates a draft 311 report with lat/lng, photo (if taken), and a suggested category (e.g. "Street & Sidewalk Defect: bike lane hazard")
- User reviews and submits to 311 directly from the app

**City-specific considerations:**
- SF 311 has an API (SF311 Open311). Reports are public.
- NYC 311 also has an API. Category taxonomy differs.
- Each city's accepted complaint types need mapping to our internal tags.

**Related existing work:**
- docs/research/family-safety/city-profiles/ already contains per-city profile research that could inform which 311 category to suggest.

## Tracking

These are research/product threads, not sprint tasks. No immediate owner or timeline. Revisit in the post-launch planning session.
