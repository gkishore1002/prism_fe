import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { AssessmentProvider } from '@/hooks/useAssessments'
import { QuestionPaperProvider } from '@/hooks/useQuestionPapers'
import { CurriculumProvider } from '@/hooks/useCurriculum'
import { StudyPlanProvider } from '@/hooks/useStudyPlans'
import { NotificationsProvider } from '@/hooks/useNotifications'
import { router } from './router'

export function App() {
  return (
    <AuthProvider>
      <CurriculumProvider>
        <QuestionPaperProvider>
          <AssessmentProvider>
            <StudyPlanProvider>
              <NotificationsProvider>
                <RouterProvider router={router} />
              </NotificationsProvider>
            </StudyPlanProvider>
          </AssessmentProvider>
        </QuestionPaperProvider>
      </CurriculumProvider>
    </AuthProvider>
  )
}
