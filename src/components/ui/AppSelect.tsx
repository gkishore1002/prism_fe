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
import { cn } from '@/lib/cn'

export interface AppSelectOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

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
  portal?: boolean
  name?: string
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
  portal = true,
  name,
}: AppSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const listId = useId()

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

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const gap = 6
    const maxHeight = 280
    const spaceBelow = window.innerHeight - rect.bottom - gap
    const spaceAbove = rect.top - gap
    const openUp = spaceBelow < 200 && spaceAbove > spaceBelow
    const height = Math.min(maxHeight, openUp ? spaceAbove - 8 : spaceBelow - 8)

    setPanelStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      maxHeight: Math.max(height, 160),
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + gap }
        : { top: rect.bottom + gap }),
    })
  }, [])

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
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
      setSearch('')
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  function handleSelect(option: AppSelectOption) {
    if (option.disabled) return
    onChange(option.value)
    setOpen(false)
    setSearch('')
  }

  function toggleOpen() {
    if (disabled) return
    setOpen((prev) => {
      if (prev) setSearch('')
      return !prev
    })
  }

  const panel = open ? (
    <>
      <div
        className="fixed inset-0 z-[9998] bg-ink/20 sm:bg-transparent"
        aria-hidden
        onClick={() => {
          setOpen(false)
          setSearch('')
        }}
      />
      <div
        ref={panelRef}
        id={listId}
        role="listbox"
        style={portal ? panelStyle : undefined}
        className={cn(
          'bg-card border border-border rounded-lg shadow-xl overflow-hidden flex flex-col',
          !portal && 'absolute left-0 right-0 top-full mt-1.5 z-50 max-h-72',
        )}
      >
        {searchable && (
          <div className="flex items-center gap-2 border-b border-border px-3 py-2 shrink-0">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="text-sm outline-none bg-transparent w-full min-w-0"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <div className="overflow-y-auto scrollbar-thin flex-1 p-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6 px-3">{emptyMessage}</p>
          ) : (
            filtered.map((option) => {
              const active = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={option.disabled}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-md transition-colors flex items-start gap-2',
                    active ? 'bg-accent/10 text-foreground' : 'hover:bg-secondary/60',
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
                    <span className="block text-sm font-medium truncate">{option.label}</span>
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
      </div>
    </>
  ) : null

  return (
    <div className={cn('relative w-full', className)}>
      {label && (
        <span className="block text-xs text-muted-foreground mb-1">{label}</span>
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
          'w-full flex items-center justify-between gap-2 border border-border rounded-md px-3 py-2 text-sm bg-background text-left transition-colors',
          'hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30',
          disabled && 'opacity-50 cursor-not-allowed',
          open && 'border-accent/50 ring-2 ring-accent/20',
          triggerClassName,
        )}
      >
        <span className={cn('truncate', !selected && 'text-muted-foreground')}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground shrink-0 transition-transform',
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
    <label className={cn('block', className)}>
      <AppSelect {...props} />
      {children}
    </label>
  )
}
