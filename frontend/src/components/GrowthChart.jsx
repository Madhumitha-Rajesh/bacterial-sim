import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function GrowthChart({ series }) {
  const data = series.time.map((t, i) => ({
    time: t,
    population: series.totalPopulation[i],
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#eef1f6" vertical={false} />
        <XAxis
          dataKey="time"
          tickFormatter={(v) => `${v}h`}
          tick={{ fontSize: 11, fill: '#9aa4b2' }}
          axisLine={{ stroke: '#e4e8f0' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v) => `${v}`}
          tick={{ fontSize: 11, fill: '#9aa4b2' }}
          axisLine={{ stroke: '#e4e8f0' }}
          tickLine={false}
          width={44}
          label={{ value: 'CFU', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9aa4b2' }}
        />
        <Tooltip
          formatter={(value) => [`${Math.round(value)} CFU`, 'Population']}
          labelFormatter={(label) => `t = ${label}h`}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e8f0' }}
        />
        <Line
          type="monotone"
          dataKey="population"
          stroke="#2f6fed"
          strokeWidth={2.5}
          dot={false}
          isAnimationActive={true}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
