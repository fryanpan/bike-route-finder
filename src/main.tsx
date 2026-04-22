import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { initSentry } from './sentry'
import { initPostHog } from './posthog'
import { initUserback } from './userback'
import 'leaflet/dist/leaflet.css'
import './App.css'
import App from './App'

initSentry()
initPostHog()
initUserback()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<p style={{ padding: 24 }}>Something went wrong. Please reload the page.</p>}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)
