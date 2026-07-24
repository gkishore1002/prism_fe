import { ReportsLayoutShell } from '@/modules/reports/ReportsLayoutShell'

export function AdminReportsLayout() {
  return (
    <ReportsLayoutShell
      insightsTo="/admin/reports/insights"
      studentsTo="/admin/reports/students"
      subjectsTo="/admin/reports/subjects"
      analyticsTo="/admin/reports/analytics"
    />
  )
}