import { StudentGenomeReportPage } from '@/modules/reports/StudentGenomeReportPage'

export function TutorStudentReportPage() {
  return (
    <StudentGenomeReportPage
      reportsBackHref="/tutor/reports/students"
      reportsBackLabel="All student reports"
    />
  )
}