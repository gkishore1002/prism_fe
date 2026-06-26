import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const variants = {
  primary: 'bg-blue-800 text-white hover:bg-blue-700 active:scale-[0.97]',
  action: 'bg-yellow-400 text-blue-900 hover:bg-yellow-300 active:scale-[0.97] font-semibold shadow-sm',
  secondary: 'bg-transparent text-text-primary border border-surface-200 hover:bg-surface-50 hover:border-surface-300',
  ghost: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.97]',
  gradient: 'gradient-brand-icon text-blue-900 font-semibold hover:opacity-90 active:scale-[0.97]',
} as const

const sizes = {
  sm: 'h-8 px-[18px] text-[11px] gap-1.5',
  md: 'h-9 px-[18px] text-xs gap-2',
  lg: 'h-11 px-6 text-xs gap-2',
} as const

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-display font-medium rounded-[8px] transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blue-400/20',
        'disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
)
Button.displayName = 'Button'
