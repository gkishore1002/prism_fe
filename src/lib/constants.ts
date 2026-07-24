import type { HealthStatus } from '@/types'

export const APP_NAME = 'Prism'

export const HEALTH_CONFIG: Record<
  HealthStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  excellent: {
    label: 'Excellent',
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    dot: 'bg-emerald-500',
  },
  good: {
    label: 'Good',
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    dot: 'bg-emerald-500',
  },
  fair: {
    label: 'Fair',
    color: 'text-yellow-700',
    bg: 'bg-yellow-100',
    dot: 'bg-yellow-500',
  },
  weak: {
    label: 'Weak',
    color: 'text-yellow-700',
    bg: 'bg-yellow-100',
    dot: 'bg-yellow-400',
  },
  critical: {
    label: 'Critical',
    color: 'text-rose-700',
    bg: 'bg-rose-100',
    dot: 'bg-rose-500',
  },
}

export function getHealthStatus(score: number): HealthStatus {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 55) return 'fair'
  if (score >= 40) return 'weak'
  return 'critical'
}

export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`
}

export function formatTrend(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}
