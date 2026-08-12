import { LearningGenomeCohortReport } from '@/modules/tutor/components/learningGenome/LearningGenomeCohortReport'

export function AdminInsightsPage() {
  return (
    <LearningGenomeCohortReport
      variant="full"
      studentReportPathPrefix="/admin/students"
      allStudentReportsHref="/admin/reports/students"
    />
  )
}
