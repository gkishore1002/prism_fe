import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export function InsightCard({
  icon: Icon,
  title,
  description,
  value,
  hint,
  href,
  tone = 'default',
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  value?: string | number
  hint?: string
  href?: string
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger'
  action?: string
  className?: string
}) {
  const toneMap = {
    default: 'text-slate-500 bg-slate-100',
    accent: 'text-indigo-600 bg-indigo-50',
    success: 'text-emerald-600 bg-emerald-50',
    warning: 'text-amber-600 bg-amber-50',
    danger: 'text-rose-600 bg-rose-50',
  }

  const body = (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={cn(
        'glass-card p-5 h-full flex flex-col gap-3 card-hover',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', toneMap[tone])}>
          <Icon className="w-5 h-5" />
        </span>
        {href && <ArrowUpRight className="w-4 h-4 text-muted-foreground" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
          {title}
        </p>
        {value != null && (
          <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
        )}
        {description && (
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
        {hint && <p className="mt-2 text-xs text-muted-foreground/80">{hint}</p>}
      </div>
      {(action || href) && (
        <span className="text-xs font-medium text-accent">{action ?? 'Open'}</span>
      )}
    </motion.div>
  )

  if (href) {
    return (
      <Link to={href} className="block h-full focus-visible:rounded-[20px]">
        {body}
      </Link>
    )
  }
  return body
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">
      {children}
    </p>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="glass-card px-6 py-14 text-center">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-muted-foreground">
        <Icon className="w-5 h-5" />
      </span>
      <h3 className="font-display text-lg text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
