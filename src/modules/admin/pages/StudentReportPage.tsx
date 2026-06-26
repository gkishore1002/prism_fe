import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/AppShell'
import { StudentWiseReportPanel } from '@/components/academic/StudentWiseReportPanel'
import { studentMasterProfiles } from '@/data/mock'

export function AdminStudentReportPage() {
  const { studentId } = useParams<{ studentId: string }>()
  const profile = studentMasterProfiles.find((s) => s.id === studentId)

  if (!studentId || !profile) {
    return (
      <PageHeader
        title="Student not found"
        sub="Return to student management to pick a valid profile."
        actions={
          <Link to="/admin/students" className="text-sm text-accent hover:underline">
            Back to students
          </Link>
        }
      />
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Student-wise report · Owner"
        title={profile.name}
        sub="Diagnostics, readiness, recent tests, and AI insight — scoped to board and grade."
        actions={
          <Link
            to="/admin/students"
            className="text-sm border border-border px-4 py-2 rounded-md hover:bg-secondary"
          >
            All students
          </Link>
        }
      />
      <StudentWiseReportPanel studentId={studentId} />
    </>
  )
}
