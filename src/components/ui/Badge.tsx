import { cn } from '@/lib/cn'
import type { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'brand' | 'action' | 'ai' | 'success' | 'warning' | 'danger' | 'neutral'
}

const variantStyles = {
  default: 'bg-surface-100 text-text-secondary',
  brand: 'bg-blue-100 text-blue-700',
  action: 'bg-yellow-100 text-yellow-700',
  ai: 'bg-indigo-100 text-indigo-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-rose-100 text-rose-700',
  neutral: 'bg-surface-100 text-text-muted',
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-[3px] rounded-[20px]',
        'font-display text-[10.5px] font-medium',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
