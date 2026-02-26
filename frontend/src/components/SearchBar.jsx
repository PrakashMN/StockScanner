import { useState, useEffect, useRef } from 'react'
import { searchStocks } from '../services/api'

export default function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const skipSearch = useRef(false)

  // Handle outside Click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search for suggestions
  useEffect(() => {
    // If input is short, clear immediately (don't wait for debounce)
    if (query.length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    if (skipSearch.current) {
      skipSearch.current = false
      return
    }

    const timer = setTimeout(async () => {
      try {
        const results = await searchStocks(query)
        setSuggestions(results)
        setShowDropdown(true)
      } catch (error) {
        console.error('Search failed:', error)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [query])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      skipSearch.current = true
      onSearch(query.toUpperCase())
      setShowDropdown(false)
    }
  }

  const handleSelect = (s) => {
    skipSearch.current = true
    setQuery(s.symbol)
    onSearch(s.symbol)
    setShowDropdown(false)
  }

  return (
    <div className="searchbar-wrapper" ref={dropdownRef}>
      <form className="searchbar-form" onSubmit={handleSubmit}>
        <div className="searchbar-input-group">
          <span className="searchbar-icon">🔍</span>
          <input
            type="text"
            className="searchbar-input"
            placeholder="Search company (e.g. Tata, Apple)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn-primary searchbar-btn" disabled={loading || !query.trim()}>
            {loading ? '...' : 'Scan'}
          </button>
        </div>
      </form>

      {showDropdown && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((s, idx) => (
            <div 
              key={idx} 
              className="suggestion-item"
              onClick={() => handleSelect(s)}
            >
              <div className="s-info">
                <span className="s-name">{s.name}</span>
                <span className="s-symbol">{s.symbol}</span>
              </div>
              <div className="s-meta">
                <span className="s-exch">{s.exch}</span>
                <span className="s-type">{s.type}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="quick-searches">
        <span className="quick-label">Quick:</span>
        {['AAPL', 'TSLA', 'BTC-USD', 'RELIANCE.NS', 'TCS.NS'].map(t => (
          <button key={t} onClick={() => { setQuery(t); onSearch(t); }} className="quick-chip" disabled={loading}>
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}
