import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const variants = {
  primary: 'btn btn-primary',
  action: 'btn btn-action',
  secondary: 'btn btn-secondary',
  ghost: 'btn btn-ghost',
  danger: 'btn btn-danger',
  gradient: 'btn btn-gradient',
} as const

const sizes = {
  sm: 'h-8 px-4 text-[11px] gap-1.5',
  md: 'h-9 px-[18px] text-xs gap-2',
  lg: 'h-11 px-6 text-sm gap-2',
} as const

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  ),
)
Button.displayName = 'Button'

/** Class strings for native `<button>` / `<Link>` elements outside the Button component */
export const btnClass = {
  primary: 'btn btn-primary',
  action: 'btn btn-action',
  secondary: 'btn btn-secondary',
  ghost: 'btn btn-ghost',
  danger: 'btn btn-danger',
  gradient: 'btn btn-gradient',
} as const
