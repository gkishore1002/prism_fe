import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { springSoft } from '@/lib/motion'

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
  index = 0,
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
  index?: number
}) {
  const toneMap = {
    default: 'text-muted-foreground bg-secondary',
    accent: 'text-[#1C2739] bg-[#D9E4EE]',
    success: 'text-[#047857] bg-[#ECFDF5]',
    warning: 'text-[#9A6D04] bg-[#FEF3D6]',
    danger: 'text-[#B91C1C] bg-[#FEF2F2]',
  }

  const body = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springSoft, delay: index * 0.05 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      className={cn('glass-card p-5 h-full flex flex-col gap-3', className)}
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
      <Link to={href} className="block h-full focus-visible:rounded-[16px]">
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
    <motion.div
      className="glass-card px-6 py-14 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        <Icon className="w-5 h-5" />
      </span>
      <h3 className="font-display text-lg text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="mt-5 flex flex-wrap justify-center items-center gap-3">
          {action}
        </div>
      )}
    </motion.div>
  )
}
