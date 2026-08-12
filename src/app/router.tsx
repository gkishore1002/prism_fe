import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RouterRoot } from '@/components/layout/RouteTransitionOverlay'
import { LoginPage } from '@/modules/auth/pages/LoginPage'
import { SetupPage } from '@/modules/auth/pages/SetupPage'
import { GuestRoute, RoleProtectedRoute } from '@/modules/auth/components/ProtectedRoute'
import { SetupOnlyRoute, SetupRequiredRoute } from '@/modules/auth/components/SetupRoute'
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

function AuthenticatedHomeRedirect() {
  return (
    <SetupRequiredRoute>
      <HomeRedirect />
    </SetupRequiredRoute>
  )
}

export const router = createBrowserRouter([
  {
    element: <RouterRoot />,
    children: [
      {
        path: '/',
        element: <AuthenticatedHomeRedirect />,
      },
      {
        path: '/setup',
        element: (
          <SetupOnlyRoute>
            <SetupPage />
          </SetupOnlyRoute>
        ),
      },
      {
        path: '/login',
        element: (
          <SetupRequiredRoute>
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          </SetupRequiredRoute>
        ),
      },
      {
        path: '/student/*',
        element: (
          <SetupRequiredRoute>
            <RoleProtectedRoute allowed="student">
              <StudentDashboard />
            </RoleProtectedRoute>
          </SetupRequiredRoute>
        ),
      },
      {
        path: '/parent/*',
        element: <Navigate to="/student" replace />,
      },
      {
        path: '/tutor/*',
        element: (
          <SetupRequiredRoute>
            <RoleProtectedRoute allowed="tutor">
              <TutorDashboard />
            </RoleProtectedRoute>
          </SetupRequiredRoute>
        ),
      },
      {
        path: '/admin/*',
        element: (
          <SetupRequiredRoute>
            <RoleProtectedRoute allowed="admin">
              <AdminDashboard />
            </RoleProtectedRoute>
          </SetupRequiredRoute>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
