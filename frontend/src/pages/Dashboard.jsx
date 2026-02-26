import { useState } from 'react'
import { analyzeStock } from '../services/api'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar.jsx'
import IndicatorCard from '../components/IndicatorCard.jsx'
import SignalBadge from '../components/SignalBadge.jsx'
import StockChart from '../components/StockChart.jsx'
import FilterPanel from '../components/FilterPanel.jsx'
import AdvancedFilters from '../components/AdvancedFilters.jsx'
import RecentStockGrid from '../components/RecentStockGrid.jsx'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All')
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem('ss_search_history')
    if (!saved) return []
    try {
      const parsed = JSON.parse(saved)
      // Filter out legacy string-based history to prevent crashes
      return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'object' && item !== null && item.symbol) : []
    } catch (e) {
      return []
    }
  })
  const [advancedFilters, setAdvancedFilters] = useState({
    price: { min: '', max: '' },
    volume: { min: '', max: '' },
    marketCap: { min: '', max: '' },
    pe: { min: '', max: '' },
    divYield: { min: '', max: '' },
  })

  const resetFilters = () => {
    setAdvancedFilters({
      price: { min: '', max: '' },
      volume: { min: '', max: '' },
      marketCap: { min: '', max: '' },
      pe: { min: '', max: '' },
      divYield: { min: '', max: '' },
    })
  }

  const isStockPassingFilters = (stock, filters) => {
    if (!stock) return true
    const f = filters
    
    // Safety check for keys
    const price = stock.currentPrice ?? stock.price
    const mcap = (stock.marketCap / 1e9)
    const vol = stock.averageVolume
    const pe = stock.trailingPE
    const div = stock.dividendYield

    const results = {
      price: (f.price.min === '' || price >= parseFloat(f.price.min)) &&
             (f.price.max === '' || price <= parseFloat(f.price.max)),
      volume: (f.volume.min === '' || (vol && vol >= parseFloat(f.volume.min))),
      marketCap: (f.marketCap.min === '' || (mcap && mcap >= parseFloat(f.marketCap.min))),
      pe: (f.pe.max === '' || (pe !== null && pe !== undefined && pe <= parseFloat(f.pe.max))),
      divYield: (f.divYield.min === '' || (div !== null && div !== undefined && div >= parseFloat(f.divYield.min))),
    }
    
    return Object.values(results).every(v => v === true)
  }

  const getFilterResults = (res) => {
    if (!res) return null
    const f = advancedFilters
    const price = res.currentPrice ?? res.price
    const mcap = (res.marketCap / 1e9)
    const vol = res.averageVolume
    const pe = res.trailingPE
    const div = res.dividendYield

    return {
      price: (f.price.min === '' || price >= parseFloat(f.price.min)) &&
             (f.price.max === '' || price <= parseFloat(f.price.max)),
      volume: (f.volume.min === '' || (vol && vol >= parseFloat(f.volume.min))),
      marketCap: (f.marketCap.min === '' || (mcap && mcap >= parseFloat(f.marketCap.min))),
      pe: (f.pe.max === '' || (pe !== null && pe !== undefined && pe <= parseFloat(f.pe.max))),
      divYield: (f.divYield.min === '' || (div !== null && div !== undefined && div >= parseFloat(f.divYield.min))),
    }
  }

  const filterResults = getFilterResults(result)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSearch = async (symbol) => {
    if (!symbol) return
    const sym = symbol.toUpperCase()
    setError('')
    setLoading(true)
    setResult(null)
    
    try {
      const data = await analyzeStock(sym)
      setResult(data)
      
      // Update History with rich data
      setSearchHistory(prev => {
        const historyItem = {
          symbol: sym,
          price: data.currentPrice,
          rsi: data.rsi,
          signal: data.signal,
          name: data.name,
          currency: data.currency || (sym.endsWith('.NS') || sym.endsWith('.BO') ? 'INR' : 'USD'),
          marketCap: data.marketCap,
          averageVolume: data.averageVolume,
          trailingPE: data.trailingPE,
          dividendYield: data.dividendYield,
          timestamp: new Date().getTime()
        }
        
        const filtered = prev.filter(s => s.symbol !== sym)
        const updated = [historyItem, ...filtered].slice(0, 20)
        localStorage.setItem('ss_search_history', JSON.stringify(updated))
        return updated
      })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch stock data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('ss_search_history')
  }

  const isVisible =
    !result ||
    filter === 'All' ||
    result.signal === filter

  const filteredHistory = searchHistory.filter(item => {
    const signalMatch = filter === 'All' || item.signal === filter
    const advancedMatch = isStockPassingFilters(item, advancedFilters)
    return signalMatch && advancedMatch
  })

  // Check if active result passes advanced filters
  const activePassesFilters = isStockPassingFilters(result, advancedFilters)
  const finalVisible = isVisible && activePassesFilters

  return (
    <div className="dashboard">
      {/* ── Header ── */}
      <header className="dashboard-header">
        <div className="header-left">
          <span className="logo-icon">📈</span>
          <span className="logo-text">StockScanner</span>
        </div>
        <div className="header-right">
          <span className="user-greeting">Hi, {user?.username}</span>
          <button className="btn-logout" onClick={handleLogout} id="logout-btn">
            Logout
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="dashboard-main">
        <div className="dashboard-hero">
          <h1 className="hero-title">Scan Any Stock</h1>
          <p className="hero-subtitle">
            Enter a ticker symbol to get RSI, Moving Averages, and trading signals instantly.
          </p>
          <SearchBar onSearch={handleSearch} loading={loading} />
        </div>

        <AdvancedFilters
          filters={advancedFilters}
          onFilterChange={setAdvancedFilters}
          onReset={resetFilters}
        />

        <FilterPanel activeFilter={filter} onFilterChange={setFilter} />

        {/* ── Error ── */}
        {error && (
          <div className="error-banner" style={{ maxWidth: 600, margin: '0 auto 24px' }}>
            {error}
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="skeleton-wrapper">
            <div className="skeleton skeleton-header" />
            <div className="skeleton skeleton-chart" />
            <div className="skeleton-cards">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton skeleton-card" />
              ))}
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {result && !loading && finalVisible && (
          <div className="results-wrapper">
            {/* Stock Header */}
            <div className="stock-header">
              <div className="stock-title-group">
                <h2 className="stock-symbol">{result.symbol}</h2>
                <span className="stock-name">{result.name}</span>
                {result.exchange && (
                  <span className="stock-exchange">{result.exchange}</span>
                )}
              </div>
              <div className="stock-price-group">
                <span className="stock-price">
                  {result.currency} {result.currentPrice?.toLocaleString()}
                </span>
                <SignalBadge signal={result.signal} />
              </div>
            </div>

            {/* Signal Reason */}
            <div className="signal-reason">
              <span className="reason-label">Signal Reason: </span>
              {result.reason}
            </div>

            {/* Filter Results Checklist */}
            {filterResults && (Object.values(advancedFilters).some(f => f.min !== '' || f.max !== '')) && (
              <div className="filter-results-bar">
                <span className="fr-label">Filter Check:</span>
                <div className="fr-chips">
                  {advancedFilters.price.min !== '' || advancedFilters.price.max !== '' ? (
                    <span className={`fr-chip ${filterResults.price ? 'pass' : 'fail'}`}>
                      Price {filterResults.price ? '✅' : '❌'}
                    </span>
                  ) : null}
                  {advancedFilters.volume.min !== '' ? (
                    <span className={`fr-chip ${filterResults.volume ? 'pass' : 'fail'}`}>
                      Volume {filterResults.volume ? '✅' : '❌'}
                    </span>
                  ) : null}
                  {advancedFilters.marketCap.min !== '' ? (
                    <span className={`fr-chip ${filterResults.marketCap ? 'pass' : 'fail'}`}>
                      Market Cap {filterResults.marketCap ? '✅' : '❌'}
                    </span>
                  ) : null}
                  {advancedFilters.pe.max !== '' ? (
                    <span className={`fr-chip ${filterResults.pe ? 'pass' : 'fail'}`}>
                      P/E Ratio {filterResults.pe ? '✅' : '❌'}
                    </span>
                  ) : null}
                  {advancedFilters.divYield.min !== '' ? (
                    <span className={`fr-chip ${filterResults.divYield ? 'pass' : 'fail'}`}>
                      Div Yield {filterResults.divYield ? '✅' : '❌'}
                    </span>
                  ) : null}
                </div>
              </div>
            )}

            {/* Chart */}
            <StockChart data={result.chartData} symbol={result.symbol} />

            {/* Indicators */}
            <div className="indicators-grid">
              <IndicatorCard
                label="RSI (14)"
                value={result.rsi}
                unit=""
                description={
                  result.rsi == null
                    ? 'Not enough data'
                    : result.rsi < 30
                    ? 'Oversold'
                    : result.rsi > 70
                    ? 'Overbought'
                    : 'Neutral'
                }
                color={
                  result.rsi == null
                    ? 'gray'
                    : result.rsi < 30
                    ? 'green'
                    : result.rsi > 70
                    ? 'red'
                    : 'blue'
                }
              />
              <IndicatorCard
                label="MA 50"
                value={result.ma50}
                unit={result.currency}
                description={
                  result.ma50 == null
                    ? 'Not enough data'
                    : result.currentPrice > result.ma50
                    ? 'Price above MA50'
                    : 'Price below MA50'
                }
                color={
                  result.ma50 == null
                    ? 'gray'
                    : result.currentPrice > result.ma50
                    ? 'green'
                    : 'red'
                }
              />
              <IndicatorCard
                label="MA 200"
                value={result.ma200}
                unit={result.currency}
                description={
                  result.ma200 == null
                    ? 'Not enough data'
                    : result.currentPrice > result.ma200
                    ? 'Price above MA200'
                    : 'Price below MA200'
                }
                color={
                  result.ma200 == null
                    ? 'gray'
                    : result.currentPrice > result.ma200
                    ? 'green'
                    : 'red'
                }
              />
              <IndicatorCard
                label="Volume"
                value={
                  result.volume > 1_000_000
                    ? (result.volume / 1_000_000).toFixed(2) + 'M'
                    : result.volume?.toLocaleString()
                }
                unit=""
                description="Last trading day volume"
                color="purple"
                isText
              />
              <IndicatorCard
                label="Market Cap"
                value={
                  result.marketCap > 1_000_000_000_000
                    ? (result.marketCap / 1_000_000_000_000).toFixed(2) + 'T'
                    : result.marketCap > 1_000_000_000
                    ? (result.marketCap / 1_000_000_000).toFixed(2) + 'B'
                    : result.marketCap?.toLocaleString()
                }
                unit=""
                description="Total market value"
                color="blue"
                isText
              />
              <IndicatorCard
                label="P/E Ratio"
                value={result.trailingPE}
                unit=""
                description={result.trailingPE ? "Trailing 12 months" : "No PE ratio"}
                color={!result.trailingPE ? "gray" : result.trailingPE < 20 ? "green" : result.trailingPE > 40 ? "red" : "blue"}
              />
              <IndicatorCard
                label="Div Yield"
                value={result.dividendYield}
                unit="%"
                description={result.dividendYield ? "Annual yield" : "No dividend"}
                color={!result.dividendYield ? "gray" : "green"}
              />
              <IndicatorCard
                label="Avg Volume"
                value={
                  result.averageVolume > 1_000_000
                    ? (result.averageVolume / 1_000_000).toFixed(2) + 'M'
                    : result.averageVolume?.toLocaleString()
                }
                unit=""
                description="3-month average"
                color="purple"
                isText
              />
            </div>

            {/* 52W Range Bar */}
            {result.fiftyTwoWeekLow && result.fiftyTwoWeekHigh && (
              <div className="range-52w-wrapper">
                <div className="range-52w-labels">
                  <span>52W Low: {result.currency} {result.fiftyTwoWeekLow}</span>
                  <span>52W High: {result.currency} {result.fiftyTwoWeekHigh}</span>
                </div>
                <div className="range-52w-bar-bg">
                  <div
                    className="range-52w-bar-fill"
                    style={{
                      left: `${((result.currentPrice - result.fiftyTwoWeekLow) / (result.fiftyTwoWeekHigh - result.fiftyTwoWeekLow)) * 100}%`
                    }}
                  />
                  <div
                    className="range-52w-marker"
                    style={{
                      left: `${((result.currentPrice - result.fiftyTwoWeekLow) / (result.fiftyTwoWeekHigh - result.fiftyTwoWeekLow)) * 100}%`
                    }}
                  />
                </div>
              </div>
            )}

            {/* Golden Cross */}
            {result.goldenCross !== null && result.goldenCross !== undefined && (
              <div className={`cross-banner ${result.goldenCross ? 'golden' : 'death'}`}>
                <span className="cross-icon">
                  {result.goldenCross ? '✨' : '💀'}
                </span>
                <div>
                  <strong>
                    {result.goldenCross ? 'Golden Cross Detected' : 'Death Cross Detected'}
                  </strong>
                  <p>
                    {result.goldenCross
                      ? '50-day MA has crossed above the 200-day MA — a bullish trend signal.'
                      : '50-day MA has crossed below the 200-day MA — a bearish trend signal.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Empty filtered state ── */}
        {result && !loading && !finalVisible && (
          <div className="empty-filter">
            <span>🔍</span>
            <p>
              <strong>{result.symbol}</strong> doesn't match your active filters.
            </p>
          </div>
        )}

        {/* ── Initial empty state ── */}
        {!result && !loading && !error && (
          <div className="empty-state">
            <div className="empty-icon">🔭</div>
            <h3>No stock selected</h3>
            <p>
              Search for a ticker symbol above (e.g., <strong>AAPL</strong>, <strong>TCS.NS</strong>,{' '}
              <strong>TSLA</strong>) to see analysis.
            </p>
          </div>
        )}

        <RecentStockGrid 
          history={filteredHistory} 
          onSelect={handleSearch} 
          onClear={clearHistory} 
        />
      </main>
    </div>
  )
}
