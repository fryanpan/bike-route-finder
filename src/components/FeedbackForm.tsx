import { useState } from 'react'

const CALENDLY_URL = import.meta.env.VITE_CALENDLY_URL as string | undefined

type Submit = 'idle' | 'submitting' | 'ok' | 'error'

export default function FeedbackForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submit, setSubmit] = useState<Submit>('idle')
  const [error, setError] = useState<string | null>(null)

  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && /@/.test(email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || submit === 'submitting') return

    setSubmit('submitting')
    setError(null)

    try {
      const resp = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: `${name.trim()} <${email.trim()}>`,
          text: message.trim() || '(no message)',
          pageUrl: window.location.href,
        }),
      })
      if (!resp.ok) {
        const body = await resp.text()
        setError(`Couldn't submit — ${resp.status}. Try again or email Bryan directly: fryanpan@gmail.com`)
        setSubmit('error')
        console.error('[Feedback] submit failed', resp.status, body)
        return
      }
      setSubmit('ok')
    } catch (err) {
      setError("Couldn't submit — network issue. Try again or email Bryan: fryanpan@gmail.com")
      setSubmit('error')
      console.error('[Feedback] submit error', err)
    }
  }

  return (
    <div className="feedback-backdrop" onClick={onClose}>
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
        <div className="feedback-header">
          <h2 className="feedback-title">Send feedback</h2>
          <button className="feedback-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {submit !== 'ok' ? (
          <form className="feedback-body" onSubmit={handleSubmit}>
            <p className="feedback-intro">
              What worked, what didn't, what was wrong. We'll read every
              one and get back to you if you leave a note and an email.
            </p>

            <label className="feedback-label" htmlFor="fb-name">
              Name <span className="feedback-required">*</span>
            </label>
            <input
              id="fb-name"
              type="text"
              className="feedback-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bryan"
              required
              autoComplete="name"
            />

            <label className="feedback-label" htmlFor="fb-email">
              Email <span className="feedback-required">*</span>
            </label>
            <input
              id="fb-email"
              type="email"
              className="feedback-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />

            <label className="feedback-label" htmlFor="fb-msg">
              Message
            </label>
            <textarea
              id="fb-msg"
              className="feedback-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. route from home to Tempelhof had weird turns; Gleisdreieck → Mehringdamm didn't match my usual route"
              rows={4}
            />

            {error && (
              <div className="feedback-error">{error}</div>
            )}

            <button
              type="submit"
              className="feedback-submit"
              disabled={!canSubmit || submit === 'submitting'}
            >
              {submit === 'submitting' ? 'Sending…' : 'Send feedback'}
            </button>

            {CALENDLY_URL && (
              <a
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="feedback-calendly-link"
              >
                Or book a 15-min chat with Bryan →
              </a>
            )}
          </form>
        ) : (
          <div className="feedback-thanks">
            <div className="feedback-thanks-emoji">🙏</div>
            <div className="feedback-thanks-title">Thanks!</div>
            <p className="feedback-thanks-body">
              Your feedback was saved. If you left an email, Bryan will
              get back to you.
            </p>
            {CALENDLY_URL && (
              <a
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="feedback-submit feedback-calendly-cta"
              >
                Book a 15-min chat →
              </a>
            )}
            <button className="feedback-btn" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
