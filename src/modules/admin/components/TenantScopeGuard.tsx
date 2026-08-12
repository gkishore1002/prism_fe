import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

/** Platform super users manage orgs only via /admin/platform — never tenant admin. */
export function TenantScopeGuard() {
  const { role } = useAuth()
  if (role === 'super_user') {
    return <Navigate to="/admin/platform" replace />
  }
  return <Outlet />
}
