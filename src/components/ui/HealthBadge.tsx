import { cn } from '@/lib/cn'
import type { HealthStatus } from '@/types'
import { HEALTH_CONFIG } from '@/lib/constants'

interface HealthBadgeProps {
  status: HealthStatus
  score?: number
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

export function HealthBadge({ status, score, size = 'sm', showLabel = true, className }: HealthBadgeProps) {
  const config = HEALTH_CONFIG[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-display font-medium rounded-[20px]',
        config.bg,
        config.color,
        size === 'sm' ? 'px-2.5 py-[3px] text-[10.5px]' : 'px-3 py-1 text-xs',
        className,
      )}
    >
      <span className={cn('rounded-full', size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2', config.dot)} />
      {showLabel && config.label}
      {score !== undefined && (
        <span className="font-mono-data font-semibold">{score}%</span>
      )}
    </span>
  )
}