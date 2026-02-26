const filters = ['All', 'Bullish', 'Bearish', 'Neutral']

const icons = {
  All: '🌐',
  Bullish: '🚀',
  Bearish: '🐻',
  Neutral: '⚖️',
}

export default function FilterPanel({ activeFilter, onFilterChange }) {
  return (
    <div className="filter-panel">
      <span className="filter-label">Filter by Signal:</span>
      <div className="filter-chips">
        {filters.map((f) => (
          <button
            key={f}
            className={`filter-chip ${activeFilter === f ? 'active' : ''}`}
            onClick={() => onFilterChange(f)}
            id={`filter-${f.toLowerCase()}`}
          >
            {icons[f]} {f}
          </button>
        ))}
      </div>
    </div>
  )
}
