import { baseTheme, getToneClasses } from '@/theme'

export const tutorTheme = {
  ...baseTheme,
  primaryTone: 'blue' as const,
  accentTone: 'yellow' as const,
  insightPanel: `${baseTheme.panelSoft} accent-yellow`,
  studentCard: `${baseTheme.panel} ${baseTheme.cardHover}`,
}

export const tutorTones = {
  class: getToneClasses('blue', 'soft'),
  insight: getToneClasses('yellow', 'soft'),
  risk: getToneClasses('rose', 'soft'),
  success: getToneClasses('emerald', 'soft'),
}
