import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/PrismLoader'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ScoreRing } from '../components/ScoreRing'
import { PlanTimeline } from '../components/PlanTimeline'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { Target } from 'lucide-react'

export function StudentPlanPage() {
  useAnalyticsPage('studentPlan')
  const { loading, learningGaps, recoveryPlan, readiness } = useAnalytics()
  const pending = recoveryPlan.filter((s) => !s.completed)
  const completed = recoveryPlan.filter((s) => s.completed)
  const avgReadiness = readiness.length
    ? Math.round(readiness.reduce((s, r) => s + r.currentReadiness, 0) / readiness.length)
    : 0
  const completedPct = recoveryPlan.length
    ? Math.round((completed.length / recoveryPlan.length) * 100)
    : 0

  if (loading) {
    return <PageLoader />
  }

  return (
    <>
      <PageHeader
        eyebrow="Recovery"
        title="Your study plan"
        sub="Prioritized steps to close gaps and boost exam readiness"
      />

      <div className="grid grid-cols-2 gap-3 mb-6">
        <AppCard className="flex flex-col items-center py-4">
          <ScoreRing value={avgReadiness} size={88} color="brand" />
          <p className="text-[10px] text-muted-foreground mt-2 font-display uppercase tracking-wide">Exam ready</p>
        </AppCard>
        <AppCard className="flex flex-col justify-center py-4 px-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-accent" />
            <p className="text-[11px] font-display font-semibold text-foreground">Plan progress</p>
          </div>
          <p className="text-[28px] font-mono-data font-bold text-foreground">{completedPct}%</p>
          <ProgressBar value={completedPct} color="yellow" size="sm" className="mt-2" />
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {completed.length} of {recoveryPlan.length} done
          </p>
        </AppCard>
      </div>

      {learningGaps.length > 0 && (
        <div className="mb-6">
          <p className="text-[11px] font-display font-semibold uppercase tracking-wide text-muted-foreground mb-2.5 px-0.5">
            Fix these first
          </p>
          <div className="space-y-2">
            {learningGaps.map((gap, i) => (
              <AppCard
                key={gap.id}
                className={gap.severity === 'high' ? 'accent-rose' : 'accent-yellow'}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-md bg-secondary text-[11px] font-display font-bold text-muted-foreground flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[14px] font-medium text-foreground">{gap.topicName}</p>
                      <p className="text-[11px] text-muted-foreground">{gap.subjectName}</p>
                      <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">{gap.recommendedAction}</p>
                    </div>
                  </div>
                  <Badge variant={gap.severity === 'high' ? 'danger' : 'warning'}>+{gap.impactOnScore}%</Badge>
                </div>
              </AppCard>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[11px] font-display font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-0.5">
          Your steps
        </p>
        {recoveryPlan.length === 0 ? (
          <AppCard>
            <p className="text-sm text-muted-foreground">No recovery steps yet.</p>
          </AppCard>
        ) : (
          <PlanTimeline pending={pending} completed={completed} />
        )}
      </div>
    </>
  )
}