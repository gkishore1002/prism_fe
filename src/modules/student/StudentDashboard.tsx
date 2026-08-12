import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { StudentTodayPage } from './pages/TodayPage'
import { StudentAssessmentsPage } from './pages/AssessmentsPage'
import { StudentTakeAssessmentPage } from './pages/TakeAssessmentPage'
import { NotificationsPage } from '@/components/notifications/NotificationsPage'

export function StudentDashboard() {
  return (
    <Routes>
      <Route path="assessments/:assessmentId/take" element={<StudentTakeAssessmentPage />} />
      <Route element={<AppLayout module="student" />}>
        <Route index element={<StudentTodayPage />} />
        <Route path="study-plan" element={<Navigate to="/student" replace />} />
        <Route path="assessments" element={<StudentAssessmentsPage />} />
        <Route path="reports" element={<Navigate to="/student/assessments" replace />} />
        <Route path="reports/*" element={<Navigate to="/student/assessments" replace />} />
        <Route path="notifications" element={<NotificationsPage />} />
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
