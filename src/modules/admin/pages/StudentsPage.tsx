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

      <div className="flex flex-wrap items-start gap-2 mb-5">
        <AppStat compact label="Total Students" value={stats?.total ?? 0} />
        <AppStat compact label="Active" value={stats?.active ?? 0} tone="leaf" />
        <AppStat compact label="Branches" value={centers.length} />
      </div>

      <StudentManagementPanel scope="admin" />
    </>
  )
}
