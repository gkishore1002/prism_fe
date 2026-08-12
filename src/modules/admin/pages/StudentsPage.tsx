import { useEffect, useState } from 'react'
import { PageHeader, AppStat } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/PrismLoader'
import { StudentManagementPanel } from '@/components/academic/StudentManagementPanel'
import { useAnalyticsPage } from '@/hooks/useAnalytics'
import { useCenters } from '@/hooks/useCenters'
import { fetchStudentsMasterStats, type StudentMasterStats } from '@/lib/api/studentsApi'

export function AdminStudentsPage({ embedded = false }: { embedded?: boolean }) {
  useAnalyticsPage('adminStudents')
  const { centers } = useCenters()
  const [stats, setStats] = useState<StudentMasterStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetchStudentsMasterStats()
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <PageLoader />
  }

  return (
    <>
      {!embedded && (
        <PageHeader
          eyebrow="Student master profile · BRD §3.3"
          title="Students"
          sub="Organization owners and branch admins add students, view reports, manage assessments, question papers, and curriculum — branch admins within assigned branches."
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <AppStat label="Total Students" value={stats?.total ?? 0} />
        <AppStat label="Active" value={stats?.active ?? 0} tone="leaf" />
        <AppStat label="Branches" value={centers.length} hint="Across institute" />
      </div>

      <StudentManagementPanel scope="admin" />
    </>
  )
}
