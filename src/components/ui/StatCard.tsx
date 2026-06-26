import { cn } from '@/lib/cn'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type Accent = 'blue' | 'yellow' | 'emerald' | 'rose' | 'indigo'

interface StatCardProps {
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  subtitle?: string
  accent?: Accent
  className?: string
}

const accentBorder: Record<Accent, string> = {
  blue: 'border-l-blue-500',
  yellow: 'border-l-yellow-400',
  emerald: 'border-l-emerald-500',
  rose: 'border-l-rose-500',
  indigo: 'border-l-indigo-500',
}

const accentValue: Record<Accent, string> = {
  blue: 'text-blue-700',
  yellow: 'text-yellow-600',
  emerald: 'text-emerald-600',
  rose: 'text-rose-600',
  indigo: 'text-indigo-600',
}

export function StatCard({
  label,
  value,
  change,
  trend,
  icon,
  subtitle,
  accent = 'blue',
  className,
}: StatCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor =
    trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-text-muted'

  return (
    <div
      className={cn(
        'relative bg-surface rounded-[14px] border border-surface-200 p-5',
        'border-l-[4px]',
        accentBorder[accent],
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-display font-medium uppercase tracking-[1.5px] text-text-muted">
            {label}
          </p>
          <p className={cn('text-[28px] font-mono-data font-semibold tabular-nums', accentValue[accent])}>
            {value}
          </p>
          {subtitle && <p className="text-[12px] text-text-secondary">{subtitle}</p>}
        </div>
        {icon && (
          <div className="p-2 rounded-[10px] bg-blue-50 text-blue-600">{icon}</div>
        )}
      </div>
      {change !== undefined && trend && (
        <div className={cn('flex items-center gap-1 mt-3 text-[12px] font-medium', trendColor)}>
          <TrendIcon className="w-3.5 h-3.5" />
          <span className="font-mono-data">{change > 0 ? '+' : ''}{change}%</span>
          <span className="text-text-muted font-normal font-sans">vs last month</span>
        </div>
      )}
    </div>
  )
}
