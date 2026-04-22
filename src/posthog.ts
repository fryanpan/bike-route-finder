// PostHog product analytics — passive page-views, funnels, session replay.
// Dynamically imported so the ~60 KB SDK never ships to dev or to users
// who aren't on the prod hostname. Safe to call unconditionally at boot.

export async function initPostHog() {
  const key = import.meta.env.VITE_POSTHOG_KEY
  if (!key) return
  if (typeof window === 'undefined') return
  if (location.hostname !== 'bike-map.fryanpan.com') return

  const host = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'

  const { default: posthog } = await import('posthog-js')
  posthog.init(key, {
    api_host: host,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
  })
}
