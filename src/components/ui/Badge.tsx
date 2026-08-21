import { cn } from '@/lib/cn'
import type { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'brand' | 'action' | 'ai' | 'success' | 'warning' | 'danger' | 'neutral'
}

/**
 * Swotify badge variants — each colour is semantically assigned:
 *   brand    → sapphire  (teacher approved, structural)
 *   action   → gold      (in progress, intervention)
 *   ai       → violet    (AI suggested, ML output)
 *   success  → emerald   (positive outcome)
 *   warning  → gold      (watch, caution)
 *   danger   → coral     (risk detected)
 *   neutral  → surface
 */
const variantStyles = {
  default:  'bg-sapphire-50 text-sapphire-700',
  brand:    'bg-sapphire-100 text-sapphire-700',
  action:   'bg-gold-100 text-gold-700',
  ai:       'bg-violet-100 text-violet-700',
  success:  'bg-emerald-100 text-emerald-700',
  warning:  'bg-gold-100 text-gold-700',
  danger:   'bg-coral-100 text-coral-700',
  neutral:  'bg-[#F5F4F0] text-[#64748B]',
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-[10px] py-[3px] rounded-[20px]',
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