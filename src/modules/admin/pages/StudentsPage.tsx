import { PageHeader, AppStat } from '@/components/layout/AppShell'
import { StudentManagementPanel } from '@/components/academic/StudentManagementPanel'
import { studentMasterProfiles, institutionCenters } from '@/data/mock'

export function AdminStudentsPage() {
  const active = studentMasterProfiles.filter((s) => s.status === 'active')

  return (
    <>
      <PageHeader
        eyebrow="Student master profile · BRD §3.3"
        title="Students"
        sub="Institute owners add and manage all students — board, grade, batch, branch, and academic year."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <AppStat label="Total Students" value={studentMasterProfiles.length} />
        <AppStat label="Active" value={active.length} tone="leaf" />
        <AppStat label="Branches" value={institutionCenters.length} hint="Across institute" />
      </div>

      <StudentManagementPanel scope="admin" />
    </>
  )
}
