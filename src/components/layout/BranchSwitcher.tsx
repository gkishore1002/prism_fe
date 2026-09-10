import { ChevronDown, MapPin } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useCenters } from '@/hooks/useCenters'
import { formatCenterLabel } from '@/lib/centerLabel'
import { cn } from '@/lib/cn'
import { reloadAppAfterScopeChange } from '@/lib/reloadAppScope'

/** Lightweight navbar menu — portals the panel, never dims/blurs the page. */
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
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})

  useEffect(() => {
    void ensureLoaded()
  }, [ensureLoaded])

  const updatePanelPosition = useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const rect = root.getBoundingClientRect()
    const width = Math.min(220, window.innerWidth - 16)
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
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-secondary/50"
      >
        <MapPin className="w-3.5 h-3.5 text-accent" />
        <span className="max-w-[160px] truncate">{label}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            style={panelStyle}
            className="rounded-md border border-border bg-background py-1 shadow-lg"
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
                  'block w-full px-3 py-2 text-left text-xs hover:bg-secondary/50',
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
