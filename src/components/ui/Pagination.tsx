import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AppDropdown } from '@/components/ui/AppDropdown'
import { DEFAULT_PAGE_LIMIT, PAGE_LIMIT_OPTIONS } from '@/lib/pagination'
import { cn } from '@/lib/cn'

export interface PaginationProps {
  page: number
  pages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
  limitOptions?: readonly number[]
  className?: string
  itemLabel?: string
}

function pageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | 'ellipsis')[] = [1]
  if (current > 3) pages.push('ellipsis')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i += 1) pages.push(i)
  if (current < total - 2) pages.push('ellipsis')
  pages.push(total)
  return pages
}

export function Pagination({
  page,
  pages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  limitOptions = PAGE_LIMIT_OPTIONS,
  className,
  itemLabel = 'students',
}: PaginationProps) {
  if (total === 0) return null

  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)
  const nums = pageNumbers(page, pages)

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-border',
        className,
      )}
    >
      <p className="text-xs text-muted-foreground">
        Showing {start}–{end} of {total} {itemLabel}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {onLimitChange && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mr-1 sm:mr-2">
            <span className="shrink-0">Rows</span>
            <AppDropdown
              value={String(limit)}
              onChange={(v) => onLimitChange(Number(v))}
              options={limitOptions.map((n) => ({ value: String(n), label: String(n) }))}
              variant="inline"
              fullWidth={false}
              placeholder={String(DEFAULT_PAGE_LIMIT)}
              triggerClassName="min-w-[4.5rem]"
            />
          </div>
        )}

        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border text-xs disabled:opacity-40 hover:bg-secondary"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Prev
        </button>

        <div className="flex items-center gap-1">
          {nums.map((n, idx) =>
            n === 'ellipsis' ? (
              <span key={`e-${idx}`} className="px-1 text-xs text-muted-foreground">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                onClick={() => onPageChange(n)}
                className={cn(
                  'min-w-[2rem] h-8 rounded-md text-xs font-medium',
                  n === page
                    ? 'bg-accent text-accent-foreground'
                    : 'border border-border hover:bg-secondary text-foreground',
                )}
                aria-current={n === page ? 'page' : undefined}
              >
                {n}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border text-xs disabled:opacity-40 hover:bg-secondary"
          aria-label="Next page"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
