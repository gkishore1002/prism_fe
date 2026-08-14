import { AnalyticsProvider } from '@/hooks/useAnalytics'
import { CentersProvider } from '@/hooks/useCenters'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { AssessmentProvider } from '@/hooks/useAssessments'
import { QuestionPaperProvider } from '@/hooks/useQuestionPapers'
import { CurriculumProvider } from '@/hooks/useCurriculum'
import { NotificationsProvider } from '@/hooks/useNotifications'
import { ConfirmModalProvider } from '@/components/ui/AppModal'
import { ToastProvider } from '@/components/ui/Toast'
import { router } from './router'

export function App() {
  return (
    <AuthProvider>
      <CentersProvider>
        <AnalyticsProvider>
          <CurriculumProvider>
            <QuestionPaperProvider>
              <AssessmentProvider>
                <NotificationsProvider>
                  <ToastProvider>
                    <ConfirmModalProvider>
                      <RouterProvider router={router} />
                    </ConfirmModalProvider>
                  </ToastProvider>
                </NotificationsProvider>
              </AssessmentProvider>
            </QuestionPaperProvider>
          </CurriculumProvider>
        </AnalyticsProvider>
      </CentersProvider>
    </AuthProvider>
  )
}
