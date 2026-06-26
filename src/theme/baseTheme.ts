import { colors } from './tokens'

/** Shared UI class tokens — Swotify-style pattern, Learnova pastel palette */
export const baseTheme = {
  shell: 'rounded-[14px] border border-surface-200 bg-surface-0',
  panel: 'rounded-[14px] border border-surface-200 bg-surface-0',
  panelSoft: 'rounded-[14px] border border-surface-200 bg-surface-50',
  input:
    'w-full rounded-[10px] border border-surface-200 bg-surface-0 px-3.5 py-2.5 text-[13px] text-text-primary outline-none transition focus:border-blue-400 focus:ring-[3px] focus:ring-blue-400/12 font-sans',
  buttonPrimary:
    'btn btn-primary px-[18px] py-2 text-xs',
  buttonAction:
    'btn btn-action px-[18px] py-2 text-xs',
  buttonSecondary:
    'btn btn-secondary px-[18px] py-2 text-xs',
  buttonGhost:
    'btn btn-ghost px-[18px] py-2 text-xs',
  chip: 'inline-flex items-center gap-1 rounded-[20px] px-2.5 py-[3px] text-[10.5px] font-display font-medium',
  statCard: 'rounded-[14px] border border-surface-200 bg-surface-0 p-5 border-l-[4px]',
  cardHover: 'transition-all duration-200 hover:-translate-y-0.5 shadow-card hover:shadow-card-raised',
} as const

export const toneStyles = {
  blue: {
    solid: 'bg-blue-800 text-white',
    soft: 'bg-blue-50 text-blue-700 border-blue-100',
    muted: 'bg-blue-100 text-blue-700',
    border: 'border-blue-200',
    accent: 'border-l-blue-500',
    icon: 'bg-blue-100 text-blue-600',
  },
  yellow: {
    solid: 'bg-yellow-300 text-blue-900',
    soft: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    muted: 'bg-yellow-100 text-yellow-700',
    border: 'border-yellow-200',
    accent: 'border-l-yellow-400',
    icon: 'bg-yellow-100 text-yellow-700',
  },
  emerald: {
    solid: 'bg-emerald-600 text-white',
    soft: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    muted: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-200',
    accent: 'border-l-emerald-500',
    icon: 'bg-emerald-100 text-emerald-600',
  },
  rose: {
    solid: 'bg-rose-600 text-white',
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
