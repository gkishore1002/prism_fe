import { useEffect, useState } from 'react'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/PrismLoader'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { useTutorDashboard } from '@/hooks/useTutorDashboard'
import { analyticsApi } from '@/lib/api/analyticsApi'
import type { AtRiskStudent } from '@/lib/api/analyticsApi'

export function TutorAtRiskPage({ embedded = false }: { embedded?: boolean }) {
  useAnalyticsPage('tutorAtRisk')
  const { atRisk: bootstrapAtRisk, loading } = useAnalytics()
  const { activeBatchId } = useTutorDashboard()
  const [atRisk, setAtRisk] = useState<AtRiskStudent[]>(bootstrapAtRisk)

  useEffect(() => {
    setAtRisk(bootstrapAtRisk)
  }, [bootstrapAtRisk])

  useEffect(() => {
    if (!activeBatchId) return
    let cancelled = false
    void analyticsApi
      .tutorAtRisk(activeBatchId)
      .then((rows) => {
        if (!cancelled) setAtRisk(rows)
      })
      .catch(() => {
        if (!cancelled) setAtRisk(bootstrapAtRisk)
      })
    return () => {
      cancelled = true
    }
  }, [activeBatchId, bootstrapAtRisk])

  if (loading && atRisk.length === 0 && bootstrapAtRisk.length === 0) {
    return <PageLoader />
  }

  return (
    <>
      {!embedded && (
        <PageHeader
          eyebrow="Early Intervention"
          title="At-risk students"
          sub="Flagged for early intervention with the reasons behind the flag."
        />
      )}
      {atRisk.length === 0 ? (
        <AppCard><p className="text-sm text-muted-foreground">No at-risk students right now.</p></AppCard>
      ) : (
        <AppCard className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">Student</th>
                <th className="text-left px-5 py-3">Board · Grade</th>
                <th className="text-left px-5 py-3">Reason</th>
                <th className="text-right px-5 py-3">Risk</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {atRisk.map((s) => (
                <tr key={s.name} className="border-t border-border">
                  <td className="px-5 py-4 font-medium">{s.name}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {s.board} · Grade {s.grade}
                  </td>
                  <td className="px-5 py-4">{s.reason}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-rose" style={{ width: `${s.risk}%` }} />
                      </div>
                      <span className="font-mono-data text-rose">{s.risk}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      className="text-xs px-3 py-1.5 bg-ink text-paper rounded-md"
                    >
                      Intervene
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AppCard>
      )}
    </>
  )
}
