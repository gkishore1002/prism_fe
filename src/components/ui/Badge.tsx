import { cn } from '@/lib/cn'
import type { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'brand' | 'action' | 'ai' | 'success' | 'warning' | 'danger' | 'neutral'
}

const variantStyles = {
  default: 'bg-secondary text-muted-foreground',
  brand: 'bg-blue-100 text-blue-700',
  action: 'bg-yellow-100 text-yellow-700',
  ai: 'bg-[#E8E0FF] text-[#6554D8]',
  success: 'bg-[#E8F8F1] text-[#0C8F5C]',
  warning: 'bg-[#FFEFD0] text-[#C06F00]',
  danger: 'bg-[#FCEEEF] text-[#CC3D42]',
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