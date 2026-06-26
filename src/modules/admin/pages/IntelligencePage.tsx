import { Sparkles, TrendingDown, AlertTriangle } from 'lucide-react'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { hardestTopics } from '@/data/ownerMock'

export function AdminIntelligencePage() {
  return (
    <>
      <PageHeader
        eyebrow="AI · Institution Intelligence"
        title="Institution-wide insights"
        sub="Aggregated across 2,500 students. What's working, what's breaking, where to invest."
      />

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <AppCard className="bg-ink text-paper">
          <div className="flex items-center gap-2 text-accent text-[10px] uppercase tracking-[0.25em]">
            <Sparkles className="w-3.5 h-3.5" /> Marks-drop analysis
          </div>
          <div className="font-display text-3xl mt-3">CBSE 8 Math · −16% this term</div>
          <p className="text-paper/70 mt-3">
            Primary cause: word problems (accuracy 74% → 38%). Affects 4 batches. Recommend
            dedicated word-problem workshop across grade 8.
          </p>
        </AppCard>
        <AppCard>
          <div className="flex items-center gap-2 text-rose text-[10px] uppercase tracking-[0.25em]">
            <TrendingDown className="w-3.5 h-3.5" /> Hardest question
          </div>
          <div className="font-display text-2xl mt-3">Q17 · Coordinate Geometry</div>
          <p className="text-muted-foreground mt-2">
            Correct rate: <span className="font-mono-data text-rose">12%</span> across all attempts.
            Concept may need re-teaching at the institute level.
          </p>
        </AppCard>
      </div>

      <AppCard>
        <div className="flex items-baseline justify-between mb-6">
          <div className="font-display text-2xl">Hardest topics — institution wide</div>
          <span className="text-xs text-muted-foreground">Based on 184,000 attempts</span>
        </div>
        <div className="space-y-3">
          {hardestTopics.map((t, i) => (
            <div key={t.topic} className="flex items-center gap-4">
              <div className="font-mono-data text-xs text-muted-foreground w-6">#{i + 1}</div>
              <div className="flex-1">{t.topic}</div>
              <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-rose" style={{ width: `${t.correct}%` }} />
              </div>
              <div className="font-mono-data text-sm w-12 text-right">{t.correct}%</div>
            </div>
          ))}
        </div>
      </AppCard>

      <AppCard className="mt-6">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-accent">
          <AlertTriangle className="w-3.5 h-3.5" /> Curriculum interventions suggested
        </div>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex gap-3">
            <span className="font-mono-data text-accent">1.</span> Add 4-hour Coordinate Geometry
            remedial block for CBSE 8/9. Estimated lift: institution average +3%.
          </div>
          <div className="flex gap-3">
            <span className="font-mono-data text-accent">2.</span> Reading Inference workshop for
            English Lit across grades. Affects retention scores.
          </div>
          <div className="flex gap-3">
            <span className="font-mono-data text-accent">3.</span> Reassign Mr. Rajan T. to a
            co-teaching pair — growth metrics lagging by 6%.
          </div>
        </div>
      </AppCard>
    </>
  )
}
