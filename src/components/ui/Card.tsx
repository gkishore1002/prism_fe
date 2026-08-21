import { cn } from '@/lib/cn'
import type { HTMLAttributes } from 'react'

/**
 * Metric card category (Swotify left-border accent pattern):
 * Cards stay white; a 4px left pseudo-element carries the category color.
 * - volume   → sapphire  (totals, neutral counts)
 * - healthy  → emerald   (pass rate, improvements)
 * - risk     → coral     (at-risk students, alerts)
 * - caution  → gold      (mid-range watch, pending interventions)
 * - activity → violet    (AI engagement, uploads, logins)
 * - action   → sapphire-600 (pending reviews, actions needed)
 */
type MetricCategory = 'volume' | 'healthy' | 'risk' | 'caution' | 'activity' | 'action'

type Accent =
  | 'sapphire' | 'navy' | 'blue'
  | 'gold' | 'yellow'
  | 'emerald'
  | 'rose' | 'coral'
  | 'indigo'
  | 'violet'
  | 'none'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  accent?: Accent
  /** Metric category tint — renders a 4px left-border accent */
  metric?: MetricCategory
}

const paddingMap = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
}

const accentMap: Record<Accent, string> = {
  sapphire: 'accent-sapphire',
  navy:     'accent-navy',
  blue:     'accent-blue',
  gold:     'accent-gold',
  yellow:   'accent-yellow',
  emerald:  'accent-emerald',
  rose:     'accent-rose',
  coral:    'accent-coral',
  indigo:   'accent-indigo',
  violet:   'accent-activity',
  none:     '',
}

const metricMap: Record<MetricCategory, string> = {
  volume:   'metric-card metric-volume',
  healthy:  'metric-card metric-healthy',
  risk:     'metric-card metric-risk',
  caution:  'metric-card metric-caution',
  activity: 'metric-card metric-activity',
  action:   'metric-card metric-action',
}

export function Card({
  className,
  hover,
  padding = 'md',
  accent = 'none',
  metric,
  children,
  ...props
}: CardProps) {
  if (metric) {
    return (
      <div className={cn(metricMap[metric], className)} {...props}>
        {children}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'glass-card rounded-[14px] overflow-hidden border border-border',
        paddingMap[padding],
        accentMap[accent],
        hover && 'card-hover cursor-pointer ios-press',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-between border-b border-border', className)}
      style={{ padding: '18px 20px 14px' }}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-[15px] font-display font-semibold text-foreground tracking-tight', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-[13px] text-muted-foreground mt-0.5 font-sans', className)} {...props}>
      {children}
    </p>
  )
}

/** Metric label — Sora 11px, uppercase, muted, letter-spaced */
export function MetricLabel({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('metric-label', className)} {...props}>
      {children}
    </div>
  )
}

/** Metric value — IBM Plex Mono 28px 600 */
export function MetricValue({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('metric-value font-mono-data tabular-nums', className)} {...props}>
      {children}
    </div>
  )
}