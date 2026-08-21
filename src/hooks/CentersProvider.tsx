import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/hooks/useAuth'
import { fetchBranchContext } from '@/lib/api/institutionsApi'
import { isPlatformContext } from '@/modules/auth/lib/orgContext'
import { ACTIVE_BRANCH_KEY } from '@/modules/auth/lib/authStorage'
import { canManageTenant as computeCanManageTenant } from '@/lib/roles'
import type { Institution, InstitutionCenter } from '@/types'

export type ActiveBranchSelection = 'all' | string

export interface CentersContextValue {
  centers: InstitutionCenter[]
  organization: Institution | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  ensureLoaded: () => Promise<void>
  isOwner: boolean
  isPlatformSuperUser: boolean
  canManageTenant: boolean
  canSelectAllBranches: boolean
  activeBranch: ActiveBranchSelection
  isAllBranches: boolean
  activeCenterId: string | undefined
  setActiveBranch: (branch: ActiveBranchSelection) => void
}

export const CentersContext = createContext<CentersContextValue | null>(null)

function readStoredBranch(): ActiveBranchSelection {
  const stored = sessionStorage.getItem(ACTIVE_BRANCH_KEY)
  if (stored === 'all' || (stored && stored.length > 0)) return stored
  return 'all'
}

export function CentersProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, role, adminPortal, portalRefreshKey } = useAuth()
  const [centers, setCenters] = useState<InstitutionCenter[]>([])
  const [organization, setOrganization] = useState<Institution | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [isPlatformSuperUser, setIsPlatformSuperUser] = useState(false)
  const [canSelectAllBranches, setCanSelectAllBranches] = useState(false)
  const [activeBranch, setActiveBranchState] = useState<ActiveBranchSelection>(() => readStoredBranch())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadedRef = useRef(false)
  const loadPromiseRef = useRef<Promise<void> | null>(null)

  const setActiveBranch = useCallback((branch: ActiveBranchSelection) => {
    setActiveBranchState(branch)
    sessionStorage.setItem(ACTIVE_BRANCH_KEY, branch)
  }, [])

  useEffect(() => {
    if (!isAuthenticated || role === 'student') {
      loadedRef.current = false
      loadPromiseRef.current = null
      setCenters([])
      setOrganization(null)
      setLoading(false)
      setError(null)
      setActiveBranch('all')
    }
  }, [isAuthenticated, role, setActiveBranch])

  useEffect(() => {
    loadedRef.current = false
  }, [adminPortal, portalRefreshKey, role])

  useEffect(() => {
    if (centers.length === 1 && activeBranch === 'all' && !canSelectAllBranches) {
      setActiveBranch(centers[0].id)
    } else if (
      activeBranch !== 'all' &&
      centers.length > 0 &&
      !centers.some((c) => c.id === activeBranch)
    ) {
      setActiveBranch(canSelectAllBranches ? 'all' : centers[0]?.id ?? 'all')
    }
  }, [centers, activeBranch, canSelectAllBranches, setActiveBranch])

  const fetchOnce = useCallback(async (force = false) => {
    if (!isAuthenticated || role === 'student') return
    if (role === 'super_user' && isPlatformContext()) {
      setCenters([])
      setOrganization(null)
      setIsOwner(false)
      setIsPlatformSuperUser(true)
      setCanSelectAllBranches(true)
      loadedRef.current = true
      setLoading(false)
      setError(null)
      return
    }
    if (!force && loadedRef.current) return
    if (loadPromiseRef.current) {
      await loadPromiseRef.current
      return
    }

    setLoading(true)
    setError(null)
    loadPromiseRef.current = (async () => {
      try {
        const ctx = await fetchBranchContext()
        setOrganization(ctx.organization)
        setCenters(ctx.accessibleCenters)
        setIsOwner(ctx.isOwner)
        setIsPlatformSuperUser(ctx.isPlatformSuperUser)
        setCanSelectAllBranches(ctx.canSelectAllBranches)
        loadedRef.current = true

        if (ctx.accessibleCenters.length === 1) {
          setActiveBranch(ctx.accessibleCenters[0].id)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load branches')
        setCenters([])
        loadedRef.current = false
      } finally {
        setLoading(false)
      }
    })().finally(() => {
      loadPromiseRef.current = null
    })

    await loadPromiseRef.current
  }, [isAuthenticated, role, adminPortal, portalRefreshKey, setActiveBranch])

  const ensureLoaded = useCallback(async () => {
    await fetchOnce(false)
  }, [fetchOnce])

  const refresh = useCallback(async () => {
    loadedRef.current = false
    await fetchOnce(true)
  }, [fetchOnce])

  const isAllBranches = activeBranch === 'all'
  const activeCenterId = isAllBranches ? undefined : activeBranch
  const tenantCanManage = computeCanManageTenant(role, isOwner, isPlatformSuperUser)

  const value = useMemo(
    () => ({
      centers,
      organization,
      loading,
      error,
      refresh,
      ensureLoaded,
      isOwner,
      isPlatformSuperUser,
      canManageTenant: tenantCanManage,
      canSelectAllBranches,
      activeBranch,
      isAllBranches,
      activeCenterId,
      setActiveBranch,
    }),
    [
      centers,
      organization,
      loading,
      error,
      refresh,
      ensureLoaded,
      isOwner,
      isPlatformSuperUser,
      tenantCanManage,
      canSelectAllBranches,
      activeBranch,
      isAllBranches,
      activeCenterId,
      setActiveBranch,
    ],
  )

  return <CentersContext.Provider value={value}>{children}</CentersContext.Provider>
}
