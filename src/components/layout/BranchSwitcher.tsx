import { ChevronDown, MapPin } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useCenters } from '@/hooks/useCenters'
import { formatCenterLabel } from '@/lib/centerLabel'
import { cn } from '@/lib/cn'

export function BranchSwitcher({ className }: { className?: string }) {
  const {
    centers,
    loading,
    activeBranch,
    isAllBranches,
    canSelectAllBranches,
    setActiveBranch,
    ensureLoaded,
  } = useCenters()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void ensureLoaded()
  }, [ensureLoaded])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  if (loading && centers.length === 0) {
    return <span className={cn('text-xs text-muted-foreground', className)}>Loading branches…</span>
  }

  if (centers.length === 0) return null

  const activeCenter = centers.find((c) => c.id === activeBranch)
  const label =
    isAllBranches && canSelectAllBranches
      ? 'All branches'
      : activeCenter
        ? formatCenterLabel(activeCenter)
        : formatCenterLabel(centers[0])

  if (centers.length === 1 && !canSelectAllBranches) {
    return (
      <div className={cn('inline-flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
        <MapPin className="w-3.5 h-3.5" />
        <span>{label}</span>
      </div>
    )
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-secondary/50"
      >
        <MapPin className="w-3.5 h-3.5 text-accent" />
        <span className="max-w-[160px] truncate">{label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 min-w-[200px] rounded-md border border-border bg-background py-1 shadow-lg">
          {canSelectAllBranches && (
            <button
              type="button"
              onClick={() => {
                setActiveBranch('all')
                setOpen(false)
              }}
              className={cn(
                'block w-full px-3 py-2 text-left text-xs hover:bg-secondary/50',
                isAllBranches && 'bg-accent/10 text-accent font-medium',
              )}
            >
              All branches
            </button>
          )}
          {centers.map((center) => (
            <button
              key={center.id}
              type="button"
              onClick={() => {
                setActiveBranch(center.id)
                setOpen(false)
              }}
              className={cn(
                'block w-full px-3 py-2 text-left text-xs hover:bg-secondary/50',
                activeBranch === center.id && 'bg-accent/10 text-accent font-medium',
              )}
            >
              {formatCenterLabel(center)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
