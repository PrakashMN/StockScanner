import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="ct-date">{label}</p>
        <p className="ct-price">
          Close: <strong>{payload[0].value?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
        </p>
      </div>
    )
  }
  return null
}

export default function StockChart({ data, symbol }) {
  if (!data || data.length === 0) return null

  // Show every 5th date label to avoid crowding
  const tickFormatter = (val, i) => (i % 5 === 0 ? val : '')

  const minVal = Math.min(...data.map((d) => d.close)) * 0.995
  const maxVal = Math.max(...data.map((d) => d.close)) * 1.005

  return (
    <div className="chart-wrapper">
      <div className="chart-header">
        <span className="chart-title">{symbol} — 30-Day Price</span>
        <span className="chart-badge">Close Price</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
          <XAxis
            dataKey="date"
            tickFormatter={tickFormatter}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
          />
          <YAxis
            domain={[minVal, maxVal]}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="close"
            stroke="#6c63ff"
            strokeWidth={2.5}
            fill="url(#priceGrad)"
            dot={false}
            activeDot={{ r: 5, fill: '#6c63ff', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
