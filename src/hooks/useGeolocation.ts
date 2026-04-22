import { useState, useEffect } from 'react'
import type { LatLng } from '../utils/types'

export type GeolocationStatus = 'idle' | 'active' | 'denied' | 'unavailable'

export interface GeolocationState {
  location: LatLng | null
  status: GeolocationStatus
  /** Compass heading in degrees, 0 = north, clockwise. null if unknown. */
  heading: number | null
}

export function useGeolocation(): GeolocationState {
  const [location, setLocation] = useState<LatLng | null>(null)
  const [status, setStatus] = useState<GeolocationStatus>('idle')
  // Heading has two sources that can fill in for each other:
  //   - GeolocationPosition.coords.heading — set while moving > threshold
  //   - DeviceOrientationEvent.alpha — compass heading, works stationary
  // We prefer GPS heading when moving (actual travel direction); fall
  // back to the device compass when stationary so the arrow still points.
  const [gpsHeading, setGpsHeading] = useState<number | null>(null)
  const [compassHeading, setCompassHeading] = useState<number | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus('unavailable')
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStatus('active')
        const h = pos.coords.heading
        setGpsHeading(typeof h === 'number' && !Number.isNaN(h) ? h : null)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied')
        } else {
          setStatus('unavailable')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  useEffect(() => {
    // Device compass fallback. iOS requires a user gesture to enable
    // DeviceOrientationEvent — we silently attach here; if iOS never
    // delivers events we stay null and the arrow hides.
    function onOrientation(e: DeviceOrientationEvent) {
      // webkitCompassHeading (iOS Safari): already 0=north, clockwise.
      const webkit = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading
      if (typeof webkit === 'number' && !Number.isNaN(webkit)) {
        setCompassHeading(webkit)
        return
      }
      // Standard / Android: alpha = 0 at north-facing device, decreases
      // clockwise, so convert to 0=north-clockwise via (360 - alpha) % 360.
      if (typeof e.alpha === 'number' && !Number.isNaN(e.alpha)) {
        setCompassHeading((360 - e.alpha) % 360)
      }
    }
    window.addEventListener('deviceorientationabsolute', onOrientation as EventListener, true)
    window.addEventListener('deviceorientation', onOrientation as EventListener, true)
    return () => {
      window.removeEventListener('deviceorientationabsolute', onOrientation as EventListener, true)
      window.removeEventListener('deviceorientation', onOrientation as EventListener, true)
    }
  }, [])

  const heading = gpsHeading != null ? gpsHeading : compassHeading
  return { location, status, heading }
}
