import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { cn } from '@/lib/cn'

interface TrendChartProps {
  data: { week?: string; month?: string; health: number }[]
  dataKey?: string
  height?: number
  className?: string
}

export function TrendChart({ data, dataKey = 'week', height = 200, className }: TrendChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
          <XAxis
            dataKey={dataKey}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#a1a1aa' }}
          />
          <YAxis
            domain={[50, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#a1a1aa' }}
          />
          <Tooltip
            contentStyle={{
              background: 'white',
              border: '1px solid #e4e4e7',
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
            formatter={(value) => [`${value}%`, 'Health']}
          />
          <Area
            type="monotone"
            dataKey="health"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#healthGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}