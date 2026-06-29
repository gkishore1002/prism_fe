import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AdminDashboardPage } from './pages/DashboardPage'
import { AdminCentersPage } from './pages/CentersPage'
import { AdminBoardsPage } from './pages/BoardsPage'
import { AdminSubjectReportsPage } from './pages/SubjectReportsPage'
import { AdminCurriculumSetupPage } from './pages/CurriculumSetupPage'
import { AdminTeachersPage } from './pages/TeachersPage'
import { AdminSyllabusPage } from './pages/SyllabusPage'
import { AdminIntelligencePage } from './pages/IntelligencePage'
import { AdminStudentsPage } from './pages/StudentsPage'
import { AdminStudentReportPage } from './pages/StudentReportPage'
import { AdminQuestionBankPage } from './pages/QuestionBankPage'
import { AdminBankQuestionPaperPage } from './pages/BankQuestionPaperPage'
import { AdminAssessmentsPage } from './pages/AssessmentsPage'
import { AdminAssessmentAttendancePage } from './pages/AssessmentAttendancePage'
import { NotificationsPage } from '@/components/notifications/NotificationsPage'

export function AdminDashboard() {
  return (
    <Routes>
      <Route element={<AppLayout module="admin" />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="centers" element={<AdminCentersPage />} />
        <Route path="students" element={<AdminStudentsPage />} />
        <Route path="students/:studentId/report" element={<AdminStudentReportPage />} />
        <Route path="question-bank" element={<AdminQuestionBankPage />} />
        <Route path="question-bank/papers/:paperId" element={<AdminBankQuestionPaperPage />} />
        <Route path="assessments" element={<AdminAssessmentsPage />} />
        <Route path="assessments/:assessmentId/attendance" element={<AdminAssessmentAttendancePage />} />
        <Route path="boards" element={<AdminBoardsPage />} />
        <Route path="reports" element={<AdminSubjectReportsPage />} />
        <Route path="setup" element={<AdminCurriculumSetupPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="teachers" element={<AdminTeachersPage />} />
        <Route path="syllabus" element={<AdminSyllabusPage />} />
        <Route path="intelligence" element={<AdminIntelligencePage />} />
        <Route path="institution" element={<Navigate to="/admin" replace />} />
        <Route path="analytics" element={<Navigate to="/admin/reports" replace />} />
        <Route path="hierarchy" element={<Navigate to="/admin/setup" replace />} />
        <Route path="settings" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  )
}
