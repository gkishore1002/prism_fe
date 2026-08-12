import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AdminDashboardPage } from './DashboardPage'

/** Platform super users use /admin/platform only. */
export function AdminHomePage() {
  const { role } = useAuth()
  if (role === 'super_user') {
    return <Navigate to="/admin/platform" replace />
  }
  return <AdminDashboardPage />
}
