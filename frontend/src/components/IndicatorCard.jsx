export default function IndicatorCard({ label, value, unit, description, color, isText }) {
  const colorMap = {
    green: 'var(--green)',
    red: 'var(--red)',
    blue: 'var(--blue)',
    purple: 'var(--purple)',
    gray: 'var(--muted)',
  }
  const accent = colorMap[color] || colorMap.gray

  return (
    <div className="indicator-card" style={{ '--accent': accent }}>
      <div className="ic-label">{label}</div>
      <div className="ic-value" style={{ color: accent }}>
        {value == null ? '—' : isText ? value : (
          <>
            {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}
            {unit && <span className="ic-unit"> {unit}</span>}
          </>
        )}
      </div>
      <div className="ic-desc">{description}</div>
      <div className="ic-accent-bar" />
    </div>
  )
}
