import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageLoader } from '@/components/ui/PrismLoader'

const StudentTodayPage = lazy(() =>
  import('./pages/TodayPage').then((m) => ({ default: m.StudentTodayPage })),
)
const StudentAssessmentsPage = lazy(() =>
  import('./pages/AssessmentsPage').then((m) => ({ default: m.StudentAssessmentsPage })),
)
const StudentTakeAssessmentPage = lazy(() =>
  import('./pages/TakeAssessmentPage').then((m) => ({ default: m.StudentTakeAssessmentPage })),
)
const NotificationsPage = lazy(() =>
  import('@/components/notifications/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  })),
)

function PageSuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader label="Loading…" />}>{children}</Suspense>
}

export function StudentDashboard() {
  return (
    <Routes>
      <Route
        path="assessments/:assessmentId/take"
        element={
          <PageSuspense>
            <StudentTakeAssessmentPage />
          </PageSuspense>
        }
      />
      <Route element={<AppLayout module="student" />}>
        <Route
          index
          element={
            <PageSuspense>
              <StudentTodayPage />
            </PageSuspense>
          }
        />
        <Route path="study-plan" element={<Navigate to="/student" replace />} />
        <Route
          path="assessments"
          element={
            <PageSuspense>
              <StudentAssessmentsPage />
            </PageSuspense>
          }
        />
        <Route path="reports" element={<Navigate to="/student/assessments" replace />} />
        <Route path="reports/*" element={<Navigate to="/student/assessments" replace />} />
        <Route
          path="notifications"
          element={
            <PageSuspense>
              <NotificationsPage />
            </PageSuspense>
          }
        />
        <Route path="today" element={<Navigate to="/student" replace />} />
        <Route path="practice" element={<Navigate to="/student/assessments" replace />} />
        <Route path="diagnostics" element={<Navigate to="/student/assessments" replace />} />
        <Route path="alerts" element={<Navigate to="/student/assessments" replace />} />
        <Route path="health" element={<Navigate to="/student/assessments" replace />} />
        <Route path="plan" element={<Navigate to="/student" replace />} />
        <Route path="gaps" element={<Navigate to="/student/assessments" replace />} />
        <Route path="recovery" element={<Navigate to="/student" replace />} />
        <Route path="readiness" element={<Navigate to="/student/assessments" replace />} />
      </Route>
    </Routes>
  )
}
