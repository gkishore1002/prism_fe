/** Prism design tokens — bold navy + CSC gold (see PRISM_DESIGN_SYSTEM.md) */

export const colors = {
  blue: {
    50: '#edf4ff',
    100: '#d4e6fc',
    200: '#a8c8f0',
    300: '#7aade6',
    400: '#5290da',
    500: '#3575c4',
    600: '#2a60a8',
    700: '#1e4a82',
    800: '#163a66',
    900: '#0c2238',
  },
  yellow: {
    50: '#fff9e6',
    100: '#ffecb3',
    200: '#ffd966',
    300: '#f5c830',
    400: '#e8b820',
    500: '#d4a008',
    600: '#b8860b',
    700: '#966f00',
  },
  surface: {
    0: '#ffffff',
    50: '#fffbf0',
    100: '#fef3d6',
    200: '#f5e8c8',
    300: '#ead9b0',
  },
  text: {
    primary: '#163a66',
    secondary: '#466080',
    muted: '#6e8499',
    faint: '#a3b5c8',
  },
  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
  },
  rose: {
    50: '#fff1f2',
    100: '#ffe4e6',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
  },
  indigo: {
    50: '#eef2ff',
    100: '#e0e7ff',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
  },
} as const

export const gradients = {
  dark: 'linear-gradient(to bottom right, #0c2238, #1e4a82, #0c2238)',
  brandIcon: 'linear-gradient(135deg, #f5c830 0%, #e8b820 100%)',
  mesh: `
    radial-gradient(ellipse 90% 55% at 50% -15%, rgba(232, 184, 32, 0.14), transparent 55%),
    radial-gradient(ellipse 55% 45% at 100% 0%, rgba(255, 236, 179, 0.42), transparent 50%),
    radial-gradient(ellipse 45% 40% at 0% 100%, rgba(254, 243, 214, 0.55), transparent 55%),
    linear-gradient(180deg, #fffaeb 0%, #fff8e6 48%, #fffbf0 100%)
  `,
  progressBlue: 'linear-gradient(90deg, #7aade6, #3575c4)',
  progressYellow: 'linear-gradient(90deg, #ffd966, #e8b820)',
  appBg: '#fffaeb',
} as const

export const layout = {
  sidebarWidth: 260,
  sidebarCollapsed: 68,
  headerHeight: 64,
  maxContentWidth: 1400,
  radiusCard: 14,
  radiusBtn: 8,
  radiusInput: 10,
  radiusBadge: 20,
} as const
