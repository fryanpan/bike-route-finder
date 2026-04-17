/**
 * Feedback queue — local-only storage for "flag this segment as wrong"
 * reports the user makes during routing. Admin reviews the queue at
 * `?admin=feedback` and can promote an entry to a real region rule.
 *
 * No network, no cloud sync. Simple serialization to localStorage.
 * Cap at 100 items per region; oldest dropped.
 */

const KEY = 'bike-route-feedback-queue'
const MAX_ITEMS = 100

export type FeedbackVerdict =
  | 'should-be-preferred'
  | 'should-be-avoided'
  | 'rough-surface'

export interface FeedbackEntry {
  id: string                 // uuid-ish — timestamp + random suffix
  createdAt: number          // Date.now() when flagged
  region: string | null      // 'berlin', 'sf', null if unknown
  wayIds: number[]
  coordinates: [number, number][]  // segment coords for context
  currentItemName: string | null
  currentTags: Record<string, string>  // snapshot — admin needs this to write a rule
  verdict: FeedbackVerdict
  note?: string              // optional free-text
}

function randomId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function loadFeedbackQueue(): FeedbackEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as FeedbackEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveFeedbackEntry(entry: Omit<FeedbackEntry, 'id' | 'createdAt'>): FeedbackEntry {
  const full: FeedbackEntry = { ...entry, id: randomId(), createdAt: Date.now() }
  const queue = loadFeedbackQueue()
  queue.unshift(full)
  // Cap: drop oldest
  while (queue.length > MAX_ITEMS) queue.pop()
  try { localStorage.setItem(KEY, JSON.stringify(queue)) } catch { /* quota */ }
  return full
}

export function deleteFeedbackEntry(id: string): void {
  const queue = loadFeedbackQueue().filter((e) => e.id !== id)
  try { localStorage.setItem(KEY, JSON.stringify(queue)) } catch { /* quota */ }
}

export function clearFeedbackQueue(): void {
  try { localStorage.removeItem(KEY) } catch { /* quota */ }
}
