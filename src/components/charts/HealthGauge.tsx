import { cn } from '@/lib/cn'

interface HealthGaugeProps {
  value: number
  size?: number
  label?: string
  className?: string
}

function getGaugeColor(value: number) {
  if (value >= 85) return { stroke: '#0CBF6E', text: 'text-emerald-600' }
  if (value >= 70) return { stroke: '#1C2739', text: 'text-blue-600' }
  if (value >= 55) return { stroke: '#F7B731', text: 'text-yellow-600' }
  if (value >= 40) return { stroke: '#F7B731', text: 'text-yellow-600' }
  return { stroke: '#FF6B6B', text: 'text-coral-600' }
}

export function HealthGauge({ value, size = 160, label = 'Academic Health', className }: HealthGaugeProps) {
  const radius = (size - 20) / 2
  const circumference = Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const colors = getGaugeColor(value)

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        <path
          d={`M 10 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none"
          stroke="#EEEDEA"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d={`M 10 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <text
          x={size / 2}
          y={size / 2 - 8}
          textAnchor="middle"
          className={cn('text-3xl font-bold fill-current', colors.text)}
          style={{ fontSize: size * 0.18 }}
        >
          {value}%
        </text>
        <text
          x={size / 2}
          y={size / 2 + 14}
          textAnchor="middle"
          className="fill-zinc-400"
          style={{ fontSize: size * 0.07 }}
        >
          {label}
        </text>
      </svg>
    </div>
  )
}