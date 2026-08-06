/** Prism design tokens — modern academic SaaS (Indigo) */

export const colors = {
  blue: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#0f172a',
  },
  yellow: {
    50: '#fef3c7',
    100: '#fde68a',
    200: '#fcd34d',
    300: '#fbbf24',
    400: '#f59e0b',
    500: '#d97706',
    600: '#b45309',
    700: '#92400e',
  },
  surface: {
    0: '#ffffff',
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
  },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    muted: '#94a3b8',
    faint: '#cbd5e1',
  },
  emerald: {
    50: '#dcfce7',
    100: '#bbf7d0',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
  },
  rose: {
    50: '#fee2e2',
    100: '#fecaca',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  indigo: {
    50: '#eef2ff',
    100: '#e0e7ff',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
  },
  sky: '#0ea5e9',
  violet: '#8b5cf6',
  cyan: '#06b6d4',
  amber: '#f59e0b',
  chart: {
    blue: '#3b82f6',
    indigo: '#6366f1',
    violet: '#8b5cf6',
    emerald: '#10b981',
    amber: '#f59e0b',
    rose: '#f43f5e',
    cyan: '#06b6d4',
    slate: '#64748b',
  },
} as const

export const gradients = {
  dark: 'linear-gradient(145deg, #312e81 0%, #4f46e5 45%, #0ea5e9 100%)',
  brandIcon: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 55%, #8b5cf6 100%)',
  mesh: `
    radial-gradient(ellipse 80% 50% at 8% -10%, rgba(79, 70, 229, 0.1), transparent 55%),
    radial-gradient(ellipse 55% 40% at 95% 0%, rgba(139, 92, 246, 0.08), transparent 50%)
  `,
  progressBlue: 'linear-gradient(90deg, #818cf8, #4f46e5)',
  progressYellow: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
  appBg: '#f8fafc',
} as const

export const layout = {
  sidebarWidth: 260,
  sidebarCollapsed: 72,
  headerHeight: 56,
  maxContentWidth: 1440,
  radiusCard: 20,
  radiusBtn: 12,
  radiusInput: 12,
  radiusBadge: 8,
} as const
