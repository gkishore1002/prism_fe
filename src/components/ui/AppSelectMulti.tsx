import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/cn'
import type { AppSelectOption } from './AppSelect'

interface AppSelectMultiProps {
  values: string[]
  onChange: (values: string[]) => void
  options: AppSelectOption[]
  label?: string
  placeholder?: string
  searchable?: boolean
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
  emptyMessage?: string
  maxLabels?: number
}

export function AppSelectMulti({
  values,
  onChange,
  options,
  label,
  placeholder = 'Select options',
  searchable = false,
  searchPlaceholder = 'Search…',
  disabled = false,
  className,
  emptyMessage = 'No options available',
  maxLabels = 2,
}: AppSelectMultiProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const isMobile = useIsMobile()

  const selected = options.filter((o) => values.includes(o.value))

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.description?.toLowerCase().includes(q) ?? false),
    )
  }, [options, search])

  const updatePanelPosition = useCallback(() => {
    if (isMobile) {
      setPanelStyle({})
      return
    }
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const gap = 6
    const maxHeight = 320
    const spaceBelow = window.innerHeight - rect.bottom - gap
    const spaceAbove = rect.top - gap
    const openUp = spaceBelow < 220 && spaceAbove > spaceBelow
    const height = Math.min(maxHeight, openUp ? spaceAbove - 8 : spaceBelow - 8)

    setPanelStyle({
      position: 'fixed',
      left: Math.max(8, rect.left),
      width: Math.min(rect.width, window.innerWidth - 16),
      zIndex: 52,
      maxHeight: Math.max(height, 180),
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + gap }
        : { top: rect.bottom + gap }),
    })
  }, [isMobile])

  useEffect(() => {
    if (!open) return
    updatePanelPosition()
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
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
      setSearch('')
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  function toggleValue(optionValue: string) {
    if (values.includes(optionValue)) {
      onChange(values.filter((v) => v !== optionValue))
    } else {
      onChange([...values, optionValue])
    }
  }

  function closePanel() {
    setOpen(false)
    setSearch('')
  }

  const triggerLabel =
    selected.length === 0
      ? placeholder
      : selected.length <= maxLabels
        ? selected.map((s) => s.label).join(', ')
        : `${selected.length} selected`

  const panel = open ? (
    <>
      <div
        className="fixed inset-0 z-ln-dropdown bg-ink/35 backdrop-blur-[2px]"
        aria-hidden
        onClick={closePanel}
      />
      <div
        ref={panelRef}
        id={listId}
        role="listbox"
        aria-multiselectable
        style={!isMobile ? panelStyle : undefined}
        className={cn(
          'glass-sheet border border-border overflow-hidden flex flex-col z-ln-dropdown',
          isMobile
            ? 'ln-dropdown-sheet fixed inset-x-0 bottom-0 rounded-t-[20px] max-h-[min(85dvh,560px)] animate-ln-sheet-up safe-bottom'
            : 'rounded-[14px] animate-ios-sheet',
        )}
      >
        {isMobile && (
          <div className="flex flex-col items-center pt-2 pb-1 shrink-0 border-b border-border/60">
            <span className="ln-sheet-handle" aria-hidden />
            {label && (
              <p className="text-sm font-medium text-foreground px-4 pb-2">{label}</p>
            )}
          </div>
        )}

        {searchable && (
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5 shrink-0">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              autoFocus={!isMobile}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="text-sm outline-none bg-transparent w-full min-w-0 min-h-[44px] sm:min-h-0"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="p-2 -mr-1 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="overflow-y-auto scrollbar-thin flex-1 p-1.5 sm:p-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 px-3">{emptyMessage}</p>
          ) : (
            filtered.map((option) => {
              const active = values.includes(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={option.disabled}
                  onClick={() => toggleValue(option.value)}
                  className={cn(
                    'w-full text-left px-3.5 py-3 sm:py-2.5 rounded-[12px] transition-all duration-[180ms] flex items-start gap-2.5 ios-list-row min-h-[48px] sm:min-h-0',
                    active ? 'bg-accent/12 text-foreground' : 'hover:bg-secondary/50',
                    option.disabled && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  <span
                    className={cn(
                      'w-5 h-5 shrink-0 mt-0.5 rounded-md border flex items-center justify-center',
                      active ? 'bg-accent border-accent text-accent-foreground' : 'border-border',
                    )}
                  >
                    {active && <Check className="w-3 h-3" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{option.label}</span>
                    {option.description && (
                      <span className="block text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {option.description}
                      </span>
                    )}
                  </span>
                </button>
              )
            })
          )}
        </div>

        {isMobile && (
          <div className="shrink-0 border-t border-border p-3 safe-bottom">
            <button
              type="button"
              onClick={closePanel}
              className="btn btn-primary w-full min-h-[48px]"
            >
              Done ({selected.length})
            </button>
          </div>
        )}
      </div>
    </>
  ) : null

  return (
    <div className={cn('relative w-full min-w-0', className)}>
      {label && !isMobile && (
        <span className="block text-xs text-muted-foreground mb-1">{label}</span>
      )}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center justify-between gap-2 border border-border rounded-[14px] px-4 py-2.5 sm:py-2.5 min-h-[48px] sm:min-h-[44px] text-[15px] bg-card/85 backdrop-blur-sm text-left transition-all duration-[280ms] ios-shadow-sm',
          'hover:border-accent/35 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/20',
          disabled && 'opacity-50 cursor-not-allowed',
          open && 'border-accent/45 ring-[3px] ring-accent/15 bg-card',
        )}
      >
        <span className={cn('truncate', selected.length === 0 && 'text-muted-foreground')}>
          {triggerLabel}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground shrink-0 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      {panel && createPortal(panel, document.body)}
    </div>
  )
}
