import { useParams } from 'react-router-dom'
import { ReportsHubPage } from '@/modules/reports/ReportsHubPage'

export function TutorStudentReportsHubPage() {
  const { studentId } = useParams<{ studentId: string }>()
  return (
    <ReportsHubPage
      studentId={studentId}
      reportsPathPrefix={`/tutor/students/${studentId}/reports`}
      title="Student reports"
      subtitle="Assessment-wise results and overall performance for this student."
    />
  )
}

export function AdminStudentReportsHubPage() {
  const { studentId } = useParams<{ studentId: string }>()
  return (
    <ReportsHubPage
      studentId={studentId}
      reportsPathPrefix={`/admin/students/${studentId}/reports`}
      title="Student reports"
      subtitle="Assessment-wise results and overall performance for this student."
    />
  )
}
