import { baseTheme, getToneClasses } from '@/theme'

/** Student theme — minimal density (see LEARNOVA_DESIGN_SYSTEM.md §5) */
export const studentTheme = {
  ...baseTheme,
  primaryTone: 'blue' as const,
  accentTone: 'yellow' as const,
  heroCard: 'rounded-[14px] bg-gradient-to-br from-yellow-50 to-yellow-100/70 border border-yellow-100',
  focusCard: `${baseTheme.panel} accent-yellow bg-yellow-50/50 border-yellow-100`,
  maxWidth: 'max-w-2xl',
}

export const studentTones = {
  health: getToneClasses('blue', 'soft'),
  action: getToneClasses('yellow', 'soft'),
  ai: getToneClasses('indigo', 'soft'),
  risk: getToneClasses('rose', 'soft'),
  success: getToneClasses('emerald', 'soft'),
}
