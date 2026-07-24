import { StudentReportsList } from '@/modules/reports/StudentReportsList'

export function AdminStudentReportsPage() {
  return <StudentReportsList reportPathPrefix="/admin/students" />
}