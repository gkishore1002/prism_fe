import { ReportsLayoutShell } from '@/modules/reports/ReportsLayoutShell'

export function TutorReportsLayout() {
  return (
    <ReportsLayoutShell
      insightsTo="/tutor/reports/insights"
      studentsTo="/tutor/reports/students"
      subjectsTo="/tutor/reports/subjects"
      atRiskTo="/tutor/reports/at-risk"
    />
  )
}
