import { StudentGenomeReportPage } from '@/modules/reports/StudentGenomeReportPage'

export function AdminStudentReportPage() {
  return (
    <StudentGenomeReportPage
      reportsBackHref="/admin/reports/students"
      reportsBackLabel="All student reports"
    />
  )
}