import { ChevronDown, Repeat } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  fetchRoleOptions,
  roleOptionKey,
  type RoleOption,
  type RoleOptionsResponse,
} from '@/modules/auth/lib/authApi'
import { cn } from '@/lib/cn'

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
  const [options, setOptions] = useState<RoleOptionsResponse | null>(null)
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  if (!options || options.roles.length <= 1) return null

  const active =
    options.roles.find((option) => isActiveOption(option, options)) ?? options.roles[0]

  async function handleSelect(option: RoleOption) {
    if (isActiveOption(option, options!)) {
      setOpen(false)
      return
    }
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

  return (
    <div ref={rootRef} className="relative px-2">
      <button
        type="button"
        disabled={switching}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-left text-sm hover:bg-secondary/50 transition-colors disabled:opacity-60',
          collapsed && 'justify-center px-2',
        )}
        aria-label="Switch portal"
      >
        <Repeat className="w-4 h-4 shrink-0 text-accent" />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 truncate font-medium">{active.label}</span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
          </>
        )}
      </button>
      {open && (
        <div
          className={cn(
            'absolute z-50 rounded-md border border-border bg-background py-1 shadow-lg',
            collapsed ? 'left-full ml-2 bottom-0 min-w-[220px]' : 'left-2 right-2 bottom-full mb-1',
          )}
        >
          <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            Switch portal
          </p>
          {options.roles.map((option) => (
            <button
              key={roleOptionKey(option)}
              type="button"
              disabled={switching}
              onClick={() => void handleSelect(option)}
              className={cn(
                'block w-full px-3 py-2 text-left hover:bg-secondary/50 disabled:opacity-60',
                isActiveOption(option, options) && 'bg-accent/10 text-accent',
              )}
            >
              <span className="block text-sm font-medium">{option.label}</span>
              <span className="block text-[11px] text-muted-foreground">{option.description}</span>
            </button>
          ))}
          {error && <p className="px-3 py-2 text-xs text-rose">{error}</p>}
        </div>
      )}
    </div>
  )
}
