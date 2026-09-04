import { useEffect, useState } from 'react'
import { PageLoader } from '@/components/ui/PrismLoader'
import { Play, Clock, Calendar, Lock, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { useAuth } from '@/hooks/useAuth'
import { useAssessments } from '@/hooks/useAssessments'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { resolveStudentProfile, scopeLabelFromProfile } from '@/modules/student/lib/studentProfile'
import { scopeLabel } from '@/lib/academicScope'
import { RequestReassignmentModal } from '@/modules/student/components/RequestReassignmentModal'
import { ExamStartButton } from '@/modules/student/components/ExamStartButton'
import { useNotifications } from '@/hooks/useNotifications'
import { CscFullReportModal } from '@/modules/student/components/CscFullReportModal'
import { btnClass } from '@/components/ui/Button'
import {
  AccessRequestStatusBadge,
  accessRequestTheme,
  accessRequestToneStyles,
  descriptionForAccessRequestStatus,
  toneForAccessRequestStatus,
} from '@/lib/accessRequestTheme'

export function StudentAssessmentsPage() {
  const { user } = useAuth()
  useAnalyticsPage('studentAssessments')
  const { getAssessmentsForStudent, canStudentAttend, loading: assessmentsLoading, error, refresh } =
    useAssessments()
  const { loading: analyticsLoading, recentAssessments, studentProfile } = useAnalytics()
  const [reassignTarget, setReassignTarget] = useState<{ id: string; title: string } | null>(null)
  const [fullReportTarget, setFullReportTarget] = useState<string | null>(null)
  const { refresh: refreshNotifications } = useNotifications()

  useEffect(() => {
    void refresh()
  }, [refresh])
  const profile = resolveStudentProfile(studentProfile, user)

  if (!profile && (analyticsLoading || assessmentsLoading)) {
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
    (a) => (a.canAttend ?? (a.status === 'live' && !a.studentSubmitted)) && !a.timingOver,
  )
  const timingOver = assigned.filter(
    (a) => a.timingOver && !a.studentSubmitted && a.mode === 'assessment',
  )
  const upcoming = assigned.filter(
    (a) => a.status === 'scheduled' && !a.studentSubmitted && !a.timingOver,
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
          <h3 className="font-display text-lg text-foreground">
            {availableNow.some((a) => a.attemptInProgress) ? 'Continue exam' : 'Start now'}
          </h3>
          {availableNow.map((a) => (
            <div key={a.id} className="bg-ink text-paper rounded-lg p-6 relative overflow-hidden">
              <div className="absolute inset-0 paper-grid opacity-[0.08]" aria-hidden />
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-accent font-display font-semibold">
                    Live · {a.mode} mode
                    {a.attemptInProgress ? ' · in progress' : ''}
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
                  {a.attemptInProgress && (
                    <p className="text-accent text-xs mt-2">
                      Your previous answers are saved. Re-enter to continue from where you left.
                    </p>
                  )}
                </div>
                {canStudentAttend(query, a.id) ? (
                  <ExamStartButton
                    assessmentId={a.id}
                    className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-md font-medium hover:opacity-90 shrink-0"
                  >
                    {a.attemptInProgress ? (
                      <>
                        <RotateCcw className="w-4 h-4" /> Resume exam
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" /> Start
                      </>
                    )}
                  </ExamStartButton>
                ) : (
                  <span className="text-xs text-paper/60">Not on invite list</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {timingOver.length > 0 && (
        <AppCard className={`mb-8 border-2 ${accessRequestTheme.section}`}>
          <h3 className="font-display text-lg text-foreground mb-1 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-accent" />
            Exam timing over
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Missed deadlines — request reassignment or wait for tutor approval.
          </p>
          <div className="space-y-3">
            {timingOver.map((a) => {
              const tone = toneForAccessRequestStatus(a.accessRequestStatus)
              const styles = accessRequestToneStyles[tone]
              const isPending = a.accessRequestStatus === 'pending'
              return (
                <div
                  key={a.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border ${styles.card}`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <AccessRequestStatusBadge status={a.accessRequestStatus} emphasis={isPending} />
                    </div>
                    <p className="font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Deadline was {a.availableUntil || a.scheduledAt || '—'}
                    </p>
                    <p className="text-xs mt-1.5 text-muted-foreground">
                      {descriptionForAccessRequestStatus(a.accessRequestStatus)}
                    </p>
                  </div>
                  {a.accessRequestStatus === 'approved' ? (
                    <ExamStartButton
                      assessmentId={a.id}
                      className={`${btnClass.primary} text-sm px-4 py-2 inline-flex items-center gap-2 ${accessRequestTheme.approveBtn} shrink-0`}
                    >
                      <Play className="w-4 h-4" /> {a.attemptInProgress ? 'Resume exam' : 'Start exam'}
                    </ExamStartButton>
                  ) : a.accessRequestStatus === 'pending' ? (
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide px-3 py-2 rounded-lg shrink-0 ${accessRequestTheme.badgeEmphasis}`}
                    >
                      Awaiting tutor approval
                    </span>
                  ) : a.accessRequestStatus === 'rejected' ? (
                    <span className="text-xs text-muted-foreground font-medium shrink-0">
                      Contact tutor or CSC
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setReassignTarget({ id: a.id, title: a.title })}
                      className={`${btnClass.secondary} text-sm px-4 py-2 shrink-0`}
                    >
                      Request reassignment
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </AppCard>
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
        <h3 className="font-display text-lg text-foreground">Previously attended</h3>

        {availableNow.length === 0 && upcoming.length === 0 && !latest && earlier.length === 0 && awaitingResults.length === 0 && (
          <AppCard><p className="text-sm text-muted-foreground">No completed assessments yet.</p></AppCard>
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
                <p className="text-sm text-muted-foreground mt-3">
                  {latest.insight || `You scored ${latest.accuracy}% on ${latest.title}.`}
                </p>
                <p className="text-sm text-muted-foreground mt-1 italic" lang="ta">
                  {latest.title} தேர்வில் நீங்கள் {latest.accuracy}% மதிப்பெண் பெற்றுள்ளீர்கள்.
                </p>
                <button
                  type="button"
                  onClick={() => setFullReportTarget(latest.title)}
                  className="text-xs text-accent hover:underline mt-3 inline-block"
                >
                  View full report →
                </button>
              </div>
              <div className="text-center shrink-0">
                <div className="font-mono-data text-4xl font-bold text-foreground">{latest.accuracy}%</div>
                <div className="text-xs text-muted-foreground mt-1">score</div>
              </div>
            </div>
          </AppCard>
        )}

        {earlier.length > 0 && (
          <AppCard>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Earlier</h4>
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
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {a.insight || `You scored ${a.accuracy}% on ${a.title}.`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 italic" lang="ta">
                      {a.title} தேர்வில் {a.accuracy}% மதிப்பெண்.
                    </p>
                    <button
                      type="button"
                      onClick={() => setFullReportTarget(a.title)}
                      className="text-[10px] text-accent hover:underline mt-1 inline-block"
                    >
                      View full report
                    </button>
                  </div>
                  <span className="font-mono-data text-lg font-semibold shrink-0 ml-3">{a.accuracy}%</span>
                </div>
              ))}
            </div>
          </AppCard>
        )}

        {!latest && earlier.length === 0 && awaitingResults.length === 0 && (
          <AppCard><p className="text-sm text-muted-foreground">No completed assessments yet.</p></AppCard>
        )}
      </div>

      <CscFullReportModal
        open={fullReportTarget != null}
        onClose={() => setFullReportTarget(null)}
        assessmentTitle={fullReportTarget ?? undefined}
      />

      <RequestReassignmentModal
        open={reassignTarget != null}
        onClose={() => setReassignTarget(null)}
        assessmentId={reassignTarget?.id ?? ''}
        assessmentTitle={reassignTarget?.title ?? ''}
        onSubmitted={() => {
          setReassignTarget(null)
          void refresh()
          void refreshNotifications()
        }}
      />
    </>
  )
}