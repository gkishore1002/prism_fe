import { baseTheme } from '@/theme'

export const authTheme = {
  ...baseTheme,
  darkPanel: 'gradient-dark',
  lightPanel: 'app-page-bg',
  brandMark: 'w-10 h-10 rounded-[14px] gradient-brand-icon flex items-center justify-center ios-shadow-sm',
  roleCard: `${baseTheme.panel} card-hover`,
  input: baseTheme.input,
}
