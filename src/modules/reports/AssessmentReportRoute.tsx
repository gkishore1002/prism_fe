import { useParams } from 'react-router-dom'
import { AssessmentReportPage } from '@/modules/reports/AssessmentReportPage'
import { StudentAssessmentSummaryPage } from '@/modules/student/pages/StudentAssessmentSummaryPage'

export function StudentAssessmentReportPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  if (!assessmentId) return null
  return (
    <StudentAssessmentSummaryPage
      assessmentId={assessmentId}
      backHref="/student/reports"
      backLabel="All reports"
    />
  )
}

export function TutorStudentAssessmentReportPage() {
  const { studentId, assessmentId } = useParams<{ studentId: string; assessmentId: string }>()
  if (!assessmentId || !studentId) return null
  return (
    <AssessmentReportPage
      assessmentId={assessmentId}
      studentId={studentId}
      backHref={`/tutor/students/${studentId}/reports`}
      backLabel="All reports"
    />
  )
}

export function AdminStudentAssessmentReportPage() {
  const { studentId, assessmentId } = useParams<{ studentId: string; assessmentId: string }>()
  if (!assessmentId || !studentId) return null
  return (
    <AssessmentReportPage
      assessmentId={assessmentId}
      studentId={studentId}
      backHref={`/admin/students/${studentId}/reports`}
      backLabel="All reports"
    />
  )
}
