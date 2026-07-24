import { PageHeader, AppStat } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/PrismLoader'
import { StudentManagementPanel } from '@/components/academic/StudentManagementPanel'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { useCenters } from '@/hooks/useCenters'

export function AdminStudentsPage() {
  useAnalyticsPage('adminStudents')
  const { studentMaster, loading } = useAnalytics()
  const { centers } = useCenters()
  const active = studentMaster.filter((s) => s.status === 'active')

  if (loading) {
    return <PageLoader />
  }

  return (
    <>
      <PageHeader
        eyebrow="Student master profile · BRD §3.3"
        title="Students"
        sub="Institute owners add and manage all students — board, grade, batch, branch, and academic year."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <AppStat label="Total Students" value={studentMaster.length} />
        <AppStat label="Active" value={active.length} tone="leaf" />
        <AppStat label="Branches" value={centers.length} hint="Across institute" />
      </div>

      <StudentManagementPanel
        scope="admin"
        students={studentMaster.map((s) => ({
          ...s,
          schoolName: s.schoolName ?? undefined,
          email: s.email ?? undefined,
        }))}
      />
    </>
  )
}