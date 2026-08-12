import { Link } from 'react-router-dom'
import { PageLoader } from '@/components/ui/PrismLoader'
import { Play, ArrowRight, Clock, Zap } from 'lucide-react'
import { AppCard, AppStat } from '@/components/layout/AppShell'
import { AnalyticsInsightsCard } from '@/components/ui/AnalyticsInsightsCard'
import { studentInsightBullets } from '@/lib/analyticsInsights'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ScoreRing } from '../components/ScoreRing'
import { SubjectStrip } from '../components/SubjectStrip'
import { StudentProfileHeader } from '../components/StudentProfileHeader'
import { LiveAssessmentPrompt } from '../components/LiveAssessmentPrompt'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { useAuth } from '@/hooks/useAuth'
import { resolveStudentProfile } from '@/modules/student/lib/studentProfile'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

export function StudentTodayPage() {
  const { user } = useAuth()
  useAnalyticsPage('studentToday')
  const {
    loading,
    overview,
    studentProfile,
    studentHealth,
    studentSubjects,
    topicBreakdown,
    improvementTrend,
    learningGaps,
    recoveryPlan,
    progressAlerts,
  } = useAnalytics()

  const profile = resolveStudentProfile(studentProfile, user)
  const institutionName = overview?.institution.name
  const focus = learningGaps[0]
  const weakTopicCount = topicBreakdown.filter((t) => t.status === 'weak').length
  const nextStep = recoveryPlan.find((s) => !s.completed)
  const recoveryDone = recoveryPlan.filter((s) => s.completed).length
  const recoveryTotal = recoveryPlan.length
  const recoveryPct = recoveryTotal ? Math.round((recoveryDone / recoveryTotal) * 100) : 0

  if (loading) {
    return <PageLoader label="Loading your dashboard…" />
  }

  if (!profile) {
    return (
      <p className="text-sm text-muted-foreground p-4">
        Student data is unavailable. Connect to the Prism API and sign in again.
      </p>
    )
  }

  return (
    <>
      <StudentProfileHeader
        profile={profile}
        institutionName={institutionName}
        actions={
          progressAlerts.length > 0 ? (
            <Link
              to={progressAlerts[0].href}
              className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg"
            >
              {progressAlerts.length} alert{progressAlerts.length > 1 ? 's' : ''}
            </Link>
          ) : undefined
        }
      />

      <p className="text-sm text-muted-foreground mb-6 -mt-2">
        Your academic overview — health, focus topics, and what to study next.
      </p>

      <LiveAssessmentPrompt />

      {/* Health + plan rings */}
      {studentHealth && (
        <AppCard className="mb-6">
          <div className="flex items-center justify-around gap-4 py-2">
            <ScoreRing value={studentHealth.overall} label="Health" color="brand" size={100} />
            <div className="w-px h-20 bg-border hidden sm:block" />
            <ScoreRing
              value={recoveryPct}
              label="Recovery"
              color="gold"
              size={100}
              sublabel={recoveryTotal ? `${recoveryDone}/${recoveryTotal}` : '—'}
            />
          </div>
          {studentHealth.subjects.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-display font-semibold uppercase tracking-wide text-muted-foreground">
                  Subjects
                </p>
                <Link to="/student/assessments" className="text-[11px] text-accent font-medium hover:underline">
                  See all
                </Link>
              </div>
              <SubjectStrip subjects={studentHealth.subjects} />
            </div>
          )}
        </AppCard>
      )}

      {/* Today's focus */}
      <div className="bg-ink text-paper rounded-lg p-8 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 paper-grid opacity-[0.08]" aria-hidden />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-3 font-display font-semibold">
              Today&apos;s Focus
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              {nextStep?.action ?? focus?.topicName ?? 'Start with practice'}
            </h2>
            {(focus || nextStep) && (
              <p className="text-paper/70 mt-2 font-sans text-[14px]">
                {nextStep
                  ? `${nextStep.estimatedHours}h · +${nextStep.expectedGain}% expected gain`
                  : `Expected lift +${focus?.impactOnScore ?? 0}% if addressed today`}
              </p>
            )}
          </div>
          <Link
            to="/student/assessments"
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-md font-medium hover:opacity-90 shrink-0"
          >
            <Play className="w-4 h-4" /> {nextStep ? 'View assessments' : 'Start practice'}
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <AppStat label="Academic Health" value={profile.healthScore} unit="/100" tone="accent" />
        <AppStat label="Improvement (6m)" value={`+${profile.improvement}%`} tone="leaf" />
        <AppStat label="Readiness" value={`${profile.readiness}%`} />
        <AppStat label="Weak topics" value={weakTopicCount} tone="rose" />
      </div>

      {/* Gap focus card */}
      {focus && (
        <AppCard className="mb-8 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-yellow-700" />
            <p className="text-[11px] font-display font-semibold uppercase tracking-wide text-yellow-700">
              Priority gap
            </p>
          </div>
          <p className="font-display text-lg font-bold">{focus.topicName}</p>
          <p className="text-sm text-muted-foreground mt-1">{focus.recommendedAction}</p>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-yellow-100">
            <p className="font-mono-data text-lg font-bold text-yellow-700">+{focus.impactOnScore}% potential</p>
            <Link to="/student/assessments">
              <Button variant="action" size="sm" className="gap-1">
                Start <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </AppCard>
      )}

      {nextStep && (
        <Link to="/student/assessments" className="block group mb-8">
          <AppCard className="group-hover:border-accent/40 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-ink" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Up next in recovery</p>
                <p className="text-sm font-medium truncate">{nextStep.action}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="neutral">{nextStep.estimatedHours}h</Badge>
                  <Badge variant="success">+{nextStep.expectedGain}%</Badge>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent shrink-0" />
            </div>
          </AppCard>
        </Link>
      )}

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <AppCard className="md:col-span-2">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-display font-semibold">
                Improvement trend
              </div>
              <div className="font-display text-2xl mt-1 font-bold text-foreground">
                {improvementTrend.length > 0
                  ? `${improvementTrend[0]?.score ?? 0}% → ${improvementTrend[improvementTrend.length - 1]?.score ?? 0}%`
                  : '—'}
              </div>
            </div>
            <Link to="/student/assessments" className="text-xs text-accent inline-flex items-center gap-1 hover:underline">
              View assessments <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {improvementTrend.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={improvementTrend}>
                  <CartesianGrid stroke="#d8e2ef" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" stroke="#6e8499" fontSize={11} />
                  <YAxis stroke="#6e8499" fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: 'white', border: '1px solid #d8e2ef', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="score" stroke="#e8b820" strokeWidth={2.5} dot={{ r: 4, fill: '#e8b820' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Complete assessments to build your trend.</p>
          )}
        </AppCard>

        <AnalyticsInsightsCard
          title="Today's focus"
          bullets={studentInsightBullets(studentHealth, learningGaps, [])}
        />
      </div>

      <AppCard>
        <div className="flex items-baseline justify-between mb-6">
          <div className="font-display text-2xl font-bold text-foreground">Subjects</div>
          <div className="text-xs text-muted-foreground">
            {profile.board} {profile.grade} curriculum
          </div>
        </div>
        {studentSubjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No subject data yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
            {studentSubjects.map((s) => (
              <div key={s.name}>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="font-medium text-foreground">{s.name}</div>
                  <div className="font-mono-data text-lg font-semibold">
                    {s.health}<span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-ink rounded-full" style={{ width: `${s.health}%` }} />
                </div>
                <div className="mt-2 text-xs text-muted-foreground font-sans capitalize">
                  {topicBreakdown
                    .filter((t) => t.subject === s.name && t.status === 'weak')
                    .map((t) => t.topic)
                    .join(', ') || `Status: ${s.status}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </AppCard>
    </>
  )
}