/**
 * Fire-and-forget route logging to the D1 backend.
 * Logs each computed route for analytics and evaluation purposes.
 */

export async function logRoute(params: {
  startLat: number
  startLng: number
  startLabel?: string
  endLat: number
  endLng: number
  endLabel?: string
  travelMode: string
  engine: string
  distanceM?: number
  durationS?: number
  preferredPct?: number
}): Promise<void> {
  try {
    await fetch('/api/route-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
  } catch {
    // fire and forget — don't block routing on logging failures
  }
}
