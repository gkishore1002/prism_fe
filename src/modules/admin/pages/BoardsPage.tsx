import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, TrendingUp, ArrowRight } from 'lucide-react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { boardReport, aiBoardReport } from '@/data/ownerMock'

export function AdminBoardsPage() {
  const [board, setBoard] = useState(boardReport[0].board)
  const row = boardReport.find((b) => b.board === board)!
  const ai = aiBoardReport[board]

  return (
    <>
      <PageHeader
        eyebrow="Board-wise · CBSE / State / ICSE"
        title="Board performance reports"
        sub="How each board cohort performs. Pick a board to see the AI-generated executive summary."
      />

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {boardReport.map((b) => (
          <button
            key={b.board}
            type="button"
            onClick={() => setBoard(b.board)}
            className={`text-left rounded-lg border p-5 transition ${
              board === b.board ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/40'
            }`}
          >
            <div className="flex items-baseline justify-between">
              <div className="font-display text-2xl">{b.board}</div>
              <div className="font-mono-data text-sm text-muted-foreground">{b.students} students</div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Avg</div>
                <div className="font-mono-data text-xl">{b.avg}%</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Growth</div>
                <div className="font-mono-data text-xl text-leaf">+{b.improvement}%</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">At-risk</div>
                <div className="font-mono-data text-xl text-rose">{b.atRisk}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <AppStat label="Students" value={row.students.toLocaleString()} />
        <AppStat label="Mean score" value={row.avg} unit="%" tone="accent" />
        <AppStat label="Syllabus done" value={row.syllabus} unit="%" tone="leaf" />
        <AppStat label="At-risk" value={row.atRisk} tone="rose" />
      </div>

      <AppCard className="mb-6 bg-ink text-paper">
        <div className="flex items-center gap-2 text-accent text-[10px] uppercase tracking-[0.25em]">
          <Sparkles className="w-3.5 h-3.5" /> AI Board Report · {board}
        </div>
        <div className="font-display text-3xl mt-3">{ai.headline}</div>
        <p className="text-paper/70 mt-3 max-w-3xl">{ai.insight}</p>
        <div className="mt-6 pt-5 border-t border-paper/15">
          <div className="text-[11px] uppercase tracking-widest text-paper/60 mb-3">
            Recommended actions
          </div>
          <ol className="space-y-2">
            {ai.actions.map((a, i) => (
              <li key={a} className="flex gap-3 text-paper/90">
                <span className="font-mono-data text-accent">{i + 1}.</span>
                <span>{a}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex items-center gap-2 text-leaf">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">
              Projected institute-wide lift if applied:{' '}
              <span className="font-mono-data">+{ai.lift}%</span> within 6 weeks.
            </span>
          </div>
        </div>
      </AppCard>

      <div className="grid md:grid-cols-2 gap-4">
        <AppCard>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Best subject</div>
          <div className="font-display text-2xl mt-1">{row.topSubject}</div>
          <div className="text-sm text-muted-foreground mt-2">Promote this in admissions material.</div>
        </AppCard>
        <AppCard>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Weakest subject</div>
          <div className="font-display text-2xl mt-1">{row.weakSubject}</div>
          <Link to="/admin/reports" className="text-sm text-accent mt-2 inline-flex items-center gap-1">
            Open subject drill-down <ArrowRight className="w-3 h-3" />
          </Link>
        </AppCard>
      </div>
    </>
  )
}
