import { CalendarRange, ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useAcademicYears } from '@/hooks/useAcademicYears'
import { cn } from '@/lib/cn'
import { reloadAppAfterScopeChange } from '@/lib/reloadAppScope'

/** Lightweight navbar filter — portals the panel, never dims/blurs the page. */
export function AcademicYearSwitcher({
  className,
  compact = false,
}: {
  className?: string
  /** Icon-only trigger (calendar) for tight mobile chrome. */
  compact?: boolean
}) {
  const { years, activeYearId, setActiveYearId, loading } = useAcademicYears()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})

  const active = years.find((y) => y.id === activeYearId) ?? years[0]

  const updatePanelPosition = useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const rect = root.getBoundingClientRect()
    const width = Math.min(200, window.innerWidth - 16)
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8)
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

  if (!years.length) return null

  return (
    <div ref={rootRef} className={cn('inline-flex items-center gap-1 min-w-0', className)}>
      {!compact && (
        <CalendarRange className="w-3.5 h-3.5 text-muted-foreground shrink-0 hidden sm:block" />
      )}
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Academic year${active?.name ? `: ${active.name}` : ''}`}
        title={active?.name ?? 'Academic year'}
        className={cn(
          'inline-flex items-center justify-center rounded-md border border-border bg-background text-xs font-medium hover:bg-secondary/50 disabled:opacity-50',
          compact ? 'size-9 p-0' : 'gap-1.5 px-2.5 py-1.5',
          open && 'bg-secondary/50',
        )}
      >
        {compact ? (
          <CalendarRange className="w-4 h-4 text-muted-foreground" />
        ) : (
          <>
            <span className="max-w-[9rem] truncate">{active?.name ?? 'Year'}</span>
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
            className="rounded-md border border-border bg-background py-1 shadow-lg"
          >
            {years.map((y) => (
              <button
                key={y.id}
                type="button"
                role="option"
                aria-selected={y.id === activeYearId}
                onClick={() => {
                  if (y.id === activeYearId) {
                    setOpen(false)
                    return
                  }
                  setActiveYearId(y.id)
                  setOpen(false)
                  reloadAppAfterScopeChange()
                }}
                className={cn(
                  'block w-full px-3 py-2.5 text-left text-xs hover:bg-secondary/50',
                  y.id === activeYearId && 'bg-accent/10 text-accent font-medium',
                )}
              >
                <span className="font-medium">{y.name}</span>
                {y.isCurrent && (
                  <span className="ml-1.5 text-[10px] text-muted-foreground">Current</span>
                )}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
