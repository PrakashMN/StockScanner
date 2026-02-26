export default function SignalBadge({ signal }) {
  const map = {
    Bullish:  { emoji: '🚀', cls: 'badge-bullish' },
    Bearish:  { emoji: '🐻', cls: 'badge-bearish' },
    Neutral:  { emoji: '⚖️', cls: 'badge-neutral' },
  }
  const { emoji, cls } = map[signal] || map.Neutral

  return (
    <div className={`signal-badge ${cls}`}>
      <span className="badge-emoji">{emoji}</span>
      <span className="badge-text">{signal}</span>
    </div>
  )
}
