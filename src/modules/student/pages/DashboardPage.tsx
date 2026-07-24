import { Link } from 'react-router-dom'
import { PageLoader } from '@/components/ui/PrismLoader'
import { ArrowRight, Sparkles, Clock, Zap } from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ScoreRing } from '../components/ScoreRing'
import { SubjectStrip } from '../components/SubjectStrip'
import { StudentProfileHeader } from '../components/StudentProfileHeader'
import { useAuth } from '@/hooks/useAuth'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { resolveStudentProfile } from '../lib/studentProfile'

export function StudentDashboardPage() {
  const { user } = useAuth()
  useAnalyticsPage('studentDashboard')
  const { loading, studentHealth, learningGaps, recoveryPlan, studentProfile } = useAnalytics()
  const profile = resolveStudentProfile(studentProfile, user)
  const topGap = learningGaps[0]
  const nextStep = recoveryPlan.find((s) => !s.completed)
  const completedSteps = recoveryPlan.filter((s) => s.completed).length
  const planPct = recoveryPlan.length
    ? Math.round((completedSteps / recoveryPlan.length) * 100)
    : 0

  if (loading) {
    return <PageLoader />
  }

  if (!profile || !studentHealth) {
    return (
      <p className="text-sm text-muted-foreground p-4">
        Student dashboard data is unavailable. Connect to the Prism API and sign in again.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <StudentProfileHeader profile={profile} institutionName="BrightPath Academy" />

      <AppCard className="p-5">
        <div className="flex items-center justify-around gap-4">
          <ScoreRing value={studentHealth.overall} label="Health" color="brand" size={110} />
          <div className="w-px h-20 bg-border hidden sm:block" />
          <ScoreRing
            value={planPct}
            label="Plan done"
            color="gold"
            size={110}
            sublabel={`${completedSteps}/${recoveryPlan.length}`}
          />
        </div>
      </AppCard>

      <div>
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <p className="text-[11px] font-display font-semibold uppercase tracking-wide text-muted-foreground">
            Subjects
          </p>
          <Link to="/student/health" className="text-[11px] text-accent font-display font-medium hover:underline">
            See all
          </Link>
        </div>
        <SubjectStrip subjects={studentHealth.subjects} />
      </div>

      {topGap && (
        <AppCard className="accent-yellow overflow-hidden bg-gradient-to-br from-yellow-50/80 to-card">
          <div className="p-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-[11px] font-display font-semibold uppercase tracking-wide text-accent">
                  Today&apos;s focus
                </p>
                <p className="text-[16px] font-display font-bold text-foreground">{topGap.topicName}</p>
              </div>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">{topGap.recommendedAction}</p>
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">If you fix this</p>
                <p className="text-[20px] font-mono-data font-bold text-accent">+{topGap.impactOnScore}%</p>
              </div>
              <Link to="/student/plan">
                <Button variant="action" size="md" className="gap-2">
                  Start now <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </AppCard>
      )}

      {nextStep && (
        <Link to="/student/plan" className="block group">
          <AppCard className="p-4 group-hover:border-accent/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-ink" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-display">
                  Up next in your plan
                </p>
                <p className="text-[14px] font-medium text-foreground truncate">{nextStep.action}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="neutral">{nextStep.estimatedHours}h</Badge>
                  <Badge variant="success">+{nextStep.expectedGain}%</Badge>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
            </div>
          </AppCard>
        </Link>
      )}

      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
        <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          <span className="font-medium text-indigo-700">Tip:</span> Follow your recovery plan daily to lift readiness
          before the next exam.
        </p>
      </div>
    </div>
  )
}