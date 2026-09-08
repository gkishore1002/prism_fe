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
  Layers,
  Radio,
  CheckCircle2,
  Target,
  BarChart3,
  ArrowRight,
  UserPlus,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { InsightCard, SectionLabel } from '@/components/design/InsightCard'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { Avatar } from '@/components/ui/Avatar'
import { AppDropdown } from '@/components/ui/AppDropdown'
import { useCurriculum } from '@/hooks/useCurriculum'
import { useQuestionPapers } from '@/hooks/useQuestionPapers'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { useAssessments } from '@/hooks/useAssessments'
import { useTutorDashboard } from '@/hooks/useTutorDashboard'
import { cn } from '@/lib/cn'

const CHART = {
  ink: '#1C2739',
  gold: '#C9A227',
  leaf: '#0CBF6E',
  rose: '#E85D4C',
  slate: '#64748B',
}

function masteryTone(mastery: number, scored: boolean) {
  if (!scored) return { text: 'text-muted-foreground', bar: 'bg-border', chip: 'bg-secondary text-muted-foreground' }
  if (mastery >= 70) return { text: 'text-leaf', bar: 'bg-leaf', chip: 'bg-leaf/12 text-leaf' }
  if (mastery >= 50) return { text: 'text-accent', bar: 'bg-accent', chip: 'bg-accent/15 text-foreground' }
  return { text: 'text-rose', bar: 'bg-rose', chip: 'bg-rose/12 text-rose' }
}

function MetricTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
}: {
  label: string
  value: string | number
  hint?: string
  icon: React.ComponentType<{ className?: string }>
  tone?: 'default' | 'leaf' | 'accent' | 'rose'
}) {
  const tones = {
    default: 'bg-card border-border',
    leaf: 'bg-leaf/8 border-leaf/25',
    accent: 'bg-accent/10 border-accent/30',
    rose: 'bg-rose/8 border-rose/25',
  }
  const iconTone = {
    default: 'bg-secondary text-foreground',
    leaf: 'bg-leaf/15 text-leaf',
    accent: 'bg-accent/20 text-foreground',
    rose: 'bg-rose/15 text-rose',
  }
  return (
    <div className={cn('rounded-[14px] border p-4 sm:p-5', tones[tone])}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
            {label}
          </p>
          <p className="font-display text-3xl sm:text-4xl text-foreground mt-1.5 tabular-nums">
            {value}
          </p>
          {hint && <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{hint}</p>}
        </div>
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl shrink-0', iconTone[tone])}>
          <Icon className="w-5 h-5" />
        </span>
      </div>
    </div>
  )
}

export function TutorDashboardPage() {
  useAnalyticsPage(['tutorDashboard', 'tutorBatches'])
  const { batches: tutorBatches, students: tutorStudents, getStudentsForBatch } = useCurriculum()
  const { ensureLoaded: ensureQuestionPapersLoaded } = useQuestionPapers()
  const { topicWeakness, classInsights, atRisk, batchHeatmap, copilot } = useAnalytics()
  const { assessments, ensureLoaded: ensureAssessmentsLoaded } = useAssessments()

  useEffect(() => {
    void ensureAssessmentsLoaded()
    void ensureQuestionPapersLoaded()
  }, [ensureAssessmentsLoaded, ensureQuestionPapersLoaded])

  const {
    pageTitle,
    pageSubtitle,
    pageEyebrow,
    heroSummary,
    activeBatchId,
    setSelectedBatchId,
  } = useTutorDashboard()

  const activeBatch = tutorBatches.find((b) => b.id === activeBatchId) ?? tutorBatches[0]
  const batchStudents = activeBatch ? getStudentsForBatch(activeBatch.id) : tutorStudents
  const classHealth = activeBatch?.avgScore ?? heroSummary.avgScore ?? copilot?.avgScore ?? 0

  const batchOptions = useMemo(
    () => [
      ...tutorBatches.map((b) => ({
        value: b.id,
        label: `${b.name} · ${b.board} ${b.grade}`,
      })),
    ],
    [tutorBatches],
  )

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

  const liveAssessments = assessments.filter((a) => a.status === 'live')
  const scheduledAssessments = assessments.filter((a) => a.status === 'scheduled')
  const completedAssessments = assessments.filter((a) => a.status === 'completed')
  const activeAssessments = [...liveAssessments, ...scheduledAssessments]

  const assessmentPipeline = useMemo(
    () => [
      { stage: 'Scheduled', count: scheduledAssessments.length, fill: CHART.gold },
      { stage: 'Live', count: liveAssessments.length, fill: CHART.leaf },
      { stage: 'Completed', count: completedAssessments.length, fill: CHART.ink },
    ],
    [scheduledAssessments.length, liveAssessments.length, completedAssessments.length],
  )

  const batchPerfData = useMemo(
    () =>
      [...tutorBatches]
        .map((b) => ({
          id: b.id,
          name: b.name.length > 16 ? `${b.name.slice(0, 14)}…` : b.name,
          fullName: b.name,
          students: b.studentIds.length,
          health: b.avgScore ?? 0,
          fill:
            (b.avgScore ?? 0) >= 80
              ? CHART.leaf
              : (b.avgScore ?? 0) >= 65
                ? CHART.ink
                : (b.avgScore ?? 0) >= 50
                  ? CHART.gold
                  : CHART.rose,
        }))
        .sort((a, b) => b.health - a.health),
    [tutorBatches],
  )

  const networkBatchAvg = useMemo(() => {
    if (batchPerfData.length === 0) return 0
    return Math.round(batchPerfData.reduce((sum, b) => sum + b.health, 0) / batchPerfData.length)
  }, [batchPerfData])

  const recentStudents = batchStudents.slice(0, 6)
  const topInsight = batchClassInsights[0]
  const strongTopics = heroSummary.strongTopics?.length
    ? heroSummary.strongTopics
    : copilot?.strongTopics ?? []
  const weakTopicNames = heroSummary.weakTopics?.length
    ? heroSummary.weakTopics
    : copilot?.weakTopics ?? topicWeakness.slice(0, 4).map((t) => t.topic)

  const heatmapRows = useMemo(
    () => [...batchHeatmap].sort((a, b) => a.mastery - b.mastery).slice(0, 8),
    [batchHeatmap],
  )
  const topicsScored = useMemo(
    () => topicWeakness.some((t) => (t.avgMastery ?? 0) > 0 || (t.avgPredictedScore ?? 0) > 0),
    [topicWeakness],
  )
  const heatmapScored = useMemo(
    () => heatmapRows.some((h) => (h.mastery ?? 0) > 0),
    [heatmapRows],
  )
  const avgHeatmapMastery = useMemo(() => {
    if (heatmapRows.length === 0) return 0
    return Math.round(heatmapRows.reduce((sum, h) => sum + h.mastery, 0) / heatmapRows.length)
  }, [heatmapRows])

  return (
    <>
      <PageHeader
        eyebrow={pageEyebrow || 'Tutor workspace'}
        title={pageTitle}
        sub={pageSubtitle}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {batchOptions.length > 0 && (
              <div className="min-w-[12rem]">
                <AppDropdown
                  value={activeBatch?.id ?? ''}
                  onChange={setSelectedBatchId}
                  options={batchOptions}
                  variant="inline"
                  fullWidth
                  placeholder="Select batch"
                />
              </div>
            )}
            <Link to="/tutor/assessments" className="btn btn-primary gap-2 px-4 py-2 text-sm">
              <ClipboardList className="w-4 h-4" /> New assessment
            </Link>
            <Link to="/tutor/marks" className="btn btn-secondary gap-2 px-4 py-2 text-sm">
              Enter marks
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <MetricTile
          label="Students"
          value={batchStudents.length.toLocaleString()}
          hint={activeBatch ? activeBatch.name : `${tutorStudents.length} across all batches`}
          icon={Users}
          tone="leaf"
        />
        <MetricTile
          label="Batches"
          value={tutorBatches.length.toLocaleString()}
          hint={
            tutorBatches.length > 0
              ? `Avg health ${networkBatchAvg}%`
              : 'Create batches in curriculum'
          }
          icon={Layers}
        />
        <MetricTile
          label="Assessments"
          value={assessments.length.toLocaleString()}
          hint={`${liveAssessments.length} live · ${scheduledAssessments.length} queued · ${completedAssessments.length} done`}
          icon={ClipboardList}
          tone={liveAssessments.length > 0 ? 'leaf' : 'default'}
        />
        <MetricTile
          label="Class health"
          value={`${classHealth}%`}
          hint={
            batchAtRisk.length > 0
              ? `${batchAtRisk.length} at risk in scope`
              : 'No at-risk flags in scope'
          }
          icon={Activity}
          tone={classHealth >= 70 ? 'accent' : batchAtRisk.length > 0 ? 'rose' : 'default'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <InsightCard
          index={0}
          icon={Activity}
          title="Academic health"
          value={`${classHealth}%`}
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
          href="/tutor/reports/at-risk"
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

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mb-6">
        <AppCard className="xl:col-span-3 relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-70"
            style={{
              background:
                'radial-gradient(ellipse 80% 100% at 10% -20%, rgba(201,162,39,0.12), transparent 55%)',
            }}
            aria-hidden
          />
          <div className="relative">
            <SectionLabel>Teaching pulse</SectionLabel>
            <div className="flex items-start gap-3 mt-1">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent shrink-0">
                <Sparkles className="w-5 h-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-xl text-foreground">
                  {topInsight?.title ?? heroSummary.headline ?? 'Ready when you are'}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  {topInsight?.description ??
                    topInsight?.suggestedIntervention ??
                    (copilot
                      ? `${copilot.subject} · ${copilot.batchName || 'Your batches'} · expected +${copilot.expectedImprovement ?? heroSummary.expectedImprovement}%`
                      : 'Prism will surface class insights, weak topics, and next-lesson recommendations as data arrives.')}
                </p>
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-leaf/25 bg-leaf/8 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                      Strong
                    </p>
                    {strongTopics.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No strong topics yet</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {strongTopics.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-leaf/15 text-leaf border border-leaf/20"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                      Needs focus
                    </p>
                    {weakTopicNames.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No focus topics yet</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {weakTopicNames.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-accent/15 text-foreground border border-accent/25"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to="/tutor/reports/insights" className="btn btn-secondary text-xs px-3 py-2">
                    <BarChart3 className="w-3.5 h-3.5" /> Class insights
                  </Link>
                  <Link to="/tutor/question-bank" className="btn btn-ghost text-xs px-3 py-2">
                    <BookOpen className="w-3.5 h-3.5" /> Question bank
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </AppCard>

        <AppCard className="xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                Exam pipeline
              </p>
              <h3 className="font-display text-lg text-foreground mt-1">How exams are moving</h3>
            </div>
            <Link to="/tutor/assessments" className="text-xs text-accent hover:underline">
              Manage →
            </Link>
          </div>
          {assessmentPipeline.every((r) => r.count === 0) ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No assessments yet.</p>
          ) : (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assessmentPipeline} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} fontSize={11} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    width={72}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [value, 'Count']}
                    contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 12 }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                    {assessmentPipeline.map((entry) => (
                      <Cell key={entry.stage} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Radio className="w-3 h-3 text-leaf" /> {liveAssessments.length} live
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-accent" /> {scheduledAssessments.length} scheduled
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {completedAssessments.length} completed
            </span>
          </div>
        </AppCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mb-6">
        <AppCard className="xl:col-span-3">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                Batch scoreboard
              </p>
              <h3 className="font-display text-xl text-foreground mt-1">How each batch is scoring</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Ranked by average score · network average {networkBatchAvg}%
              </p>
            </div>
            <Link to="/tutor/curriculum" className="text-xs text-accent hover:underline shrink-0">
              Batches →
            </Link>
          </div>
          {batchPerfData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">No batches yet.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={batchPerfData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} dy={6} />
                  <YAxis
                    domain={[0, 100]}
                    fontSize={11}
                    width={36}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}`}
                  />
                  <Tooltip
                    formatter={(value: number, _name, item) => [
                      `${value}%`,
                      (item?.payload as { fullName?: string })?.fullName ?? 'Health',
                    ]}
                    contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 12 }}
                  />
                  <Bar dataKey="health" radius={[6, 6, 0, 0]} barSize={28}>
                    {batchPerfData.map((entry) => (
                      <Cell key={entry.id} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </AppCard>

        <AppCard className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                Attention queue
              </p>
              <h3 className="font-display text-lg text-foreground mt-1">At-risk students</h3>
            </div>
            <Link to="/tutor/reports/at-risk" className="text-xs text-accent hover:underline">
              View all
            </Link>
          </div>
          {batchAtRisk.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No at-risk students in scope.</p>
          ) : (
            <ul className="space-y-2">
              {[...batchAtRisk]
                .sort((a, b) => b.risk - a.risk)
                .slice(0, 6)
                .map((s) => (
                  <li
                    key={`${s.name}-${s.grade}`}
                    className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5"
                  >
                    <span className="w-8 h-8 rounded-lg bg-rose/10 text-rose grid place-items-center shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        Grade {s.grade} · {s.board} · {s.reason}
                      </p>
                    </div>
                    <span className="font-mono-data text-sm text-rose tabular-nums shrink-0">
                      {s.risk}%
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </AppCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <AppCard>
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                Reteach queue
              </p>
              <h3 className="font-display text-lg text-foreground mt-1">Topics to cover next</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {topicWeakness.length === 0
                  ? 'Ranked by lowest mastery once assessments are scored.'
                  : topicsScored
                    ? `${topicWeakness.length} topics need attention in this scope.`
                    : 'Topics listed — mastery will appear after scored assessments.'}
              </p>
            </div>
            <Link to="/tutor/curriculum" className="text-xs text-accent hover:underline shrink-0">
              Curriculum
            </Link>
          </div>

          {topicWeakness.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-secondary/20 px-4 py-8 text-center">
              <TrendingUp className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-70" />
              <p className="text-sm font-medium text-foreground">No reteach queue yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Run and score a live assessment to surface the weakest topics for the next class.
              </p>
              <Link
                to="/tutor/assessments"
                className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline mt-3"
              >
                Go to assessments <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {topicWeakness.slice(0, 5).map((topic) => {
                const mastery = Math.max(0, Math.min(100, topic.avgMastery ?? 0))
                const tone = masteryTone(mastery, topicsScored)
                const predicted =
                  topic.avgPredictedScore != null && topic.avgPredictedScore !== mastery
                    ? topic.avgPredictedScore
                    : null
                return (
                  <li
                    key={topic.topic}
                    className="rounded-xl border border-border bg-card px-3 py-2.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={cn(
                          'mt-0.5 w-6 h-6 rounded-md grid place-items-center text-[11px] font-mono-data shrink-0',
                          topicsScored && mastery < 50
                            ? 'bg-rose/12 text-rose'
                            : 'bg-secondary text-muted-foreground',
                        )}
                      >
                        {topic.rank}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-foreground leading-snug" title={topic.topic}>
                            {topic.topic}
                          </p>
                          <span className={cn('font-mono-data text-sm tabular-nums shrink-0', tone.text)}>
                            {topicsScored ? `${mastery}%` : '—'}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                          {topicsScored
                            ? topic.suggestedNextClass || 'Plan a short reteach block'
                            : 'Awaiting scored attempts'}
                          {predicted != null ? ` · predicted ${predicted}%` : ''}
                        </p>
                        <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-[width]', tone.bar)}
                            style={{
                              width: topicsScored
                                ? `${Math.max(mastery, mastery > 0 ? 4 : 0)}%`
                                : '0%',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </AppCard>

        <AppCard>
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                Topic mastery
              </p>
              <h3 className="font-display text-lg text-foreground mt-1">Lowest coverage first</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {heatmapRows.length === 0
                  ? 'Mastery by topic once students complete scored work.'
                  : heatmapScored
                    ? `Avg ${avgHeatmapMastery}% across ${heatmapRows.length} topics shown`
                    : 'Topics mapped — scores appear after assessments are marked'}
              </p>
            </div>
            <Link to="/tutor/reports/subjects" className="text-xs text-accent hover:underline shrink-0">
              Subjects
            </Link>
          </div>

          {heatmapRows.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-secondary/20 px-4 py-8 text-center">
              <BarChart3 className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-70" />
              <p className="text-sm font-medium text-foreground">No mastery data yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Topic coverage fills in from question tags and scored assessments.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-3 mb-3 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-rose" /> Low
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-accent" /> Fair
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-leaf" /> Strong
                </span>
                {!heatmapScored && (
                  <span className="ml-auto normal-case tracking-normal text-muted-foreground">
                    Not scored yet
                  </span>
                )}
              </div>
              <ul className="space-y-2">
                {heatmapRows.map((h) => {
                  const mastery = Math.max(0, Math.min(100, h.mastery ?? 0))
                  const tone = masteryTone(mastery, heatmapScored)
                  return (
                    <li key={h.topic} className="flex items-center gap-3">
                      <p className="w-[42%] min-w-0 text-xs font-medium text-foreground line-clamp-2 leading-snug" title={h.topic}>
                        {h.topic}
                      </p>
                      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', tone.bar)}
                          style={{
                            width: heatmapScored
                              ? `${Math.max(mastery, mastery > 0 ? 3 : 0)}%`
                              : '0%',
                          }}
                        />
                      </div>
                      <span className={cn('w-10 text-right font-mono-data text-xs tabular-nums', tone.text)}>
                        {heatmapScored ? `${mastery}%` : '—'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </AppCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mb-6">
        <AppCard className="xl:col-span-3">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                Roster
              </p>
              <h3 className="font-display text-lg text-foreground mt-1">Students in scope</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {activeBatch
                  ? `${activeBatch.name} · ${batchStudents.length} student${batchStudents.length === 1 ? '' : 's'}`
                  : `${tutorStudents.length} student${tutorStudents.length === 1 ? '' : 's'} across batches`}
              </p>
            </div>
            <Link to="/tutor/students" className="text-xs text-accent hover:underline shrink-0">
              View all
            </Link>
          </div>

          {recentStudents.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-secondary/20 px-4 py-8 text-center">
              <UserPlus className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-70" />
              <p className="text-sm font-medium text-foreground">No students in this batch</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Assign learners to {activeBatch?.name ?? 'a batch'} in curriculum setup to see health and reports here.
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/tutor/curriculum"
                  className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                >
                  Open curriculum <ArrowRight className="w-3 h-3" />
                </Link>
                <Link
                  to="/tutor/students"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Browse all students
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-3 divide-y divide-border/70">
              {recentStudents.map((student) => (
                <Link
                  key={student.id}
                  to={`/tutor/students/${student.id}/report`}
                  className="flex items-center gap-3 py-2.5 px-1 hover:bg-secondary/40 rounded-lg transition-colors"
                >
                  <Avatar name={student.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {student.batch || activeBatch?.name || '—'}
                      {student.board ? ` · ${student.board}` : ''}
                      {student.grade ? ` ${student.grade}` : ''}
                    </p>
                  </div>
                  <HealthBadge status={student.status || 'good'} />
                </Link>
              ))}
            </div>
          )}
        </AppCard>

        <AppCard className="xl:col-span-2">
          <SectionLabel>Quick actions</SectionLabel>
          <p className="text-xs text-muted-foreground mt-1 mb-3">Jump into the next teaching task.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
            {[
              {
                to: '/tutor/assessments',
                label: 'Build assessment',
                hint: 'Schedule or go live',
                icon: ClipboardList,
              },
              {
                to: '/tutor/marks',
                label: 'Enter marks',
                hint: 'Manual or CSV upload',
                icon: Target,
              },
              {
                to: '/tutor/question-bank',
                label: 'Question bank',
                hint: 'Papers & imports',
                icon: BookOpen,
              },
              {
                to: '/tutor/reports',
                label: 'Reports',
                hint: 'Insights & genome',
                icon: Activity,
              },
            ].map(({ to, label, hint, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-left hover:border-accent/35 hover:bg-secondary/35 transition-colors"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground shrink-0">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{label}</span>
                  <span className="block text-[11px] text-muted-foreground">{hint}</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        </AppCard>
      </div>
    </>
  )
}
