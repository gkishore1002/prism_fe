import { LearningGenomeCohortReport } from '@/modules/tutor/components/learningGenome/LearningGenomeCohortReport'

export function AdminInsightsPage() {
  return (
    <LearningGenomeCohortReport
      variant="class-insights"
      studentReportPathPrefix="/admin/students"
      allStudentReportsHref="/admin/reports/students"
    />
  )
}
