import { useState, useEffect, useRef, useCallback } from 'react'
import { searchPlaces } from '../services/geocoding'
import type { Place } from '../utils/types'

interface Props {
  label: string
  value: Place | null
  onSelect: (place: Place) => void
  placeholder: string
}

export default function SearchBar({ label, value, onSelect, placeholder }: Props) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Place[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync display when parent updates the selected value
  useEffect(() => {
    setQuery(value?.shortLabel ?? '')
  }, [value])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length >= 2) {
      debounceRef.current = setTimeout(async () => {
        try {
          const results = await searchPlaces(q)
          setSuggestions(results)
          setOpen(results.length > 0)
        } catch {
          setSuggestions([])
        }
      }, 300)
    } else {
      setSuggestions([])
      setOpen(false)
    }
  }, [])

  const handleSelect = useCallback(
    (place: Place) => {
      setQuery(place.shortLabel)
      setSuggestions([])
      setOpen(false)
      onSelect(place)
    },
    [onSelect],
  )

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="search-bar" ref={containerRef}>
      <label className="search-label">{label}</label>
      <input
        type="text"
        className="search-input"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
      />
      {open && (
        <ul className="suggestions">
          {suggestions.map((s, i) => (
            <li key={i} className="suggestion-item" onMouseDown={() => handleSelect(s)}>
              <span className="suggestion-name">{s.shortLabel}</span>
              <span className="suggestion-detail">
                {s.label.split(', ').slice(1, 3).join(', ')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
