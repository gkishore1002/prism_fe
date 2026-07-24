import { LearningGenomeCohortReport } from '@/modules/tutor/components/learningGenome/LearningGenomeCohortReport'



export function TutorInsightsPage({ embedded = false }: { embedded?: boolean }) {

  void embedded

  return (

    <LearningGenomeCohortReport

      variant="class-insights"

      studentReportPathPrefix="/tutor/students"

      allStudentReportsHref="/tutor/reports/students"

    />

  )

}
