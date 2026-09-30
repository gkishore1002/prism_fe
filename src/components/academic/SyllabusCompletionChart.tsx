import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BookMarked } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts'
import { AppCard } from '@/components/layout/AppShell'
import { DashboardSectionLoader } from '@/components/ui/PrismLoader'
import { cn } from '@/lib/cn'

const CHART = {
  ink: '#1C2739',
  gold: '#C9A227',
  leaf: '#0CBF6E',
  rose: '#E85D4C',
  slate: '#64748B',
  sky: '#3B82A0',
  sand: '#D4A574',
}

const SUBJECT_COLORS = [CHART.ink, CHART.gold, CHART.leaf, CHART.sky, CHART.rose, CHART.sand]

function fillFor(value: number) {
  if (value >= 85) return CHART.leaf
  if (value >= 70) return CHART.ink
  if (value >= 55) return CHART.gold
  return CHART.rose
}

export interface SyllabusCompletionChartProps {
  rows: Record<string, number | string>[]
  className?: string
  linkHref?: string
  linkLabel?: string
  loading?: boolean
}

/**
 * Graphical syllabus completion analytics (grade × subject mastery %).
 * Consumes `/analytics/institution/syllabus` rows.
 */
export function SyllabusCompletionChart({
  rows,
  className,
  linkHref,
  linkLabel = 'Curriculum →',
  loading = false,
}: SyllabusCompletionChartProps) {
  const subjectKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const row of rows) {
      for (const [key, value] of Object.entries(row)) {
        if (key === 'board' || key === 'grade') continue
        if (typeof value === 'number') keys.add(key)
      }
    }
    return [...keys].sort((a, b) => a.localeCompare(b))
  }, [rows])

  const chartData = useMemo(() => {
    return rows.map((row) => {
      const board = String(row.board ?? '')
      const grade = String(row.grade ?? '')
      const label = board ? `${grade}` : grade
      const point: Record<string, string | number> = {
        label: label.length > 14 ? `${label.slice(0, 12)}…` : label,
        fullLabel: board ? `${board} · ${grade}` : grade,
        board,
        grade,
      }
      const values: number[] = []
      for (const subject of subjectKeys) {
        const raw = row[subject]
        const n = typeof raw === 'number' ? raw : 0
        point[subject] = n
        values.push(n)
      }
      point.overall =
        values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0
      return point
    })
  }, [rows, subjectKeys])

  const insights = useMemo(() => {
    if (chartData.length === 0 || subjectKeys.length === 0) {
      return { avg: 0, strongest: null as { name: string; value: number } | null, weakest: null as { name: string; value: number } | null }
    }
    const bySubject = subjectKeys.map((subject) => {
      const vals = chartData
        .map((row) => row[subject])
        .filter((v): v is number => typeof v === 'number')
      const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
      return { name: subject, value: avg }
    })
    const ranked = [...bySubject].sort((a, b) => b.value - a.value)
    const overalls = chartData.map((r) => Number(r.overall) || 0)
    const avg = overalls.length
      ? Math.round(overalls.reduce((a, b) => a + b, 0) / overalls.length)
      : 0
    return {
      avg,
      strongest: ranked[0] ?? null,
      weakest: ranked.length > 1 ? ranked[ranked.length - 1] : ranked[0] ?? null,
    }
  }, [chartData, subjectKeys])

  const gradeBars = useMemo(
    () =>
      chartData.map((row) => ({
        ...row,
        fill: fillFor(Number(row.overall) || 0),
      })),
    [chartData],
  )

  return (
    <AppCard className={cn(className)}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <BookMarked className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
              Syllabus completion
            </p>
            <h3 className="font-display text-xl text-foreground mt-1">Topic mastery by grade</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Average mastery across topics · from assessments and marks
            </p>
          </div>
        </div>
        {linkHref ? (
          <Link to={linkHref} className="text-xs text-accent hover:underline shrink-0">
            {linkLabel}
          </Link>
        ) : null}
      </div>

      {loading && (chartData.length === 0 || subjectKeys.length === 0) ? (
        <DashboardSectionLoader label="Loading syllabus analytics…" />
      ) : chartData.length === 0 || subjectKeys.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">
          Add curriculum topics and scored work to unlock syllabus completion.
        </p>
      ) : (
        <>
          <div className="metric-chip-grid mb-4">
            <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2.5 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Overall</p>
              <p className="font-display text-xl tabular-nums mt-0.5">{insights.avg}%</p>
            </div>
            <div className="rounded-xl border border-leaf/25 bg-leaf/8 px-3 py-2.5 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Strongest</p>
              <p className="font-medium text-sm truncate mt-0.5" title={insights.strongest?.name}>
                {insights.strongest?.name ?? '—'}
              </p>
              <p className="font-mono-data text-xs text-leaf">{insights.strongest?.value ?? 0}%</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2.5 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Needs focus</p>
              <p className="font-medium text-sm truncate mt-0.5" title={insights.weakest?.name}>
                {insights.weakest?.name ?? '—'}
              </p>
              <p className="font-mono-data text-xs text-rose">{insights.weakest?.value ?? 0}%</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-5 gap-4">
            <div className={cn('lg:col-span-2', gradeBars.length > 5 ? 'h-64' : 'h-52')}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Overall by grade
              </p>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={gradeBars}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" domain={[0, 100]} fontSize={11} tickLine={false} unit="%" />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={88}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--secondary)', opacity: 0.45 }}
                    formatter={(value) => [`${value ?? 0}%`, 'Overall']}
                    labelFormatter={(_, payload) =>
                      String(
                        (payload?.[0]?.payload as { fullLabel?: string } | undefined)?.fullLabel ??
                          '',
                      )
                    }
                  />
                  <ReferenceLine x={70} stroke={CHART.slate} strokeDasharray="4 4" />
                  <Bar dataKey="overall" name="Overall" radius={[0, 6, 6, 0]} barSize={16}>
                    {gradeBars.map((entry) => (
                      <Cell key={String(entry.fullLabel)} fill={String(entry.fill)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={cn('lg:col-span-3', 'h-64')}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Subjects by grade
              </p>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} fontSize={11} width={32} tickLine={false} unit="%" />
                  <Tooltip
                    labelFormatter={(_, payload) =>
                      String(
                        (payload?.[0]?.payload as { fullLabel?: string } | undefined)?.fullLabel ??
                          '',
                      )
                    }
                    formatter={(value, name) => [`${value ?? 0}%`, String(name)]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={70} stroke={CHART.slate} strokeDasharray="4 4" />
                  {subjectKeys.map((subject, i) => (
                    <Bar
                      key={subject}
                      dataKey={subject}
                      name={subject}
                      fill={SUBJECT_COLORS[i % SUBJECT_COLORS.length]}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </AppCard>
  )
}
