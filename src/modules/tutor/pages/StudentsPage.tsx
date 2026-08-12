import { useEffect, useState } from 'react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/PrismLoader'
import { StudentManagementPanel } from '@/components/academic/StudentManagementPanel'
import { useCurriculum } from '@/hooks/useCurriculum'
import { fetchStudentsMasterStats, type StudentMasterStats } from '@/lib/api/studentsApi'

export function TutorStudentsPage() {
  const { batches } = useCurriculum()
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
      <PageHeader
        eyebrow="Student master profile · BRD §3.3"
        title="My Students"
        sub="Add and manage students anchored to board, grade, batch, branch, and academic year."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <AppStat label="My Students" value={stats?.total ?? 0} />
        <AppStat label="Active" value={stats?.active ?? 0} tone="leaf" />
        <AppStat label="Batches" value={batches.length} hint="Manage in Curriculum Setup" />
      </div>

      <AppCard className="mb-6 !p-4">
        <p className="text-xs text-muted-foreground">
          Tutors manage students in their assigned branches. Add batches under Curriculum Setup.
        </p>
      </AppCard>

      <StudentManagementPanel scope="tutor" />
    </>
  )
}
