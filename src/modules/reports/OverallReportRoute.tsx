import { Navigate, useParams } from 'react-router-dom'

export function StudentOverallReportPage() {
  return <Navigate to="/student/reports?tab=overview" replace />
}

export function TutorStudentOverallReportPage() {
  const { studentId } = useParams<{ studentId: string }>()
  return <Navigate to={`/tutor/students/${studentId}/reports?tab=overview`} replace />
}

export function AdminStudentOverallReportPage() {
  const { studentId } = useParams<{ studentId: string }>()
  return <Navigate to={`/admin/students/${studentId}/reports?tab=overview`} replace />
}
