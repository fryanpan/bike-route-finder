import SearchBar from './SearchBar'
import type { QuickOption } from './SearchBar'
import type { Place } from '../utils/types'

interface Props {
  startPoint: Place | null
  endPoint: Place | null
  onStartSelect: (place: Place) => void
  onEndSelect: (place: Place) => void
  onStartClear: () => void
  onEndClear: () => void
  onSwap: () => void
  startQuickOptions: QuickOption[]
  endQuickOptions: QuickOption[]
}

export default function RoutingHeader({
  startPoint,
  endPoint,
  onStartSelect,
  onEndSelect,
  onStartClear,
  onEndClear,
  onSwap,
  startQuickOptions,
  endQuickOptions,
}: Props) {
  return (
    <div className="routing-header">
      <div className="routing-inputs">
        <SearchBar
          label="Start"
          value={startPoint}
          onSelect={onStartSelect}
          onClear={onStartClear}
          placeholder="Search start location…"
          quickOptions={startQuickOptions}
        />
        <SearchBar
          label="End"
          value={endPoint}
          onSelect={onEndSelect}
          onClear={onEndClear}
          placeholder="Search destination…"
          quickOptions={endQuickOptions}
          biasPoint={startPoint ?? undefined}
        />
      </div>
      <button
        className="routing-swap-btn"
        aria-label="Swap start and end"
        onClick={onSwap}
      >
        ⇅
      </button>
    </div>
  )
}
