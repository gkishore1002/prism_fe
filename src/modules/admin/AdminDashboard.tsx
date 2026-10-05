import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageLoader } from '@/components/ui/PrismLoader'
import { TenantScopeGuard } from './components/TenantScopeGuard'
import { PlatformLayout } from './components/PlatformLayout'
import { AdminManageLayout } from './pages/ManageLayout'
import { AdminReportsLayout } from './pages/ReportsLayout'

const AdminHomePage = lazy(() =>
  import('./pages/AdminHomePage').then((m) => ({ default: m.AdminHomePage })),
)
const PlatformConsolePage = lazy(() =>
  import('./pages/PlatformConsolePage').then((m) => ({ default: m.PlatformConsolePage })),
)
const PlatformOnboardPage = lazy(() =>
  import('./pages/PlatformOnboardPage').then((m) => ({ default: m.PlatformOnboardPage })),
)
const PlatformOrganizationPage = lazy(() =>
  import('./pages/PlatformOrganizationPage').then((m) => ({ default: m.PlatformOrganizationPage })),
)
const PlatformSuperUsersPage = lazy(() =>
  import('./pages/PlatformSuperUsersPage').then((m) => ({ default: m.PlatformSuperUsersPage })),
)
const AdminCentersPage = lazy(() =>
  import('./pages/CentersPage').then((m) => ({ default: m.AdminCentersPage })),
)
const AdminCenterDetailPage = lazy(() =>
  import('./pages/CenterDetailPage').then((m) => ({ default: m.AdminCenterDetailPage })),
)
const AdminInsightsPage = lazy(() =>
  import('./pages/InsightsPage').then((m) => ({ default: m.AdminInsightsPage })),
)
const AdminStudentReportsPage = lazy(() =>
  import('./pages/StudentReportsPage').then((m) => ({ default: m.AdminStudentReportsPage })),
)
const AdminSubjectReportsPage = lazy(() =>
  import('./pages/SubjectReportsPage').then((m) => ({ default: m.AdminSubjectReportsPage })),
)
const AdminAnalyticsPage = lazy(() =>
  import('./pages/AnalyticsPage').then((m) => ({ default: m.AdminAnalyticsPage })),
)
const AdminCurriculumSetupPage = lazy(() =>
  import('./pages/CurriculumSetupPage').then((m) => ({ default: m.AdminCurriculumSetupPage })),
)
const AdminStudentsPage = lazy(() =>
  import('./pages/StudentsPage').then((m) => ({ default: m.AdminStudentsPage })),
)
const AdminStudentReportPage = lazy(() =>
  import('./pages/StudentReportPage').then((m) => ({ default: m.AdminStudentReportPage })),
)
const AdminStudentReportsHubPage = lazy(() =>
  import('@/modules/reports/StudentReportsHubRoute').then((m) => ({
    default: m.AdminStudentReportsHubPage,
  })),
)
const AdminStudentOverallReportPage = lazy(() =>
  import('@/modules/reports/OverallReportRoute').then((m) => ({
    default: m.AdminStudentOverallReportPage,
  })),
)
const AdminStudentAssessmentReportPage = lazy(() =>
  import('@/modules/reports/AssessmentReportRoute').then((m) => ({
    default: m.AdminStudentAssessmentReportPage,
  })),
)
const AdminQuestionBankPage = lazy(() =>
  import('./pages/QuestionBankPage').then((m) => ({ default: m.AdminQuestionBankPage })),
)
const AdminBankQuestionPaperPage = lazy(() =>
  import('./pages/BankQuestionPaperPage').then((m) => ({ default: m.AdminBankQuestionPaperPage })),
)
const AdminAssessmentsPage = lazy(() =>
  import('./pages/AssessmentsPage').then((m) => ({ default: m.AdminAssessmentsPage })),
)
const AdminQuestionPaperPage = lazy(() =>
  import('./pages/QuestionPaperPage').then((m) => ({ default: m.AdminQuestionPaperPage })),
)
const AdminAssessmentAttendancePage = lazy(() =>
  import('@/components/academic/AssessmentAttendancePage').then((m) => ({
    default: m.AdminAssessmentAttendancePage,
  })),
)
const TutorMarksPage = lazy(() =>
  import('@/modules/tutor/pages/MarksPage').then((m) => ({ default: m.TutorMarksPage })),
)
const AdminSettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.AdminSettingsPage })),
)
const AdminStaffPage = lazy(() =>
  import('./pages/StaffPage').then((m) => ({ default: m.AdminStaffPage })),
)
const NotificationsPage = lazy(() =>
  import('@/components/notifications/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  })),
)

function RedirectLegacyCenterDetail() {
  const { centerId } = useParams()
  return <Navigate to={`/admin/manage/centers/${centerId}`} replace />
}

function PageSuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader label="Loading…" />}>{children}</Suspense>
}

export function AdminDashboard() {
  return (
    <Routes>
      <Route element={<AppLayout module="admin" />}>
        <Route path="platform" element={<PlatformLayout />}>
          <Route
            index
            element={
              <PageSuspense>
                <PlatformConsolePage />
              </PageSuspense>
            }
          />
          <Route
            path="onboard"
            element={
              <PageSuspense>
                <PlatformOnboardPage />
              </PageSuspense>
            }
          />
          <Route
            path="admins"
            element={
              <PageSuspense>
                <PlatformSuperUsersPage />
              </PageSuspense>
            }
          />
          <Route path="super-users" element={<Navigate to="/admin/platform/admins" replace />} />
          <Route
            path="organizations/:code"
            element={
              <PageSuspense>
                <PlatformOrganizationPage />
              </PageSuspense>
            }
          />
        </Route>
        <Route element={<TenantScopeGuard />}>
          <Route
            index
            element={
              <PageSuspense>
                <AdminHomePage />
              </PageSuspense>
            }
          />

          <Route path="manage" element={<AdminManageLayout />}>
            <Route index element={<Navigate to="students" replace />} />
            <Route
              path="students"
              element={
                <PageSuspense>
                  <AdminStudentsPage embedded />
                </PageSuspense>
              }
            />
            <Route
              path="staff"
              element={
                <PageSuspense>
                  <AdminStaffPage embedded />
                </PageSuspense>
              }
            />
            <Route
              path="centers"
              element={
                <PageSuspense>
                  <AdminCentersPage embedded />
                </PageSuspense>
              }
            />
            <Route
              path="centers/:centerId"
              element={
                <PageSuspense>
                  <AdminCenterDetailPage />
                </PageSuspense>
              }
            />
          </Route>

          <Route path="centers" element={<Navigate to="/admin/manage/centers" replace />} />
          <Route path="centers/:centerId" element={<RedirectLegacyCenterDetail />} />
          <Route path="students" element={<Navigate to="/admin/manage/students" replace />} />
          <Route path="staff" element={<Navigate to="/admin/manage/staff" replace />} />
          <Route path="admins" element={<Navigate to="/admin/manage/staff" replace />} />
          <Route path="teachers" element={<Navigate to="/admin/manage/staff" replace />} />
          <Route path="boards" element={<Navigate to="/admin/reports" replace />} />

          <Route
            path="students/:studentId/report"
            element={
              <PageSuspense>
                <AdminStudentReportPage />
              </PageSuspense>
            }
          />
          <Route
            path="students/:studentId/reports"
            element={
              <PageSuspense>
                <AdminStudentReportsHubPage />
              </PageSuspense>
            }
          />
          <Route
            path="students/:studentId/reports/overall"
            element={
              <PageSuspense>
                <AdminStudentOverallReportPage />
              </PageSuspense>
            }
          />
          <Route
            path="students/:studentId/reports/assessment/:assessmentId"
            element={
              <PageSuspense>
                <AdminStudentAssessmentReportPage />
              </PageSuspense>
            }
          />

          <Route
            path="question-bank"
            element={
              <PageSuspense>
                <AdminQuestionBankPage />
              </PageSuspense>
            }
          />
          <Route
            path="question-bank/papers/:paperId"
            element={
              <PageSuspense>
                <AdminBankQuestionPaperPage />
              </PageSuspense>
            }
          />
          <Route
            path="assessments"
            element={
              <PageSuspense>
                <AdminAssessmentsPage />
              </PageSuspense>
            }
          />
          <Route
            path="assessments/:assessmentId/paper"
            element={
              <PageSuspense>
                <AdminQuestionPaperPage />
              </PageSuspense>
            }
          />
          <Route
            path="assessments/:assessmentId/attendance"
            element={
              <PageSuspense>
                <AdminAssessmentAttendancePage />
              </PageSuspense>
            }
          />
          <Route
            path="marks"
            element={
              <PageSuspense>
                <TutorMarksPage />
              </PageSuspense>
            }
          />
          <Route path="reports" element={<AdminReportsLayout />}>
            <Route index element={<Navigate to="insights" replace />} />
            <Route
              path="insights"
              element={
                <PageSuspense>
                  <AdminInsightsPage />
                </PageSuspense>
              }
            />
            <Route
              path="students"
              element={
                <PageSuspense>
                  <AdminStudentReportsPage />
                </PageSuspense>
              }
            />
            <Route
              path="subjects"
              element={
                <PageSuspense>
                  <AdminSubjectReportsPage />
                </PageSuspense>
              }
            />
            <Route
              path="analytics"
              element={
                <PageSuspense>
                  <AdminAnalyticsPage />
                </PageSuspense>
              }
            />
          </Route>
          <Route
            path="setup"
            element={
              <PageSuspense>
                <AdminCurriculumSetupPage />
              </PageSuspense>
            }
          />
          <Route
            path="curriculum"
            element={
              <PageSuspense>
                <AdminCurriculumSetupPage />
              </PageSuspense>
            }
          />
          <Route path="batches" element={<Navigate to="/admin/curriculum" replace />} />
          <Route
            path="settings"
            element={
              <PageSuspense>
                <AdminSettingsPage />
              </PageSuspense>
            }
          />
          <Route
            path="notifications"
            element={
              <PageSuspense>
                <NotificationsPage />
              </PageSuspense>
            }
          />
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
