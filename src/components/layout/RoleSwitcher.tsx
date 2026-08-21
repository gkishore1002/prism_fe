import { Check, ChevronDown, Repeat } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  fetchRoleOptions,
  roleOptionKey,
  type RoleOption,
  type RoleOptionsResponse,
} from '@/modules/auth/lib/authApi'
import { cn } from '@/lib/cn'
import { useConfirmModal } from '@/components/ui/AppModal'

function isActiveOption(
  option: RoleOption,
  current: Pick<RoleOptionsResponse, 'currentRole' | 'currentAdminPortal'>,
): boolean {
  if (option.role !== current.currentRole) return false
  if (option.role !== 'admin') return true
  return (option.adminPortal ?? 'branch') === (current.currentAdminPortal ?? 'branch')
}

export function RoleSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { role, switchPortal, portalRefreshKey } = useAuth()
  const { confirm } = useConfirmModal()
  const [options, setOptions] = useState<RoleOptionsResponse | null>(null)
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})

  const load = useCallback(async () => {
    if (role === 'super_user') return
    try {
      setOptions(await fetchRoleOptions())
      setError(null)
    } catch {
      setOptions(null)
    }
  }, [role])

  useEffect(() => {
    void load()
  }, [load, role, portalRefreshKey])

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const gap = 6
    setPanelStyle({
      position: 'fixed',
      zIndex: 70,
      minWidth: Math.max(rect.width, 176),
      left: collapsed ? rect.right + gap : rect.left,
      bottom: window.innerHeight - rect.top + gap,
    })
  }, [collapsed])

  useLayoutEffect(() => {
    if (!open) return
    updatePanelPosition()
  }, [open, updatePanelPosition])

  useEffect(() => {
    if (!open) return
    const onMove = () => updatePanelPosition()
    window.addEventListener('resize', onMove)
    window.addEventListener('scroll', onMove, true)
    return () => {
      window.removeEventListener('resize', onMove)
      window.removeEventListener('scroll', onMove, true)
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

  if (!options || options.roles.length <= 1) return null

  const active =
    options.roles.find((option) => isActiveOption(option, options)) ?? options.roles[0]

  async function handleSelect(option: RoleOption) {
    if (isActiveOption(option, options!)) {
      setOpen(false)
      return
    }
    const ok = await confirm({
      title: 'Switch portal',
      message: `Switch to "${option.label}"? You will be redirected to that portal.`,
      confirmLabel: 'Switch',
    })
    if (!ok) return
    setSwitching(true)
    setError(null)
    try {
      await switchPortal(option)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not switch role')
    } finally {
      setSwitching(false)
    }
  }

  const menu =
    open &&
    createPortal(
      <div
        ref={panelRef}
        role="menu"
        style={panelStyle}
        className="rounded-lg border border-border bg-card py-1 shadow-lg"
      >
        {options.roles.map((option) => {
          const activeOption = isActiveOption(option, options)
          return (
            <button
              key={roleOptionKey(option)}
              type="button"
              role="menuitem"
              disabled={switching}
              onClick={() => void handleSelect(option)}
              className={cn(
                'flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[13px] disabled:opacity-60',
                activeOption
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-foreground hover:bg-secondary/70',
              )}
            >
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {activeOption && <Check className="w-3.5 h-3.5 shrink-0" />}
            </button>
          )
        })}
        {error && <p className="px-2.5 py-1.5 text-xs text-rose">{error}</p>}
      </div>,
      document.body,
    )

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={switching}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-navy-200 hover:bg-navy-700/60 hover:text-white transition-colors disabled:opacity-60',
          collapsed && 'justify-center px-2',
        )}
        aria-label="Switch role"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Repeat className="w-4 h-4 shrink-0" />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 truncate text-left">{active.label}</span>
            <ChevronDown
              className={cn('w-3.5 h-3.5 shrink-0 opacity-70 transition-transform', open && 'rotate-180')}
            />
          </>
        )}
      </button>
      {menu}
    </div>
  )
}
