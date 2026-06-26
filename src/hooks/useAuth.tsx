import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { User, UserRole } from '@/types'
import { currentStudent, currentTutor, currentAdmin } from '@/data/mock'
import {
  loginLearnova,
  type LoginPendingRoles,
  type RoleOption,
} from '@/modules/auth/lib/authApi'
import {
  clearSession,
  dashboardPathForRole,
  persistSession,
  readSession,
} from '@/modules/auth/lib/authStorage'

interface AuthContextValue {
  user: User
  role: UserRole
  isAuthenticated: boolean
  pendingRoleSelection: LoginPendingRoles | null
  login: (email: string, password: string, institutionCode: string) => Promise<string | null>
  selectRole: (role: UserRole) => string
  logout: () => void
  cancelRoleSelection: () => void
}

const usersByRole: Record<UserRole, User> = {
  student: currentStudent,
  tutor: currentTutor,
  admin: currentAdmin,
}

const AuthContext = createContext<AuthContextValue | null>(null)

function sessionToUser(session: { role: UserRole; email: string }): User {
  const base = usersByRole[session.role]
  return { ...base, email: session.email }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = readSession()
  const [role, setRole] = useState<UserRole>(stored?.role ?? 'student')
  const [user, setUser] = useState<User>(
    stored ? sessionToUser(stored) : currentStudent,
  )
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(stored))
  const [pendingRoleSelection, setPendingRoleSelection] = useState<LoginPendingRoles | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  const completeAuth = useCallback((email: string, selectedRole: UserRole) => {
    const nextUser = { ...usersByRole[selectedRole], email }
    persistSession({ email, role: selectedRole, userId: nextUser.id })
    setUser(nextUser)
    setRole(selectedRole)
    setIsAuthenticated(true)
    setPendingRoleSelection(null)
    setPendingEmail(null)
    return dashboardPathForRole(selectedRole)
  }, [])

  const login = useCallback(async (email: string, password: string, institutionCode: string) => {
    const result = await loginLearnova(email, password, institutionCode)
    if (result.type === 'authenticated') {
      return completeAuth(result.email, result.role)
    }
    setPendingEmail(result.email)
    setPendingRoleSelection(result)
    return null
  }, [completeAuth])

  const selectRole = useCallback(
    (selectedRole: UserRole) => {
      const email = pendingEmail ?? usersByRole[selectedRole].email
      return completeAuth(email, selectedRole)
    },
    [completeAuth, pendingEmail],
  )

  const logout = useCallback(() => {
    clearSession()
    setIsAuthenticated(false)
    setPendingRoleSelection(null)
    setPendingEmail(null)
    setRole('student')
    setUser(currentStudent)
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
