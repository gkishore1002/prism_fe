import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { MoreVertical } from 'lucide-react'
import { cn } from '@/lib/cn'

const CloseActionMenuContext = createContext<(() => void) | null>(null)

function useCloseActionMenu() {
  return useContext(CloseActionMenuContext)
}

interface ActionMenuProps {
  label: string
  children: ReactNode
  className?: string
}

export function ActionMenu({ label, children, className }: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})

  const close = useCallback(() => setOpen(false), [])

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current
    const panel = panelRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const gap = 4
    const menuHeight = panel?.offsetHeight ?? 160
    const spaceBelow = window.innerHeight - rect.bottom - gap
    const spaceAbove = rect.top - gap
    const openUp = spaceBelow < menuHeight && spaceAbove > spaceBelow

    setPanelStyle({
      position: 'fixed',
      zIndex: 60,
      minWidth: '10rem',
      right: window.innerWidth - rect.right,
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + gap }
        : { top: rect.bottom + gap }),
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
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const menu =
    open &&
    createPortal(
      <CloseActionMenuContext.Provider value={close}>
        <div
          ref={panelRef}
          role="menu"
          style={panelStyle}
          className="rounded-md border border-border bg-card shadow-lg py-1 text-sm"
        >
          {children}
        </div>
      </CloseActionMenuContext.Provider>,
      document.body,
    )

  return (
    <div className={cn('flex justify-end', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {menu}
    </div>
  )
}

export function ActionMenuItem({
  children,
  className,
  onSelect,
}: {
  children: ReactNode
  className?: string
  onSelect?: () => void
}) {
  const close = useCloseActionMenu()
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        onSelect?.()
        close?.()
      }}
      className={cn('flex items-center gap-2 w-full px-3 py-2 hover:bg-secondary text-left', className)}
    >
      {children}
    </button>
  )
}

export function ActionMenuLink({
  children,
  className,
  to,
}: {
  children: ReactNode
  className?: string
  to: string
}) {
  const close = useCloseActionMenu()
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={() => close?.()}
      className={cn('flex items-center gap-2 w-full px-3 py-2 hover:bg-secondary text-foreground', className)}
    >
      {children}
    </Link>
  )
}
