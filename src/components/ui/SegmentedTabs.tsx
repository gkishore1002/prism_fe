import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { NavLink, type NavLinkProps } from 'react-router-dom'
import { cn } from '@/lib/cn'

/**
 * Horizontally scrollable segmented control — wraps on sm+ screens.
 * Use for page tabs (Marks, Question Bank, Manage, Reports, etc.).
 */
export function SegmentedTabs({
  children,
  className,
  'aria-label': ariaLabel,
}: {
  children: ReactNode
  className?: string
  'aria-label'?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('ln-tabs-bar ln-tabs-scroll mb-6', className)}
    >
      {children}
    </div>
  )
}

type SegmentedTabProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean
  count?: number
  icon?: ReactNode
}

/** Button tab inside SegmentedTabs */
export function SegmentedTab({
  active,
  count,
  icon,
  children,
  className,
  type = 'button',
  ...rest
}: SegmentedTabProps) {
  return (
    <button
      type={type}
      role="tab"
      aria-selected={active}
      className={cn('ln-tab-item', active && 'ln-tab-item-active', className)}
      {...rest}
    >
      {icon}
      <span className="truncate max-w-[9.5rem] sm:max-w-none">{children}</span>
      {typeof count === 'number' && count > 0 ? (
        <span className="font-mono-data text-[11px] opacity-80 tabular-nums">{count}</span>
      ) : null}
    </button>
  )
}

type SegmentedTabLinkProps = Omit<NavLinkProps, 'className' | 'children'> & {
  icon?: ReactNode
  className?: string
  children: ReactNode
}

/** NavLink tab inside SegmentedTabs (route-based sections). */
export function SegmentedTabLink({ icon, children, className, ...rest }: SegmentedTabLinkProps) {
  return (
    <NavLink
      role="tab"
      className={({ isActive }) =>
        cn('ln-tab-item', isActive && 'ln-tab-item-active', className)
      }
      {...rest}
    >
      {icon}
      <span className="truncate max-w-[9.5rem] sm:max-w-none">{children}</span>
    </NavLink>
  )
}
