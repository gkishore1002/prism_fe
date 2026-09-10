import { useEffect, useMemo, useState } from 'react'
import { PageLoader } from '@/components/ui/PrismLoader'
import {
  Play,
  Clock,
  Calendar,
  Lock,
  RotateCcw,
  Trophy,
} from 'lucide-react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { useAuth } from '@/hooks/useAuth'
import { useAssessments } from '@/hooks/useAssessments'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { resolveStudentProfile, scopeLabelFromProfile } from '@/modules/student/lib/studentProfile'
import { StudentEnrollmentYearBar } from '@/modules/student/components/StudentEnrollmentYearBar'
import { scopeLabel } from '@/lib/academicScope'
import { formatSubjects } from '@/lib/formatSubjects'
import type { StudentEnrollment } from '@/lib/api/academicYearsApi'
import { RequestReassignmentModal } from '@/modules/student/components/RequestReassignmentModal'
import { ExamStartButton } from '@/modules/student/components/ExamStartButton'
import { useNotifications } from '@/hooks/useNotifications'
import { CscFullReportModal } from '@/modules/student/components/CscFullReportModal'
import { btnClass } from '@/components/ui/Button'
import {
  AccessRequestStatusBadge,
  descriptionForAccessRequestStatus,
} from '@/lib/accessRequestTheme'
import { cn } from '@/lib/cn'
import { analyticsApi } from '@/lib/api/analyticsApi'
import type { AssessmentResult } from '@/types'

export function StudentAssessmentsPage() {
  const { user } = useAuth()
  useAnalyticsPage('studentAssessments')
  const { getAssessmentsForStudent, canStudentAttend, loading: assessmentsLoading, error, refresh } =
    useAssessments()
  const { loading: analyticsLoading, recentAssessments: recentFromAnalytics, studentProfile } =
    useAnalytics()
  const [reassignTarget, setReassignTarget] = useState<{ id: string; title: string } | null>(null)
  const [fullReportTarget, setFullReportTarget] = useState<string | null>(null)
  const [activeEnrollment, setActiveEnrollment] = useState<StudentEnrollment | null>(null)
  const [recentAssessments, setRecentAssessments] = useState<AssessmentResult[]>([])
  const { refresh: refreshNotifications } = useNotifications()

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    const onFocus = () => {
      void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onFocus)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh])

  useEffect(() => {
    let cancelled = false
    async function loadRecent() {
      if (!activeEnrollment) {
        setRecentAssessments(recentFromAnalytics)
        return
      }
      try {
        const rows = await analyticsApi.recentAssessments(undefined, {
          academicYearId: activeEnrollment.academicYearId,
          enrollmentId: activeEnrollment.id,
        })
        if (!cancelled) setRecentAssessments(rows)
      } catch {
        if (!cancelled) setRecentAssessments(recentFromAnalytics)
      }
    }
    void loadRecent()
    return () => {
      cancelled = true
    }
  }, [activeEnrollment, recentFromAnalytics])

  const profile = resolveStudentProfile(studentProfile, user)

  const academicScope = profile ? { board: profile.board, grade: profile.grade } : null
  const query = profile
    ? { studentId: profile.id || user.id, board: profile.board, grade: profile.grade }
    : null

  const assigned = useMemo(() => {
    const rows = query ? getAssessmentsForStudent(query) : []
    if (!activeEnrollment) return rows
    // Live/upcoming only for the current enrollment year; past years show history only.
    if (!activeEnrollment.isCurrent) {
      return rows.filter(
        (a) =>
          a.academicYearId === activeEnrollment.academicYearId &&
          (a.studentSubmitted || a.status === 'completed'),
      )
    }
    return rows.filter(
      (a) => !a.academicYearId || a.academicYearId === activeEnrollment.academicYearId,
    )
  }, [getAssessmentsForStudent, query, activeEnrollment])

  const availableNow = useMemo(
    () =>
      assigned.filter((a) => {
        if (a.studentSubmitted || a.timingOver) return false
        if (a.attemptInProgress) return true
        return Boolean(a.canAttend ?? (a.status === 'live' && !a.studentSubmitted))
      }),
    [assigned],
  )
  const timingOver = useMemo(
    () =>
      assigned.filter(
        (a) => a.timingOver && !a.studentSubmitted && a.mode === 'assessment',
      ),
    [assigned],
  )
  const upcoming = useMemo(
    () =>
      assigned.filter(
        (a) =>
          a.status === 'scheduled' &&
          !a.studentSubmitted &&
          !a.timingOver &&
          !a.attemptInProgress,
      ),
    [assigned],
  )
  const awaitingResults = useMemo(
    () => assigned.filter((a) => a.studentSubmitted && a.status !== 'completed'),
    [assigned],
  )

  const attendedFiltered = useMemo(
    () =>
      recentAssessments.filter((row) => {
        if (!activeEnrollment) return true
        if (row.enrollmentId) return row.enrollmentId === activeEnrollment.id
        if (row.academicYearId) return row.academicYearId === activeEnrollment.academicYearId
        // Legacy rows without year/enrollment: only show on current year view.
        return activeEnrollment.isCurrent
      }),
    [recentAssessments, activeEnrollment],
  )
  const [latest, ...earlier] = attendedFiltered

  if (!profile && (analyticsLoading || assessmentsLoading)) {
    return <PageLoader label="Loading assessments…" />
  }

  if (!profile || !academicScope || !query) {
    return (
      <p className="text-sm text-muted-foreground p-4">
        Assessment data is unavailable. Connect to the Prism API and sign in again.
      </p>
    )
  }

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

  const hasAnyWork =
    availableNow.length > 0 ||
    upcoming.length > 0 ||
    awaitingResults.length > 0 ||
    timingOver.length > 0 ||
    Boolean(latest) ||
    earlier.length > 0

  return (
    <>
      <PageHeader
        eyebrow={scopeLabelFromProfile(profile)}
        title="Assessments"
        sub="Board-wise tests from your tutor — you only see exams for your board and grade that you're invited to."
      />

      <StudentEnrollmentYearBar className="mb-4" onChange={setActiveEnrollment} />

      {activeEnrollment && !activeEnrollment.isCurrent && (
        <p className="text-xs text-muted-foreground mb-4">
          Viewing {activeEnrollment.academicYear} history ({activeEnrollment.grade}
          {activeEnrollment.batch ? ` · ${activeEnrollment.batch}` : ''}). Live exams stay on the
          current year.
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <AppStat label="Live now" value={availableNow.length} tone="accent" hint="Can start" />
        <AppStat label="Upcoming" value={upcoming.length} hint="Not live yet" />
        <AppStat
          label="Timing over"
          value={timingOver.length}
          tone={timingOver.length > 0 ? 'accent' : 'default'}
          hint="Missed window"
        />
        <AppStat
          label="Awaiting results"
          value={awaitingResults.length}
          tone="leaf"
          hint="Submitted"
        />
        <AppStat
          label="Attended"
          value={attendedFiltered.length}
          hint="With scores"
        />
      </div>

      {latest ? (
        <AppCard className="mb-6 border-accent/25 bg-gradient-to-br from-accent/[0.07] via-card to-card overflow-hidden relative">
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-1/3 opacity-40"
            style={{
              background:
                'radial-gradient(ellipse 80% 80% at 100% 50%, rgba(201,162,39,0.2), transparent 70%)',
            }}
            aria-hidden
          />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.16em] text-accent font-semibold">
                Last attended exam
              </p>
              <p className="font-display text-xl text-foreground mt-1 truncate">{latest.title}</p>
              <p className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {latest.date}
                </span>
                <span>· {latest.subjectName}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {latest.insight || `You scored ${latest.accuracy}% on ${latest.title}.`}
              </p>
              <button
                type="button"
                onClick={() => setFullReportTarget(latest.title)}
                className="text-xs text-accent hover:underline mt-2 inline-flex items-center gap-1"
              >
                View full report →
              </button>
            </div>
            <div className="text-center sm:text-right shrink-0 sm:pl-2">
              <p className="font-mono-data text-4xl font-bold text-foreground tabular-nums">
                {latest.accuracy}%
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Score</p>
            </div>
          </div>
        </AppCard>
      ) : (
        <AppCard className="mb-6 border-dashed">
          <div className="flex items-center gap-3 py-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No exam attended yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your latest scored assessment will show here after you submit.
              </p>
            </div>
          </div>
        </AppCard>
      )}

      {!hasAnyWork && (
        <AppCard className="mb-8 text-center py-10">
          <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground">No assessments assigned yet</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            When your tutor schedules a {scopeLabel(academicScope)} exam and adds you to the list, it
            will appear here.
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
                    {a.durationMinutes > 0 ? ` · ${a.durationMinutes} minutes` : ' · Untimed'} ·{' '}
                    {formatSubjects(a.subjects, a.subject)}
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
                {canStudentAttend(query, a.id) || a.attemptInProgress ? (
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
        <section className="mb-8 rounded-xl border border-accent/30 bg-accent/[0.07] overflow-hidden">
          <div className="px-4 py-3 border-b border-accent/20 flex items-center justify-between gap-2 bg-accent/[0.06]">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent shrink-0">
                <Clock className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground tracking-tight">
                  Timing over
                </h3>
                <p className="text-[11px] text-muted-foreground truncate">
                  Window closed — request reassignment if you still need to attend
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono-data tabular-nums px-2 py-0.5 rounded-md border border-accent/25 bg-accent/10 text-foreground shrink-0">
              {timingOver.length}
            </span>
          </div>
          <ul className="divide-y divide-accent/15 bg-card/60">
            {timingOver.map((a) => {
              const isPending = a.accessRequestStatus === 'pending'
              return (
                <li
                  key={a.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 hover:bg-accent/[0.04] transition-colors"
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    <AccessRequestStatusBadge
                      status={a.accessRequestStatus}
                      emphasis={isPending}
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {a.availableUntil || a.scheduledAt || 'Deadline passed'}
                        {' · '}
                        {descriptionForAccessRequestStatus(a.accessRequestStatus)}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 sm:pl-2">
                    {a.accessRequestStatus === 'approved' ? (
                      <ExamStartButton
                        assessmentId={a.id}
                        className={cn(
                          btnClass.primary,
                          'text-xs h-8 px-3 inline-flex items-center gap-1.5',
                        )}
                      >
                        <Play className="w-3.5 h-3.5" />
                        {a.attemptInProgress ? 'Resume' : 'Start'}
                      </ExamStartButton>
                    ) : a.accessRequestStatus === 'pending' ? (
                      <span className="text-[10px] uppercase tracking-wide font-semibold text-accent">
                        Awaiting tutor
                      </span>
                    ) : a.accessRequestStatus === 'rejected' ? (
                      <span className="text-[11px] text-muted-foreground">Contact tutor / CSC</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setReassignTarget({ id: a.id, title: a.title })}
                        className={cn(btnClass.secondary, 'text-xs h-8 px-3 border-accent/30')}
                      >
                        Request reassignment
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {upcoming.length > 0 && (
        <AppCard className="mb-8">
          <h3 className="font-display text-lg text-foreground mb-4">
            Upcoming — waiting for tutor to go live
          </h3>
          <div className="space-y-3">
            {upcoming.map((a) => (
              <div
                key={a.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-md border border-border"
              >
                <div>
                  <p className="font-medium text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatSubjects(a.subjects, a.subject)} · {a.mode} mode · {a.questionCount}{' '}
                    questions · Scheduled
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

      {earlier.length > 0 && (
        <div className="space-y-3 mb-4">
          <h3 className="font-display text-lg text-foreground">Earlier attended</h3>
          <AppCard>
            <div className="space-y-1 divide-y divide-border/70">
              {earlier.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.date} · {a.subjectName}
                    </p>
                    <button
                      type="button"
                      onClick={() => setFullReportTarget(a.title)}
                      className="text-[10px] text-accent hover:underline mt-1 inline-block"
                    >
                      View full report
                    </button>
                  </div>
                  <span className="font-mono-data text-lg font-semibold shrink-0 tabular-nums">
                    {a.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          </AppCard>
        </div>
      )}

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
