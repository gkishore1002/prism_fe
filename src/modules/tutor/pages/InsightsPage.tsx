import { LearningGenomeCohortReport } from '@/modules/tutor/components/learningGenome/LearningGenomeCohortReport'
import { useTutorDashboard } from '@/hooks/useTutorDashboard'

export function TutorInsightsPage({ embedded = false }: { embedded?: boolean }) {
  void embedded
  const { activeBatchId } = useTutorDashboard()
  return (
    <LearningGenomeCohortReport
      variant="class-insights"
      initialBatchId={activeBatchId}
      studentReportPathPrefix="/tutor/students"
      allStudentReportsHref="/tutor/reports/students"
    />
  )
}
