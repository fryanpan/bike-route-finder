# Gender, comfort, and infrastructure preference

Research on how infrastructure type shapes **who actually rides**, not just who can. Women are the sensitivity indicator the literature uses — when a city's design makes women comfortable, ridership rises for everyone. This file captures what the research says, the preference ordering it produces, and what it implies for our Layer 1 scoring.

## Core finding

> **Women ride more where protected infrastructure exists.**
> Dedicated cycling infrastructure increases women's participation in cycling by 4–6%. Both genders ride more when it's safer, but the effect on women is larger.

Reported in [Momentum Magazine — "The Bike Lane Gender Gap"](https://momentummag.com/the-bike-lane-gender-gap-new-research-shows-women-ride-more-where-protected-infrastructure-exists/) summarizing New York City Transportation Alternatives work.

Consistent across cities and methodologies:
- Portland State research: women ride more where they are physically separated from cars ([Dill, Goddard, Monsere & McNeil, 2014 — "Can Protected Bike Lanes Help Close the Gender Gap in Cycling?"](https://pdxscholar.library.pdx.edu/usp_fac/123/))
- Valencia natural experiment: new protected lanes disproportionately lifted women's ridership ([Effects of building cycling infrastructure on bicycle use: Differences by gender, 2025](https://www.sciencedirect.com/science/article/pii/S0739885925000149))
- NYC: [Inclusive roads in NYC: Gender differences in responses to cycling infrastructure, 2022](https://www.sciencedirect.com/science/article/pii/S0264275122001585)
- Global: [Revealing the determinants of gender inequality in urban cycling with large-scale data, EPJ Data Science 2023](https://epjdatascience.springeropen.com/articles/10.1140/epjds/s13688-023-00385-7)
- ITDP: [Cycling's Gender Gap — Breaking the Cycle of Inequality, 2022](https://itdp.org/2022/07/06/cyclings-gender-gap/)

## What "protected" actually means for preference

**Preference ordering from Dill et al.'s 3,000-adult survey across the 50 largest US metros:**

1. **Quiet residential street / bike boulevard** — highest comfort; women rated these at the top, especially when explicitly labeled "bike boulevard." See [Jennifer Dill — A case for bike boulevards, 2019](https://jenniferdill.net/2019/06/27/a-case-for-bike-boulevards/).
2. **Protected bike lane (curb or physical barrier)** — more than 2× the "very comfortable" count of a striped lane.
3. **Striped/painted bike lane** — "had no significant positive effect on the choice to bike" (Dill).
4. **Shared road / sharrow** — lowest.

**A bike boulevard can exceed a protected lane on a busy street.** Dill's observational study of 164 cyclists across 1,400+ trips found cyclists went *out of their way* to use Portland's neighborhood greenways but did not go out of their way to use painted lanes on busy streets. Quoting Dill directly: *"Having a bike boulevard to ride on substantially increased a woman's odds of cycling, eliminating the gender gap."*

## Answers to the three questions this research gets asked

### Q: Why don't women like bike lanes that aren't protected?

Paint is a visual cue, not a physical barrier. A striped lane on a busy arterial places the rider next to fast-moving motor traffic with no protection against drift, doorings, or driver error. The comfort differential vs. a protected lane is large; the differential vs. the same street with no lane at all is small. Dill: "Simple striped bike lanes had no significant positive effect on the choice to bike."

### Q: Is any car traffic nearby a problem, or just frequent enough traffic without protection?

**Volume and speed, not presence.** Quiet residential streets score at or above protected lanes for comfort — and those streets have local car traffic. What the research repeatedly identifies as the threshold:

- NACTO AAA: mixed traffic acceptable up to **3,000 veh/day and 85th-percentile ≤ 25 mph (40 km/h)**
- LTS 1: typically **≤ 1,500–3,000 vpd** on a 2-lane road with no centerline
- CROW / Dutch norm: shared use only on **access streets ≤ 30 km/h with ~<2,000–2,500 motor vehicles/day**

Above those thresholds, the infrastructure needs physical separation for women (and families) to feel comfortable. Below them, unprotected sharing is consistently accepted.

### Q: Would a quiet bike-priority street with local car traffic be OK, or is that still worse than a fully separate protected bike lane on a busy street?

**It's as good or better.** This is the surprise in Dill's data and what motivates the "bike boulevard" concept in the first place:

- Women rate quiet residential streets at the top of the comfort distribution
- Bike boulevards (quiet streets *plus* traffic-calming and through-traffic diversion) rated even higher
- Bike boulevards in Portland "eliminated the gender gap" for their users

A protected lane on a busy street is a compromise — you get the physical separation but you still hear, smell, and ride alongside heavy motor traffic, with more complex intersections to cross. A quiet street with low volumes and calmed speeds removes the stressor at the source.

This is why the Dutch, Germans, and Danes build Fahrradstraßen / cycle streets *in parallel* to their curb-separated axes on busy roads — both count as "Great" in the protection hierarchy. For a family with a kid, a calm, legible bike-priority street is often the best option in the city, not a fallback.

## Implications for our Layer 1 model

Our current `PathLevel` tiers already reflect this ordering — but this research is the explicit justification:

| Our tier | Matches which preference tier | Notes |
|---|---|---|
| **1a — Car-free** | Preference tier 1 (no motor traffic at all) | Park paths, dedicated cycleways, shared-use paths |
| **1b — Bikeway with minimal cars** | Preference tier 1 (quiet street + bike priority) | Fahrradstraße, living streets, bike boulevards, SF Slow Streets. Literature ranks this WITH car-free and protected, not below. |
| **2a — Bike route beside cars (quiet)** | Preference tier 2-3 | Painted lane on a street ≤ 30 km/h — acceptable but not preferred. Kid-traffic-savvy+ only. |
| **2b — Residential or busier painted lane** | Preference tier 3-4 | Either a painted lane on a faster arterial, or a residential street without bike priority. Adult modes only. |
| **3 — Shared road** | Preference tier 4 | Training mode only. |
| **4 — Unprotected major road** | Below any preference tier | Hidden. |

The research strongly supports treating **1a and 1b as equal top tier** for preferred-path routing, which is what kid-confident and higher already do. It also supports why kid-starting-out is **1a only** — only the most cautious cohort demands physical absence of motor traffic, and the research acknowledges that level of caution exists even though the thresholds above (2,000–3,000 vpd / 30 km/h) would nominally accept mixed traffic.

Where the family-bike-map adds on top of the gender literature: **parent cognitive load** (the adult monitoring the kid while riding) is a load not captured in adult-cyclist preference surveys. See `standards.md §Cognitive-load and developmental analogs` for that separate body of evidence.

## Related project research

- [Research README](./README.md) — index into family-safety research
- [Standards](./standards.md) — LTS, NACTO AAA, CROW, LTN 1/20 frameworks the thresholds above come from
- [Safety-in-numbers](./safety-in-numbers.md) — the city-level multiplier: more people riding → fewer per-capita crashes, which is downstream of women/family ridership being enabled
