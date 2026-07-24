import { useParams } from 'react-router-dom'
import { OverallPerformanceReportPage } from '@/modules/reports/OverallPerformanceReportPage'

export function StudentOverallReportPage() {
  return (
    <OverallPerformanceReportPage
      backHref="/student/reports"
      backLabel="All reports"
    />
  )
}

export function TutorStudentOverallReportPage() {
  const { studentId } = useParams<{ studentId: string }>()
  return (
    <OverallPerformanceReportPage
      studentId={studentId}
      backHref={`/tutor/students/${studentId}/reports`}
      backLabel="All reports"
    />
  )
}

export function AdminStudentOverallReportPage() {
  const { studentId } = useParams<{ studentId: string }>()
  return (
    <OverallPerformanceReportPage
      studentId={studentId}
      backHref={`/admin/students/${studentId}/reports`}
      backLabel="All reports"
    />
  )
}
