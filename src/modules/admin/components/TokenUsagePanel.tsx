import { useEffect, useMemo, useState } from 'react'
import { Activity, BarChart3 } from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { FormErrorBanner } from '@/components/ui/FormErrorBanner'
import {
  fetchInstitutionUsage,
  fetchInstitutionUsageForDay,
  type InstitutionUsage,
  type UsageByDay,
} from '@/lib/api/usageApi'
import { cn } from '@/lib/cn'

const RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

const SERVICE_LABELS: Record<string, string> = {
  book_outline: 'Book outline',
  topic_map: 'Topic mapping',
  mcq_generation: 'AI MCQ generation',
  report_summary: 'Report summaries',
  assessment_report: 'Assessment reports',
  student_report: 'Student overall reports',
  student_genome: 'Learning Genome narratives',
  other: 'Other',
}

function formatNum(n: number | null | undefined): string {
  if (n == null) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatDayLabel(dateIso: string): string {
  if (!dateIso) return '—'
  const d = new Date(`${dateIso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return dateIso
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
}

function serviceLabel(service: string): string {
  return SERVICE_LABELS[service] ?? service.replace(/_/g, ' ')
}

function Sparkline({ points }: { points: UsageByDay[] }) {
  if (!points.length) {
    return (
      <div className="flex h-16 items-center justify-center text-xs text-muted-foreground">
        No data
      </div>
    )
  }
  const width = 600
  const height = 64
  const max = Math.max(1, ...points.map((p) => p.totalTokens))
  const stepX = points.length > 1 ? width / (points.length - 1) : width
  const path = points
    .map((p, i) => {
      const x = i * stepX
      const y = height - (p.totalTokens / max) * (height - 4) - 2
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  const areaPath = `${path} L${(points.length - 1) * stepX},${height} L0,${height} Z`
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full">
      <path d={areaPath} fill="rgba(13, 27, 42, 0.08)" />
      <path d={path} fill="none" stroke="hsl(var(--accent))" strokeWidth="2" />
    </svg>
  )
}

export function TokenUsagePanel() {
  const [rangeDays, setRangeDays] = useState(30)
  const [data, setData] = useState<InstitutionUsage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState('')
  const [dayServiceData, setDayServiceData] = useState<InstitutionUsage['byService']>([])
  const [dayServiceLoading, setDayServiceLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void fetchInstitutionUsage(rangeDays)
      .then((payload) => {
        if (cancelled) return
        setData(payload)
        const last = payload.byDay[payload.byDay.length - 1]?.date ?? ''
        setSelectedDay(last)
      })
      .catch((err) => {
        if (!cancelled) {
          setData(null)
          setError(err instanceof Error ? err.message : 'Could not load token usage')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [rangeDays])

  useEffect(() => {
    if (!selectedDay) {
      setDayServiceData([])
      return
    }
    let cancelled = false
    setDayServiceLoading(true)
    void fetchInstitutionUsageForDay(selectedDay)
      .then((payload) => {
        if (!cancelled) setDayServiceData(payload.byService)
      })
      .catch(() => {
        if (!cancelled) setDayServiceData([])
      })
      .finally(() => {
        if (!cancelled) setDayServiceLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedDay])

  const maxServiceTokens = useMemo(
    () => Math.max(1, ...(data?.byService.map((s) => s.totalTokens) ?? [1])),
    [data],
  )

  const selectedDayRow = data?.byDay.find((d) => d.date === selectedDay)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            Token usage
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            All Vertex / Gemini tokens for this org — book outline, topic map, MCQs,
            assessment reports, overall reports, and Learning Genome narratives.
          </p>
        </div>
        <div className="inline-flex rounded-md border border-border overflow-hidden">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setRangeDays(r.days)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium',
                rangeDays === r.days
                  ? 'bg-accent/15 text-foreground'
                  : 'bg-background text-muted-foreground hover:bg-secondary',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && <FormErrorBanner message={error} />}

      {loading && !data ? (
        <AppCard className="text-sm text-muted-foreground py-10 text-center">
          Loading usage…
        </AppCard>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total tokens', value: data?.totals.totalTokens ?? 0 },
              { label: 'Prompt tokens', value: data?.totals.promptTokens ?? 0 },
              { label: 'Completion tokens', value: data?.totals.completionTokens ?? 0 },
              { label: 'API calls', value: data?.totals.callCount ?? 0 },
            ].map((kpi) => (
              <AppCard key={kpi.label} className="py-4">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {kpi.label}
                </p>
                <p className="mt-1 font-mono-data text-2xl font-semibold text-foreground">
                  {formatNum(kpi.value)}
                </p>
              </AppCard>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <AppCard>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold text-foreground">By service</h4>
              </div>
              {!data?.byService.length ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No usage in this range.</p>
              ) : (
                <ul className="space-y-3">
                  {data.byService.map((row) => (
                    <li key={row.service}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-foreground">
                          {serviceLabel(row.service)}
                        </span>
                        <span className="font-mono-data text-muted-foreground">
                          {formatNum(row.totalTokens)} · {formatNum(row.callCount)} calls
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-ink/80"
                          style={{
                            width: `${Math.max(4, (row.totalTokens / maxServiceTokens) * 100)}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </AppCard>

            <AppCard>
              <h4 className="text-sm font-semibold text-foreground mb-3">Daily trend</h4>
              <Sparkline points={data?.byDay ?? []} />
              {!data?.byDay.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No daily data yet.</p>
              ) : (
                <ul className="mt-3 max-h-48 overflow-y-auto divide-y divide-border">
                  {[...(data.byDay ?? [])].reverse().map((day) => (
                    <li key={day.date}>
                      <button
                        type="button"
                        onClick={() => setSelectedDay(day.date)}
                        className={cn(
                          'w-full flex items-center justify-between px-1 py-2 text-left text-xs hover:bg-secondary/50',
                          selectedDay === day.date && 'bg-accent/10',
                        )}
                      >
                        <span className="text-foreground">{formatDayLabel(day.date)}</span>
                        <span className="font-mono-data text-muted-foreground">
                          {formatNum(day.totalTokens)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </AppCard>
          </div>

          {selectedDay && (
            <AppCard>
              <h4 className="text-sm font-semibold text-foreground mb-1">
                {formatDayLabel(selectedDay)}
              </h4>
              <p className="text-xs text-muted-foreground mb-4">
                {selectedDayRow
                  ? `${formatNum(selectedDayRow.callCount)} calls · ${formatNum(selectedDayRow.totalTokens)} tokens · ${formatNum(selectedDayRow.promptTokens)} prompt / ${formatNum(selectedDayRow.completionTokens)} completion`
                  : 'No totals for this day'}
              </p>
              {dayServiceLoading ? (
                <p className="text-sm text-muted-foreground">Loading services…</p>
              ) : !dayServiceData.length ? (
                <p className="text-sm text-muted-foreground">No service breakdown for this day.</p>
              ) : (
                <ul className="space-y-2">
                  {dayServiceData.map((row) => (
                    <li
                      key={row.service}
                      className="flex items-center justify-between text-sm border-b border-border last:border-0 py-2"
                    >
                      <span className="text-foreground">{serviceLabel(row.service)}</span>
                      <span className="font-mono-data text-muted-foreground text-xs">
                        {formatNum(row.totalTokens)} · {formatNum(row.callCount)} calls
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </AppCard>
          )}
        </>
      )}
    </div>
  )
}
