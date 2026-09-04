import { Link } from 'react-router-dom'
import { PageLoader } from '@/components/ui/PrismLoader'
import { Users, TrendingUp } from 'lucide-react'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { useCurriculum } from '@/hooks/useCurriculum'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'

export function TutorBatchesPage() {
  useAnalyticsPage('tutorBatches')
  const { batches, loading: curriculumLoading } = useCurriculum()
  const { batchHeatmap, loading: analyticsLoading } = useAnalytics()
  const loading =
    (curriculumLoading && batches.length === 0) ||
    (analyticsLoading && batchHeatmap.length === 0 && batches.length === 0)

  if (loading) {
    return <PageLoader />
  }

  return (
    <>
      <PageHeader
        eyebrow="Batch Intelligence"
        title="Batches"
        sub="What to reteach next — scoped to board and grade."
      />

      {batches.length === 0 ? (
        <AppCard><p className="text-sm text-muted-foreground">No batches yet.</p></AppCard>
      ) : (
        <div className="space-y-4 mb-8">
          {batches.map((b) => (
            <AppCard key={b.id}>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="font-display text-xl">{b.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3 h-3" /> {b.studentIds.length} students
                    </span>
                    <span>{b.board} · {b.grade}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Avg score
                  </div>
                  <div className="font-mono-data text-2xl mt-1">{b.avgScore ?? 0}%</div>
                </div>
                <Link
                  to="/tutor/students"
                  className="text-sm btn btn-primary px-4 py-2"
                >
                  Open
                </Link>
              </div>
            </AppCard>
          ))}
        </div>
      )}

      <AppCard>
        <div className="flex items-baseline justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Mastery heatmap
            </div>
            <div className="font-display text-2xl mt-1">Topic-level mastery</div>
          </div>
        </div>
        {batchHeatmap.length === 0 ? (
          <p className="text-sm text-muted-foreground">No heatmap data yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {batchHeatmap.map((h) => (
              <div
                key={h.topic}
                className="p-4 rounded-md border border-border"
                style={{ background: `oklch(0.72 0.17 45 / ${(h.mastery / 100) * 0.4})` }}
              >
                <div className="text-sm">{h.topic}</div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="font-mono-data text-2xl">{h.mastery}</span>
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
                <div className="text-xs mt-1 inline-flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-leaf" />
                </div>
              </div>
            ))}
          </div>
        )}
      </AppCard>
    </>
  )
}