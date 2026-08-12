import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User, UserRole } from '@/types'
import {
  fetchAuthSession,
  loginPrism,
  logoutPrism,
  selectRolePrism,
  switchRolePrism,
  type LoginPendingRoles,
  type RoleOption,
} from '@/modules/auth/lib/authApi'
import {
  clearSession,
  dashboardPathForRole,
  persistSession,
  readSession,
  type PrismSession,
} from '@/modules/auth/lib/authStorage'
import { clearActiveOrgCode, enterPlatformOverview } from '@/modules/auth/lib/orgContext'

const GUEST_USER: User = {
  id: '',
  name: 'Guest',
  email: '',
  role: 'student',
  institutionId: '',
}

interface AuthContextValue {
  user: User
  role: UserRole
  adminPortal?: 'organization' | 'branch'
  isAuthenticated: boolean
  pendingRoleSelection: LoginPendingRoles | null
  login: (email: string, password: string, institutionCode: string) => Promise<string | null>
  selectRole: (option: RoleOption) => Promise<string>
  switchPortal: (option: RoleOption) => Promise<void>
  refreshPortals: () => void
  refreshAuth: () => Promise<void>
  portalRefreshKey: number
  logout: () => void
  cancelRoleSelection: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = readSession()
  const [role, setRole] = useState<UserRole>(stored?.role ?? 'student')
  const [adminPortal, setAdminPortal] = useState<PrismSession['adminPortal']>(stored?.adminPortal)
  const [user, setUser] = useState<User>(stored?.user ?? GUEST_USER)
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(stored))
  const [pendingRoleSelection, setPendingRoleSelection] = useState<LoginPendingRoles | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [pendingInstitutionCode, setPendingInstitutionCode] = useState<string | null>(null)
  const [portalRefreshKey, setPortalRefreshKey] = useState(0)

  const refreshPortals = useCallback(() => {
    setPortalRefreshKey((value) => value + 1)
  }, [])

  const applyAuth = useCallback(
    (
      email: string,
      selectedRole: UserRole,
      nextUser: User,
      accessToken?: string,
      nextAdminPortal?: RoleOption['adminPortal'],
    ) => {
      if (selectedRole === 'super_user') {
        enterPlatformOverview()
      }
      persistSession({
        email,
        role: selectedRole,
        userId: nextUser.id,
        accessToken,
        user: nextUser,
        adminPortal: nextAdminPortal,
      })
      setUser(nextUser)
      setRole(selectedRole)
      setAdminPortal(nextAdminPortal)
      setIsAuthenticated(true)
      setPendingRoleSelection(null)
      setPendingEmail(null)
      setPendingInstitutionCode(null)
    },
    [],
  )

  const syncSessionFromApi = useCallback(async () => {
    const synced = await fetchAuthSession()
    if (!synced) return false
    const current = readSession()
    if (!current?.accessToken) return false
    persistSession({
      ...current,
      user: synced.user,
      role: synced.user.role,
      adminPortal: synced.adminPortal,
    })
    setUser(synced.user)
    setRole(synced.user.role)
    setAdminPortal(synced.adminPortal)
    return true
  }, [])

  const refreshAuth = useCallback(async () => {
    const ok = await syncSessionFromApi()
    if (ok) {
      refreshPortals()
    }
  }, [refreshPortals, syncSessionFromApi])

  useEffect(() => {
    if (!stored?.accessToken) return
    void syncSessionFromApi().then((ok) => {
      if (!ok) {
        clearSession()
        setIsAuthenticated(false)
        setPendingRoleSelection(null)
        setPendingEmail(null)
        setPendingInstitutionCode(null)
        setRole('student')
        setAdminPortal(undefined)
        setUser(GUEST_USER)
      }
    })
  }, [syncSessionFromApi])

  const completeAuth = useCallback(
    async (
      email: string,
      selectedRole: UserRole,
      nextUser: User,
      accessToken?: string,
      nextAdminPortal?: RoleOption['adminPortal'],
    ) => {
      applyAuth(email, selectedRole, nextUser, accessToken, nextAdminPortal)
      return dashboardPathForRole(selectedRole)
    },
    [applyAuth],
  )

  const login = useCallback(
    async (email: string, password: string, institutionCode: string) => {
      const result = await loginPrism(email, password, institutionCode)
      if (result.type === 'authenticated') {
        return await completeAuth(
          result.email,
          result.role,
          result.user,
          result.accessToken,
          result.adminPortal,
        )
      }
      setPendingEmail(result.email)
      setPendingInstitutionCode(result.institutionCode ?? institutionCode)
      setPendingRoleSelection(result)
      return null
    },
    [completeAuth],
  )

  const selectRole = useCallback(
    async (option: RoleOption) => {
      const email = pendingEmail ?? user.email
      const result = await selectRolePrism(email, option.role, {
        institutionCode: pendingInstitutionCode ?? undefined,
        adminPortal: option.adminPortal,
      })
      return await completeAuth(
        result.email,
        result.role,
        result.user,
        result.accessToken,
        result.adminPortal ?? option.adminPortal,
      )
    },
    [completeAuth, pendingEmail, pendingInstitutionCode, user.email],
  )

  const switchPortal = useCallback(async (option: RoleOption) => {
    const result = await switchRolePrism(option)
    applyAuth(
      result.email,
      result.role,
      result.user,
      result.accessToken,
      result.adminPortal ?? option.adminPortal,
    )
    window.location.assign(dashboardPathForRole(result.role))
  }, [applyAuth])

  const logout = useCallback(() => {
    void logoutPrism()
    clearSession()
    clearActiveOrgCode()
    setIsAuthenticated(false)
    setPendingRoleSelection(null)
    setPendingEmail(null)
    setPendingInstitutionCode(null)
    setRole('student')
    setAdminPortal(undefined)
    setUser(GUEST_USER)
  }, [])

  const cancelRoleSelection = useCallback(() => {
    setPendingRoleSelection(null)
    setPendingEmail(null)
    setPendingInstitutionCode(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      role,
      adminPortal,
      isAuthenticated,
      pendingRoleSelection,
      login,
      selectRole,
      switchPortal,
      refreshPortals,
      refreshAuth,
      portalRefreshKey,
      logout,
      cancelRoleSelection,
    }),
    [
      user,
      role,
      adminPortal,
      isAuthenticated,
      pendingRoleSelection,
      login,
      selectRole,
      switchPortal,
      refreshPortals,
      refreshAuth,
      portalRefreshKey,
      logout,
      cancelRoleSelection,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export type { RoleOption }
