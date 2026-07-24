import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'
import { cn } from '@/lib/cn'

interface TopicBarChartProps {
  data: { name: string; mastery: number; status: string }[]
  height?: number
  className?: string
}

const statusColors: Record<string, string> = {
  excellent: '#10b981',
  good: '#22c55e',
  fair: '#f59e0b',
  weak: '#f97316',
  critical: '#ef4444',
}

export function TopicBarChart({ data, height = 220, className }: TopicBarChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#a1a1aa' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#52525b' }}
          />
          <Tooltip
            contentStyle={{
              background: 'white',
              border: '1px solid #e4e4e7',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value) => [`${value}%`, 'Mastery']}
          />
          <Bar dataKey="mastery" radius={[0, 4, 4, 0]} barSize={16}>
            {data.map((entry, i) => (
              <Cell key={i} fill={statusColors[entry.status] ?? '#6366f1'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}