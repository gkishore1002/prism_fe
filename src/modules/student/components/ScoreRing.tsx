import { cn } from '@/lib/cn'

interface ScoreRingProps {
  value: number
  size?: number
  label?: string
  sublabel?: string
  color?: 'brand' | 'gold' | 'emerald'
  className?: string
}

const strokeMap = {
  brand: { stroke: '#0065F3', track: '#D9EAFF', text: 'text-foreground' },
  gold: { stroke: '#FF950A', track: '#FFEFD0', text: 'text-yellow-600' },
  emerald: { stroke: '#10B981', track: '#DCFCE7', text: 'text-leaf' },
}

export function ScoreRing({
  value,
  size = 120,
  label,
  sublabel,
  color = 'brand',
  className,
}: ScoreRingProps) {
  const stroke = 8
  const radius = (size - stroke * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const colors = strokeMap[color]

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.track}
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-mono-data font-semibold leading-none', colors.text)} style={{ fontSize: size * 0.22 }}>
            {value}%
          </span>
          {sublabel && (
            <span className="text-[9px] text-muted-foreground mt-0.5 font-sans">{sublabel}</span>
          )}
        </div>
      </div>
      {label && (
        <p className="text-[11px] font-display font-medium text-muted-foreground mt-2 uppercase tracking-wide">{label}</p>
      )}
    </div>
  )
}