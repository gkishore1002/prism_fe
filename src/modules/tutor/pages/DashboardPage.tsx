import { Link } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import {
  AlertTriangle,
  Users,
  ClipboardList,
  TrendingUp,
  Sparkles,
  Activity,
  BookOpen,
  Clock,
} from 'lucide-react'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { InsightCard, SectionLabel } from '@/components/design/InsightCard'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { Avatar } from '@/components/ui/Avatar'
import { useCurriculum } from '@/hooks/useCurriculum'
import { useQuestionPapers } from '@/hooks/useQuestionPapers'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { useAssessments } from '@/hooks/useAssessments'
import { useTutorDashboard } from '@/hooks/useTutorDashboard'
import { cn } from '@/lib/cn'

export function TutorDashboardPage() {
  useAnalyticsPage('tutorDashboard')
  const { batches: tutorBatches, students: tutorStudents, getStudentsForBatch } = useCurriculum()
  const { ensureLoaded: ensureQuestionPapersLoaded } = useQuestionPapers()
  const { topicWeakness, classInsights, atRisk } = useAnalytics()
  const { assessments, ensureLoaded: ensureAssessmentsLoaded } = useAssessments()

  useEffect(() => {
    void ensureAssessmentsLoaded()
    void ensureQuestionPapersLoaded()
  }, [ensureAssessmentsLoaded, ensureQuestionPapersLoaded])

  const { pageTitle, pageSubtitle, pageEyebrow, heroSummary, activeBatchId } = useTutorDashboard()
  const activeBatch = tutorBatches.find((b) => b.id === activeBatchId) ?? tutorBatches[0]

  const batchClassInsights = useMemo(
    () =>
      activeBatch
        ? classInsights.filter(
            (insight) =>
              insight.batchId === activeBatch.id ||
              insight.title.startsWith(`${activeBatch.name}:`),
          )
        : classInsights,
    [activeBatch, classInsights],
  )

  const batchAtRisk = useMemo(() => {
    if (!activeBatch?.id) return atRisk
    const names = new Set(getStudentsForBatch(activeBatch.id).map((student) => student.name))
    return atRisk.filter((student) => names.has(student.name))
  }, [activeBatch?.id, atRisk, getStudentsForBatch])

  const recentStudents = tutorStudents.slice(0, 5)
  const activeAssessments = assessments.filter((a) => a.status === 'live' || a.status === 'scheduled')
  const topInsight = batchClassInsights[0]

  return (
    <>
      <PageHeader
        eyebrow={pageEyebrow || 'Tutor workspace'}
        title={pageTitle}
        sub={pageSubtitle}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/tutor/assessments" className="btn btn-primary gap-2 px-4 py-2 text-sm">
              <ClipboardList className="w-4 h-4" /> New assessment
            </Link>
            <Link to="/tutor/marks" className="btn btn-secondary gap-2 px-4 py-2 text-sm">
              Enter marks
            </Link>
          </div>
        }
      />

      {/* AI-first insight grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <InsightCard
          index={0}
          icon={Activity}
          title="Academic health"
          value={`${activeBatch?.avgScore ?? heroSummary.avgScore}%`}
          description="Class average across recent assessments and marks."
          hint={activeBatch?.name ?? 'All batches'}
          tone="accent"
          href="/tutor/reports"
          action="View analytics"
        />
        <InsightCard
          index={1}
          icon={AlertTriangle}
          title="Students at risk"
          value={batchAtRisk.length}
          description="Learners needing intervention based on health and gaps."
          tone={batchAtRisk.length > 0 ? 'danger' : 'success'}
          href="/tutor/students"
          action="Review alerts"
        />
        <InsightCard
          index={2}
          icon={TrendingUp}
          title="Weak topics"
          value={topicWeakness.length}
          description="Topics below mastery threshold for the next class."
          tone="warning"
          href="/tutor/curriculum"
          action="Plan next class"
        />
        <InsightCard
          index={3}
          icon={Clock}
          title="Active assessments"
          value={activeAssessments.length}
          description="Live or scheduled exams awaiting completion."
          tone="default"
          href="/tutor/assessments"
          action="Manage"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-8">
        <AppCard className="xl:col-span-3 prism-glow relative overflow-hidden">
          <SectionLabel>AI teaching assistant</SectionLabel>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent shrink-0">
              <Sparkles className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-xl text-foreground">
                {topInsight?.title ?? 'Ready when you are'}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-2xl">
                {topInsight?.description ??
                  topInsight?.suggestedIntervention ??
                  'Prism will surface class insights, weak topics, and next-lesson recommendations as data arrives.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/tutor/question-bank" className="btn btn-secondary text-xs px-3 py-2">
                  <BookOpen className="w-3.5 h-3.5" /> Question bank
                </Link>
                <Link to="/tutor/reports" className="btn btn-ghost text-xs px-3 py-2">
                  Open reports
                </Link>
              </div>
            </div>
          </div>
        </AppCard>

        <AppCard className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <SectionLabel>Quick actions</SectionLabel>
          </div>
          <div className="grid gap-2">
            {[
              { to: '/tutor/assessments', label: 'Build assessment', icon: ClipboardList },
              { to: '/tutor/question-bank', label: 'Import questions', icon: BookOpen },
              { to: '/tutor/students', label: 'Student roster', icon: Users },
              { to: '/tutor/reports', label: 'Learning genome', icon: Activity },
            ].map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 rounded-2xl border border-border px-3 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
              >
                <Icon className="w-4 h-4 text-accent" />
                <span className="flex-1 font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </AppCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <AppCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg text-foreground">Weak topics</h3>
            <Link to="/tutor/curriculum" className="text-xs text-accent hover:underline">
              Curriculum
            </Link>
          </div>
          <div className="space-y-2">
            {topicWeakness.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No weak topics flagged.</p>
            ) : (
              topicWeakness.slice(0, 6).map((topic) => (
                <div
                  key={topic.topic}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-secondary border border-border"
                >
                  <span className="font-mono-data text-xs text-muted-foreground w-5">{topic.rank}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{topic.topic}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {topic.suggestedNextClass}
                      {topic.avgPredictedScore != null && (
                        <> · predicted {topic.avgPredictedScore}%</>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={cn(
                        'font-mono-data text-sm font-semibold',
                        topic.avgMastery < 60 ? 'text-rose' : 'text-accent',
                      )}
                    >
                      {topic.avgMastery}%
                    </span>
                    {topic.avgPredictedScore != null && topic.avgPredictedScore !== topic.avgMastery && (
                      <p className="text-[10px] text-muted-foreground font-mono">
                        → {topic.avgPredictedScore}%
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </AppCard>

        <AppCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg text-foreground">Students</h3>
            <Link to="/tutor/students" className="text-xs text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-1">
            {recentStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <Avatar name={student.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{student.name}</p>
                  <p className="text-xs text-muted-foreground">{student.batch || '—'}</p>
                </div>
                <HealthBadge status={student.status || 'good'} />
              </div>
            ))}
          </div>

          {batchAtRisk.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-rose font-medium mb-2">
                {batchAtRisk.length} at-risk student{batchAtRisk.length === 1 ? '' : 's'}
              </p>
              <div className="flex flex-wrap gap-2">
                {batchAtRisk.slice(0, 4).map((s) => (
                  <span
                    key={s.name}
                    className="text-xs px-2.5 py-1 rounded-full bg-rose/10 text-rose border border-rose/20"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </AppCard>
      </div>
    </>
  )
}
