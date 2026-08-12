import { StudentGenomeReportPage } from '@/modules/reports/StudentGenomeReportPage'

export function AdminStudentReportPage() {
  return (
    <StudentGenomeReportPage
      reportsBackHref="/admin/manage/students"
      reportsBackLabel="Back to students"
    />
  )
}