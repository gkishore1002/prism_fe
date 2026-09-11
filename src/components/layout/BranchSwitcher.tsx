import { ChevronDown, MapPin } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useCenters } from '@/hooks/useCenters'
import { formatCenterLabel } from '@/lib/centerLabel'
import { cn } from '@/lib/cn'
import { reloadAppAfterScopeChange } from '@/lib/reloadAppScope'

/** Lightweight navbar menu — portals the panel, never dims/blurs the page. */
export function BranchSwitcher({
  className,
  compact = false,
}: {
  className?: string
  /** Icon-only trigger (location pin) for tight mobile chrome. */
  compact?: boolean
}) {
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
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})

  useEffect(() => {
    void ensureLoaded()
  }, [ensureLoaded])

  const updatePanelPosition = useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const rect = root.getBoundingClientRect()
    const width = Math.min(240, window.innerWidth - 16)
    const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8)
    setPanelStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left,
      width,
      zIndex: 52,
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updatePanelPosition()
  }, [open, updatePanelPosition])

  useEffect(() => {
    if (!open) return
    const onScrollOrResize = () => updatePanelPosition()
    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('scroll', onScrollOrResize, true)
    return () => {
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('scroll', onScrollOrResize, true)
    }
  }, [open, updatePanelPosition])

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (loading && centers.length === 0) {
    return compact ? (
      <span
        className={cn(
          'inline-grid size-9 place-items-center rounded-md border border-border text-muted-foreground',
          className,
        )}
        aria-hidden
      >
        <MapPin className="w-4 h-4 opacity-50" />
      </span>
    ) : (
      <span className={cn('text-xs text-muted-foreground', className)}>Branches…</span>
    )
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
    if (compact) {
      return (
        <span
          className={cn(
            'inline-grid size-9 place-items-center rounded-md border border-border text-muted-foreground',
            className,
          )}
          title={label}
          aria-label={label}
        >
          <MapPin className="w-4 h-4" />
        </span>
      )
    }
    return (
      <div
        className={cn('inline-flex items-center gap-1.5 text-xs text-muted-foreground min-w-0', className)}
        title={label}
      >
        <MapPin className="w-3.5 h-3.5 shrink-0" />
        <span className="max-w-[10rem] truncate">{label}</span>
      </div>
    )
  }

  return (
    <div ref={rootRef} className={cn('relative min-w-0', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Branch: ${label}`}
        title={label}
        className={cn(
          'inline-flex items-center justify-center rounded-md border border-border bg-background text-xs font-medium hover:bg-secondary/50 max-w-full',
          compact ? 'size-9 p-0' : 'gap-1.5 px-2.5 py-1.5',
          open && 'bg-secondary/50',
        )}
      >
        {compact ? (
          <MapPin className="w-4 h-4 text-accent" />
        ) : (
          <>
            <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="max-w-[10rem] truncate">{label}</span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform',
                open && 'rotate-180',
              )}
            />
          </>
        )}
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            style={panelStyle}
            className="rounded-md border border-border bg-background py-1 shadow-lg max-h-[min(60dvh,320px)] overflow-y-auto"
          >
            {canSelectAllBranches && (
              <button
                type="button"
                role="option"
                aria-selected={isAllBranches}
                onClick={() => {
                  if (isAllBranches) {
                    setOpen(false)
                    return
                  }
                  setActiveBranch('all')
                  setOpen(false)
                  reloadAppAfterScopeChange()
                }}
                className={cn(
                  'block w-full px-3 py-2.5 text-left text-xs hover:bg-secondary/50',
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
                role="option"
                aria-selected={activeBranch === center.id}
                onClick={() => {
                  if (activeBranch === center.id) {
                    setOpen(false)
                    return
                  }
                  setActiveBranch(center.id)
                  setOpen(false)
                  reloadAppAfterScopeChange()
                }}
                className={cn(
                  'block w-full px-3 py-2.5 text-left text-xs hover:bg-secondary/50',
                  activeBranch === center.id && 'bg-accent/10 text-accent font-medium',
                )}
              >
                {formatCenterLabel(center)}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
