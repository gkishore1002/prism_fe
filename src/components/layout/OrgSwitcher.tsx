import { Building2, ChevronDown, Crown } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { fetchPlatformOrganizations, type PlatformOrganization } from '@/lib/api/platformApi'
import { enterPlatformOverview, PLATFORM_ORG_CODE } from '@/modules/auth/lib/orgContext'
import { cn } from '@/lib/cn'

/** Lightweight navbar menu — portals the panel, never dims/blurs the page. */
export function OrgSwitcher({ className }: { className?: string }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { role } = useAuth()
  const [organizations, setOrganizations] = useState<PlatformOrganization[]>([])
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})

  const managedCodeMatch = pathname.match(/\/admin\/platform\/organizations\/([^/]+)/)
  const managedCode = managedCodeMatch?.[1]?.toUpperCase() ?? null
  const onPlatformOverview = pathname.startsWith('/admin/platform') && !managedCode

  useEffect(() => {
    if (role !== 'super_user') return
    let cancelled = false
    fetchPlatformOrganizations()
      .then((orgs) => {
        if (!cancelled) setOrganizations(orgs)
      })
      .catch(() => {
        if (!cancelled) setOrganizations([])
      })
    return () => {
      cancelled = true
    }
  }, [role])

  const updatePanelPosition = useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const rect = root.getBoundingClientRect()
    const width = Math.min(260, window.innerWidth - 16)
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

  if (role !== 'super_user') return null

  const activeOrg = managedCode ? organizations.find((o) => o.code === managedCode) : null
  const label = onPlatformOverview
    ? 'Platform overview'
    : activeOrg?.name ?? managedCode ?? 'Platform overview'

  function selectPlatformOverview() {
    enterPlatformOverview()
    setOpen(false)
    navigate('/admin/platform')
  }

  function selectOrganization(code: string) {
    enterPlatformOverview()
    setOpen(false)
    navigate(`/admin/platform/organizations/${code}`)
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
        {onPlatformOverview ? (
          <Crown className="w-3.5 h-3.5 text-accent" />
        ) : (
          <Building2 className="w-3.5 h-3.5 text-accent" />
        )}
        <span className="max-w-[180px] truncate">{label}</span>
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
            <button
              type="button"
              role="option"
              aria-selected={onPlatformOverview}
              onClick={() => selectPlatformOverview()}
              className={cn(
                'block w-full px-3 py-2 text-left text-xs hover:bg-secondary/50',
                onPlatformOverview && 'bg-accent/10 text-accent font-medium',
              )}
            >
              <span className="font-medium">Platform overview</span>
              <span className="ml-1 text-muted-foreground">({PLATFORM_ORG_CODE})</span>
            </button>
            <div className="my-1 border-t border-border" />
            {organizations.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">No tenant organizations</p>
            ) : (
              organizations.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  role="option"
                  aria-selected={managedCode === org.code}
                  onClick={() => selectOrganization(org.code)}
                  className={cn(
                    'block w-full px-3 py-2 text-left text-xs hover:bg-secondary/50',
                    managedCode === org.code && 'bg-accent/10 text-accent font-medium',
                  )}
                >
                  <span className="font-medium">{org.name}</span>
                  <span className="ml-1 text-muted-foreground">({org.code})</span>
                </button>
              ))
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}
