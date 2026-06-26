import { baseTheme } from '@/theme'

export const authTheme = {
  ...baseTheme,
  darkPanel: 'gradient-dark',
  lightPanel: 'app-page-bg',
  brandMark: 'w-9 h-9 rounded-[10px] gradient-brand-icon flex items-center justify-center',
  roleCard: `${baseTheme.panel} card-hover`,
  input: baseTheme.input,
}
