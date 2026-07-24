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
  fetchCurrentUser,
  loginPrism,
  logoutPrism,
  selectRolePrism,
  type LoginPendingRoles,
  type RoleOption,
} from '@/modules/auth/lib/authApi'
import {
  clearSession,
  dashboardPathForRole,
  persistSession,
  readSession,
} from '@/modules/auth/lib/authStorage'

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
  isAuthenticated: boolean
  pendingRoleSelection: LoginPendingRoles | null
  login: (email: string, password: string, institutionCode: string) => Promise<string | null>
  selectRole: (role: UserRole) => Promise<string>
  logout: () => void
  cancelRoleSelection: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = readSession()
  const [role, setRole] = useState<UserRole>(stored?.role ?? 'student')
  const [user, setUser] = useState<User>(stored?.user ?? GUEST_USER)
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(stored))
  const [pendingRoleSelection, setPendingRoleSelection] = useState<LoginPendingRoles | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  useEffect(() => {
    if (!stored?.accessToken) return
    fetchCurrentUser().then((apiUser) => {
      if (apiUser) {
        setUser(apiUser)
        setRole(apiUser.role)
        return
      }
      // Token expired or SECRET_KEY changed — clear stale session so user can log in again.
      clearSession()
      setIsAuthenticated(false)
      setPendingRoleSelection(null)
      setPendingEmail(null)
      setRole('student')
      setUser(GUEST_USER)
    })
  }, [])

  const completeAuth = useCallback(
    (email: string, selectedRole: UserRole, nextUser: User, accessToken?: string) => {
      persistSession({
        email,
        role: selectedRole,
        userId: nextUser.id,
        accessToken,
        user: nextUser,
      })
      setUser(nextUser)
      setRole(selectedRole)
      setIsAuthenticated(true)
      setPendingRoleSelection(null)
      setPendingEmail(null)
      return dashboardPathForRole(selectedRole)
    },
    [],
  )

  const login = useCallback(
    async (email: string, password: string, institutionCode: string) => {
      const result = await loginPrism(email, password, institutionCode)
      if (result.type === 'authenticated') {
        return completeAuth(result.email, result.role, result.user, result.accessToken)
      }
      setPendingEmail(result.email)
      setPendingRoleSelection(result)
      return null
    },
    [completeAuth],
  )

  const selectRole = useCallback(
    async (selectedRole: UserRole) => {
      const email = pendingEmail ?? user.email
      const result = await selectRolePrism(email, selectedRole)
      return completeAuth(result.email, result.role, result.user, result.accessToken)
    },
    [completeAuth, pendingEmail, user.email],
  )

  const logout = useCallback(() => {
    void logoutPrism()
    clearSession()
    setIsAuthenticated(false)
    setPendingRoleSelection(null)
    setPendingEmail(null)
    setRole('student')
    setUser(GUEST_USER)
  }, [])

  const cancelRoleSelection = useCallback(() => {
    setPendingRoleSelection(null)
    setPendingEmail(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      role,
      isAuthenticated,
      pendingRoleSelection,
      login,
      selectRole,
      logout,
      cancelRoleSelection,
    }),
    [user, role, isAuthenticated, pendingRoleSelection, login, selectRole, logout, cancelRoleSelection],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export type { RoleOption }