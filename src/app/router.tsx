import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RouterRoot } from '@/components/layout/RouteTransitionOverlay'
import { PageLoader } from '@/components/ui/PrismLoader'
import { GuestRoute, RoleProtectedRoute } from '@/modules/auth/components/ProtectedRoute'
import { SetupOnlyRoute, SetupRequiredRoute } from '@/modules/auth/components/SetupRoute'
import { useAuth } from '@/hooks/useAuth'
import { dashboardPathForRole } from '@/modules/auth/lib/authStorage'

const LoginPage = lazy(() =>
  import('@/modules/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const SetupPage = lazy(() =>
  import('@/modules/auth/pages/SetupPage').then((m) => ({ default: m.SetupPage })),
)
const StudentDashboard = lazy(() =>
  import('@/modules/student/StudentDashboard').then((m) => ({ default: m.StudentDashboard })),
)
const TutorDashboard = lazy(() =>
  import('@/modules/tutor/TutorDashboard').then((m) => ({ default: m.TutorDashboard })),
)
const AdminDashboard = lazy(() =>
  import('@/modules/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
)

function RouteFallback() {
  return <PageLoader label="Loading…" />
}

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>
}

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
        element: withSuspense(
          <SetupOnlyRoute>
            <SetupPage />
          </SetupOnlyRoute>,
        ),
      },
      {
        path: '/login',
        element: withSuspense(
          <SetupRequiredRoute>
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          </SetupRequiredRoute>,
        ),
      },
      {
        path: '/student/*',
        element: withSuspense(
          <SetupRequiredRoute>
            <RoleProtectedRoute allowed="student">
              <StudentDashboard />
            </RoleProtectedRoute>
          </SetupRequiredRoute>,
        ),
      },
      {
        path: '/parent/*',
        element: <Navigate to="/student" replace />,
      },
      {
        path: '/tutor/*',
        element: withSuspense(
          <SetupRequiredRoute>
            <RoleProtectedRoute allowed="tutor">
              <TutorDashboard />
            </RoleProtectedRoute>
          </SetupRequiredRoute>,
        ),
      },
      {
        path: '/admin/*',
        element: withSuspense(
          <SetupRequiredRoute>
            <RoleProtectedRoute allowed="admin">
              <AdminDashboard />
            </RoleProtectedRoute>
          </SetupRequiredRoute>,
        ),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
