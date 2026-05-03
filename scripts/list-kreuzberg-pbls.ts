#!/usr/bin/env bun
/**
 * List PBL-tagged streets in Kreuzberg + Mitte by parent-highway class.
 * Answers Bryan's question: which streets would option B (narrow demote
 * to primary/secondary ≥ 50 km/h) spare vs. catch?
 */

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

function buildPblQuery(bbox: { south: number; west: number; north: number; east: number }): string {
  const { south, west, north, east } = bbox
  const b = `${south},${west},${north},${east}`
  return `[out:json][timeout:30];
(
  way[~"^cycleway(:right|:left|:both)?$"~"^(track|opposite_track)$"](${b});
);
out tags;`
}

// Kreuzberg + Mitte rough bbox (covers Friedrichshain edge too)
const BBOX = { south: 52.495, north: 52.530, west: 13.380, east: 13.450 }

interface Way {
  id: number
  tags: Record<string, string>
}

async function main() {
  console.log(`Querying Overpass for Kreuzberg/Mitte bbox: ${JSON.stringify(BBOX)}`)
  const resp = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(buildPblQuery(BBOX))}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  if (!resp.ok) { console.error(`fail ${resp.status}`); return }
  const data = await resp.json() as { elements: Array<{ type: string; id: number; tags?: Record<string,string> }> }
  const ways: Way[] = data.elements.filter(e => e.type === 'way' && e.tags).map(e => ({ id: e.id, tags: e.tags! }))
  console.log(`Got ${ways.length} ways`)

  function hasSeparatedCycleway(t: Record<string,string>): boolean {
    const isTrack = (v?: string) => v === 'track' || v === 'opposite_track'
    return isTrack(t.cycleway) || isTrack(t['cycleway:right']) ||
           isTrack(t['cycleway:left']) || isTrack(t['cycleway:both'])
  }

  // Group by named street + parent class
  const groups = new Map<string, { hwy: string; maxspeed: string; ways: number }>()
  for (const w of ways) {
    if (!hasSeparatedCycleway(w.tags)) continue
    const name = w.tags.name ?? '(unnamed)'
    const hwy = w.tags.highway ?? '?'
    if (hwy === 'cycleway' || hwy === 'path' || hwy === 'footway') continue // standalone, not a PBL on a parent
    const maxspeed = w.tags.maxspeed ?? ''
    const key = `${name}|${hwy}|${maxspeed}`
    const existing = groups.get(key)
    if (existing) existing.ways++
    else groups.set(key, { hwy, maxspeed, ways: 1 })
  }

  // Sort by highway class then name
  const rows = [...groups.entries()].map(([k, v]) => {
    const [name, hwy, maxspeed] = k.split('|')
    return { name, hwy, maxspeed, ways: v.ways }
  }).sort((a, b) => {
    const order = ['primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'living_street', 'service']
    const aIdx = order.indexOf(a.hwy); const bIdx = order.indexOf(b.hwy)
    if (aIdx !== bIdx) return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx)
    return a.name.localeCompare(b.name)
  })

  console.log()
  console.log('## Streets with SEPARATED CYCLEWAY (PBL) tagging in Kreuzberg/Mitte')
  console.log()
  console.log('Caught by option B (narrow rule: primary/secondary AND maxspeed ≥ 50):')
  for (const r of rows) {
    const speed = r.maxspeed === '' ? 50 : Number(r.maxspeed) || 50
    const caughtByB = (r.hwy === 'primary' || r.hwy === 'secondary') && speed >= 50
    if (caughtByB) console.log(`  ${r.hwy.padEnd(12)} ${(r.maxspeed || '50?').padEnd(5)}  ${r.name}  (${r.ways} segments)`)
  }
  console.log()
  console.log('Spared by option B (lighter PBLs — tertiary or below, or low speed):')
  for (const r of rows) {
    const speed = r.maxspeed === '' ? 50 : Number(r.maxspeed) || 50
    const caughtByB = (r.hwy === 'primary' || r.hwy === 'secondary') && speed >= 50
    if (!caughtByB) console.log(`  ${r.hwy.padEnd(12)} ${(r.maxspeed || '50?').padEnd(5)}  ${r.name}  (${r.ways} segments)`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
