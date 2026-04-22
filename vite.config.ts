import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    // Uploads source maps to Sentry on production builds so stack traces resolve
    // to real file/line numbers. Requires SENTRY_AUTH_TOKEN env var (CI secret).
    // No-ops silently if the token is absent (local dev, preview builds).
    sentryVitePlugin({
      org: 'fryanpan',
      project: 'bike-map',
      telemetry: false,
    }),
  ],
  // Vite HMR serves the app; /api/* is proxied to the local wrangler dev
  // on :8791 so Worker routes (feedback, mapillary, overpass) still work.
  // Run both: `bunx wrangler dev --port 8791` + `bunx vite`.
  server: {
    host: true, // listen on 0.0.0.0 so Tailscale / LAN hosts can reach it
    port: 5173,
    // Allow Tailscale + .local names to hit the dev server. Vite 5 blocks
    // anything not explicitly listed by default.
    allowedHosts: [
      '.ts.net',       // Tailscale magic DNS (tailXXXX.ts.net)
      '.local',        // mDNS / Bonjour hostnames
      'localhost',
      '127.0.0.1',
    ],
    proxy: {
      '/api': 'http://localhost:8791',
    },
  },
  build: {
    sourcemap: true,
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
            return 'vendor-leaflet'
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react'
          }
        },
      },
    },
  },
})
