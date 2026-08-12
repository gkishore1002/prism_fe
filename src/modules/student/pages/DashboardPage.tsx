import { Link } from 'react-router-dom'
import { PageLoader } from '@/components/ui/PrismLoader'
import { ArrowRight, Sparkles, Zap, Target, BookOpen, Flame } from 'lucide-react'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { InsightCard, SectionLabel } from '@/components/design/InsightCard'
import { ScoreRing } from '../components/ScoreRing'
import { SubjectStrip } from '../components/SubjectStrip'
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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Student portal"
        title={`Hello, ${profile.name.split(' ')[0]}`}
        sub="Your learning health, focus areas, and next actions — powered by Prism AI."
        actions={
          <Link to="/student/assessments" className="btn btn-primary gap-2 px-4 py-2 text-sm">
            <BookOpen className="w-4 h-4" /> Assessments
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <InsightCard
          icon={Target}
          title="Academic health"
          value={`${studentHealth.overall}`}
          description="Overall learning health score."
          tone="accent"
          href="/student/assessments"
        />
        <InsightCard
          icon={Flame}
          title="Study plan"
          value={`${planPct}%`}
          description={`${completedSteps} of ${recoveryPlan.length} recovery steps done.`}
          tone="success"
        />
        <InsightCard
          icon={Zap}
          title="Focus topic"
          value={topGap ? '1' : '0'}
          description={topGap?.topicName ?? 'No critical gaps right now.'}
          tone={topGap ? 'warning' : 'success'}
        />
        <InsightCard
          icon={Sparkles}
          title="Your results"
          description="See scores from assessments you have attended."
          href="/student/assessments"
          action="View results"
          tone="default"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <AppCard className="lg:col-span-2 flex items-center justify-around gap-4 py-8">
          <ScoreRing value={studentHealth.overall} label="Health" color="brand" size={110} />
          <div className="w-px h-20 bg-border hidden sm:block" />
          <ScoreRing
            value={planPct}
            label="Plan"
            color="gold"
            size={110}
            sublabel={`${completedSteps}/${recoveryPlan.length}`}
          />
        </AppCard>

        <AppCard className="lg:col-span-3">
          <SectionLabel>Subjects</SectionLabel>
          <SubjectStrip subjects={studentHealth.subjects} />
          {topGap && (
            <div className="mt-5 rounded-2xl border border-accent/25 bg-accent/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-accent font-semibold">
                Today&apos;s focus
              </p>
              <p className="mt-1 font-display text-lg text-foreground">{topGap.topicName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Priority gap · {topGap.severity} severity
              </p>
              {nextStep && (
                <Link
                  to="/student/assessments"
                  className="mt-3 inline-flex items-center gap-1 text-sm text-accent font-medium"
                >
                  View assessments <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          )}
        </AppCard>
      </div>
    </div>
  )
}
