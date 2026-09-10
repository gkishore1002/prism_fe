import { useEffect, useState } from 'react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { StudentManagementPanel } from '@/components/academic/StudentManagementPanel'
import { useCurriculum } from '@/hooks/useCurriculum'
import { useCenters } from '@/hooks/useCenters'
import { useAcademicYears } from '@/hooks/useAcademicYears'
import { fetchStudentsMasterStats, type StudentMasterStats } from '@/lib/api/studentsApi'

export function TutorStudentsPage() {
  const { batches } = useCurriculum()
  const { activeCenterId, isAllBranches } = useCenters()
  const { activeYearId } = useAcademicYears()
  const [stats, setStats] = useState<StudentMasterStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const branchCenterId = isAllBranches ? undefined : activeCenterId

  useEffect(() => {
    if (!activeYearId) {
      setStats(null)
      setStatsLoading(true)
      return
    }
    let cancelled = false
    setStatsLoading(true)
    void fetchStudentsMasterStats(branchCenterId, activeYearId)
      .then((next) => {
        if (!cancelled) setStats(next)
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [branchCenterId, activeYearId])

  return (
    <>
      <PageHeader
        eyebrow="Student master profile · BRD §3.3"
        title="My Students"
        sub="Add and manage students anchored to board, grade, batch, branch, and academic year."
      />

      <div className={`flex flex-wrap items-start gap-2 mb-5${statsLoading && !stats ? ' opacity-60' : ''}`}>
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
