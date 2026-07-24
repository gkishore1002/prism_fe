import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AdminDashboardPage } from './pages/DashboardPage'
import { AdminCentersPage } from './pages/CentersPage'
import { AdminBoardsPage } from './pages/BoardsPage'
import { AdminReportsLayout } from './pages/ReportsLayout'
import { AdminInsightsPage } from './pages/InsightsPage'
import { AdminStudentReportsPage } from './pages/StudentReportsPage'
import { AdminSubjectReportsPage } from './pages/SubjectReportsPage'
import { AdminAnalyticsPage } from './pages/AnalyticsPage'
import { AdminCurriculumSetupPage } from './pages/CurriculumSetupPage'
import { AdminTeachersPage } from './pages/TeachersPage'
import { AdminStudentsPage } from './pages/StudentsPage'
import { AdminStudentReportPage } from './pages/StudentReportPage'
import { AdminStudentReportsHubPage } from '@/modules/reports/StudentReportsHubRoute'
import { AdminStudentOverallReportPage } from '@/modules/reports/OverallReportRoute'
import { AdminStudentAssessmentReportPage } from '@/modules/reports/AssessmentReportRoute'
import { AdminQuestionBankPage } from './pages/QuestionBankPage'
import { AdminBankQuestionPaperPage } from './pages/BankQuestionPaperPage'
import { AdminAssessmentsPage } from './pages/AssessmentsPage'
import { AdminAssessmentAttendancePage } from '@/components/academic/AssessmentAttendancePage'
import { NotificationsPage } from '@/components/notifications/NotificationsPage'

export function AdminDashboard() {
  return (
    <Routes>
      <Route element={<AppLayout module="admin" />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="centers" element={<AdminCentersPage />} />
        <Route path="students" element={<AdminStudentsPage />} />
        <Route path="students/:studentId/report" element={<AdminStudentReportPage />} />
        <Route path="students/:studentId/reports" element={<AdminStudentReportsHubPage />} />
        <Route path="students/:studentId/reports/overall" element={<AdminStudentOverallReportPage />} />
        <Route path="students/:studentId/reports/assessment/:assessmentId" element={<AdminStudentAssessmentReportPage />} />
        <Route path="question-bank" element={<AdminQuestionBankPage />} />
        <Route path="question-bank/papers/:paperId" element={<AdminBankQuestionPaperPage />} />
        <Route path="assessments" element={<AdminAssessmentsPage />} />
        <Route path="assessments/:assessmentId/attendance" element={<AdminAssessmentAttendancePage />} />
        <Route path="boards" element={<AdminBoardsPage />} />
        <Route path="reports" element={<AdminReportsLayout />}>
          <Route index element={<Navigate to="insights" replace />} />
          <Route path="insights" element={<AdminInsightsPage />} />
          <Route path="students" element={<AdminStudentReportsPage />} />
          <Route path="subjects" element={<AdminSubjectReportsPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
        </Route>
        <Route path="setup" element={<AdminCurriculumSetupPage />} />
        <Route path="curriculum" element={<AdminCurriculumSetupPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="teachers" element={<AdminTeachersPage />} />
        <Route path="syllabus" element={<Navigate to="/admin/curriculum" replace />} />
        <Route path="intelligence" element={<Navigate to="/admin/reports" replace />} />
        <Route path="institution" element={<Navigate to="/admin" replace />} />
        <Route path="analytics" element={<Navigate to="/admin/reports" replace />} />
        <Route path="hierarchy" element={<Navigate to="/admin/curriculum" replace />} />
        <Route path="settings" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  )
}