import { baseTheme, getToneClasses } from '@/theme'

export const adminTheme = {
  ...baseTheme,
  primaryTone: 'blue' as const,
  accentTone: 'yellow' as const,
  hero: 'rounded-[14px] gradient-dark text-white',
  metricRow: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
}

export const adminTones = {
  institution: getToneClasses('blue', 'soft'),
  metric: getToneClasses('yellow', 'soft'),
  analytics: getToneClasses('indigo', 'soft'),
  success: getToneClasses('emerald', 'soft'),
}
