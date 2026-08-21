/** Prism Design System — Swotify Plus sapphire × gold × warm surfaces */

export const colors = {
  /* ── Sapphire (anchored on #1C2739) ── */
  sapphire: {
    900: '#0F172A',
    800: '#1C2739',
    700: '#2A3B52',
    600: '#3A516E',
    500: '#4D6B8F',
    400: '#6B89AB',
    300: '#90ADC8',
    200: '#B7CDDF',
    100: '#D9E4EE',
    50:  '#EDF2F7',
  },
  /* ── Solar Gold (CTAs, interventions, urgency) ── */
  gold: {
    700: '#9A6D04',
    600: '#D4960A',
    500: '#F7B731',
    400: '#FACE6A',
    300: '#FCD98A',
    100: '#FEF3D6',
    50:  '#FFFAEB',
  },
  /* ── Emerald (success / positive outcomes) ── */
  emerald: {
    700: '#047857',
    600: '#059669',
    500: '#0CBF6E',
    400: '#4ADE80',
    100: '#D1FAE5',
    50:  '#ECFDF5',
  },
  /* ── Coral (risk / alerts) ── */
  coral: {
    700: '#B91C1C',
    600: '#DC2626',
    500: '#FF6B6B',
    400: '#FCA5A5',
    100: '#FEE2E2',
    50:  '#FEF2F2',
  },
  /* ── Violet (AI / intelligence) ── */
  violet: {
    800: '#5B21B6',
    700: '#6D28D9',
    600: '#7C3AED',
    500: '#8B5CF6',
    400: '#A78BFA',
    100: '#EDE9FE',
    50:  '#F5F3FF',
  },
  /* ── Warm neutral surfaces ── */
  surface: {
    0:   '#FFFFFF',
    1:   '#FFFFFF',
    50:  '#FAFAF7',
    100: '#F5F4F0',
    200: '#EEEDEA',
    300: '#E0DFDB',
  },
  /* ── Metric card categories ── */
  metric: {
    volume:   { bg: '#FFFFFF', text: '#0F172A', accent: '#1C2739' },
    healthy:  { bg: '#FFFFFF', text: '#0F172A', accent: '#0CBF6E' },
    risk:     { bg: '#FFFFFF', text: '#0F172A', accent: '#FF6B6B' },
    caution:  { bg: '#FFFFFF', text: '#0F172A', accent: '#F7B731' },
    activity: { bg: '#FFFFFF', text: '#0F172A', accent: '#8B5CF6' },
    action:   { bg: '#FFFFFF', text: '#0F172A', accent: '#3A516E' },
  },
  /* ── Semantic aliases ── */
  primary:      '#1C2739',
  primaryHover: '#2A3B52',
  accent:       '#F7B731',
  background:   '#FAFAF7',
  surfaceSolid: '#FFFFFF',
  sidebar:      '#0F172A',
  border:       '#EEEDEA',
  hover:        '#F5F4F0',
  selected:     '#EDF2F7',
  ink:          '#0F172A',
  ai:           '#8B5CF6',
  success:      '#059669',
  warning:      '#F7B731',
  danger:       '#DC2626',
  leaf:         '#0CBF6E',
  rose:         '#FF6B6B',
  /* Backward-compat aliases */
  blue: {
    50:  '#EDF2F7',
    100: '#D9E4EE',
    200: '#B7CDDF',
    500: '#4D6B8F',
    600: '#1C2739',
    700: '#2A3B52',
    900: '#0F172A',
  },
  yellow: {
    50:  '#FFFAEB',
    100: '#FEF3D6',
    400: '#F7B731',
    500: '#D4960A',
    600: '#D4960A',
    700: '#9A6D04',
  },
  indigo: {
    50:  '#F5F3FF',
    100: '#EDE9FE',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
  },
  navy: {
    50:  '#EDF2F7',
    200: '#90ADC8',
    500: '#4D6B8F',
    700: '#1C2739',
    900: '#0F172A',
  },
  heritage: {
    parchment: '#FAFAF7',
    navy:      '#0F172A',
    ink:       '#0F172A',
    gold:      '#F7B731',
  },
  /** Chart palette */
  chart: {
    sapphire: '#1C2739',
    gold:     '#F7B731',
    emerald:  '#0CBF6E',
    coral:    '#FF6B6B',
    violet:   '#8B5CF6',
    amber:    '#D4960A',
    slate:    '#64748B',
    /* legacy aliases */
    blue:     '#1C2739',
    indigo:   '#8B5CF6',
    cyan:     '#4D6B8F',
    rose:     '#FF6B6B',
  },
  text: {
    primary:   '#0F172A',
    secondary: '#64748B',
    muted:     '#94A3B8',
    faint:     '#CBD5E1',
  },
} as const

export const gradients = {
  dark:           'linear-gradient(to bottom right, #0F172A, #1E293B, #0F172A)',
  darkVertical:   'linear-gradient(to bottom, #0F172A, #1E293B, #0F172A)',
  darkRadial:     'radial-gradient(ellipse at top left, #1E293B, #0F172A)',
  brandIcon:      'linear-gradient(135deg, #FACE6A 0%, #F7B731 100%)',
  sapphireToGold: 'linear-gradient(135deg, #1C2739, #F7B731)',
  avatarSapphire: 'linear-gradient(135deg, #3A516E, #8B5CF6)',
  progressGold:   'linear-gradient(90deg, #FACE6A, #F7B731)',
  progressEmerald:'linear-gradient(90deg, #4ADE80, #0CBF6E)',
  mesh: `
    radial-gradient(ellipse 80% 50% at 8% -10%, rgba(28, 39, 57, 0.04), transparent 55%),
    radial-gradient(ellipse 55% 40% at 95% 0%, rgba(247, 183, 49, 0.05), transparent 50%)
  `,
  appBg: '#FAFAF7',
} as const

export const layout = {
  sidebarWidth:     260,
  sidebarCollapsed: 72,
  headerHeight:     64,
  maxContentWidth:  1400,
  radiusCard:       14,
  radiusBtn:         8,
  radiusInput:      10,
  radiusBadge:      20,
} as const
