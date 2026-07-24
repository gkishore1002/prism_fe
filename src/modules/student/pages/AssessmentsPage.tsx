import { useEffect } from 'react'
import { PageLoader } from '@/components/ui/PrismLoader'
import { Link } from 'react-router-dom'
import { Play, Clock, Calendar, Sparkles, Lock, CheckCircle2 } from 'lucide-react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { useAuth } from '@/hooks/useAuth'
import { useAssessments } from '@/hooks/useAssessments'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { resolveStudentProfile, scopeLabelFromProfile } from '@/modules/student/lib/studentProfile'
import { scopeLabel } from '@/lib/academicScope'

export function StudentAssessmentsPage() {
  const { user } = useAuth()
  useAnalyticsPage('studentAssessments')
  const { getAssessmentsForStudent, canStudentAttend, loading: assessmentsLoading, error, refresh, ensureLoaded } =
    useAssessments()
  const { loading: analyticsLoading, recentAssessments, studentProfile } = useAnalytics()

  useEffect(() => {
    void ensureLoaded()
  }, [ensureLoaded])
  const profile = resolveStudentProfile(studentProfile, user)

  if (analyticsLoading || assessmentsLoading) {
    return <PageLoader label="Loading assessments…" />
  }

  if (!profile) {
    return (
      <p className="text-sm text-muted-foreground p-4">
        Assessment data is unavailable. Connect to the Prism API and sign in again.
      </p>
    )
  }

  const academicScope = { board: profile.board, grade: profile.grade }
  const query = { studentId: profile.id || user.id, ...academicScope }
  const assigned = getAssessmentsForStudent(query)
  const availableNow = assigned.filter(
    (a) => a.status === 'live' && !a.studentSubmitted,
  )
  const upcoming = assigned.filter(
    (a) => a.status === 'scheduled' && !a.studentSubmitted,
  )
  const awaitingResults = assigned.filter(
    (a) => a.studentSubmitted && a.status !== 'completed',
  )
  const [latest, ...earlier] = recentAssessments

  if (error) {
    return (
      <div className="p-4 space-y-3">
        <p className="text-sm text-rose">{error}</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="text-sm text-accent hover:underline"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow={scopeLabelFromProfile(profile)}
        title="Assessments"
        sub="Board-wise tests from your tutor — you only see exams for your board and grade that you're invited to."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <AppStat label="Live now" value={availableNow.length} tone="accent" hint="Tutor has gone live" />
        <AppStat label="Upcoming" value={upcoming.length} hint="Waiting for tutor to start" />
        <AppStat
          label="Awaiting results"
          value={awaitingResults.length}
          hint="Submitted, session still open"
          tone="leaf"
        />
      </div>

      {availableNow.length === 0 && upcoming.length === 0 && awaitingResults.length === 0 && !latest && earlier.length === 0 && (
        <AppCard className="mb-8 text-center py-10">
          <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground">No assessments assigned yet</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            When your tutor schedules a {scopeLabel(academicScope)} exam and adds you to the list, it will appear here.
          </p>
        </AppCard>
      )}

      {availableNow.length > 0 && (
        <div className="space-y-3 mb-8">
          <h3 className="font-display text-lg text-foreground">Start now</h3>
          {availableNow.map((a) => (
            <div key={a.id} className="bg-ink text-paper rounded-lg p-6 relative overflow-hidden">
              <div className="absolute inset-0 paper-grid opacity-[0.08]" aria-hidden />
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-accent font-display font-semibold">
                    Live · {a.mode} mode
                  </span>
                  <h4 className="font-display text-2xl font-bold mt-2">{a.title}</h4>
                  <p className="text-paper/70 text-sm mt-1">
                    {a.questionCount} questions
                    {a.durationMinutes > 0 ? ` · ${a.durationMinutes} minutes` : ' · Untimed'} · {a.subject}
                  </p>
                  <p className="text-paper/50 text-xs mt-1">
                    {scopeLabel({ board: a.board, grade: a.grade })} · {a.batchName}
                    {a.scheduledAt ? ` · ${a.scheduledAt}` : ''}
                  </p>
                </div>
                {canStudentAttend(query, a.id) ? (
                  <Link
                    to={`/student/assessments/${a.id}/take`}
                    className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-md font-medium hover:opacity-90 shrink-0"
                  >
                    <Play className="w-4 h-4" /> Start
                  </Link>
                ) : (
                  <span className="text-xs text-paper/60">Not on invite list</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {upcoming.length > 0 && (
        <AppCard className="mb-8">
          <h3 className="font-display text-lg text-foreground mb-4">Upcoming — waiting for tutor to go live</h3>
          <div className="space-y-3">
            {upcoming.map((a) => (
              <div
                key={a.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-md border border-border"
              >
                <div>
                  <p className="font-medium text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {a.subject} · {a.mode} mode · {a.questionCount} questions · Scheduled
                  </p>
                </div>
                <div className="flex flex-col sm:items-end gap-2 text-xs text-muted-foreground shrink-0">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-foreground">
                    <Lock className="w-3 h-3" />
                    Starts when tutor goes live
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {a.scheduledAt || 'Date TBC'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {a.durationMinutes > 0 ? `${a.durationMinutes} min` : 'Untimed'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AppCard>
      )}

      {awaitingResults.length > 0 && (
        <AppCard className="mb-8">
          <h3 className="font-display text-lg text-foreground mb-4">Submitted — awaiting results</h3>
          <div className="space-y-3">
            {awaitingResults.map((a) => (
              <div
                key={a.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-md border border-border bg-secondary/20"
              >
                <div>
                  <p className="font-medium text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {a.subject} · submitted · your tutor will share results after the session ends
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-leaf/15 text-leaf shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Awaiting results
                </span>
              </div>
            ))}
          </div>
        </AppCard>
      )}

      <div className="space-y-4">
        <h3 className="font-display text-lg text-foreground">Your results</h3>

        {availableNow.length === 0 && upcoming.length === 0 && !latest && earlier.length === 0 && awaitingResults.length === 0 && (
          <AppCard><p className="text-sm text-muted-foreground">No assessments yet.</p></AppCard>
        )}

        {latest && (
          <AppCard className="border-accent/20">
            <div className="text-[10px] uppercase tracking-widest text-accent font-medium mb-3">
              Most recent
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-display text-xl font-bold text-foreground">{latest.title}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  {latest.date} · {latest.subjectName}
                </p>
                <div className="flex items-start gap-2 mt-4 p-3 rounded-md bg-secondary/50">
                  <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{latest.insight}</p>
                </div>
                {latest.weakTopics.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Work on: {latest.weakTopics.join(', ')}
                  </p>
                )}
                {latest.assessmentId && (
                  <Link
                    to={`/student/reports/assessment/${latest.assessmentId}`}
                    className="text-xs text-accent hover:underline mt-3 inline-block"
                  >
                    View assessment report →
                  </Link>
                )}
              </div>
              <div className="text-center shrink-0">
                <div className="font-mono-data text-4xl font-bold text-foreground">{latest.accuracy}%</div>
                <div className="text-xs text-muted-foreground mt-1">accuracy</div>
              </div>
            </div>
          </AppCard>
        )}

        {earlier.length > 0 && (
          <AppCard>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Earlier results</h4>
            <div className="space-y-2">
              {earlier.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-secondary/40 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.date} · {a.subjectName}
                    </p>
                    {a.assessmentId && (
                      <Link
                        to={`/student/reports/assessment/${a.assessmentId}`}
                        className="text-[10px] text-accent hover:underline mt-1 inline-block"
                      >
                        View report
                      </Link>
                    )}
                  </div>
                  <span className="font-mono-data text-lg font-semibold">{a.accuracy}%</span>
                </div>
              ))}
            </div>
          </AppCard>
        )}

        {!latest && earlier.length === 0 && (
          <AppCard><p className="text-sm text-muted-foreground">No completed assessments yet.</p></AppCard>
        )}
      </div>
    </>
  )
}