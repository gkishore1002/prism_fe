import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PageLoader } from '@/components/ui/PrismLoader'
import {
  ArrowRight,
  Users,
  Network,
  BarChart3,
  Database,
  ClipboardList,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Building2,
  Radio,
  UserCheck,
  GraduationCap,
  Trophy,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ReferenceLine,
} from 'recharts'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { Pagination } from '@/components/ui/Pagination'
import { pageCount, paginateItems } from '@/lib/pagination'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { useAdminPortalContext } from '@/hooks/useAdminPortalContext'
import { useCenters } from '@/hooks/useCenters'
import { useAcademicYears } from '@/hooks/useAcademicYears'
import { formatCenterLabel } from '@/lib/centerLabel'
import { adminMeta } from '@/modules/admin/lib/nav'
import { cn } from '@/lib/cn'
import { fadeUp } from '@/lib/motion'

const CHART = {
  ink: '#1C2739',
  gold: '#C9A227',
  leaf: '#0CBF6E',
  rose: '#E85D4C',
  slate: '#64748B',
  sky: '#3B82A0',
  sand: '#D4A574',
}

const SUBJECT_LINE_COLORS = [CHART.ink, CHART.gold, CHART.leaf, CHART.sky, CHART.rose, CHART.sand]
const STAFF_LEADERBOARD_LIMIT = 5
const STAFF_LEADERBOARD_LIMIT_OPTIONS = [5, 10, 20] as const

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

export function AdminDashboardPage() {
  useAnalyticsPage(['adminDashboard', 'adminDashboardHeavy'])
  const [staffPage, setStaffPage] = useState(1)
  const [staffLimit, setStaffLimit] = useState(STAFF_LEADERBOARD_LIMIT)
  const {
    activeCenterId,
    isAllBranches,
    canSelectAllBranches,
    centers,
    ensureLoaded: ensureBranchesLoaded,
  } = useCenters()
  const { activeYear } = useAcademicYears()
  const { branchScoped, portalLabel } = useAdminPortalContext()
  const {
    loading,
    overview: inst,
    operationalStats: ops,
    teachers,
    subjectHealth,
    classInsights,
    atRisk,
    centerAnalytics,
    branchSubjectMatrix,
  } = useAnalytics()

  useEffect(() => {
    void ensureBranchesLoaded()
  }, [ensureBranchesLoaded])

  const activeCenter = centers.find((c) => c.id === activeCenterId)
  const branchScopedAdminPortal = branchScoped
  const studentScopeHint = branchScopedAdminPortal
    ? centers.length <= 1 && activeCenter
      ? formatCenterLabel(activeCenter)
      : 'Assigned branches'
    : isAllBranches && canSelectAllBranches
      ? 'All branches'
      : activeCenter
        ? formatCenterLabel(activeCenter)
        : 'Current branch view'

  const branchPerfData = useMemo(() => {
    const ranked = [...centerAnalytics].sort((a, b) => b.avg - a.avg)
    const networkAvg =
      ranked.length > 0
        ? Math.round(ranked.reduce((sum, c) => sum + c.avg, 0) / ranked.length)
        : 0
    return ranked.map((c, index) => {
      const delta = c.avg - networkAvg
      return {
        rank: index + 1,
        id: c.id,
        name: c.name.length > 18 ? `${c.name.slice(0, 16)}…` : c.name,
        fullName: c.name,
        city: c.city || '',
        health: c.avg,
        students: c.students,
        growth: c.growth,
        retention: c.retention,
        readiness: c.nps,
        mastery: c.topicMastery ?? 0,
        vsNetwork: delta,
        fill:
          c.avg >= 80 ? CHART.leaf : c.avg >= 65 ? CHART.ink : c.avg >= 50 ? CHART.gold : CHART.rose,
      }
    })
  }, [centerAnalytics])

  const networkBranchAvg = useMemo(() => {
    if (branchPerfData.length === 0) return 0
    return Math.round(branchPerfData.reduce((sum, b) => sum + b.health, 0) / branchPerfData.length)
  }, [branchPerfData])

  const branchLeader = branchPerfData[0]
  const branchTrail = branchPerfData.length > 1 ? branchPerfData[branchPerfData.length - 1] : null
  const branchSpread =
    branchLeader && branchTrail ? branchLeader.health - branchTrail.health : 0

  const studentActivityPie = useMemo(() => {
    const active = ops?.activeStudents ?? 0
    const inactive = ops?.inactiveStudents ?? 0
    return [
      { name: 'Active', value: active, fill: CHART.leaf },
      { name: 'Inactive', value: inactive, fill: CHART.rose },
    ].filter((d) => d.value > 0)
  }, [ops])

  const studentActiveRate = useMemo(() => {
    const total = (ops?.activeStudents ?? 0) + (ops?.inactiveStudents ?? 0)
    if (!total) return 0
    return Math.round((100 * (ops?.activeStudents ?? 0)) / total)
  }, [ops])

  const branchActivityRows = useMemo(
    () =>
      [...centerAnalytics]
        .map((c) => ({
          id: c.id,
          name: c.name,
          students: c.students,
          activePct: c.retention,
          fill:
            c.retention >= 85
              ? CHART.leaf
              : c.retention >= 70
                ? CHART.ink
                : c.retention >= 55
                  ? CHART.gold
                  : CHART.rose,
        }))
        .sort((a, b) => b.activePct - a.activePct),
    [centerAnalytics],
  )

  const assessmentPipeline = useMemo(() => {
    if (!ops) return []
    return [
      { stage: 'Scheduled', count: ops.assessmentsScheduled ?? 0, fill: CHART.gold },
      { stage: 'Live', count: ops.assessmentsLive ?? 0, fill: CHART.leaf },
      { stage: 'Completed', count: ops.assessmentsCompleted ?? 0, fill: CHART.ink },
    ]
  }, [ops])

  const subjectBranchChart = useMemo(() => {
    if (!branchSubjectMatrix?.branches?.length || !branchSubjectMatrix.subjects?.length) return []
    return branchSubjectMatrix.branches.map((row) => {
      const short =
        String(row.branch ?? '').length > 12
          ? `${String(row.branch).slice(0, 10)}…`
          : String(row.branch ?? '')
      const point: Record<string, string | number> = {
        branch: short,
        fullBranch: String(row.branch ?? ''),
      }
      for (const subject of branchSubjectMatrix.subjects) {
        const val = row[subject]
        if (typeof val === 'number') point[subject] = val
      }
      return point
    })
  }, [branchSubjectMatrix])

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

  const topBranchRadar = useMemo(() => {
    if (!subjectInsights.ranked.length) return []
    return subjectInsights.ranked.slice(0, 6).map((s) => ({
      subject: s.subject.length > 12 ? `${s.subject.slice(0, 11)}…` : s.subject,
      fullSubject: s.subject,
      health: s.health,
      target: 70,
      fullMark: 100,
    }))
  }, [subjectInsights])

  const subjectHeatRows = useMemo(() => {
    if (!branchSubjectMatrix?.branches?.length || !branchSubjectMatrix.subjects?.length) return []
    return branchSubjectMatrix.branches.map((row) => ({
      branch: String(row.branch ?? ''),
      cells: branchSubjectMatrix.subjects.map((subject) => {
        const raw = row[subject]
        const health = typeof raw === 'number' ? raw : null
        return {
          subject,
          health,
          fill:
            health == null
              ? 'transparent'
              : health >= 80
                ? 'bg-leaf/25 text-leaf'
                : health >= 65
                  ? 'bg-ink/10 text-foreground'
                  : health >= 50
                    ? 'bg-accent/20 text-foreground'
                    : 'bg-rose/15 text-rose',
        }
      }),
    }))
  }, [branchSubjectMatrix])

  const branchHealthRows = useMemo(() => {
    return [...centerAnalytics]
      .map((c) => {
        const performance = c.avg
        const engagement = c.retention
        const mastery = c.topicMastery ?? c.avg
        const readiness = c.nps
        const health = Math.round(
          performance * 0.4 + engagement * 0.2 + mastery * 0.2 + readiness * 0.2,
        )
        const status =
          health >= 80 ? 'healthy' : health >= 60 ? 'watch' : 'critical'
        return {
          id: c.id,
          name: c.name,
          students: c.students,
          batches: c.batchCount ?? 0,
          activePct: engagement,
          health,
          growth: c.growth,
          status,
        }
      })
      .sort((a, b) => b.health - a.health)
  }, [centerAnalytics])

  const branchHealthSummary = useMemo(() => {
    const healthy = branchHealthRows.filter((b) => b.status === 'healthy').length
    const watch = branchHealthRows.filter((b) => b.status === 'watch').length
    const critical = branchHealthRows.filter((b) => b.status === 'critical').length
    const totalStudents = branchHealthRows.reduce((sum, b) => sum + b.students, 0)
    const avgGrowth =
      branchHealthRows.length > 0
        ? Math.round(
            branchHealthRows.reduce((sum, b) => sum + b.growth, 0) / branchHealthRows.length,
          )
        : 0
    const top = branchHealthRows[0] ?? null
    const weak =
      branchHealthRows.length > 1
        ? branchHealthRows[branchHealthRows.length - 1]
        : branchHealthRows[0] ?? null
    const staffGrowth =
      teachers.length > 0
        ? Math.round(teachers.reduce((sum, t) => sum + (t.growth ?? 0), 0) / teachers.length)
        : null
    const assessmentCompletion =
      ops?.assessmentsTotal && ops.assessmentsTotal > 0
        ? Math.round((100 * (ops.assessmentsCompleted ?? 0)) / ops.assessmentsTotal)
        : null
    return {
      healthy,
      watch,
      critical,
      totalStudents,
      avgGrowth,
      top,
      weak,
      staffGrowth,
      assessmentCompletion,
      curriculumProgress:
        ops?.curriculumProgress != null ? Math.round(ops.curriculumProgress) : null,
    }
  }, [branchHealthRows, teachers, ops])

  const staffLeaderboard = useMemo(() => {
    return [...teachers]
      .map((row) => ({
        ...row,
        score: Math.round(row.growth * 0.4 + row.improved * 0.35 + row.readiness * 0.25),
      }))
      .sort(
        (a, b) =>
          b.growth - a.growth || b.improved - a.improved || b.students - a.students || b.score - a.score,
      )
      .map((row, index) => ({ ...row, rank: index + 1 }))
  }, [teachers])

  const staffLeaderboardSummary = useMemo(() => {
    if (staffLeaderboard.length === 0) {
      return { avgGrowth: 0, avgImproved: 0, totalStudents: 0, leader: null as (typeof staffLeaderboard)[0] | null }
    }
    const avgGrowth = Math.round(
      staffLeaderboard.reduce((sum, row) => sum + row.growth, 0) / staffLeaderboard.length,
    )
    const avgImproved = Math.round(
      staffLeaderboard.reduce((sum, row) => sum + row.improved, 0) / staffLeaderboard.length,
    )
    const totalStudents = staffLeaderboard.reduce((sum, row) => sum + row.students, 0)
    return { avgGrowth, avgImproved, totalStudents, leader: staffLeaderboard[0] }
  }, [staffLeaderboard])

  const staffLeaderboardPages = pageCount(staffLeaderboard.length, staffLimit)
  const staffLeaderboardRows = paginateItems(staffLeaderboard, staffPage, staffLimit)

  useEffect(() => {
    if (staffPage > staffLeaderboardPages) setStaffPage(staffLeaderboardPages)
  }, [staffPage, staffLeaderboardPages])

  if (loading && !inst) {
    return <PageLoader />
  }

  if (!inst) {
    return (
      <>
        <PageHeader title="Institute overview" sub="No institution data available yet." />
        <AppCard>
          <p className="text-sm text-muted-foreground">Connect to the API to load analytics.</p>
        </AppCard>
      </>
    )
  }

  const studentTotal = ops?.totalStudents ?? inst.totalStudents
  const studentActive = ops?.activeStudents ?? studentTotal
  const studentInactive = ops?.inactiveStudents ?? 0
  const staffTotal = ops?.totalStaff ?? inst.tutorCount
  const tutorCount = ops?.tutorCount ?? inst.tutorCount
  const activeStaff = ops?.activeStaff ?? 0
  const branchCount = branchScopedAdminPortal ? centers.length : ops?.totalCenters ?? centers.length
  const healthTone =
    inst.avgHealth >= 75 ? CHART.leaf : inst.avgHealth >= 55 ? CHART.gold : CHART.rose
  const growthNegative = inst.avgImprovement < 0
  const atRiskCount = atRisk.length
  const healthR = 34
  const healthCircumference = 2 * Math.PI * healthR
  const healthOffset =
    healthCircumference - (Math.min(100, Math.max(0, inst.avgHealth)) / 100) * healthCircumference
  const pulseSignals = [
    {
      label: 'Readiness',
      value: `${inst.avgReadiness}%`,
      tone: inst.avgReadiness >= 70 ? CHART.leaf : inst.avgReadiness >= 50 ? CHART.gold : CHART.rose,
    },
    {
      label: 'Growth',
      value: `${inst.avgImprovement >= 0 ? '+' : ''}${inst.avgImprovement}%`,
      tone: growthNegative ? CHART.rose : CHART.leaf,
    },
    {
      label: 'Active',
      value: `${studentActiveRate}%`,
      tone: studentActiveRate >= 70 ? CHART.leaf : studentActiveRate >= 45 ? CHART.gold : CHART.rose,
    },
    {
      label: 'Improving',
      value: `${inst.retention}%`,
      tone: CHART.ink,
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow={`${portalLabel} · ${inst.institution.name}`}
        title="Command dashboard"
        sub={
          branchScopedAdminPortal
            ? adminMeta.branchDefaultSubtitle
            : 'Live pulse across people, branches, assessments, and subject performance'
        }
      />

      {/* Hero pulse — compact strip */}
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
                  {inst.avgHealth}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-paper/45">health</span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.14em] text-paper/50 font-semibold">
                Pulse · {studentScopeHint}
              </p>
              <p className="font-display text-base sm:text-lg text-paper leading-snug truncate">
                {inst.avgHealth >= 75
                  ? 'Performing strongly'
                  : inst.avgHealth >= 55
                    ? 'Holding steady'
                    : 'Needs focus'}
                <span className="text-paper/45 font-sans text-sm font-normal">
                  {' '}
                  · {studentActive.toLocaleString()} active · {branchCount}{' '}
                  {branchCount === 1 ? 'branch' : 'branches'}
                </span>
              </p>
              {(growthNegative || atRiskCount > 0) && (
                <p className="inline-flex items-center gap-1 text-[11px] text-rose mt-0.5">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {growthNegative && `Growth ${inst.avgImprovement}%`}
                  {growthNegative && atRiskCount > 0 && ' · '}
                  {atRiskCount > 0 && `${atRiskCount} at risk`}
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
            {(ops?.assessmentsLive ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1.5 text-leaf font-medium">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-leaf" />
                </span>
                {ops?.assessmentsLive} live
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-accent" />
              {ops?.assessmentsScheduled ?? 0} queued
            </span>
            <span className="inline-flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-paper/45" />
              {activeStaff}/{tutorCount} staff
            </span>
            <Link
              to="/admin/manage/students"
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-medium bg-accent text-accent-foreground"
            >
              Students <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <MetricTile
          label="Students"
          value={studentTotal.toLocaleString()}
          hint={`${studentActive} active · ${studentInactive} inactive`}
          icon={GraduationCap}
          tone="leaf"
        />
        <MetricTile
          label="Staff"
          value={staffTotal.toLocaleString()}
          hint={`${tutorCount} tutors · ${ops?.adminCount ?? 0} admins · ${activeStaff} running exams`}
          icon={UserCheck}
          tone="accent"
        />
        <MetricTile
          label="Branches"
          value={branchCount.toLocaleString()}
          hint={studentScopeHint}
          icon={Building2}
        />
        <MetricTile
          label="Assessments"
          value={(ops?.assessmentsTotal ?? 0).toLocaleString()}
          hint={`${ops?.assessmentsLive ?? 0} live · ${ops?.assessmentsScheduled ?? 0} queued · ${ops?.assessmentsCompleted ?? 0} done`}
          icon={ClipboardList}
          tone={(ops?.assessmentsLive ?? 0) > 0 ? 'leaf' : 'default'}
        />
      </div>

      {/* Leaderboard + student activity (second row); branch spans below */}
      <div className="grid lg:grid-cols-5 gap-4 mb-6">
        <AppCard className="order-1 lg:col-span-3">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                Staff leaderboard
              </p>
              <h3 className="font-display text-xl text-foreground mt-1">Who is moving students forward</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Ranked by score growth, then share of students improving
              </p>
            </div>
            <Link to="/admin/manage/staff" className="text-xs text-accent hover:underline shrink-0">
              Staff →
            </Link>
          </div>

          {staffLeaderboard.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Staff progress appears here after assessments are marked.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-xl border border-leaf/25 bg-leaf/8 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Leading</p>
                  <p className="font-medium text-sm truncate mt-0.5" title={staffLeaderboardSummary.leader?.name}>
                    {staffLeaderboardSummary.leader?.name}
                  </p>
                  <p className="font-mono-data text-xs text-leaf">
                    {staffLeaderboardSummary.leader && staffLeaderboardSummary.leader.growth > 0 ? '+' : ''}
                    {staffLeaderboardSummary.leader?.growth}% growth
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg growth</p>
                  <p className="font-display text-xl tabular-nums mt-0.5">
                    {staffLeaderboardSummary.avgGrowth > 0 ? '+' : ''}
                    {staffLeaderboardSummary.avgGrowth}%
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Students taught</p>
                  <p className="font-display text-xl tabular-nums mt-0.5">
                    {staffLeaderboardSummary.totalStudents}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {staffLeaderboardSummary.avgImproved}% improving
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm min-w-[560px]">
                  <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="text-left font-medium pb-2 pr-2 w-12">Rank</th>
                      <th className="text-left font-medium pb-2 pr-2">Staff</th>
                      <th className="text-left font-medium pb-2 pr-2">Focus</th>
                      <th className="text-right font-medium pb-2 pr-2">Students</th>
                      <th className="text-right font-medium pb-2 pr-2">Improved</th>
                      <th className="text-right font-medium pb-2 pr-2">Growth</th>
                      <th className="text-right font-medium pb-2">Readiness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffLeaderboardRows.map((row) => (
                      <tr key={row.id} className="border-t border-border/80">
                        <td className="py-2.5 pr-2">
                          <span
                            className={cn(
                              'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
                              row.rank === 1
                                ? 'bg-accent/25 text-foreground'
                                : row.rank === 2
                                  ? 'bg-secondary text-foreground'
                                  : row.rank === 3
                                    ? 'bg-gold-100 text-foreground'
                                    : 'text-muted-foreground',
                            )}
                          >
                            {row.rank === 1 ? <Trophy className="w-3.5 h-3.5" /> : row.rank}
                          </span>
                        </td>
                        <td className="py-2.5 pr-2 font-medium text-foreground">
                          <p className="truncate max-w-[10rem]">{row.name}</p>
                          {row.email ? (
                            <p className="text-[11px] text-muted-foreground truncate max-w-[10rem]">{row.email}</p>
                          ) : null}
                        </td>
                        <td className="py-2.5 pr-2 text-muted-foreground">{row.subject || '—'}</td>
                        <td className="py-2.5 pr-2 text-right font-mono-data">{row.students}</td>
                        <td className="py-2.5 pr-2 text-right font-mono-data">{row.improved}%</td>
                        <td
                          className={cn(
                            'py-2.5 pr-2 text-right font-mono-data',
                            row.growth >= 0 ? 'text-leaf' : 'text-rose',
                          )}
                        >
                          {row.growth > 0 ? '+' : ''}
                          {row.growth}%
                        </td>
                        <td className="py-2.5 text-right font-mono-data">{row.readiness}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={staffPage}
                pages={staffLeaderboardPages}
                total={staffLeaderboard.length}
                limit={staffLimit}
                onPageChange={setStaffPage}
                onLimitChange={(limit) => {
                  setStaffLimit(limit)
                  setStaffPage(1)
                }}
                limitOptions={STAFF_LEADERBOARD_LIMIT_OPTIONS}
                itemLabel="staff"
              />
            </>
          )}
        </AppCard>

        <AppCard className="order-3 lg:col-span-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                Branch scoreboard
              </p>
              <h3 className="font-display text-xl text-foreground mt-1">How each branch is scoring</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Ranked by average student health · dashed line is network average ({networkBranchAvg}%)
              </p>
            </div>
            <Link to="/admin/manage/centers" className="text-xs text-accent hover:underline shrink-0">
              Branches →
            </Link>
          </div>

          {branchPerfData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">No branch metrics yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Network avg</p>
                  <p className="font-display text-xl tabular-nums mt-0.5">{networkBranchAvg}%</p>
                </div>
                <div className="rounded-xl border border-leaf/25 bg-leaf/8 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Leading</p>
                  <p className="font-medium text-sm truncate mt-0.5" title={branchLeader?.fullName}>
                    {branchLeader?.name}
                  </p>
                  <p className="font-mono-data text-xs text-leaf">{branchLeader?.health}%</p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Spread</p>
                  <p className="font-display text-xl tabular-nums mt-0.5">{branchSpread} pts</p>
                  <p className="text-[10px] text-muted-foreground">best − weakest</p>
                </div>
              </div>

              <div className={cn('mb-4', branchPerfData.length > 4 ? 'h-56' : 'h-44')}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={branchPerfData}
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
                        const row = payload[0].payload as (typeof branchPerfData)[number]
                        return (
                          <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
                            <p className="font-medium text-foreground">
                              #{row.rank} {row.fullName}
                            </p>
                            <p className="text-muted-foreground mt-1">
                              Health {row.health}% · {row.students} students
                            </p>
                            <p className="text-muted-foreground">
                              Growth {row.growth >= 0 ? '+' : ''}
                              {row.growth}% · vs network {row.vsNetwork >= 0 ? '+' : ''}
                              {row.vsNetwork} pts
                            </p>
                          </div>
                        )
                      }}
                    />
                    <ReferenceLine
                      x={networkBranchAvg}
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
                      {branchPerfData.map((entry) => (
                        <Cell key={entry.id} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <ul className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {branchPerfData.map((b) => (
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
                        {b.city ? (
                          <span className="text-[10px] text-muted-foreground">{b.city}</span>
                        ) : null}
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
                        className={cn(
                          'font-medium',
                          b.vsNetwork >= 0 ? 'text-leaf' : 'text-rose',
                        )}
                        title="Vs network average"
                      >
                        {b.vsNetwork >= 0 ? '+' : ''}
                        {b.vsNetwork}
                      </span>
                      <span className="text-muted-foreground">{b.students} stu</span>
                      <span className={cn(b.growth >= 0 ? 'text-leaf' : 'text-rose')}>
                        {b.growth >= 0 ? '+' : ''}
                        {b.growth}% growth
                      </span>
                      <span className="text-muted-foreground">{b.retention}% active</span>
                      <span className="text-muted-foreground">{b.readiness}% ready</span>
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
            Student activity
          </p>
          <h3 className="font-display text-xl text-foreground mt-1">Engagement pulse</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Active rate and branch participation
          </p>
          {studentActivityPie.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">No student activity data.</p>
          ) : (
            <>
              <div className="relative h-40 mb-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={studentActivityPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={70}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {studentActivityPie.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value ?? 0} students`, String(name)]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="font-display text-2xl tabular-nums text-foreground">{studentActiveRate}%</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">active</p>
                </div>
              </div>

              <div className="h-2 rounded-full bg-secondary overflow-hidden flex mb-3">
                <div
                  className="h-full bg-leaf"
                  style={{ width: `${studentActiveRate}%` }}
                  title="Active"
                />
                <div
                  className="h-full bg-rose/70"
                  style={{ width: `${100 - studentActiveRate}%` }}
                  title="Inactive"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                <div className="rounded-xl border border-leaf/25 bg-leaf/8 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Active</p>
                  <p className="font-mono-data text-lg text-leaf">{ops?.activeStudents ?? 0}</p>
                </div>
                <div className="rounded-xl border border-rose/20 bg-rose/8 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Inactive</p>
                  <p className="font-mono-data text-lg text-rose">{ops?.inactiveStudents ?? 0}</p>
                </div>
              </div>

              {(ops?.cscDueSoon || ops?.cscNeverVisited) ? (
                <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2 mb-3 text-xs text-muted-foreground space-y-1">
                  {ops.cscDueSoon > 0 && (
                    <p>
                      <span className="font-medium text-foreground">{ops.cscDueSoon}</span> CSC visits due soon
                    </p>
                  )}
                  {ops.cscNeverVisited > 0 && (
                    <p>
                      <span className="font-medium text-foreground">{ops.cscNeverVisited}</span> never visited CSC
                    </p>
                  )}
                </div>
              ) : null}

              {branchActivityRows.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                    Active % by branch
                  </p>
                  <ul className="space-y-2 max-h-36 overflow-y-auto scrollbar-thin pr-1">
                    {branchActivityRows.map((row) => (
                      <li key={row.id}>
                        <div className="flex items-center justify-between gap-2 text-xs mb-1">
                          <span className="truncate font-medium text-foreground">{row.name}</span>
                          <span className="tabular-nums text-muted-foreground shrink-0">
                            {row.activePct}% · {row.students}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, row.activePct)}%`,
                              background: row.fill,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </AppCard>
      </div>

      <AppCard className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Radio className="w-4 h-4 text-leaf" />
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
            Assessment pipeline
          </p>
        </div>
        <h3 className="font-display text-xl text-foreground mb-4">How exams are moving</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={assessmentPipeline} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" allowDecimals={false} fontSize={11} />
              <YAxis type="category" dataKey="stage" width={80} fontSize={12} tickLine={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {assessmentPipeline.map((entry) => (
                  <Cell key={entry.stage} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <Link
          to="/admin/assessments"
          className="text-xs text-accent hover:underline inline-flex items-center gap-1 mt-2"
        >
          Open assessment console <ArrowRight className="w-3 h-3" />
        </Link>
      </AppCard>

      {/* Subject × branch charts */}
      <div className="grid lg:grid-cols-5 gap-4 mb-6">
        <AppCard className="lg:col-span-3">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                Subject × branch
              </p>
              <h3 className="font-display text-xl text-foreground mt-1">
                Subject health across branches
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Grouped bars compare the same subjects side-by-side · heatmap below for exact %
              </p>
            </div>
          </div>
          {subjectBranchChart.length === 0 || !branchSubjectMatrix?.subjects?.length ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              Upload assessments to unlock branch–subject trends.
            </p>
          ) : (
            <>
              <div className="h-72 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectBranchChart} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="branch" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 100]} fontSize={11} width={32} tickLine={false} unit="%" />
                    <Tooltip
                      labelFormatter={(_, payload) =>
                        String(
                          (payload?.[0]?.payload as { fullBranch?: string } | undefined)?.fullBranch ??
                            '',
                        )
                      }
                      formatter={(value, name) => [`${value ?? 0}%`, String(name)]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine y={70} stroke={CHART.slate} strokeDasharray="4 4" />
                    {branchSubjectMatrix.subjects.map((subject, i) => (
                      <Bar
                        key={subject}
                        dataKey={subject}
                        name={subject}
                        fill={SUBJECT_LINE_COLORS[i % SUBJECT_LINE_COLORS.length]}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-secondary/40 text-left text-muted-foreground">
                      <th className="px-3 py-2 font-medium sticky left-0 bg-secondary/40">Branch</th>
                      {branchSubjectMatrix.subjects.map((subject) => (
                        <th key={subject} className="px-2 py-2 font-medium whitespace-nowrap">
                          {subject.length > 14 ? `${subject.slice(0, 12)}…` : subject}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subjectHeatRows.map((row) => (
                      <tr key={row.branch} className="border-t border-border">
                        <td className="px-3 py-2 font-medium text-foreground sticky left-0 bg-card whitespace-nowrap">
                          {row.branch}
                        </td>
                        {row.cells.map((cell) => (
                          <td key={cell.subject} className="px-2 py-1.5 text-center">
                            {cell.health == null ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <span
                                className={cn(
                                  'inline-flex min-w-[2.5rem] justify-center rounded-md px-1.5 py-0.5 font-mono-data tabular-nums',
                                  cell.fill,
                                )}
                              >
                                {cell.health}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </AppCard>

        <AppCard className="lg:col-span-2">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
            Subject radar
          </p>
          <h3 className="font-display text-xl text-foreground mt-1">Org-wide balance</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-2">
            Shape of subject strength · target ring at 70%
          </p>
          {topBranchRadar.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">No subject health yet.</p>
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
                  <RadarChart data={topBranchRadar} outerRadius="70%">
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
                          (payload?.[0]?.payload as { fullSubject?: string } | undefined)
                            ?.fullSubject ?? label,
                        )
                      }
                    />
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

      {/* Branch health & growth + insights */}
      <div className="grid lg:grid-cols-5 gap-4 mb-6">
        <AppCard className="lg:col-span-3 relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-70"
            style={{
              background:
                'radial-gradient(ellipse 80% 100% at 10% -20%, rgba(201,162,39,0.12), transparent 55%)',
            }}
            aria-hidden
          />
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-1">
                  Branch health &amp; growth
                </p>
                <h3 className="font-display text-xl text-foreground">Operational snapshot</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Students, batches, and health across branches for the selected year.
                </p>
              </div>
              {activeYear?.name && (
                <span className="rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-xs font-medium text-foreground tabular-nums">
                  {activeYear.name}
                </span>
              )}
            </div>

            {branchHealthRows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">No branch metrics yet.</p>
            ) : (
              <>
                <div className="overflow-x-auto -mx-1 px-1">
                  <table className="w-full min-w-[36rem] text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                        <th className="pb-2 pr-3 font-semibold">Branch</th>
                        <th className="pb-2 pr-3 font-semibold text-right">Students</th>
                        <th className="pb-2 pr-3 font-semibold text-right">Batches</th>
                        <th className="pb-2 pr-3 font-semibold text-right">Active</th>
                        <th className="pb-2 font-semibold text-right">Health</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchHealthRows.map((row) => (
                        <tr key={row.id} className="border-b border-border/60 last:border-0">
                          <td className="py-2.5 pr-3 font-medium text-foreground truncate max-w-[12rem]">
                            {row.name}
                          </td>
                          <td className="py-2.5 pr-3 text-right font-mono-data tabular-nums">
                            {row.students}
                          </td>
                          <td className="py-2.5 pr-3 text-right font-mono-data tabular-nums">
                            {row.batches}
                          </td>
                          <td className="py-2.5 pr-3 text-right font-mono-data tabular-nums">
                            {row.activePct}%
                          </td>
                          <td className="py-2.5 text-right">
                            <span className="inline-flex items-center justify-end gap-1.5 font-mono-data tabular-nums">
                              {row.health}%
                              <span
                                className={cn(
                                  'w-2 h-2 rounded-full shrink-0',
                                  row.status === 'healthy' && 'bg-leaf',
                                  row.status === 'watch' && 'bg-amber-500',
                                  row.status === 'critical' && 'bg-rose',
                                )}
                                aria-label={row.status}
                              />
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                      Student growth
                    </p>
                    <p className="text-sm text-foreground">
                      <span className="font-mono-data tabular-nums font-medium">
                        {branchHealthSummary.totalStudents} students
                      </span>
                      <span
                        className={cn(
                          'ml-2 font-mono-data tabular-nums text-xs',
                          branchHealthSummary.avgGrowth > 0
                            ? 'text-leaf'
                            : branchHealthSummary.avgGrowth < 0
                              ? 'text-rose'
                              : 'text-muted-foreground',
                        )}
                      >
                        {branchHealthSummary.avgGrowth > 0 ? '↑' : branchHealthSummary.avgGrowth < 0 ? '↓' : '→'}{' '}
                        {Math.abs(branchHealthSummary.avgGrowth)}% vs previous year
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-leaf" />
                      {branchHealthSummary.healthy} Healthy
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {branchHealthSummary.watch} Needs attention
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose" />
                      {branchHealthSummary.critical} Critical
                    </span>
                    <Link
                      to="/admin/manage/centers"
                      className="ml-auto text-accent hover:underline inline-flex items-center gap-1"
                    >
                      View branch details <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </AppCard>

        <AppCard className="lg:col-span-2 relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-70"
            style={{
              background:
                'radial-gradient(ellipse 80% 100% at 90% -20%, rgba(201,162,39,0.1), transparent 55%)',
            }}
            aria-hidden
          />
          <div className="relative">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-1">
              Branch insights
            </p>
            <h3 className="font-display text-xl text-foreground mb-4">Highlights</h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl border border-leaf/25 bg-leaf/8 px-3 py-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Top performing
                </p>
                {branchHealthSummary.top ? (
                  <>
                    <p className="text-sm font-medium text-foreground truncate" title={branchHealthSummary.top.name}>
                      {branchHealthSummary.top.name}
                    </p>
                    <p className="font-mono-data text-lg tabular-nums text-leaf mt-0.5">
                      {branchHealthSummary.top.health}%
                    </p>
                    <p
                      className={cn(
                        'text-xs font-mono-data tabular-nums mt-0.5',
                        branchHealthSummary.top.growth >= 0 ? 'text-leaf' : 'text-rose',
                      )}
                    >
                      {branchHealthSummary.top.growth >= 0 ? '↑' : '↓'}{' '}
                      {Math.abs(branchHealthSummary.top.growth)}%
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
              <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 px-3 py-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Needs attention
                </p>
                {branchHealthSummary.weak ? (
                  <>
                    <p className="text-sm font-medium text-foreground truncate" title={branchHealthSummary.weak.name}>
                      {branchHealthSummary.weak.name}
                    </p>
                    <p className="font-mono-data text-lg tabular-nums text-amber-800 mt-0.5">
                      {branchHealthSummary.weak.health}%
                    </p>
                    <p
                      className={cn(
                        'text-xs font-mono-data tabular-nums mt-0.5',
                        branchHealthSummary.weak.growth >= 0 ? 'text-leaf' : 'text-rose',
                      )}
                    >
                      {branchHealthSummary.weak.growth >= 0 ? '↑' : '↓'}{' '}
                      {Math.abs(branchHealthSummary.weak.growth)}%
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-secondary/30 px-3 py-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Student growth
                </p>
                <p
                  className={cn(
                    'font-mono-data text-lg tabular-nums',
                    branchHealthSummary.avgGrowth >= 0 ? 'text-leaf' : 'text-rose',
                  )}
                >
                  {branchHealthSummary.avgGrowth >= 0 ? '+' : ''}
                  {branchHealthSummary.avgGrowth}%
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">this year</p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/30 px-3 py-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Staff growth
                </p>
                {branchHealthSummary.staffGrowth != null ? (
                  <>
                    <p
                      className={cn(
                        'font-mono-data text-lg tabular-nums',
                        branchHealthSummary.staffGrowth >= 0 ? 'text-leaf' : 'text-rose',
                      )}
                    >
                      {branchHealthSummary.staffGrowth >= 0 ? '+' : ''}
                      {branchHealthSummary.staffGrowth}%
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">this year</p>
                  </>
                ) : (
                  <>
                    <p className="font-mono-data text-lg tabular-nums text-foreground">
                      {(ops?.totalStaff ?? ops?.tutorCount ?? 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">staff in scope</p>
                  </>
                )}
              </div>
              <div className="rounded-xl border border-border bg-secondary/30 px-3 py-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Curriculum
                </p>
                <p className="font-mono-data text-lg tabular-nums text-foreground">
                  {branchHealthSummary.curriculumProgress != null
                    ? `${branchHealthSummary.curriculumProgress}%`
                    : '—'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">completed</p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/30 px-3 py-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Assessment
                </p>
                <p className="font-mono-data text-lg tabular-nums text-foreground">
                  {branchHealthSummary.assessmentCompletion != null
                    ? `${branchHealthSummary.assessmentCompletion}%`
                    : '—'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">completed</p>
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      {/* Ops alerts + insights */}
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
                  <Link to="/admin/assessments" className="text-accent hover:underline">
                    Review now →
                  </Link>
                </p>
              )}
            </div>
          </div>
        </AppCard>
      )}

      {(classInsights.length > 0 || atRisk.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {classInsights.length > 0 && (
            <AppCard>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="font-display text-lg">Batch insights</h3>
              </div>
              <div className="space-y-2">
                {classInsights.slice(0, 3).map((insight) => (
                  <div key={insight.id} className="p-3 rounded-xl bg-secondary/40 border border-border">
                    <p className="text-sm font-medium">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                  </div>
                ))}
              </div>
            </AppCard>
          )}
          {atRisk.length > 0 && (
            <AppCard>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose" />
                  <h3 className="font-display text-lg">At-risk students</h3>
                </div>
                <Link to="/admin/reports" className="text-xs text-accent hover:underline">
                  Reports
                </Link>
              </div>
              <div className="space-y-2">
                {atRisk.slice(0, 5).map((s) => (
                  <div
                    key={s.name}
                    className="flex justify-between p-2.5 rounded-xl bg-rose/5 border border-rose/15 text-sm"
                  >
                    <span>{s.name}</span>
                    <span className="font-mono-data text-rose">{s.risk}</span>
                  </div>
                ))}
              </div>
            </AppCard>
          )}
        </div>
      )}

      {/* Quick links */}
      <AppCard>
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-3">
          Jump to
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1">
          {(branchScopedAdminPortal
            ? [
                { to: '/admin/manage/students', icon: Users, label: 'Student management' },
                { to: '/admin/manage/staff', icon: Users, label: 'Staff' },
                { to: '/admin/reports', icon: BarChart3, label: 'Learning Genome reports' },
                { to: '/admin/curriculum', icon: Network, label: 'Curriculum setup' },
                { to: '/admin/question-bank', icon: Database, label: 'Question bank' },
                { to: '/admin/assessments', icon: ClipboardList, label: 'Assessments' },
              ]
            : [
                { to: '/admin/manage', icon: Users, label: 'Manage students, staff & branches' },
                { to: '/admin/reports', icon: BarChart3, label: 'Learning Genome reports' },
                { to: '/admin/curriculum', icon: Network, label: 'Curriculum setup' },
                { to: '/admin/question-bank', icon: Database, label: 'Question bank' },
                { to: '/admin/assessments', icon: ClipboardList, label: 'Assessments' },
                { to: '/admin/settings', icon: ShieldCheck, label: 'Organization settings' },
              ]
          ).map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary transition-colors"
            >
              <Icon className="w-4 h-4 text-accent" />
              <span className="text-sm flex-1">{label}</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </AppCard>
    </>
  )
}
