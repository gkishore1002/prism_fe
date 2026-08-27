import type { HealthStatus } from '@/types'

export const APP_NAME = 'Prism'
export const APP_TAGLINE = 'AI-Powered Academic Intelligence'
export const APP_WORKFLOW = ['Learn', 'Assess', 'Analyze', 'Improve'] as const
export const APP_ORG = 'Prism Software'

export const BRAND_MARK = '/brand/prism-mark.png'
export const BRAND_LOGO_FULL = '/brand/prism-logo-full.png'
export const BRAND_MARK_DARK = '/brand/prism-mark.png'
export const BRAND_PRIMARY = '#003B7A'
export const BRAND_ACCENT = '#FFC700'

/**
 * Health status → Swotify semantic colour families:
 *   excellent / good → Emerald  (positive outcome)
 *   fair             → Gold     (in-progress / watch)
 *   weak             → Gold     (caution)
 *   critical         → Coral    (risk detected)
 */
export const HEALTH_CONFIG: Record<
  HealthStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  excellent: {
    label: 'Excellent',
    color: 'text-emerald-700',
    bg:    'bg-emerald-100',
    dot:   'bg-emerald-500',
  },
  good: {
    label: 'Good',
    color: 'text-emerald-700',
    bg:    'bg-emerald-100',
    dot:   'bg-emerald-500',
  },
  fair: {
    label: 'Fair',
    color: 'text-gold-700',
    bg:    'bg-gold-100',
    dot:   'bg-gold-500',
  },
  weak: {
    label: 'Weak',
    color: 'text-gold-700',
    bg:    'bg-gold-100',
    dot:   'bg-gold-600',
  },
  critical: {
    label: 'Critical',
    color: 'text-coral-700',
    bg:    'bg-coral-100',
    dot:   'bg-coral-500',
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
