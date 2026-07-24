import { cn } from '@/lib/cn'

interface ProgressBarProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  color?: 'brand' | 'yellow' | 'emerald' | 'rose' | 'indigo'
  showValue?: boolean
  className?: string
}

const colorMap = {
  brand: 'bg-gradient-to-r from-blue-300 to-blue-500',
  yellow: 'bg-gradient-to-r from-yellow-200 to-yellow-400',
  emerald: 'bg-gradient-to-r from-emerald-300 to-emerald-500',
  rose: 'bg-gradient-to-r from-rose-300 to-rose-500',
  indigo: 'bg-gradient-to-r from-indigo-300 to-indigo-500',
}

const sizeMap = {
  sm: 'h-1.5',
  md: 'h-[6px]',
  lg: 'h-3',
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  color = 'brand',
  showValue,
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn('flex-1 bg-border/60 rounded-full overflow-hidden', sizeMap[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]', colorMap[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showValue && (
        <span className="text-[12px] font-mono-data font-medium text-muted-foreground w-8 text-right">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  )
}