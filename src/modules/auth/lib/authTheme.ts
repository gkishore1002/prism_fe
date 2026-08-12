import { baseTheme } from '@/theme'

/** Login surfaces match the main app Spectrum theme. */
export const authTheme = {
  ...baseTheme,
  darkPanel: 'gradient-dark relative overflow-hidden',
  bluePanel: 'gradient-dark relative overflow-hidden border-r border-white/10',
  lightPanel: 'bg-background topo-texture',
  brandMark:
    'w-10 h-10 rounded-[14px] gradient-brand-icon flex items-center justify-center ios-shadow-sm',
  roleCard: `${baseTheme.panel} card-hover`,
  input:
    'w-full rounded-[10px] border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-accent focus:shadow-[0_0_0_3px_rgba(0,101,243,0.18)]',
  inputCompact:
    'w-full rounded-[10px] border border-border bg-white px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-accent focus:shadow-[0_0_0_3px_rgba(0,101,243,0.18)]',
}
