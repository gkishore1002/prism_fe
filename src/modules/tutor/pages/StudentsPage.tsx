import { useEffect, useState } from 'react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/PrismLoader'
import { StudentManagementPanel } from '@/components/academic/StudentManagementPanel'
import { useCurriculum } from '@/hooks/useCurriculum'
import { useCenters } from '@/hooks/useCenters'
import { fetchStudentsMasterStats, type StudentMasterStats } from '@/lib/api/studentsApi'

export function TutorStudentsPage() {
  const { batches } = useCurriculum()
  const { activeCenterId, isAllBranches } = useCenters()
  const [stats, setStats] = useState<StudentMasterStats | null>(null)
  const [loading, setLoading] = useState(true)
  const branchCenterId = isAllBranches ? undefined : activeCenterId

  useEffect(() => {
    setLoading(true)
    void fetchStudentsMasterStats(branchCenterId)
      .then(setStats)
      .finally(() => setLoading(false))
  }, [branchCenterId])

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

      <div className="flex flex-wrap items-start gap-2 mb-5">
        <AppStat compact label="My Students" value={stats?.total ?? 0} />
        <AppStat compact label="Active" value={stats?.active ?? 0} tone="leaf" />
        <AppStat compact label="Batches" value={batches.length} />
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
