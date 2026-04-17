import { useState } from 'react'
import type { RouteSegment } from '../utils/types'
import type { FeedbackVerdict } from '../services/feedbackQueue'

interface Props {
  seg: RouteSegment
  region: string | null
  onSave: (verdict: FeedbackVerdict, note: string) => void
  onClose: () => void
}

export default function FlagSegmentModal({ seg, region, onSave, onClose }: Props) {
  const [verdict, setVerdict] = useState<FeedbackVerdict>('should-be-avoided')
  const [note, setNote] = useState('')

  return (
    <div className="flag-backdrop" onClick={onClose}>
      <div className="flag-modal" onClick={(e) => e.stopPropagation()}>
        <div className="flag-header">
          <div className="flag-title">Flag this segment</div>
          <button className="flag-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="flag-body">
          <div className="flag-summary">
            <div><strong>Classified as:</strong> {seg.itemName ?? '(unknown)'}</div>
            {region && <div><strong>Region:</strong> {region}</div>}
            <div><strong>Way IDs:</strong> {seg.wayIds?.join(', ') ?? '—'}</div>
          </div>

          <div className="flag-verdict">
            <label>
              <input
                type="radio"
                name="verdict"
                value="should-be-avoided"
                checked={verdict === 'should-be-avoided'}
                onChange={() => setVerdict('should-be-avoided')}
              />
              Should be avoided (wrongly classified as safe)
            </label>
            <label>
              <input
                type="radio"
                name="verdict"
                value="should-be-preferred"
                checked={verdict === 'should-be-preferred'}
                onChange={() => setVerdict('should-be-preferred')}
              />
              Should be preferred (wrongly classified as bad)
            </label>
            <label>
              <input
                type="radio"
                name="verdict"
                value="rough-surface"
                checked={verdict === 'rough-surface'}
                onChange={() => setVerdict('rough-surface')}
              />
              Rough surface (cobbles, broken pavement, etc.)
            </label>
          </div>

          <textarea
            className="flag-note"
            placeholder="Optional note (what went wrong, when, any detail)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
        </div>
        <div className="flag-footer">
          <button className="flag-btn" onClick={onClose}>Cancel</button>
          <button
            className="flag-btn flag-btn-primary"
            onClick={() => { onSave(verdict, note); onClose() }}
          >
            Save flag
          </button>
        </div>
      </div>
    </div>
  )
}
