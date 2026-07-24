import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ResponsiveTableProps {
  children: ReactNode
  className?: string
  /** Minimum table width before horizontal scroll kicks in */
  minWidth?: number
  hint?: string
}

/**
 * Wraps wide data tables with horizontal scroll + edge fade on small screens.
 */
export function ResponsiveTable({
  children,
  className,
  minWidth = 480,
  hint = 'Swipe horizontally to see more columns',
}: ResponsiveTableProps) {
  return (
    <div className={cn('ln-table-scroll -mx-4 sm:mx-0', className)}>
      <p className="ln-table-scroll-hint sm:hidden">{hint}</p>
      <div className="overflow-x-auto scrollbar-thin px-4 sm:px-0">
        <div style={{ minWidth }}>{children}</div>
      </div>
    </div>
  )
}
