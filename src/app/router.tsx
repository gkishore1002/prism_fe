import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RouterRoot } from '@/components/layout/RouteTransitionOverlay'
import { LoginPage } from '@/modules/auth/pages/LoginPage'
import { GuestRoute, RoleProtectedRoute } from '@/modules/auth/components/ProtectedRoute'
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
    element: <RouterRoot />,
    children: [
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
          <RoleProtectedRoute allowed="student">
            <StudentDashboard />
          </RoleProtectedRoute>
        ),
      },
      {
        path: '/parent/*',
        element: <Navigate to="/student" replace />,
      },
      {
        path: '/tutor/*',
        element: (
          <RoleProtectedRoute allowed="tutor">
            <TutorDashboard />
          </RoleProtectedRoute>
        ),
      },
      {
        path: '/admin/*',
        element: (
          <RoleProtectedRoute allowed="admin">
            <AdminDashboard />
          </RoleProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
