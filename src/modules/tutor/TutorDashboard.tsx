import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { TutorDashboardPage } from './pages/DashboardPage'
import { TutorStudentsPage } from './pages/StudentsPage'
import { TutorAssessmentsPage } from './pages/AssessmentsPage'
import { TutorQuestionBankPage } from './pages/QuestionBankPage'
import { TutorCurriculumSetupPage } from './pages/CurriculumSetupPage'
import { TutorStudyPlansPage } from './pages/StudyPlansPage'
import { TutorQuestionPaperPage } from './pages/QuestionPaperPage'
import { BankQuestionPaperPage } from './pages/BankQuestionPaperPage'

export function TutorDashboard() {
  return (
    <Routes>
      <Route element={<AppLayout module="tutor" />}>
        <Route index element={<TutorDashboardPage />} />
        <Route path="students" element={<TutorStudentsPage />} />
        <Route path="assessments" element={<TutorAssessmentsPage />} />
        <Route path="study-plans" element={<TutorStudyPlansPage />} />
        <Route path="assessments/:assessmentId/paper" element={<TutorQuestionPaperPage />} />
        <Route path="question-bank" element={<TutorQuestionBankPage />} />
        <Route path="question-bank/papers/:paperId" element={<BankQuestionPaperPage />} />
        <Route path="curriculum" element={<TutorCurriculumSetupPage />} />
        <Route path="setup" element={<Navigate to="/tutor/curriculum" replace />} />
        <Route path="batches" element={<Navigate to="/tutor/curriculum" replace />} />
        <Route path="meeting-report" element={<Navigate to="/tutor/curriculum" replace />} />
        <Route path="at-risk" element={<Navigate to="/tutor/students" replace />} />
        <Route path="insights" element={<Navigate to="/tutor" replace />} />
        <Route path="gaps" element={<Navigate to="/tutor" replace />} />
      </Route>
    </Routes>
  )
}
