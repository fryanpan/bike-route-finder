import type { Place } from '../utils/types'

interface Props {
  place: Place
  onDirections: () => void
  onBack: () => void
}

export default function PlaceCard({ place, onDirections, onBack }: Props) {
  // Extract city/district from the full label (comma-separated parts after the first)
  const detail = place.label.split(', ').slice(1, 3).join(', ')

  return (
    <div className="place-card">
      <button className="place-card-back" onClick={onBack} aria-label="Back to search">
        ← Back
      </button>
      <div className="place-card-info">
        <h2 className="place-card-name">{place.shortLabel}</h2>
        {detail && <p className="place-card-detail">{detail}</p>}
      </div>
      <button className="place-card-directions-btn" onClick={onDirections}>
        🚲 Directions
      </button>
    </div>
  )
}
