import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageLoader } from '@/components/ui/PrismLoader'
import { TutorDashboardProvider } from '@/hooks/useTutorDashboard'
import { TutorReportsLayout } from './pages/ReportsLayout'

const TutorDashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.TutorDashboardPage })),
)
const TutorStudentsPage = lazy(() =>
  import('./pages/StudentsPage').then((m) => ({ default: m.TutorStudentsPage })),
)
const TutorAssessmentsPage = lazy(() =>
  import('./pages/AssessmentsPage').then((m) => ({ default: m.TutorAssessmentsPage })),
)
const TutorQuestionBankPage = lazy(() =>
  import('./pages/QuestionBankPage').then((m) => ({ default: m.TutorQuestionBankPage })),
)
const TutorCurriculumSetupPage = lazy(() =>
  import('./pages/CurriculumSetupPage').then((m) => ({ default: m.TutorCurriculumSetupPage })),
)
const TutorQuestionPaperPage = lazy(() =>
  import('./pages/QuestionPaperPage').then((m) => ({ default: m.TutorQuestionPaperPage })),
)
const BankQuestionPaperPage = lazy(() =>
  import('./pages/BankQuestionPaperPage').then((m) => ({ default: m.BankQuestionPaperPage })),
)
const TutorMarksPage = lazy(() =>
  import('./pages/MarksPage').then((m) => ({ default: m.TutorMarksPage })),
)
const TutorInsightsPage = lazy(() =>
  import('./pages/InsightsPage').then((m) => ({ default: m.TutorInsightsPage })),
)
const TutorStudentReportsPage = lazy(() =>
  import('./pages/StudentReportsPage').then((m) => ({ default: m.TutorStudentReportsPage })),
)
const TutorStudentReportPage = lazy(() =>
  import('./pages/StudentReportPage').then((m) => ({ default: m.TutorStudentReportPage })),
)
const TutorStudentReportsHubPage = lazy(() =>
  import('@/modules/reports/StudentReportsHubRoute').then((m) => ({
    default: m.TutorStudentReportsHubPage,
  })),
)
const TutorStudentOverallReportPage = lazy(() =>
  import('@/modules/reports/OverallReportRoute').then((m) => ({
    default: m.TutorStudentOverallReportPage,
  })),
)
const TutorStudentAssessmentReportPage = lazy(() =>
  import('@/modules/reports/AssessmentReportRoute').then((m) => ({
    default: m.TutorStudentAssessmentReportPage,
  })),
)
const TutorSubjectReportsPage = lazy(() =>
  import('./pages/SubjectReportsPage').then((m) => ({ default: m.TutorSubjectReportsPage })),
)
const TutorAtRiskPage = lazy(() =>
  import('./pages/AtRiskPage').then((m) => ({ default: m.TutorAtRiskPage })),
)
const TutorAssessmentAttendancePage = lazy(() =>
  import('@/components/academic/AssessmentAttendancePage').then((m) => ({
    default: m.TutorAssessmentAttendancePage,
  })),
)
const NotificationsPage = lazy(() =>
  import('@/components/notifications/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  })),
)

function PageSuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader label="Loading…" />}>{children}</Suspense>
}

export function TutorDashboard() {
  return (
    <TutorDashboardProvider>
      <Routes>
        <Route element={<AppLayout module="tutor" />}>
          <Route
            index
            element={
              <PageSuspense>
                <TutorDashboardPage />
              </PageSuspense>
            }
          />
          <Route
            path="students"
            element={
              <PageSuspense>
                <TutorStudentsPage />
              </PageSuspense>
            }
          />
          <Route
            path="assessments"
            element={
              <PageSuspense>
                <TutorAssessmentsPage />
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
          <Route path="reports" element={<TutorReportsLayout />}>
            <Route index element={<Navigate to="insights" replace />} />
            <Route
              path="insights"
              element={
                <PageSuspense>
                  <TutorInsightsPage embedded />
                </PageSuspense>
              }
            />
            <Route
              path="students"
              element={
                <PageSuspense>
                  <TutorStudentReportsPage />
                </PageSuspense>
              }
            />
            <Route
              path="subjects"
              element={
                <PageSuspense>
                  <TutorSubjectReportsPage />
                </PageSuspense>
              }
            />
            <Route
              path="at-risk"
              element={
                <PageSuspense>
                  <TutorAtRiskPage embedded />
                </PageSuspense>
              }
            />
          </Route>
          <Route
            path="students/:studentId/report"
            element={
              <PageSuspense>
                <TutorStudentReportPage />
              </PageSuspense>
            }
          />
          <Route
            path="students/:studentId/reports"
            element={
              <PageSuspense>
                <TutorStudentReportsHubPage />
              </PageSuspense>
            }
          />
          <Route
            path="students/:studentId/reports/overall"
            element={
              <PageSuspense>
                <TutorStudentOverallReportPage />
              </PageSuspense>
            }
          />
          <Route
            path="students/:studentId/reports/assessment/:assessmentId"
            element={
              <PageSuspense>
                <TutorStudentAssessmentReportPage />
              </PageSuspense>
            }
          />
          <Route path="study-plans" element={<Navigate to="/tutor" replace />} />
          <Route
            path="assessments/:assessmentId/attendance"
            element={
              <PageSuspense>
                <TutorAssessmentAttendancePage />
              </PageSuspense>
            }
          />
          <Route
            path="assessments/:assessmentId/paper"
            element={
              <PageSuspense>
                <TutorQuestionPaperPage />
              </PageSuspense>
            }
          />
          <Route
            path="question-bank"
            element={
              <PageSuspense>
                <TutorQuestionBankPage />
              </PageSuspense>
            }
          />
          <Route
            path="question-bank/papers/:paperId"
            element={
              <PageSuspense>
                <BankQuestionPaperPage />
              </PageSuspense>
            }
          />
          <Route
            path="curriculum"
            element={
              <PageSuspense>
                <TutorCurriculumSetupPage />
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
          <Route path="setup" element={<Navigate to="/tutor/curriculum" replace />} />
          <Route path="batches" element={<Navigate to="/tutor/curriculum" replace />} />
          <Route path="meeting-report" element={<Navigate to="/tutor/reports/insights" replace />} />
          <Route path="insights" element={<Navigate to="/tutor/reports/insights" replace />} />
          <Route path="at-risk" element={<Navigate to="/tutor/reports/at-risk" replace />} />
          <Route path="gaps" element={<Navigate to="/tutor" replace />} />
        </Route>
      </Routes>
    </TutorDashboardProvider>
  )
}
