import { colors } from './tokens'

/** Shared UI class tokens — Prism modern academic SaaS */
export const baseTheme = {
  shell: 'rounded-[20px] border border-border glass-card',
  panel: 'rounded-[20px] border border-border glass-card',
  panelSoft: 'rounded-[20px] border border-border bg-secondary/80',
  input: 'ios-input',
  buttonPrimary: 'btn btn-primary px-5 py-2.5 text-[13px]',
  buttonAction: 'btn btn-action px-5 py-2.5 text-[13px]',
  buttonSecondary: 'btn btn-secondary px-5 py-2.5 text-[13px]',
  buttonGhost: 'btn btn-ghost px-5 py-2.5 text-[13px]',
  chip: 'inline-flex items-center gap-1 rounded-lg px-3 py-1 text-[11px] font-display font-medium',
  statCard: 'rounded-[20px] border border-border glass-card p-5',
  cardHover:
    'transition-all duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-card-raised active:scale-[0.995]',
} as const

export const toneStyles = {
  blue: {
    solid: 'bg-blue-600 text-white',
    soft: 'bg-blue-50 text-blue-700 border-blue-100',
    muted: 'bg-blue-100 text-blue-700',
    border: 'border-blue-200',
    accent: 'border-l-blue-500',
    icon: 'bg-blue-100 text-blue-600',
  },
  yellow: {
    solid: 'bg-yellow-400 text-ink',
    soft: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    muted: 'bg-yellow-100 text-yellow-700',
    border: 'border-yellow-200',
    accent: 'border-l-yellow-400',
    icon: 'bg-yellow-100 text-yellow-700',
  },
  emerald: {
    solid: 'bg-leaf text-white',
    soft: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    muted: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-200',
    accent: 'border-l-emerald-500',
    icon: 'bg-emerald-100 text-emerald-600',
  },
  rose: {
    solid: 'bg-rose text-white',
    soft: 'bg-rose-50 text-rose-700 border-rose-100',
    muted: 'bg-rose-100 text-rose-700',
    border: 'border-rose-200',
    accent: 'border-l-rose-500',
    icon: 'bg-rose-100 text-rose-600',
  },
  indigo: {
    solid: 'bg-indigo-600 text-white',
    soft: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    muted: 'bg-indigo-100 text-indigo-700',
    border: 'border-indigo-200',
    accent: 'border-l-indigo-500',
    icon: 'bg-indigo-100 text-indigo-600',
  },
} as const

export type Tone = keyof typeof toneStyles

export function getToneClasses(tone: Tone = 'blue', variant: keyof (typeof toneStyles)['blue'] = 'soft') {
  return toneStyles[tone]?.[variant] ?? toneStyles.blue[variant]
}

export const cssVar = {
  gradientDark: colors.blue[900],
} as const
