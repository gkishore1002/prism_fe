import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { AssessmentProvider } from '@/hooks/useAssessments'
import { QuestionPaperProvider } from '@/hooks/useQuestionPapers'
import { CurriculumProvider } from '@/hooks/useCurriculum'
import { StudyPlanProvider } from '@/hooks/useStudyPlans'
import { router } from './router'

export function App() {
  return (
    <AuthProvider>
      <CurriculumProvider>
        <QuestionPaperProvider>
          <AssessmentProvider>
            <StudyPlanProvider>
              <RouterProvider router={router} />
            </StudyPlanProvider>
          </AssessmentProvider>
        </QuestionPaperProvider>
      </CurriculumProvider>
    </AuthProvider>
  )
}
