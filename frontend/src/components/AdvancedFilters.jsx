import { useState } from 'react'

export default function AdvancedFilters({ filters, onFilterChange, onReset }) {
  const [isOpen, setIsOpen] = useState(false)

  const activeCount = Object.values(filters).reduce((acc, f) => {
    if (f.min !== '' || f.max !== '') return acc + 1
    return acc
  }, 0)

  const handleChange = (category, type, value) => {
    onFilterChange({
      ...filters,
      [category]: { ...filters[category], [type]: value }
    })
  }

  return (
    <div className={`advanced-filters-section ${isOpen ? 'is-open' : ''}`}>
      <div className="filter-header-row">
        <button className="filter-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
          <span className="toggle-icon">⚙️</span>
          <span>Advanced Filters</span>
          {activeCount > 0 && <span className="active-badge">{activeCount}</span>}
          <span className="chevron">{isOpen ? '▲' : '▼'}</span>
        </button>
        {activeCount > 0 && (
          <button className="btn-reset" onClick={onReset}>Reset All</button>
        )}
      </div>

      {isOpen && (
        <div className="filters-grid">
          {/* Price Filter */}
          <div className="filter-group">
            <label>Price ({filters.price.min || 'Min'} - {filters.price.max || 'Max'})</label>
            <div className="range-inputs">
              <input
                type="number"
                placeholder="Min Price"
                value={filters.price.min}
                onChange={(e) => handleChange('price', 'min', e.target.value)}
              />
              <input
                type="number"
                placeholder="Max Price"
                value={filters.price.max}
                onChange={(e) => handleChange('price', 'max', e.target.value)}
              />
            </div>
          </div>

          {/* Volume Filter */}
          <div className="filter-group">
            <label>Daily Volume (Min)</label>
            <input
              type="number"
              placeholder="e.g. 1000000"
              value={filters.volume.min}
              onChange={(e) => handleChange('volume', 'min', e.target.value)}
            />
          </div>

          {/* Market Cap Filter */}
          <div className="filter-group">
            <label>Market Cap (Min $B)</label>
            <input
              type="number"
              placeholder="e.g. 10 (for 10 Billion)"
              value={filters.marketCap.min}
              onChange={(e) => handleChange('marketCap', 'min', e.target.value)}
            />
          </div>

          {/* P/E Ratio Filter */}
          <div className="filter-group">
            <label>P/E Ratio (Max)</label>
            <input
              type="number"
              placeholder="e.g. 25"
              value={filters.pe.max}
              onChange={(e) => handleChange('pe', 'max', e.target.value)}
            />
          </div>

          {/* Dividend Yield Filter */}
          <div className="filter-group">
            <label>Div Yield (Min %)</label>
            <input
              type="number"
              placeholder="e.g. 2"
              value={filters.divYield.min}
              onChange={(e) => handleChange('divYield', 'min', e.target.value)}
            />
          </div>

          {/* Currency Filter */}
          <div className="filter-group">
            <label>Currency Type</label>
            <select 
              value={filters.currency || 'All'} 
              onChange={(e) => onFilterChange({ ...filters, currency: e.target.value })}
              className="filter-select"
            >
              <option value="All">All Currencies</option>
              <option value="INR">Indian Rupee (INR)</option>
              <option value="USD">US Dollar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
