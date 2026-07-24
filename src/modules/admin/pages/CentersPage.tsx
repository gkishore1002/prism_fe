import { useState } from 'react'
import { PageLoader } from '@/components/ui/PrismLoader'
import { MapPin, Plus } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { AnalyticsInsightsCard } from '@/components/ui/AnalyticsInsightsCard'
import { centerInsightBullets } from '@/lib/analyticsInsights'
import { formatCenterLabel } from '@/lib/centerLabel'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { useCenters } from '@/hooks/useCenters'
import { createCenter } from '@/lib/api/institutionsApi'

export function AdminCentersPage() {
  useAnalyticsPage('adminCenters')
  const { loading, centerAnalytics, refresh } = useAnalytics()
  const { refresh: refreshCenters } = useCenters({ enabled: false })
  const [selected, setSelected] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [centerName, setCenterName] = useState('')
  const [centerCity, setCenterCity] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleCreateCenter(e: React.FormEvent) {
    e.preventDefault()
    if (!centerName.trim() || !centerCity.trim()) return
    setCreating(true)
    try {
      await createCenter(centerName.trim(), centerCity.trim())
      setCenterName('')
      setCenterCity('')
      setShowForm(false)
      await refresh('adminCenters')
      await refreshCenters()
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <PageLoader />
  }

  if (centerAnalytics.length === 0) {
    return (
      <>
        <PageHeader
          title="Multi-center performance"
          sub="Add your first center to start tracking branch analytics."
        />
        <AppCard>
          <form onSubmit={(e) => void handleCreateCenter(e)} className="grid sm:grid-cols-3 gap-4 items-end">
            <label className="block sm:col-span-1">
              <span className="text-xs text-muted-foreground">Center name</span>
              <input
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
                required
                placeholder="e.g. Koramangala"
                className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
              />
            </label>
            <label className="block sm:col-span-1">
              <span className="text-xs text-muted-foreground">City</span>
              <input
                value={centerCity}
                onChange={(e) => setCenterCity(e.target.value)}
                required
                placeholder="e.g. Bengaluru"
                className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
              />
            </label>
            <button
              type="submit"
              disabled={creating}
              className="bg-ink text-paper px-4 py-2 rounded-md text-sm font-medium disabled:opacity-60"
            >
              {creating ? 'Creating…' : 'Create first center'}
            </button>
          </form>
        </AppCard>
      </>
    )
  }

  const selectedId = selected || centerAnalytics[0].id
  const center = centerAnalytics.find((c) => c.id === selectedId) ?? centerAnalytics[0]
  const chartData = centerAnalytics.map((c) => ({
    ...c,
    label: formatCenterLabel(c),
  }))
  const radarData = [
    { metric: 'Avg score', value: center.avg },
    { metric: 'Retention', value: center.retention },
    { metric: 'NPS', value: center.nps + 40 },
    { metric: 'Growth', value: center.growth * 5 },
    { metric: 'Syllabus', value: 70 + (center.avg - 65) },
  ]

  return (
    <>
      <PageHeader
        eyebrow={`Network · ${centerAnalytics.length} centers`}
        title="Multi-center performance"
        sub="Compare every center on the same scorecard. Drill in to see where each one wins or struggles."
        actions={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Add center
          </button>
        }
      />

      {showForm && (
        <AppCard className="mb-6">
          <form onSubmit={(e) => void handleCreateCenter(e)} className="grid sm:grid-cols-3 gap-4 items-end">
            <label className="block sm:col-span-1">
              <span className="text-xs text-muted-foreground">Center name</span>
              <input
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
                required
                className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
              />
            </label>
            <label className="block sm:col-span-1">
              <span className="text-xs text-muted-foreground">City</span>
              <input
                value={centerCity}
                onChange={(e) => setCenterCity(e.target.value)}
                required
                className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
              />
            </label>
            <button
              type="submit"
              disabled={creating}
              className="bg-ink text-paper px-4 py-2 rounded-md text-sm font-medium disabled:opacity-60"
            >
              {creating ? 'Creating…' : 'Create center'}
            </button>
          </form>
        </AppCard>
      )}

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <AppStat label="Total centers" value={centerAnalytics.length} />
        <AppStat
          label="Network students"
          value={centerAnalytics.reduce((a, c) => a + c.students, 0).toLocaleString()}
          tone="accent"
        />
        <AppStat
          label="Network avg"
          value={Math.round(centerAnalytics.reduce((a, c) => a + c.avg, 0) / centerAnalytics.length)}
          unit="%"
          tone="leaf"
        />
        <AppStat
          label="Best center"
          value={centerAnalytics.reduce((best, c) => (c.avg > best.avg ? c : best), centerAnalytics[0]).name}
        />
      </div>

      <AppCard className="mb-6">
        <div className="font-display text-2xl mb-4">Center comparison · average score</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" fontSize={11} interval={0} angle={-12} textAnchor="end" height={56} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="avg" fill="var(--color-ink)" name="Avg score" radius={[4, 4, 0, 0]} />
              <Bar dataKey="retention" fill="var(--color-leaf)" name="Retention" radius={[4, 4, 0, 0]} />
              <Bar dataKey="nps" fill="var(--color-accent)" name="NPS" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AppCard>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <AppCard>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">
            Select a center
          </div>
          <div className="space-y-1.5">
            {centerAnalytics.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(c.id)}
                className={`w-full text-left px-3 py-2.5 rounded-md text-sm flex items-center gap-2 transition ${
                  selectedId === c.id ? 'bg-ink text-paper' : 'hover:bg-secondary'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1 truncate">{formatCenterLabel(c)}</span>
                <span className="font-mono-data text-xs opacity-70">{c.students}</span>
              </button>
            ))}
          </div>
        </AppCard>

        <AppCard className="md:col-span-2">
          <div className="flex items-baseline justify-between mb-3">
            <div className="font-display text-2xl">{formatCenterLabel(center)}</div>
            <span className="text-xs text-muted-foreground">5-metric scorecard</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" fontSize={11} />
                <PolarRadiusAxis fontSize={10} angle={90} domain={[0, 100]} />
                <Radar
                  dataKey="value"
                  stroke="var(--color-accent)"
                  fill="var(--color-accent)"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </AppCard>
      </div>

      <AnalyticsInsightsCard
        title="Center insights"
        bullets={centerInsightBullets(centerAnalytics)}
      />
    </>
  )
}