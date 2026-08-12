import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { TenantScopeGuard } from './components/TenantScopeGuard'
import { AdminHomePage } from './pages/AdminHomePage'
import { PlatformConsolePage } from './pages/PlatformConsolePage'
import { PlatformLayout } from './components/PlatformLayout'
import { PlatformOnboardPage } from './pages/PlatformOnboardPage'
import { PlatformOrganizationPage } from './pages/PlatformOrganizationPage'
import { PlatformSuperUsersPage } from './pages/PlatformSuperUsersPage'
import { AdminCentersPage } from './pages/CentersPage'
import { AdminCenterDetailPage } from './pages/CenterDetailPage'
import { AdminReportsLayout } from './pages/ReportsLayout'
import { AdminInsightsPage } from './pages/InsightsPage'
import { AdminStudentReportsPage } from './pages/StudentReportsPage'
import { AdminSubjectReportsPage } from './pages/SubjectReportsPage'
import { AdminAnalyticsPage } from './pages/AnalyticsPage'
import { AdminCurriculumSetupPage } from './pages/CurriculumSetupPage'
import { AdminStudentsPage } from './pages/StudentsPage'
import { AdminStudentReportPage } from './pages/StudentReportPage'
import { AdminStudentReportsHubPage } from '@/modules/reports/StudentReportsHubRoute'
import { AdminStudentOverallReportPage } from '@/modules/reports/OverallReportRoute'
import { AdminStudentAssessmentReportPage } from '@/modules/reports/AssessmentReportRoute'
import { AdminQuestionBankPage } from './pages/QuestionBankPage'
import { AdminBankQuestionPaperPage } from './pages/BankQuestionPaperPage'
import { AdminAssessmentsPage } from './pages/AssessmentsPage'
import { AdminQuestionPaperPage } from './pages/QuestionPaperPage'
import { AdminAssessmentAttendancePage } from '@/components/academic/AssessmentAttendancePage'
import { AdminSettingsPage } from './pages/SettingsPage'
import { AdminStaffPage } from './pages/StaffPage'
import { AdminManageLayout } from './pages/ManageLayout'
import { NotificationsPage } from '@/components/notifications/NotificationsPage'

function RedirectLegacyCenterDetail() {
  const { centerId } = useParams()
  return <Navigate to={`/admin/manage/centers/${centerId}`} replace />
}

export function AdminDashboard() {
  return (
    <Routes>
      <Route element={<AppLayout module="admin" />}>
        <Route path="platform" element={<PlatformLayout />}>
          <Route index element={<PlatformConsolePage />} />
          <Route path="onboard" element={<PlatformOnboardPage />} />
          <Route path="admins" element={<PlatformSuperUsersPage />} />
          <Route path="super-users" element={<Navigate to="/admin/platform/admins" replace />} />
          <Route path="organizations/:code" element={<PlatformOrganizationPage />} />
        </Route>
        <Route element={<TenantScopeGuard />}>
          <Route index element={<AdminHomePage />} />

          <Route path="manage" element={<AdminManageLayout />}>
            <Route index element={<Navigate to="students" replace />} />
            <Route path="students" element={<AdminStudentsPage embedded />} />
            <Route path="staff" element={<AdminStaffPage embedded />} />
            <Route path="centers" element={<AdminCentersPage embedded />} />
            <Route path="centers/:centerId" element={<AdminCenterDetailPage />} />
          </Route>

          {/* Legacy redirects → Manage */}
          <Route path="centers" element={<Navigate to="/admin/manage/centers" replace />} />
          <Route path="centers/:centerId" element={<RedirectLegacyCenterDetail />} />
          <Route path="students" element={<Navigate to="/admin/manage/students" replace />} />
          <Route path="staff" element={<Navigate to="/admin/manage/staff" replace />} />
          <Route path="admins" element={<Navigate to="/admin/manage/staff" replace />} />
          <Route path="teachers" element={<Navigate to="/admin/manage/staff" replace />} />
          <Route path="boards" element={<Navigate to="/admin/reports" replace />} />

          {/* Student report deep-links (unchanged paths used by reports module) */}
          <Route path="students/:studentId/report" element={<AdminStudentReportPage />} />
          <Route path="students/:studentId/reports" element={<AdminStudentReportsHubPage />} />
          <Route path="students/:studentId/reports/overall" element={<AdminStudentOverallReportPage />} />
          <Route path="students/:studentId/reports/assessment/:assessmentId" element={<AdminStudentAssessmentReportPage />} />

          <Route path="question-bank" element={<AdminQuestionBankPage />} />
          <Route path="question-bank/papers/:paperId" element={<AdminBankQuestionPaperPage />} />
          <Route path="assessments" element={<AdminAssessmentsPage />} />
          <Route path="assessments/:assessmentId/paper" element={<AdminQuestionPaperPage />} />
          <Route path="assessments/:assessmentId/attendance" element={<AdminAssessmentAttendancePage />} />
          <Route path="reports" element={<AdminReportsLayout />}>
            <Route index element={<Navigate to="insights" replace />} />
            <Route path="insights" element={<AdminInsightsPage />} />
            <Route path="students" element={<AdminStudentReportsPage />} />
            <Route path="subjects" element={<AdminSubjectReportsPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
          </Route>
          <Route path="setup" element={<AdminCurriculumSetupPage />} />
          <Route path="curriculum" element={<AdminCurriculumSetupPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="syllabus" element={<Navigate to="/admin/curriculum" replace />} />
          <Route path="intelligence" element={<Navigate to="/admin/reports" replace />} />
          <Route path="institution" element={<Navigate to="/admin" replace />} />
          <Route path="analytics" element={<Navigate to="/admin/reports" replace />} />
          <Route path="hierarchy" element={<Navigate to="/admin/curriculum" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
