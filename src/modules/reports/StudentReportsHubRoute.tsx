import { useParams } from 'react-router-dom'
import { StudentPerformanceReportPage } from '@/modules/reports/StudentPerformanceReportPage'

export function TutorStudentReportsHubPage() {
  const { studentId } = useParams<{ studentId: string }>()
  return (
    <StudentPerformanceReportPage
      studentId={studentId}
      reportsPathPrefix={`/tutor/students/${studentId}/reports`}
      reportsListHref="/tutor/reports/students"
    />
  )
}

export function AdminStudentReportsHubPage() {
  const { studentId } = useParams<{ studentId: string }>()
  return (
    <StudentPerformanceReportPage
      studentId={studentId}
      reportsPathPrefix={`/admin/students/${studentId}/reports`}
      reportsListHref="/admin/reports/students"
    />
  )
}
