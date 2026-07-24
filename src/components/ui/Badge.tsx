import { cn } from '@/lib/cn'
import type { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'brand' | 'action' | 'ai' | 'success' | 'warning' | 'danger' | 'neutral'
}

const variantStyles = {
  default: 'bg-secondary text-muted-foreground',
  brand: 'bg-blue-100 text-blue-700',
  action: 'bg-yellow-100 text-yellow-700',
  ai: 'bg-indigo-100 text-indigo-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-rose-100 text-rose-700',
  neutral: 'bg-secondary text-muted-foreground',
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1 rounded-[20px]',
        'font-display text-[11px] font-semibold tracking-wide',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}