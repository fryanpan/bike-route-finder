import { useState, useEffect, useCallback } from 'react'
import { loadFeedbackQueue, deleteFeedbackEntry, clearFeedbackQueue, type FeedbackEntry } from '../services/feedbackQueue'

export default function AuditFeedbackTab() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([])

  const refresh = useCallback(() => {
    setEntries(loadFeedbackQueue())
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleDelete = (id: string) => {
    deleteFeedbackEntry(id)
    refresh()
  }

  const handleClearAll = () => {
    if (confirm('Clear all feedback entries? This cannot be undone.')) {
      clearFeedbackQueue()
      refresh()
    }
  }

  if (entries.length === 0) {
    return (
      <div className="audit-empty">
        No feedback yet. Flag a route segment during navigation to add an entry here.
      </div>
    )
  }

  return (
    <div className="audit-feedback-tab">
      <div className="audit-feedback-header">
        <span className="audit-meta">{entries.length} flag{entries.length === 1 ? '' : 's'}</span>
        <button className="audit-action-btn" onClick={handleClearAll}>Clear all</button>
      </div>

      <div className="audit-feedback-list">
        {entries.map((e) => (
          <div key={e.id} className="audit-feedback-item">
            <div className="audit-feedback-row">
              <span className={`audit-feedback-verdict audit-feedback-verdict-${e.verdict}`}>
                {e.verdict === 'should-be-avoided' && '🚫 Should avoid'}
                {e.verdict === 'should-be-preferred' && '✅ Should prefer'}
                {e.verdict === 'rough-surface' && '⚠️ Rough'}
              </span>
              <span className="audit-feedback-meta">
                {e.region ?? '(no region)'} · {new Date(e.createdAt).toLocaleString()}
              </span>
              <button className="audit-action-btn" onClick={() => handleDelete(e.id)}>Delete</button>
            </div>
            <div className="audit-feedback-body">
              <div><strong>Classified as:</strong> {e.currentItemName ?? '(none)'}</div>
              <div><strong>Way IDs:</strong> {e.wayIds.join(', ') || '—'}</div>
              {e.note && <div className="audit-feedback-note">"{e.note}"</div>}
              {e.coordinates.length > 0 && (
                <div className="audit-feedback-coord">
                  Midpoint: {e.coordinates[Math.floor(e.coordinates.length / 2)][0].toFixed(4)},
                  {e.coordinates[Math.floor(e.coordinates.length / 2)][1].toFixed(4)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
