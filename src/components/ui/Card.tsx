import { cn } from '@/lib/cn'
import type { HTMLAttributes } from 'react'

type Accent = 'blue' | 'yellow' | 'emerald' | 'rose' | 'indigo' | 'none'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  accent?: Accent
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

const accentMap: Record<Accent, string> = {
  blue: 'accent-blue',
  yellow: 'accent-yellow',
  emerald: 'accent-emerald',
  rose: 'accent-rose',
  indigo: 'accent-indigo',
  none: '',
}

export function Card({ className, hover, padding = 'md', accent = 'none', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface rounded-[14px] border border-surface-200 overflow-hidden shadow-card',
        paddingMap[padding],
        accentMap[accent],
        hover && 'card-hover cursor-pointer',
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
    <div className={cn('flex items-center justify-between mb-4 pb-3.5 border-b border-surface-100', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-[14px] font-display font-semibold text-text-primary', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-[12px] text-text-secondary mt-0.5 font-sans', className)} {...props}>
      {children}
    </p>
  )
}
