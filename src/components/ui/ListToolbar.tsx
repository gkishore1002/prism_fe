import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { AppDropdown, type AppSelectOption } from '@/components/ui/AppDropdown'
import { formatCenterLabel } from '@/lib/centerLabel'
import { cn } from '@/lib/cn'
import { btnClass } from '@/components/ui/Button'

/** Compact list-page chrome: search + optional filter + minimal actions. */
export function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filter,
  actions,
  className,
}: {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filter?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0 bg-secondary/40 border border-border rounded-md px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="text-sm outline-none bg-transparent w-full min-w-0"
          />
        </div>
        {filter ? <div className="w-full sm:w-[220px] shrink-0">{filter}</div> : null}
        {actions ? (
          <div className="flex items-center gap-1.5 shrink-0 sm:ml-auto overflow-x-auto scrollbar-thin pb-0.5 sm:pb-0">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function ToolbarButton({
  icon,
  label,
  shortLabel,
  variant = 'secondary',
  className,
  ...rest
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon?: ReactNode
  label: string
  /** Shorter label on narrow screens; defaults to `label`. */
  shortLabel?: string
  variant?: 'secondary' | 'primary' | 'ghost'
}) {
  const tone =
    variant === 'primary' ? btnClass.primary : variant === 'ghost' ? btnClass.ghost : btnClass.secondary
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        tone,
        'text-sm px-2.5 sm:px-3 py-2 inline-flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap',
        className,
      )}
      {...rest}
    >
      {icon}
      <span className="sm:hidden">{shortLabel ?? label}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

/** Branch scope filter for list pages (when header is on “All branches”). */
export function BranchFilterDropdown({
  centers,
  value,
  onChange,
  className,
  includeAll = true,
}: {
  centers: { id: string; name: string; city?: string | null }[]
  value: string
  onChange: (value: string) => void
  className?: string
  includeAll?: boolean
}) {
  const options: AppSelectOption[] = [
    ...(includeAll ? [{ value: 'all', label: 'All branches' }] : []),
    ...centers.map((c) => ({ value: c.id, label: formatCenterLabel(c) })),
  ]
  if (options.length === 0) return null
  return (
    <AppDropdown
      value={value || 'all'}
      onChange={onChange}
      options={options}
      placeholder="Branch"
      searchable={centers.length > 6}
      variant="compact"
      className={cn('w-full', className)}
    />
  )
}
