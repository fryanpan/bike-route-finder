// Userback widget — user-initiated feedback (bug reports + screenshots).
// Loaded async from the Userback CDN so it doesn't block app boot and
// adds no weight to the main bundle. Gated to the prod hostname so it
// never appears on localhost/dev.

declare global {
  interface Window {
    Userback?: {
      access_token?: string
      on_load?: () => void
      [k: string]: unknown
    }
  }
}

export function initUserback() {
  const token = import.meta.env.VITE_USERBACK_TOKEN
  if (!token) return
  if (typeof window === 'undefined') return
  if (location.hostname !== 'bike-map.fryanpan.com') return
  if (window.Userback) return

  window.Userback = { access_token: token }

  const s = document.createElement('script')
  s.async = true
  s.src = 'https://static.userback.io/widget/v1.js'
  document.head.appendChild(s)
}
