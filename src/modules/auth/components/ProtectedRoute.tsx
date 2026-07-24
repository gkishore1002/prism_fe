import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { dashboardPathForRole } from '@/modules/auth/lib/authStorage'
import type { ReactNode } from 'react'
import type { UserRole } from '@/types'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

export function RoleProtectedRoute({
  allowed,
  children,
}: {
  allowed: UserRole | UserRole[]
  children: ReactNode
}) {
  const { isAuthenticated, role } = useAuth()
  const location = useLocation()
  const roles = Array.isArray(allowed) ? allowed : [allowed]

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!roles.includes(role)) {
    return <Navigate to={dashboardPathForRole(role)} replace />
  }

  return children
}

export function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, role } = useAuth()

  if (isAuthenticated) {
    return <Navigate to={dashboardPathForRole(role)} replace />
  }

  return children
}