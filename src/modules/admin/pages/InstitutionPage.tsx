import { MapPin } from 'lucide-react'
import { PageLoader } from '@/components/ui/PrismLoader'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/Badge'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { useCurriculum } from '@/hooks/useCurriculum'

export function AdminInstitutionPage() {
  useAnalyticsPage('adminInstitution')
  const { loading: analyticsLoading, overview } = useAnalytics()
  const { curriculum, loading: curriculumLoading } = useCurriculum()

  const loading =
    (analyticsLoading && !overview) || (curriculumLoading && curriculum.length === 0)
  const institution = overview?.institution
  const gradeCount = curriculum.reduce((n, b) => n + b.grades.length, 0)

  if (loading) {
    return <PageLoader />
  }

  if (!institution) {
    return (
      <>
        <PageHeader title="Institution profile" sub="No institution data available yet." />
        <AppCard>
          <p className="text-sm text-muted-foreground">Connect your institution or add data via admin setup.</p>
        </AppCard>
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Organization"
        title="Institution profile"
        sub="Organization overview and operational metrics"
      />

      <AppCard className="accent-yellow mb-6">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl gradient-brand-icon flex items-center justify-center shrink-0">
            <span className="font-display font-bold text-ink">L+</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-display font-bold text-foreground">{institution.name}</h3>
            <p className="text-sm text-muted-foreground capitalize mt-0.5">{institution.type} center</p>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 shrink-0" />
              {institution.name}
            </div>
          </div>
          <Badge variant="brand">Active</Badge>
        </div>
      </AppCard>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <AppStat label="Students" value={overview?.totalStudents ?? institution.studentCount} tone="accent" />
        <AppStat label="Tutors" value={overview?.tutorCount ?? institution.tutorCount} />
        <AppStat label="Boards" value={curriculum.length} />
        <AppStat label="Grades" value={gradeCount} tone="leaf" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AppCard className="accent-blue">
          <h3 className="font-display text-[15px] font-semibold text-foreground mb-4 pb-3 border-b border-secondary">
            Active boards
          </h3>
          {curriculum.length === 0 ? (
            <p className="text-sm text-muted-foreground">No boards configured.</p>
          ) : (
            <div className="space-y-2">
              {curriculum.map((board) => (
                <div
                  key={board.board}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <span className="font-medium text-foreground">{board.board}</span>
                  <Badge variant="neutral">{board.grades.length} grades</Badge>
                </div>
              ))}
            </div>
          )}
        </AppCard>

        <AppCard className="accent-emerald">
          <h3 className="font-display text-[15px] font-semibold text-foreground mb-4 pb-3 border-b border-secondary">
            Grade levels
          </h3>
          {curriculum.length === 0 ? (
            <p className="text-sm text-muted-foreground">No grades configured.</p>
          ) : (
            <div className="space-y-2">
              {curriculum.flatMap((board) =>
                board.grades.map((grade) => (
                  <div
                    key={`${board.board}-${grade.grade}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <span className="font-medium text-foreground">{grade.grade}</span>
                    <span className="text-xs text-muted-foreground">
                      {grade.subjects.length} subjects · {board.board}
                    </span>
                  </div>
                )),
              )}
            </div>
          )}
        </AppCard>
      </div>
    </>
  )
}