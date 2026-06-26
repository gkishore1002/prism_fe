import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/modules/auth/pages/LoginPage'
import { GuestRoute, ProtectedRoute } from '@/modules/auth/components/ProtectedRoute'
import { StudentDashboard } from '@/modules/student/StudentDashboard'
import { TutorDashboard } from '@/modules/tutor/TutorDashboard'
import { AdminDashboard } from '@/modules/admin/AdminDashboard'
import { useAuth } from '@/hooks/useAuth'
import { dashboardPathForRole } from '@/modules/auth/lib/authStorage'

function HomeRedirect() {
  const { isAuthenticated, role } = useAuth()
  if (isAuthenticated) {
    return <Navigate to={dashboardPathForRole(role)} replace />
  }
  return <Navigate to="/login" replace />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomeRedirect />,
  },
  {
    path: '/login',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: '/student/*',
    element: (
      <ProtectedRoute>
        <StudentDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/parent/*',
    element: <Navigate to="/student" replace />,
  },
  {
    path: '/tutor/*',
    element: (
      <ProtectedRoute>
        <TutorDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/*',
    element: (
      <ProtectedRoute>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
