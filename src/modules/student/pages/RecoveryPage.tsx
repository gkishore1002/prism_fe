import { Link } from 'react-router-dom'
import { PageLoader } from '@/components/ui/PrismLoader'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { CheckCircle2, Clock, TrendingUp } from 'lucide-react'

export function StudentRecoveryPage() {
  useAnalyticsPage('studentRecovery')
  const { loading, recoveryPlan } = useAnalytics()
  const completed = recoveryPlan.filter((s) => s.completed)
  const pending = recoveryPlan.filter((s) => !s.completed)
  const totalGain = recoveryPlan.reduce((sum, s) => sum + (s.completed ? 0 : s.expectedGain), 0)
  const totalHours = pending.reduce((sum, s) => sum + s.estimatedHours, 0)
  const progress = recoveryPlan.length ? (completed.length / recoveryPlan.length) * 100 : 0

  if (loading) {
    return <PageLoader />
  }

  if (recoveryPlan.length === 0) {
    return (
      <>
        <PageHeader title="Recovery plan" sub="No recovery steps assigned yet." />
        <AppCard className="text-center py-10">
          <p className="text-sm text-muted-foreground">Your tutor will assign steps once gaps are identified.</p>
        </AppCard>
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Personalized path"
        title="Recovery plan"
        sub="Close gaps and boost readiness step by step"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <AppCard className="border-l-[4px] border-l-yellow-400">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Plan progress</div>
          <div className="mt-3 font-mono-data text-3xl text-accent">{Math.round(progress)}%</div>
          <ProgressBar value={progress} className="mt-3" size="sm" />
        </AppCard>
        <AppStat label="Potential gain" value={`+${totalGain}%`} tone="leaf" hint="Across remaining steps" />
        <AppStat label="Time required" value={`${totalHours}h`} hint="Estimated to complete" />
      </div>

      {pending.length > 0 && (
        <AppCard className="accent-blue mb-6">
          <h3 className="font-display text-[15px] font-semibold text-foreground">Up next</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5 mb-4">
            Prioritized by impact on your academic health
          </p>
          <div className="space-y-3">
            {pending.map((step) => (
              <div
                key={step.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-accent/30 transition-colors bg-card"
              >
                <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center text-sm font-bold shrink-0">
                  {step.priority}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{step.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {step.topicName} · {step.subjectName}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {step.estimatedHours}h
                    </p>
                    <p className="text-xs text-leaf font-medium flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> +{step.expectedGain}%
                    </p>
                  </div>
                  <Button variant="primary" size="sm">
                    Start
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </AppCard>
      )}

      {completed.length > 0 && (
        <AppCard className="accent-emerald">
          <h3 className="font-display text-[15px] font-semibold text-foreground mb-4">Completed</h3>
          <div className="space-y-2">
            {completed.map((step) => (
              <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg bg-leaf/5 border border-leaf/10">
                <CheckCircle2 className="w-5 h-5 text-leaf shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground line-through">{step.action}</p>
                  <p className="text-xs text-muted-foreground">{step.topicName}</p>
                </div>
                <Badge variant="success">+{step.expectedGain}%</Badge>
              </div>
            ))}
          </div>
        </AppCard>
      )}

      <div className="mt-6 text-xs text-muted-foreground">
        <Link to="/student/gaps" className="text-accent hover:underline">
          View learning gaps →
        </Link>
      </div>
    </>
  )
}