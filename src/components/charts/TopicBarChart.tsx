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
  excellent: '#0CBF6E',
  good: '#1C2739',
  fair: '#F7B731',
  average: '#F7B731',
  weak: '#F7B731',
  critical: '#FF6B6B',
}

export function TopicBarChart({ data, height = 220, className }: TopicBarChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEEDEA" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#94A3B8' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#64748B' }}
          />
          <Tooltip
            contentStyle={{
              background: 'white',
              border: '1px solid #EEEDEA',
              borderRadius: '10px',
              fontSize: '12px',
            }}
            formatter={(value) => [`${value}%`, 'Mastery']}
          />
          <Bar dataKey="mastery" radius={[0, 4, 4, 0]} barSize={16}>
            {data.map((entry, i) => (
              <Cell key={i} fill={statusColors[entry.status] ?? '#1C2739'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}