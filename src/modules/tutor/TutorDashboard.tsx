import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { TutorDashboardProvider } from '@/hooks/useTutorDashboard'
import { TutorDashboardPage } from './pages/DashboardPage'
import { TutorStudentsPage } from './pages/StudentsPage'
import { TutorAssessmentsPage } from './pages/AssessmentsPage'
import { TutorQuestionBankPage } from './pages/QuestionBankPage'
import { TutorCurriculumSetupPage } from './pages/CurriculumSetupPage'
import { TutorQuestionPaperPage } from './pages/QuestionPaperPage'
import { BankQuestionPaperPage } from './pages/BankQuestionPaperPage'
import { TutorMarksPage } from './pages/MarksPage'
import { TutorReportsLayout } from './pages/ReportsLayout'
import { TutorInsightsPage } from './pages/InsightsPage'
import { TutorStudentReportsPage } from './pages/StudentReportsPage'
import { TutorStudentReportPage } from './pages/StudentReportPage'
import {
  TutorStudentReportsHubPage,
} from '@/modules/reports/StudentReportsHubRoute'
import {
  TutorStudentOverallReportPage,
} from '@/modules/reports/OverallReportRoute'
import {
  TutorStudentAssessmentReportPage,
} from '@/modules/reports/AssessmentReportRoute'
import { TutorSubjectReportsPage } from './pages/SubjectReportsPage'
import { TutorAtRiskPage } from './pages/AtRiskPage'
import { TutorAssessmentAttendancePage } from '@/components/academic/AssessmentAttendancePage'
import { NotificationsPage } from '@/components/notifications/NotificationsPage'

export function TutorDashboard() {
  return (
    <TutorDashboardProvider>
    <Routes>
      <Route element={<AppLayout module="tutor" />}>
        <Route index element={<TutorDashboardPage />} />
        <Route path="students" element={<TutorStudentsPage />} />
        <Route path="assessments" element={<TutorAssessmentsPage />} />
        <Route path="marks" element={<TutorMarksPage />} />
        <Route path="reports" element={<TutorReportsLayout />}>
          <Route index element={<Navigate to="insights" replace />} />
          <Route path="insights" element={<TutorInsightsPage embedded />} />
          <Route path="students" element={<TutorStudentReportsPage />} />
          <Route path="subjects" element={<TutorSubjectReportsPage />} />
          <Route path="at-risk" element={<TutorAtRiskPage embedded />} />
        </Route>
        <Route path="students/:studentId/report" element={<TutorStudentReportPage />} />
        <Route path="students/:studentId/reports" element={<TutorStudentReportsHubPage />} />
        <Route path="students/:studentId/reports/overall" element={<TutorStudentOverallReportPage />} />
        <Route path="students/:studentId/reports/assessment/:assessmentId" element={<TutorStudentAssessmentReportPage />} />
        <Route path="study-plans" element={<Navigate to="/tutor" replace />} />
        <Route path="assessments/:assessmentId/attendance" element={<TutorAssessmentAttendancePage />} />
        <Route path="assessments/:assessmentId/paper" element={<TutorQuestionPaperPage />} />
        <Route path="question-bank" element={<TutorQuestionBankPage />} />
        <Route path="question-bank/papers/:paperId" element={<BankQuestionPaperPage />} />
        <Route path="curriculum" element={<TutorCurriculumSetupPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
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