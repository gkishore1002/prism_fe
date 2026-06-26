import { Link } from 'react-router-dom'
import { Play, Clock, Calendar, Sparkles, Lock } from 'lucide-react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { recentAssessments, studentProfile } from '@/data/mock'
import { useAuth } from '@/hooks/useAuth'
import { useAssessments } from '@/hooks/useAssessments'
import { getStudentAcademicScope } from '@/lib/studentScope'
import { scopeLabel } from '@/lib/academicScope'

export function StudentAssessmentsPage() {
  const { user } = useAuth()
  const { getAssessmentsForStudent, canStudentAttend } = useAssessments()

  const academicScope = getStudentAcademicScope(user.id) ?? {
    board: studentProfile.board,
    grade: String(studentProfile.grade),
  }
  const query = { studentId: user.id, ...academicScope }

  const assigned = getAssessmentsForStudent(query)
  const live = assigned.filter((a) => a.status === 'live')
  const upcoming = assigned.filter((a) => a.status === 'scheduled')
  const [latest, ...earlier] = recentAssessments
  const avgScore =
    recentAssessments.length > 0
      ? Math.round(recentAssessments.reduce((s, a) => s + a.accuracy, 0) / recentAssessments.length)
      : 0

  return (
    <>
      <PageHeader
        eyebrow={scopeLabel(academicScope)}
        title="Assessments"
        sub="Board-wise tests from your tutor — you only see exams for your board and grade that you're invited to."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <AppStat label="Available now" value={live.length} tone="accent" hint="Ready to start" />
        <AppStat label="Upcoming" value={upcoming.length} hint="You're invited" />
        <AppStat label="Avg score" value={avgScore} unit="%" tone="leaf" />
      </div>

      {assigned.length === 0 && (
        <AppCard className="mb-8 text-center py-10">
          <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground">No assessments assigned yet</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            When your tutor schedules a {scopeLabel(academicScope)} exam and adds you to the list, it will appear here.
          </p>
        </AppCard>
      )}

      {live.length > 0 && (
        <div className="space-y-3 mb-8">
          <h3 className="font-display text-lg text-foreground">Start now</h3>
          {live.map((a) => (
            <div key={a.id} className="bg-ink text-paper rounded-lg p-6 relative overflow-hidden">
              <div className="absolute inset-0 paper-grid opacity-[0.08]" aria-hidden />
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-accent font-display font-semibold">
                    Live · {a.mode} mode
                  </span>
                  <h4 className="font-display text-2xl font-bold mt-2">{a.title}</h4>
                  <p className="text-paper/70 text-sm mt-1">
                    {a.questionCount} questions · {a.durationMinutes} minutes · {a.subject}
                  </p>
                  <p className="text-paper/50 text-xs mt-1">
                    {scopeLabel({ board: a.board, grade: a.grade })} · {a.batchName}
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
          <h3 className="font-display text-lg text-foreground mb-4">Upcoming — you're invited</h3>
          <div className="space-y-3">
            {upcoming.map((a) => (
              <div
                key={a.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-md border border-border"
              >
                <div>
                  <p className="font-medium text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {a.subject} · {a.mode} mode · {a.questionCount} questions
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {a.scheduledAt}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {a.durationMinutes} min
                  </span>
                </div>
              </div>
            ))}
          </div>
        </AppCard>
      )}

      <div className="space-y-4">
        <h3 className="font-display text-lg text-foreground">Your results</h3>

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
                  </div>
                  <span className="font-mono-data text-lg font-semibold">{a.accuracy}%</span>
                </div>
              ))}
            </div>
          </AppCard>
        )}
      </div>
    </>
  )
}
