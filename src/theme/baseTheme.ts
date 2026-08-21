import { colors } from './tokens'

/** Shared UI class tokens — Swotify Plus patterns */
export const baseTheme = {
  shell:       'rounded-[14px] border border-border glass-card',
  panel:       'rounded-[14px] border border-border glass-card',
  panelSoft:   'rounded-[14px] border border-border bg-secondary/80',
  input:       'ios-input',
  buttonPrimary:   'btn btn-primary px-[18px] py-2 text-[12px]',
  buttonAction:    'btn btn-action px-[18px] py-2 text-[12px]',
  buttonSecondary: 'btn btn-secondary px-[18px] py-2 text-[12px]',
  buttonGhost:     'btn btn-ghost px-[18px] py-2 text-[12px]',
  chip:    'inline-flex items-center gap-1 rounded-[20px] px-[10px] py-[3px] text-[10.5px] font-display font-medium',
  statCard: 'rounded-[14px] border border-border glass-card p-5',
  cardHover:
    'transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-card-raised active:scale-[0.97]',
} as const

/**
 * Tone styles mapped to Swotify semantic colour families.
 *
 * sapphire → brand / navigation / default UI
 * gold     → actions / interventions / urgency
 * emerald  → positive outcomes / growth
 * coral    → risk / alerts / needs attention
 * violet   → AI suggestions / intelligence
 */
export const toneStyles = {
  sapphire: {
    solid:  'bg-sapphire-800 text-white',
    soft:   'bg-sapphire-50 text-sapphire-700 border-sapphire-100',
    muted:  'bg-sapphire-100 text-sapphire-700',
    border: 'border-sapphire-200',
    accent: 'border-l-[#1C2739]',
    icon:   'bg-sapphire-100 text-sapphire-600',
  },
  gold: {
    solid:  'bg-gold-500 text-sapphire-900',
    soft:   'bg-gold-100 text-gold-700 border-gold-100',
    muted:  'bg-gold-100 text-gold-700',
    border: 'border-gold-500',
    accent: 'border-l-[#F7B731]',
    icon:   'bg-gold-100 text-gold-700',
  },
  emerald: {
    solid:  'bg-emerald-500 text-white',
    soft:   'bg-emerald-50 text-emerald-700 border-emerald-100',
    muted:  'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-200',
    accent: 'border-l-emerald-500',
    icon:   'bg-emerald-100 text-emerald-700',
  },
  coral: {
    solid:  'bg-coral-500 text-white',
    soft:   'bg-coral-50 text-coral-700 border-coral-100',
    muted:  'bg-coral-100 text-coral-700',
    border: 'border-coral-200',
    accent: 'border-l-coral-500',
    icon:   'bg-coral-100 text-coral-700',
  },
  violet: {
    solid:  'bg-violet-500 text-white',
    soft:   'bg-violet-50 text-violet-700 border-violet-100',
    muted:  'bg-violet-100 text-violet-700',
    border: 'border-violet-200',
    accent: 'border-l-violet-500',
    icon:   'bg-violet-100 text-violet-700',
  },
  /** Legacy aliases */
  navy: {
    solid:  'bg-navy-900 text-white',
    soft:   'bg-navy-50 text-navy-700 border-navy-200',
    muted:  'bg-navy-50 text-navy-700',
    border: 'border-navy-200',
    accent: 'border-l-[#1C2739]',
    icon:   'bg-navy-50 text-navy-700',
  },
  blue: {
    solid:  'bg-blue-600 text-white',
    soft:   'bg-blue-50 text-blue-700 border-blue-100',
    muted:  'bg-blue-100 text-blue-700',
    border: 'border-blue-200',
    accent: 'border-l-blue-500',
    icon:   'bg-blue-100 text-blue-600',
  },
  yellow: {
    solid:  'bg-yellow-400 text-sapphire-900',
    soft:   'bg-yellow-50 text-yellow-700 border-yellow-100',
    muted:  'bg-yellow-100 text-yellow-700',
    border: 'border-yellow-200',
    accent: 'border-l-yellow-400',
    icon:   'bg-yellow-100 text-yellow-700',
  },
  rose: {
    solid:  'bg-rose text-white',
    soft:   'bg-rose-50 text-rose-700 border-rose-100',
    muted:  'bg-rose-100 text-rose-700',
    border: 'border-rose-200',
    accent: 'border-l-rose-500',
    icon:   'bg-rose-50 text-rose-600',
  },
  indigo: {
    solid:  'bg-indigo-600 text-white',
    soft:   'bg-indigo-50 text-indigo-700 border-indigo-100',
    muted:  'bg-indigo-100 text-indigo-700',
    border: 'border-indigo-200',
    accent: 'border-l-indigo-500',
    icon:   'bg-indigo-100 text-indigo-600',
  },
} as const

export type Tone = keyof typeof toneStyles

export function getToneClasses(tone: Tone = 'sapphire', variant: keyof (typeof toneStyles)['sapphire'] = 'soft') {
  return toneStyles[tone]?.[variant] ?? toneStyles.sapphire[variant]
}

export const cssVar = {
  gradientDark: colors.sapphire[900],
} as const
