import { Link } from 'react-router-dom'
import { Users, TrendingUp } from 'lucide-react'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { tutorBatchList, tutorBatchHeatmap } from '@/data/tutorMock'

export function TutorBatchesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Batch Intelligence"
        title="Batches"
        sub="What to reteach next — scoped to board and grade."
      />

      <div className="space-y-4 mb-8">
        {tutorBatchList.map((b) => (
          <AppCard key={b.id}>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="font-display text-xl">{b.name}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3 h-3" /> {b.students} students
                  </span>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Avg score
                </div>
                <div className="font-mono-data text-2xl mt-1">{b.avg}%</div>
              </div>
              <div className="w-48">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Syllabus
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 bg-secondary rounded-full flex-1 overflow-hidden">
                    <div className="h-full bg-leaf" style={{ width: `${b.completion}%` }} />
                  </div>
                  <span className="font-mono-data text-sm">{b.completion}%</span>
                </div>
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

      <AppCard>
        <div className="flex items-baseline justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Mastery heatmap · CBSE Grade 8 · Batch A
            </div>
            <div className="font-display text-2xl mt-1">Topic-level mastery</div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-leaf" /> ≥70
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-brand" /> 50–69
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-rose" /> &lt;50
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tutorBatchHeatmap.map((h) => (
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
                <TrendingUp className="w-3 h-3 text-leaf" /> +3 wk
              </div>
            </div>
          ))}
        </div>
      </AppCard>
    </>
  )
}
