import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/cn'

export interface AppSelectOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export type AppSelectVariant = 'default' | 'compact' | 'inline' | 'on-dark'

interface AppSelectProps {
  value: string | null | undefined
  onChange: (value: string) => void
  options: AppSelectOption[]
  label?: string
  placeholder?: string
  searchable?: boolean
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  emptyMessage?: string
  searchEmptyMessage?: string
  portal?: boolean
  name?: string
  variant?: AppSelectVariant
  /** Full width on mobile even inside flex rows */
  fullWidth?: boolean
}

const triggerVariants: Record<AppSelectVariant, string> = {
  default:
    'border-border bg-card/85 text-foreground hover:border-accent/35 focus-visible:ring-accent/20',
  compact:
    'border-border bg-card/90 text-foreground py-2 min-h-[40px] text-sm hover:border-accent/35',
  inline:
    'border-border bg-background text-foreground text-xs min-h-[36px] px-2.5 py-1 rounded-md hover:border-accent/35 focus-visible:ring-accent/20',
  'on-dark':
    'border-paper/25 bg-paper/10 text-paper hover:border-paper/40 focus-visible:ring-accent/30 placeholder:text-paper/50',
}

export function AppSelect({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select an option',
  searchable = false,
  searchPlaceholder = 'Search…',
  disabled = false,
  className,
  triggerClassName,
  emptyMessage = 'No options available',
  searchEmptyMessage = 'No options match your search',
  portal = true,
  name,
  variant = 'default',
  fullWidth = true,
}: AppSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const isMobile = useIsMobile()

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.description?.toLowerCase().includes(q) ?? false),
    )
  }, [options, search])

  const selectableFiltered = filtered.filter((o) => !o.disabled)

  const closePanel = useCallback(() => {
    setOpen(false)
    setSearch('')
  }, [])

  const handleSelect = useCallback(
    (option: AppSelectOption) => {
      if (option.disabled) return
      onChange(option.value)
      setOpen(false)
      setSearch('')
      triggerRef.current?.focus()
    },
    [onChange],
  )

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
    const width = Math.min(Math.max(rect.width, 220), window.innerWidth - 16)
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8)

    setPanelStyle({
      position: 'fixed',
      left,
      width,
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
      closePanel()
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open, closePanel])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closePanel()
        triggerRef.current?.focus()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlighted((i) => Math.min(i + 1, selectableFiltered.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlighted((i) => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter' && selectableFiltered[highlighted]) {
        e.preventDefault()
        handleSelect(selectableFiltered[highlighted])
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, highlighted, selectableFiltered, closePanel, handleSelect])

  useEffect(() => {
    if (open) {
      const idx = selectableFiltered.findIndex((o) => o.value === value)
      setHighlighted(idx >= 0 ? idx : 0)
    }
  }, [open, selectableFiltered, value])

  function toggleOpen() {
    if (disabled) return
    setOpen((prev) => {
      if (prev) setSearch('')
      return !prev
    })
  }

  const useMobileSheet = isMobile && portal

  const panel = open ? (
    <>
      <div
        className={cn(
          'fixed inset-0 z-ln-dropdown',
          useMobileSheet ? 'bg-ink/35 backdrop-blur-[2px]' : 'sm:bg-transparent sm:backdrop-blur-none sm:pointer-events-none',
          !useMobileSheet && 'bg-ink/30 backdrop-blur-sm sm:bg-transparent',
        )}
        aria-hidden
        onClick={closePanel}
      />
      <div
        ref={panelRef}
        id={listId}
        role="listbox"
        style={portal && !useMobileSheet ? panelStyle : undefined}
        className={cn(
          'glass-sheet border border-border overflow-hidden flex flex-col z-ln-dropdown',
          useMobileSheet
            ? 'ln-dropdown-sheet fixed inset-x-0 bottom-0 rounded-t-[20px] max-h-[min(85dvh,560px)] animate-ln-sheet-up safe-bottom'
            : cn(
                'rounded-[14px] animate-ios-sheet',
                !portal && 'absolute left-0 right-0 top-full mt-2 max-h-72',
              ),
        )}
      >
        {useMobileSheet && (
          <div className="flex flex-col items-center pt-2 pb-1 shrink-0 border-b border-border/60">
            <span className="ln-sheet-handle" aria-hidden />
            {(label || placeholder) && (
              <p className="text-sm font-medium text-foreground px-4 pb-2 truncate max-w-full">
                {label ?? placeholder}
              </p>
            )}
          </div>
        )}

        {searchable && (
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5 shrink-0">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              autoFocus={!useMobileSheet}
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
            <p className="text-sm text-muted-foreground text-center py-8 px-3">
              {options.length === 0 ? emptyMessage : searchEmptyMessage}
            </p>
          ) : (
            filtered.map((option) => {
              const active = option.value === value
              const idx = selectableFiltered.indexOf(option)
              const isHighlighted = idx === highlighted && idx >= 0
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={option.disabled}
                  onMouseEnter={() => idx >= 0 && setHighlighted(idx)}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'w-full text-left px-3.5 py-3 sm:py-2.5 rounded-[12px] transition-all duration-[180ms] flex items-start gap-2.5 ios-list-row min-h-[48px] sm:min-h-0',
                    active || isHighlighted ? 'bg-accent/12 text-foreground' : 'hover:bg-secondary/50',
                    option.disabled && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  <Check
                    className={cn(
                      'w-4 h-4 shrink-0 mt-0.5',
                      active ? 'text-accent opacity-100' : 'opacity-0',
                    )}
                  />
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

        {useMobileSheet && (
          <div className="shrink-0 border-t border-border p-3 safe-bottom sm:hidden">
            <button type="button" onClick={closePanel} className="btn btn-primary w-full min-h-[48px]">
              {selected ? `Select · ${selected.label}` : 'Close'}
            </button>
          </div>
        )}
      </div>
    </>
  ) : null

  return (
    <div className={cn('relative min-w-0', fullWidth && 'w-full', className)}>
      {label && !useMobileSheet && (
        <span
          className={cn(
            'block text-xs mb-1',
            variant === 'on-dark' ? 'text-paper/70' : 'text-muted-foreground',
          )}
        >
          {label}
        </span>
      )}
      {name && <input type="hidden" name={name} value={value ?? ''} readOnly />}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={toggleOpen}
        className={cn(
          'flex items-center justify-between gap-2 border backdrop-blur-sm text-left transition-all duration-[280ms] focus-visible:outline-none focus-visible:ring-[3px]',
          variant === 'inline'
            ? 'w-auto min-w-[4.5rem] rounded-md ios-shadow-sm'
            : 'w-full rounded-[14px] px-4 text-[15px] ios-shadow-sm min-h-[48px] sm:min-h-[44px]',
          triggerVariants[variant],
          disabled && 'opacity-50 cursor-not-allowed',
          open && variant !== 'on-dark' && 'border-accent/45 ring-[3px] ring-accent/15 bg-card',
          open && variant === 'on-dark' && 'border-accent/50 ring-[3px] ring-accent/25',
          triggerClassName,
        )}
      >
        <span className={cn('truncate', !selected && (variant === 'on-dark' ? 'text-paper/55' : 'text-muted-foreground'))}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 shrink-0 transition-transform',
            variant === 'on-dark' ? 'text-paper/70' : 'text-muted-foreground',
            open && 'rotate-180',
          )}
        />
      </button>

      {portal && panel ? createPortal(panel, document.body) : panel}
    </div>
  )
}

interface AppSelectFieldProps extends AppSelectProps {
  children?: ReactNode
}

export function AppSelectField({ children, className, ...props }: AppSelectFieldProps) {
  return (
    <label className={cn('block min-w-0', className)}>
      <AppSelect {...props} />
      {children}
    </label>
  )
}

/** Alias for design-system docs */
export { AppSelect as AppDropdown }
