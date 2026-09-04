import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { PageLoader } from '@/components/ui/PrismLoader'
import { ChevronRight, MapPin, Plus, Download } from 'lucide-react'
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
import { useAdminPortalContext } from '@/hooks/useAdminPortalContext'
import { createCenter } from '@/lib/api/institutionsApi'
import { exportCentersCsv } from '@/lib/api/exportsApi'

export function AdminCentersPage({ embedded = false }: { embedded?: boolean }) {
  useAnalyticsPage('adminCenters')
  const { loading, centerAnalytics, refresh } = useAnalytics()
  const { loading: centersLoading, refresh: refreshCenters, canManageTenant, ensureLoaded } = useCenters()
  const { organizationScoped } = useAdminPortalContext()
  const [selected, setSelected] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [centerName, setCenterName] = useState('')
  const [centerCity, setCenterCity] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    void ensureLoaded()
  }, [ensureLoaded])

  async function handleCreateCenter(e: React.FormEvent) {
    e.preventDefault()
    if (!centerName.trim() || !centerCity.trim()) return
    setCreating(true)
    setCreateError(null)
    try {
      await createCenter(centerName.trim(), centerCity.trim())
      setCenterName('')
      setCenterCity('')
      setShowForm(false)
      await refresh('adminCenters')
      await refreshCenters()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create center')
    } finally {
      setCreating(false)
    }
  }

  async function handleExportCenters() {
    setExporting(true)
    try {
      await exportCentersCsv()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  if (centersLoading && centerAnalytics.length === 0) {
    return <PageLoader />
  }

  if (!organizationScoped || !canManageTenant) {
    return <Navigate to={embedded ? '/admin/manage/students' : '/admin'} replace />
  }

  if (loading && centerAnalytics.length === 0) {
    return <PageLoader />
  }

  const branchActions = (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={exporting}
        onClick={() => void handleExportCenters()}
        className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/50"
      >
        <Download className="w-4 h-4" /> {exporting ? 'Exporting…' : 'Export CSV'}
      </button>
      {canManageTenant && (
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Add center
        </button>
      )}
    </div>
  )

  if (centerAnalytics.length === 0) {
    return (
      <>
        {!embedded && (
          <PageHeader
            title="Branches"
            sub="Centers are physical branches under your institution — not separate products."
          />
        )}
        <AppCard>
          {canManageTenant ? (
            <form onSubmit={(e) => void handleCreateCenter(e)} className="grid sm:grid-cols-3 gap-4 items-end">
              <label className="block sm:col-span-1">
                <span className="text-xs text-muted-foreground">Center name</span>
                <input
                  value={centerName}
                  onChange={(e) => setCenterName(e.target.value)}
                  required
                  placeholder="e.g. Andheri (HQ)"
                  className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                />
              </label>
              <label className="block sm:col-span-1">
                <span className="text-xs text-muted-foreground">City</span>
                <input
                  value={centerCity}
                  onChange={(e) => setCenterCity(e.target.value)}
                  required
                  placeholder="e.g. Mumbai"
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
          ) : (
            <p className="text-sm text-muted-foreground">
              No branches yet. Contact your organization owner to create the first center.
            </p>
          )}
          {createError && <p className="text-sm text-rose mt-3">{createError}</p>}
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
    { metric: 'Active students', value: center.retention },
    { metric: 'Readiness', value: center.nps },
    { metric: 'Score growth', value: Math.min(100, Math.max(0, 50 + center.growth)) },
    { metric: 'Topic mastery', value: center.topicMastery ?? 0 },
  ]

  return (
    <>
      {!embedded ? (
        <PageHeader
          eyebrow={`Network · ${centerAnalytics.length} centers`}
          title="Branches"
          sub="Compare branch performance across your institution. Open a center for students, CSC compliance, and settings."
          actions={branchActions}
        />
      ) : (
        <div className="flex flex-wrap justify-end gap-2 mb-4">{branchActions}</div>
      )}

      {showForm && canManageTenant && (
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
          {createError && <p className="text-sm text-rose mt-3">{createError}</p>}
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
              <Bar dataKey="retention" fill="var(--color-leaf)" name="Active %" radius={[4, 4, 0, 0]} />
              <Bar dataKey="nps" fill="var(--color-accent)" name="Readiness" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AppCard>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <AppCard>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">
            Branches
          </div>
          <div className="space-y-1.5">
            {centerAnalytics.map((c) => (
              <div key={c.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelected(c.id)}
                  className={`flex-1 text-left px-3 py-2.5 rounded-md text-sm flex items-center gap-2 transition ${
                    selectedId === c.id ? 'bg-ink text-paper' : 'hover:bg-secondary'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 truncate">{formatCenterLabel(c)}</span>
                  <span className="font-mono-data text-xs opacity-70">{c.students}</span>
                </button>
                <Link
                  to={`/admin/manage/centers/${c.id}`}
                  className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
                  title="View center details"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </AppCard>

        <AppCard className="md:col-span-2">
          <div className="flex items-baseline justify-between mb-3">
            <div className="font-display text-2xl">{formatCenterLabel(center)}</div>
            <Link
              to={`/admin/manage/centers/${center.id}`}
              className="text-xs text-accent hover:underline"
            >
              Open center details →
            </Link>
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
