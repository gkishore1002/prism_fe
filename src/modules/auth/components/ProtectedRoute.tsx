import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { dashboardPathForRole } from '@/modules/auth/lib/authStorage'
import type { ReactNode } from 'react'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
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
