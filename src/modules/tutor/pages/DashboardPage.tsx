import { Link } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Users,
  ClipboardList,
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
  ShieldCheck,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { SyllabusCompletionChart } from '@/components/academic/SyllabusCompletionChart'
import { PageLoader, DashboardSectionLoader, InlineLoader } from '@/components/ui/PrismLoader'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { Avatar } from '@/components/ui/Avatar'
import { AppDropdown } from '@/components/ui/AppDropdown'
import { useCurriculum } from '@/hooks/useCurriculum'
import { useQuestionPapers } from '@/hooks/useQuestionPapers'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { useAssessments } from '@/hooks/useAssessments'
import { useTutorDashboard } from '@/hooks/useTutorDashboard'
import { useAcademicYears } from '@/hooks/useAcademicYears'
import { fadeUp } from '@/lib/motion'
import { cn } from '@/lib/cn'
import type { HealthStatus } from '@/types'

const CHART = {
  ink: '#1C2739',
  gold: '#C9A227',
  leaf: '#0CBF6E',
  rose: '#E85D4C',
  slate: '#64748B',
  sky: '#3B82A0',
  sand: '#D4A574',
}

function masteryTone(mastery: number, scored: boolean) {
  if (!scored) return { text: 'text-muted-foreground', bar: 'bg-border', chip: 'bg-secondary text-muted-foreground' }
  if (mastery >= 70) return { text: 'text-leaf', bar: 'bg-leaf', chip: 'bg-leaf/12 text-leaf' }
  if (mastery >= 50) return { text: 'text-accent', bar: 'bg-accent', chip: 'bg-accent/15 text-foreground' }
  return { text: 'text-rose', bar: 'bg-rose', chip: 'bg-rose/12 text-rose' }
}

function healthBucketFill(status: HealthStatus) {
  if (status === 'excellent') return CHART.leaf
  if (status === 'good') return CHART.ink
  if (status === 'fair') return CHART.gold
  if (status === 'weak') return CHART.sand
  return CHART.rose
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
  const { refreshing: analyticsRefreshing } = useAnalyticsPage([
    'tutorDashboard',
    'tutorDashboardHeavy',
  ])
  const { batches: tutorBatches, students: tutorStudents, getStudentsForBatch } = useCurriculum()
  const { ensureLoaded: ensureQuestionPapersLoaded } = useQuestionPapers()
  const { activeYear } = useAcademicYears()
  const {
    loading,
    panelsLoading,
    overview: inst,
    operationalStats: ops,
    topicWeakness,
    classInsights,
    atRisk,
    batchHeatmap,
    copilot,
    subjectHealth,
    monthlyTrend,
    syllabusCompletion,
  } = useAnalytics()
  const analyticsBusy = loading || panelsLoading
  const { assessments, ensureLoaded: ensureAssessmentsLoaded } = useAssessments()

  useEffect(() => {
    void ensureAssessmentsLoaded()
    void ensureQuestionPapersLoaded()
  }, [ensureAssessmentsLoaded, ensureQuestionPapersLoaded])

  const { pageTitle, pageSubtitle, pageEyebrow, heroSummary, activeBatchId, setSelectedBatchId } =
    useTutorDashboard()

  const activeBatch = tutorBatches.find((b) => b.id === activeBatchId) ?? tutorBatches[0]
  const batchStudents = activeBatch ? getStudentsForBatch(activeBatch.id) : tutorStudents
  const classHealth = activeBatch?.avgScore ?? heroSummary.avgScore ?? copilot?.avgScore ?? inst?.avgHealth ?? 0

  const batchOptions = useMemo(
    () =>
      tutorBatches.map((b) => ({
        value: b.id,
        label: `${b.name} · ${b.board} ${b.grade}`,
      })),
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

  const assessmentPipeline = useMemo(
    () => [
      { stage: 'Scheduled', count: scheduledAssessments.length, fill: CHART.gold },
      { stage: 'Live', count: liveAssessments.length, fill: CHART.leaf },
      { stage: 'Completed', count: completedAssessments.length, fill: CHART.ink },
    ],
    [scheduledAssessments.length, liveAssessments.length, completedAssessments.length],
  )

  const assessmentCompletion =
    assessments.length > 0
      ? Math.round((100 * completedAssessments.length) / assessments.length)
      : ops?.assessmentsTotal && ops.assessmentsTotal > 0
        ? Math.round((100 * (ops.assessmentsCompleted ?? 0)) / ops.assessmentsTotal)
        : null

  const batchPerfData = useMemo(
    () =>
      [...tutorBatches]
        .map((b) => {
          const health = b.avgScore ?? 0
          return {
            id: b.id,
            name: b.name.length > 16 ? `${b.name.slice(0, 14)}…` : b.name,
            fullName: b.name,
            board: b.board,
            grade: b.grade,
            students: b.studentIds.length,
            health,
            fill:
              health >= 80
                ? CHART.leaf
                : health >= 65
                  ? CHART.ink
                  : health >= 50
                    ? CHART.gold
                    : CHART.rose,
          }
        })
        .sort((a, b) => b.health - a.health)
        .map((row, index) => ({ ...row, rank: index + 1 })),
    [tutorBatches],
  )

  const networkBatchAvg = useMemo(() => {
    if (batchPerfData.length === 0) return 0
    return Math.round(batchPerfData.reduce((sum, b) => sum + b.health, 0) / batchPerfData.length)
  }, [batchPerfData])

  const batchPerfWithDelta = useMemo(
    () =>
      batchPerfData.map((b) => ({
        ...b,
        vsNetwork: b.health - networkBatchAvg,
      })),
    [batchPerfData, networkBatchAvg],
  )

  const batchLeader = batchPerfWithDelta[0]
  const batchTrail =
    batchPerfWithDelta.length > 1 ? batchPerfWithDelta[batchPerfWithDelta.length - 1] : null
  const batchSpread = batchLeader && batchTrail ? batchLeader.health - batchTrail.health : 0

  const recentStudents = batchStudents.slice(0, 8)
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
  const heatmapScored = useMemo(
    () => heatmapRows.some((h) => (h.mastery ?? 0) > 0),
    [heatmapRows],
  )
  const avgHeatmapMastery = useMemo(() => {
    if (heatmapRows.length === 0) return 0
    return Math.round(heatmapRows.reduce((sum, h) => sum + h.mastery, 0) / heatmapRows.length)
  }, [heatmapRows])

  const studentHealthPie = useMemo(() => {
    const buckets: Record<HealthStatus, number> = {
      excellent: 0,
      good: 0,
      fair: 0,
      weak: 0,
      critical: 0,
    }
    for (const student of batchStudents) {
      const status = (student.status ?? 'fair') as HealthStatus
      if (status in buckets) buckets[status] += 1
    }
    return (Object.keys(buckets) as HealthStatus[])
      .map((status) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        status,
        value: buckets[status],
        fill: healthBucketFill(status),
      }))
      .filter((d) => d.value > 0)
  }, [batchStudents])

  const healthyRate = useMemo(() => {
    if (batchStudents.length === 0) return 0
    const healthy = batchStudents.filter(
      (s) => s.status === 'excellent' || s.status === 'good',
    ).length
    return Math.round((100 * healthy) / batchStudents.length)
  }, [batchStudents])

  const avgReadiness = useMemo(() => {
    if (batchStudents.length === 0) return inst?.avgReadiness ?? 0
    return Math.round(
      batchStudents.reduce((sum, s) => sum + (s.readiness ?? 0), 0) / batchStudents.length,
    )
  }, [batchStudents, inst?.avgReadiness])

  const improvingRate = useMemo(() => {
    if (batchStudents.length === 0) return inst?.retention ?? 0
    const improving = batchStudents.filter((s) => s.improving).length
    return Math.round((100 * improving) / batchStudents.length)
  }, [batchStudents, inst?.retention])

  const expectedGain = copilot?.expectedImprovement ?? heroSummary.expectedImprovement ?? 0

  const subjectInsights = useMemo(() => {
    const ranked = [...subjectHealth].sort((a, b) => b.health - a.health)
    const strongest = ranked[0]
    const weakest = ranked.length > 1 ? ranked[ranked.length - 1] : ranked[0]
    const avg =
      ranked.length > 0
        ? Math.round(ranked.reduce((sum, s) => sum + s.health, 0) / ranked.length)
        : 0
    return { ranked, strongest, weakest, avg }
  }, [subjectHealth])

  const subjectRadar = useMemo(() => {
    if (!subjectInsights.ranked.length) return []
    return subjectInsights.ranked.slice(0, 6).map((s) => ({
      subject: s.subject.length > 12 ? `${s.subject.slice(0, 11)}…` : s.subject,
      fullSubject: s.subject,
      health: s.health,
      target: 70,
      fullMark: 100,
    }))
  }, [subjectInsights])

  const healthTone =
    classHealth >= 75 ? CHART.leaf : classHealth >= 55 ? CHART.gold : CHART.rose
  const healthR = 34
  const healthCircumference = 2 * Math.PI * healthR
  const healthOffset =
    healthCircumference - (Math.min(100, Math.max(0, classHealth)) / 100) * healthCircumference
  const atRiskCount = batchAtRisk.length
  const growthNegative = expectedGain < 0

  const pulseSignals = [
    {
      label: 'Readiness',
      value: `${avgReadiness}%`,
      tone: avgReadiness >= 70 ? CHART.leaf : avgReadiness >= 50 ? CHART.gold : CHART.rose,
    },
    {
      label: 'Growth',
      value: `${expectedGain >= 0 ? '+' : ''}${expectedGain}%`,
      tone: growthNegative ? CHART.rose : CHART.leaf,
    },
    {
      label: 'Healthy',
      value: `${healthyRate}%`,
      tone: healthyRate >= 70 ? CHART.leaf : healthyRate >= 45 ? CHART.gold : CHART.rose,
    },
    {
      label: 'Improving',
      value: `${improvingRate}%`,
      tone: CHART.ink,
    },
  ]

  const scopeHint = activeBatch
    ? `${activeBatch.name} · ${activeBatch.board} ${activeBatch.grade}`
    : 'All batches'

  if (loading && tutorBatches.length === 0 && assessments.length === 0 && !copilot) {
    return <PageLoader label="Loading tutor dashboard…" />
  }

  return (
    <>
      <PageHeader
        eyebrow={pageEyebrow || 'Tutor workspace'}
        title={pageTitle || 'Command dashboard'}
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

      {analyticsRefreshing ? (
        <div
          className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-secondary/25 px-3 py-2 text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <InlineLoader size="xs" label="Updating analytics for the selected branch and year…" />
        </div>
      ) : null}

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="relative overflow-hidden rounded-[14px] border border-border bg-ink text-paper mb-5"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 55% 120% at 0% 50%, rgba(201,162,39,0.2), transparent 55%), radial-gradient(ellipse 40% 100% at 100% 50%, rgba(12,191,110,0.12), transparent 50%)',
          }}
        />

        <div className="relative px-4 py-3.5 sm:px-5 sm:py-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex items-center gap-3 min-w-0 flex-1 basis-[220px]">
            <div className="relative h-[68px] w-[68px] shrink-0">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r={healthR}
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="7"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={healthR}
                  fill="none"
                  stroke={healthTone}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={healthCircumference}
                  strokeDashoffset={healthOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-lg tabular-nums leading-none text-paper">
                  {classHealth}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-paper/45">health</span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.14em] text-paper/50 font-semibold">
                Pulse · {scopeHint}
              </p>
              <p className="font-display text-base sm:text-lg text-paper leading-snug truncate">
                {classHealth >= 75
                  ? 'Performing strongly'
                  : classHealth >= 55
                    ? 'Holding steady'
                    : 'Needs focus'}
                <span className="text-paper/45 font-sans text-sm font-normal">
                  {' '}
                  · {batchStudents.length.toLocaleString()} students · {tutorBatches.length}{' '}
                  {tutorBatches.length === 1 ? 'batch' : 'batches'}
                </span>
              </p>
              {atRiskCount > 0 && (
                <p className="inline-flex items-center gap-1 text-[11px] text-rose mt-0.5">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {atRiskCount} at risk in this scope
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {pulseSignals.map((signal) => (
              <div
                key={signal.label}
                className="rounded-lg border border-paper/10 bg-paper/[0.06] px-2.5 py-1.5 min-w-[72px]"
              >
                <p className="text-[9px] uppercase tracking-wider text-paper/45 font-semibold">
                  {signal.label}
                </p>
                <p
                  className="font-display text-base tabular-nums leading-none mt-0.5"
                  style={{ color: signal.tone === CHART.ink ? 'inherit' : signal.tone }}
                >
                  {signal.value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-paper/70 sm:ml-auto">
            {liveAssessments.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-leaf font-medium">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-leaf" />
                </span>
                {liveAssessments.length} live
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-accent" />
              {scheduledAssessments.length} queued
            </span>
            {activeYear?.name && (
              <span className="inline-flex items-center gap-1 text-paper/55">{activeYear.name}</span>
            )}
            <Link
              to="/tutor/students"
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-medium bg-accent text-accent-foreground"
            >
              Students <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <MetricTile
          label="Students"
          value={batchStudents.length.toLocaleString()}
          hint={
            activeBatch
              ? `${healthyRate}% healthy · ${atRiskCount} at risk`
              : `${tutorStudents.length} across all batches`
          }
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
            atRiskCount > 0
              ? `${atRiskCount} at risk in scope`
              : `Readiness ${avgReadiness}%`
          }
          icon={Activity}
          tone={classHealth >= 70 ? 'accent' : atRiskCount > 0 ? 'rose' : 'default'}
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-4 mb-6">
        <AppCard className="order-1 lg:col-span-3">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                Batch scoreboard
              </p>
              <h3 className="font-display text-xl text-foreground mt-1">How each batch is scoring</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Ranked by average score · dashed line is your average ({networkBatchAvg}%)
              </p>
            </div>
            <Link to="/tutor/curriculum" className="text-xs text-accent hover:underline shrink-0">
              Batches →
            </Link>
          </div>

          {analyticsBusy && batchPerfWithDelta.length === 0 ? (
            <DashboardSectionLoader label="Loading batch analytics…" />
          ) : batchPerfWithDelta.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">No batches yet.</p>
          ) : (
            <>
              <div className="metric-chip-grid mb-4">
                <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Your avg</p>
                  <p className="font-display text-xl tabular-nums mt-0.5">{networkBatchAvg}%</p>
                </div>
                <div className="rounded-xl border border-leaf/25 bg-leaf/8 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Leading</p>
                  <p className="font-medium text-sm truncate mt-0.5" title={batchLeader?.fullName}>
                    {batchLeader?.name}
                  </p>
                  <p className="font-mono-data text-xs text-leaf">{batchLeader?.health}%</p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Spread</p>
                  <p className="font-display text-xl tabular-nums mt-0.5">{batchSpread} pts</p>
                  <p className="text-[10px] text-muted-foreground">best − weakest</p>
                </div>
              </div>

              <div className={cn('mb-4', batchPerfWithDelta.length > 4 ? 'h-56' : 'h-44')}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={batchPerfWithDelta}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                    <XAxis type="number" domain={[0, 100]} fontSize={11} tickLine={false} unit="%" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={108}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--secondary)', opacity: 0.45 }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null
                        const row = payload[0].payload as (typeof batchPerfWithDelta)[number]
                        return (
                          <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
                            <p className="font-medium text-foreground">
                              #{row.rank} {row.fullName}
                            </p>
                            <p className="text-muted-foreground mt-1">
                              Health {row.health}% · {row.students} students
                            </p>
                            <p className="text-muted-foreground">
                              vs average {row.vsNetwork >= 0 ? '+' : ''}
                              {row.vsNetwork} pts
                            </p>
                          </div>
                        )
                      }}
                    />
                    <ReferenceLine
                      x={networkBatchAvg}
                      stroke={CHART.slate}
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: 'Avg',
                        position: 'top',
                        fill: CHART.slate,
                        fontSize: 10,
                      }}
                    />
                    <Bar dataKey="health" name="Avg health" radius={[0, 6, 6, 0]} barSize={18}>
                      {batchPerfWithDelta.map((entry) => (
                        <Cell key={entry.id} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <ul className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {batchPerfWithDelta.map((b) => (
                  <li
                    key={b.id}
                    className="flex flex-wrap items-center gap-3 px-3 py-2.5 bg-card hover:bg-secondary/40 transition-colors"
                  >
                    <span
                      className={cn(
                        'w-7 h-7 rounded-full grid place-items-center text-[11px] font-bold shrink-0',
                        b.rank === 1
                          ? 'bg-leaf/15 text-leaf'
                          : b.rank === 2
                            ? 'bg-accent/15 text-foreground'
                            : 'bg-secondary text-muted-foreground',
                      )}
                    >
                      {b.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground truncate">{b.fullName}</p>
                        <span className="text-[10px] text-muted-foreground">
                          {b.board} {b.grade}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden max-w-xs">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, b.health)}%`, background: b.fill }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] tabular-nums shrink-0">
                      <span className="font-mono-data text-sm font-semibold text-foreground">
                        {b.health}%
                      </span>
                      <span
                        className={cn('font-medium', b.vsNetwork >= 0 ? 'text-leaf' : 'text-rose')}
                        title="Vs your average"
                      >
                        {b.vsNetwork >= 0 ? '+' : ''}
                        {b.vsNetwork}
                      </span>
                      <span className="text-muted-foreground">{b.students} stu</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: CHART.leaf }} /> ≥80 strong
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: CHART.ink }} /> 65–79 solid
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: CHART.gold }} /> 50–64 watch
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: CHART.rose }} /> &lt;50 at risk
                </span>
              </div>
            </>
          )}
        </AppCard>

        <AppCard className="order-2 lg:col-span-2">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
            Student health
          </p>
          <h3 className="font-display text-xl text-foreground mt-1">Class distribution</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Health mix for {activeBatch?.name ?? 'your batches'}
          </p>
          {analyticsBusy && studentHealthPie.length === 0 ? (
            <DashboardSectionLoader label="Loading health mix…" />
          ) : studentHealthPie.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">No student health data yet.</p>
          ) : (
            <>
              <div className="relative h-40 mb-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={studentHealthPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={70}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {studentHealthPie.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value ?? 0} students`, String(name)]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="font-display text-2xl tabular-nums text-foreground">{healthyRate}%</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">healthy</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                <div className="rounded-xl border border-leaf/25 bg-leaf/8 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Improving</p>
                  <p className="font-mono-data text-lg text-leaf">{improvingRate}%</p>
                </div>
                <div className="rounded-xl border border-rose/20 bg-rose/8 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">At risk</p>
                  <p className="font-mono-data text-lg text-rose">{atRiskCount}</p>
                </div>
              </div>

              <ul className="space-y-2">
                {studentHealthPie.map((row) => (
                  <li key={row.name}>
                    <div className="flex items-center justify-between gap-2 text-xs mb-1">
                      <span className="truncate font-medium text-foreground">{row.name}</span>
                      <span className="tabular-nums text-muted-foreground shrink-0">{row.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.round((100 * row.value) / Math.max(1, batchStudents.length)))}%`,
                          background: row.fill,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </AppCard>
      </div>

      <AppCard className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-leaf" />
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
              Assessment pipeline
            </p>
          </div>
          <Link to="/tutor/assessments" className="text-xs text-accent hover:underline">
            Manage →
          </Link>
        </div>
        <h3 className="font-display text-xl text-foreground mb-4">How exams are moving</h3>
        {analyticsBusy && assessmentPipeline.every((r) => r.count === 0) ? (
          <DashboardSectionLoader label="Loading assessments…" />
        ) : assessmentPipeline.every((r) => r.count === 0) ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No assessments yet.</p>
        ) : (
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assessmentPipeline} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" allowDecimals={false} fontSize={11} tickLine={false} />
                <YAxis type="category" dataKey="stage" width={80} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => [Number(value ?? 0), 'Count']} />
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
          {assessmentCompletion != null && (
            <span className="ml-auto font-mono-data">{assessmentCompletion}% completed</span>
          )}
        </div>
      </AppCard>

      <div className="grid lg:grid-cols-5 gap-4 mb-6">
        <AppCard className="lg:col-span-3">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                Score trend
              </p>
              <h3 className="font-display text-xl text-foreground mt-1">Class performance over time</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Monthly average from in-app exams and uploaded marks
              </p>
            </div>
            <Link to="/tutor/reports" className="text-xs text-accent hover:underline shrink-0">
              Reports →
            </Link>
          </div>
          {analyticsBusy && monthlyTrend.length === 0 ? (
            <DashboardSectionLoader label="Loading performance trend…" />
          ) : monthlyTrend.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-secondary/20 px-4 py-8 text-center">
              <Sparkles className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-70" />
              <p className="text-sm font-medium text-foreground">
                {batchClassInsights[0]?.title ?? heroSummary.headline ?? 'Trend appears after scored work'}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                {batchClassInsights[0]?.description ??
                  'Run assessments or enter marks to unlock the monthly performance line.'}
              </p>
              <div className="mt-4 grid sm:grid-cols-2 gap-3 text-left">
                <div className="rounded-xl border border-leaf/25 bg-leaf/8 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Strong</p>
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
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    domain={[0, 100]}
                    fontSize={11}
                    width={32}
                    tickLine={false}
                    axisLine={false}
                    unit="%"
                  />
                  <Tooltip formatter={(value) => [`${value ?? 0}%`, 'Score']} />
                  <ReferenceLine y={70} stroke={CHART.slate} strokeDasharray="4 4" />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke={CHART.ink}
                    strokeWidth={2}
                    dot={{ r: 4, fill: CHART.gold }}
                    name="Score %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </AppCard>

        <AppCard className="lg:col-span-2">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
            Subject radar
          </p>
          <h3 className="font-display text-xl text-foreground mt-1">Subject balance</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-2">
            Shape of subject strength · target ring at 70%
          </p>
          {analyticsBusy && subjectRadar.length === 0 ? (
            <DashboardSectionLoader label="Loading subject health…" />
          ) : subjectRadar.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              Subject health appears after scored assessments.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="rounded-xl border border-leaf/25 bg-leaf/8 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Strongest</p>
                  <p className="text-sm font-medium truncate" title={subjectInsights.strongest?.subject}>
                    {subjectInsights.strongest?.subject ?? '—'}
                  </p>
                  <p className="font-mono-data text-xs text-leaf">
                    {subjectInsights.strongest?.health ?? 0}%
                  </p>
                </div>
                <div className="rounded-xl border border-rose/20 bg-rose/8 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Needs focus</p>
                  <p className="text-sm font-medium truncate" title={subjectInsights.weakest?.subject}>
                    {subjectInsights.weakest?.subject ?? '—'}
                  </p>
                  <p className="font-mono-data text-xs text-rose">
                    {subjectInsights.weakest?.health ?? 0}%
                  </p>
                </div>
              </div>

              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={subjectRadar} outerRadius="70%">
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} axisLine={false} />
                    <Radar
                      name="Target 70%"
                      dataKey="target"
                      stroke={CHART.slate}
                      fill="transparent"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                    />
                    <Radar
                      name="Health"
                      dataKey="health"
                      stroke={CHART.ink}
                      fill={CHART.gold}
                      fillOpacity={0.32}
                      strokeWidth={2}
                    />
                    <Tooltip
                      formatter={(value, name) => [`${value ?? 0}%`, String(name)]}
                      labelFormatter={(label, payload) =>
                        String(
                          (payload?.[0]?.payload as { fullSubject?: string } | undefined)?.fullSubject ??
                            label,
                        )
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <p className="text-[10px] text-muted-foreground mb-2 text-center">
                Avg subject health {subjectInsights.avg}%
              </p>
              <ul className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin">
                {subjectInsights.ranked.slice(0, 6).map((s, i) => (
                  <li key={s.subject} className="flex items-center gap-2 text-xs">
                    <span className="w-5 text-muted-foreground tabular-nums">{i + 1}</span>
                    <span className="flex-1 truncate font-medium">{s.subject}</span>
                    <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-ink"
                        style={{ width: `${Math.min(100, s.health)}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono-data tabular-nums">{s.health}%</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </AppCard>
      </div>

      <SyllabusCompletionChart
        className="mb-6"
        rows={syllabusCompletion}
        loading={analyticsBusy}
        linkHref="/tutor/curriculum"
        linkLabel="Curriculum →"
      />

      <AppCard className="mb-6">
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

        {analyticsBusy && heatmapRows.length === 0 ? (
          <DashboardSectionLoader label="Loading topic mastery…" className="mt-4" />
        ) : heatmapRows.length === 0 ? (
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
            </div>
            <ul className="space-y-2">
              {heatmapRows.map((h) => {
                const mastery = Math.max(0, Math.min(100, h.mastery ?? 0))
                const tone = masteryTone(mastery, heatmapScored)
                return (
                  <li key={h.topic} className="flex items-center gap-3">
                    <p
                      className="w-[42%] min-w-0 text-xs font-medium text-foreground line-clamp-2 leading-snug"
                      title={h.topic}
                    >
                      {h.topic}
                    </p>
                    <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', tone.bar)}
                        style={{
                          width: heatmapScored ? `${Math.max(mastery, mastery > 0 ? 3 : 0)}%` : '0%',
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

      <div className="grid lg:grid-cols-5 gap-4 mb-6">
        <AppCard className="lg:col-span-3">
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

          {analyticsBusy && recentStudents.length === 0 ? (
            <DashboardSectionLoader label="Loading students…" className="mt-4" />
          ) : recentStudents.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-secondary/20 px-4 py-8 text-center">
              <UserPlus className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-70" />
              <p className="text-sm font-medium text-foreground">No students in this batch</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Assign learners to {activeBatch?.name ?? 'a batch'} in curriculum setup to see health
                and reports here.
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/tutor/curriculum"
                  className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                >
                  Open curriculum <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="pb-2 pr-3 font-semibold">Student</th>
                    <th className="pb-2 pr-3 font-semibold text-right">Health</th>
                    <th className="pb-2 pr-3 font-semibold text-right">Readiness</th>
                    <th className="pb-2 font-semibold text-right">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {recentStudents.map((student) => (
                    <tr key={student.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 pr-3">
                        <Link
                          to={`/tutor/students/${student.id}/report`}
                          className="flex items-center gap-2 min-w-0 hover:text-accent"
                        >
                          <Avatar name={student.name} size="sm" />
                          <span className="min-w-0">
                            <span className="block font-medium truncate">{student.name}</span>
                            <span className="block text-[11px] text-muted-foreground truncate">
                              {student.batch || activeBatch?.name || '—'}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3 text-right">
                        <HealthBadge status={student.status || 'good'} />
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono-data tabular-nums">
                        {student.readiness ?? 0}%
                      </td>
                      <td
                        className={cn(
                          'py-2.5 text-right text-xs font-medium',
                          student.improving ? 'text-leaf' : 'text-muted-foreground',
                        )}
                      >
                        {student.improving ? 'Improving' : 'Watch'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AppCard>

        <AppCard className="lg:col-span-2">
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
          {analyticsBusy && batchAtRisk.length === 0 ? (
            <DashboardSectionLoader label="Loading at-risk list…" />
          ) : batchAtRisk.length === 0 ? (
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
                    <span className="font-mono-data text-sm text-rose tabular-nums shrink-0">{s.risk}%</span>
                  </li>
                ))}
            </ul>
          )}

          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-leaf/25 bg-leaf/8 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Expected gain</p>
              <p className="font-mono-data text-lg text-leaf">+{expectedGain}%</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Curriculum</p>
              <p className="font-mono-data text-lg">
                {ops?.curriculumProgress != null ? `${Math.round(ops.curriculumProgress)}%` : '—'}
              </p>
            </div>
          </div>
        </AppCard>
      </div>

      {ops && (ops.cscDueSoon > 0 || ops.reassignmentPending > 0) && (
        <AppCard className="mb-6 border-amber-200/70 bg-amber-50/50">
          <div className="flex flex-wrap items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm flex-1">
              {ops.cscDueSoon > 0 && (
                <p>
                  <span className="font-medium">{ops.cscDueSoon} students</span> need a CSC visit soon
                  ({ops.cscInactive} inactive · {ops.cscNeverVisited} never visited).
                </p>
              )}
              {ops.reassignmentPending > 0 && (
                <p className="inline-flex items-center gap-1.5 flex-wrap">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-medium">{ops.reassignmentPending} reassignment requests</span>{' '}
                  awaiting review.
                  <Link to="/tutor/assessments" className="text-accent hover:underline">
                    Review now →
                  </Link>
                </p>
              )}
            </div>
          </div>
        </AppCard>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 mb-2">
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
            to: '/tutor/reports/insights',
            label: 'Class insights',
            hint: 'Learning genome',
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
    </>
  )
}
