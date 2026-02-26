import React from 'react'

export default function RecentStockGrid({ history, onSelect, onClear }) {
  if (history.length === 0) return null

  return (
    <div className="recent-grid-section">
      <div className="recent-header">
        <h2 className="recent-grid-title">🕒 Recently Analyzed</h2>
        <button className="btn-clear-history" onClick={onClear}>Clear All</button>
      </div>
      
      <div className="recent-grid">
        {history.map((item) => (
          <div 
            key={item.symbol} 
            className="history-card" 
            onClick={() => onSelect(item.symbol)}
          >
            <div className="hc-top">
              <span className="hc-symbol">{item?.symbol || 'Unknown'}</span>
              <span className={`hc-signal ${(item?.signal || 'Neutral').toLowerCase()}`}>
                {item?.signal || 'Neutral'}
              </span>
            </div>
            
            <div className="hc-main">
              <div className="hc-item">
                <span className="hc-label">Price</span>
                <span className="hc-value">
                  <span className="hc-currency">{item?.currency || 'INR'}</span> {item.price?.toLocaleString() || '—'}
                </span>
              </div>
              <div className="hc-item">
                <span className="hc-label">RSI</span>
                <span className={`hc-value rsi-${item?.rsi > 70 ? 'overbought' : item?.rsi < 30 ? 'oversold' : 'neutral'}`}>
                  {item?.rsi?.toFixed(1) || '—'}
                </span>
              </div>
            </div>
            
            <div className="hc-name">{item.name}</div>
            <div className="hc-accent-bar" style={{ 
              background: item.signal === 'Bullish' ? 'var(--green)' : 
                         item.signal === 'Bearish' ? 'var(--red)' : 'var(--blue)' 
            }} />
          </div>
        ))}
      </div>
    </div>
  )
}
