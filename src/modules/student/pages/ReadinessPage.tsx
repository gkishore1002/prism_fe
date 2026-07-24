import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/PrismLoader'
import { AnalyticsInsightsCard } from '@/components/ui/AnalyticsInsightsCard'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { Calendar, Target, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/cn'

export function StudentReadinessPage() {
  useAnalyticsPage('studentReadiness')
  const { loading, readiness, studentProfile } = useAnalytics()

  if (loading) {
    return <PageLoader />
  }

  if (!studentProfile || readiness.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Exam readiness" title="Exam readiness" sub="No readiness data available yet." />
        <AppCard><p className="text-sm text-muted-foreground">Complete assessments to see readiness predictions.</p></AppCard>
      </>
    )
  }

  const avgCurrent = Math.round(
    readiness.reduce((s, r) => s + r.currentReadiness, 0) / readiness.length,
  )
  const avgProjected = Math.round(
    readiness.reduce((s, r) => s + r.projectedReadiness, 0) / readiness.length,
  )

  return (
    <>
      <PageHeader
        eyebrow={`${studentProfile.board} · Grade ${studentProfile.grade}`}
        title="Exam readiness"
        sub="Board-aware readiness for upcoming school exams — always shown with grade context."
      />

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <AppStat label="Overall readiness" value={avgCurrent} unit="%" tone="accent" />
        <AppStat label="Projected" value={avgProjected} unit="%" hint={`+${avgProjected - avgCurrent}% possible`} tone="leaf" />
      </div>

      <AppCard className="mb-8 bg-ink text-paper">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-paper/60">Grade readiness verdict</p>
            <p className="font-display text-2xl mt-2">Ready for Grade {studentProfile.grade} Quarterly Exam</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-leaf justify-end">
              <TrendingUp className="w-4 h-4" />
              <span className="font-mono-data text-2xl">→ {avgProjected}%</span>
            </div>
            <p className="text-xs text-paper/60 mt-1">After recovery plan</p>
          </div>
        </div>
      </AppCard>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {readiness.map((r) => {
          const gap = r.projectedReadiness - r.currentReadiness
          return (
            <AppCard key={r.subjectId}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="font-display text-lg">{r.subjectName}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" /> Exam: {r.examDate}
                  </div>
                </div>
                <span
                  className={cn(
                    'text-[10px] uppercase tracking-widest px-2 py-1 rounded',
                    r.confidenceLevel === 'high' && 'bg-leaf/10 text-leaf',
                    r.confidenceLevel === 'medium' && 'bg-accent/10 text-accent',
                    r.confidenceLevel === 'low' && 'bg-rose/10 text-rose',
                  )}
                >
                  {r.confidenceLevel}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-center flex-1">
                  <p className="text-[10px] text-muted-foreground">Current</p>
                  <p className="font-mono-data text-2xl">{r.currentReadiness}%</p>
                </div>
                <Target className="w-5 h-5 text-muted-foreground" />
                <div className="text-center flex-1">
                  <p className="text-[10px] text-muted-foreground">Projected</p>
                  <p className="font-mono-data text-2xl text-leaf">{r.projectedReadiness}%</p>
                </div>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${r.currentReadiness}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-right">+{gap}% possible by exam day</p>
            </AppCard>
          )
        })}
      </div>

      <AnalyticsInsightsCard
        title="Readiness outlook"
        bullets={readiness.map(
          (row) =>
            `${row.subjectName}: ${row.currentReadiness}% now → ${row.projectedReadiness}% projected (${row.confidenceLevel} confidence).`,
        )}
      />
    </>
  )
}