# Setup & Deployment Guide

## Prerequisites

- Node.js 20+
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier is fine)
- A [Surge.sh](https://surge.sh) account (`npm install -g surge && surge login`)
- Linear API access (for the feedback widget)

---

## 1. Deploy the Cloudflare Worker

The Worker proxies Valhalla and Nominatim (CORS) and creates Linear issues from user feedback.

```bash
cd worker
npm install
npx wrangler login        # opens browser to authenticate with Cloudflare
npx wrangler deploy
```

Note the Worker URL printed at the end, e.g.:
```
https://bike-route-finder.fryanpan.workers.dev
```

### Set Worker secrets

```bash
npx wrangler secret put LINEAR_API_KEY      # Linear personal API key
npx wrangler secret put LINEAR_TEAM_ID      # Linear team ID (from team settings URL)
npx wrangler secret put LINEAR_PROJECT_ID   # Linear project ID
npx wrangler secret put LINEAR_ASSIGNEE_ID  # (optional) Linear user ID to auto-assign
```

To find Linear IDs: open Linear → team/project settings → copy the UUID from the URL.

---

## 2. Build and deploy the web app

```bash
cd /path/to/bike-route-finder   # repo root

npm install

# Set the Worker URL from step 1, then build
VITE_WORKER_URL=https://bike-route-finder.fryanpan.workers.dev npm run build

# Deploy to surge.sh
npx surge dist family-bike-map.surge.sh
```

The app will be live at **https://family-bike-map.surge.sh**.

---

## 3. Configure GitHub Actions (for automated CI/CD)

Add these secrets in **GitHub repo → Settings → Secrets and variables → Actions**:

| Secret | How to get it |
|--------|---------------|
| `SURGE_TOKEN` | Run `npx surge token` locally |
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" template |
| `VITE_WORKER_URL` | The Worker URL from step 1 |

Once secrets are set, merging to `main` will automatically:
- Run tests (CI also runs on every PR)
- Build the Vite app with `VITE_WORKER_URL` injected
- Deploy to `family-bike-map.surge.sh`
- Deploy the Cloudflare Worker

---

## 4. Local development

```bash
# Start the Vite dev server (proxies /api/* to Valhalla + Nominatim)
npm run dev
# App at http://localhost:5173

# Run unit tests
npm test

# Run the Worker locally (in a separate terminal)
cd worker && npx wrangler dev
```

In dev mode, the Vite proxy handles Valhalla and Nominatim calls directly — no Worker needed. The feedback widget won't post to Linear in dev (no `VITE_WORKER_URL` set).

---

## Troubleshooting

**Routes don't load**
- Check the browser network tab for `/api/valhalla/route` — if it's 502/503, the Valhalla public instance may be temporarily down.
- In production, check that `VITE_WORKER_URL` was set correctly at build time (inspect `dist/index.html` — the script tag should show the actual URL, not `%VITE_WORKER_URL%`).

**Feedback doesn't create a Linear ticket**
- Confirm the Worker secrets are set: `cd worker && npx wrangler secret list`
- Check Worker logs: `npx wrangler tail`

**Bike overlay shows "zoom in to see bike paths"**
- The viewport is too large. Zoom in until you can see individual streets.
