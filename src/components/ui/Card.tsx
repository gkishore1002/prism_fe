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
    <div className={cn('flex items-center justify-between mb-4 pb-4 border-b border-border', className)} {...props}>
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
    <p className={cn('text-[12px] text-muted-foreground mt-0.5 font-sans', className)} {...props}>
      {children}
    </p>
  )
}