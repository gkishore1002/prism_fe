import { useState } from 'react'
import { PageLoader } from '@/components/ui/PrismLoader'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { AnalyticsInsightsCard } from '@/components/ui/AnalyticsInsightsCard'
import { boardInsightBullets } from '@/lib/analyticsInsights'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'

export function AdminBoardsPage() {
  useAnalyticsPage('adminBoards')
  const { loading, boardReport } = useAnalytics()
  const [board, setBoard] = useState<string>('')

  if (loading && boardReport.length === 0) {
    return <PageLoader />
  }

  if (boardReport.length === 0) {
    return (
      <>
        <PageHeader title="Board performance reports" sub="No board data available yet." />
        <AppCard><p className="text-sm text-muted-foreground">Board reports will appear once analytics are loaded.</p></AppCard>
      </>
    )
  }

  const selectedBoard = board || boardReport[0].board
  const row = boardReport.find((b) => b.board === selectedBoard) ?? boardReport[0]

  return (
    <>
      <PageHeader
        eyebrow="Board-wise · CBSE / State / ICSE"
        title="Board performance reports"
        sub="How each board cohort performs. Pick a board to see the executive summary."
      />

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {boardReport.map((b) => (
          <button
            key={b.board}
            type="button"
            onClick={() => setBoard(b.board)}
            className={`text-left rounded-lg border p-5 transition ${
              selectedBoard === b.board ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/40'
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
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Score growth</div>
                <div className="font-mono-data text-xl text-leaf">
                  {b.improvement > 0 ? '+' : ''}{b.improvement}%
                </div>
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
        <AppStat label="Topic mastery" value={row.syllabus} unit="%" tone="leaf" />
        <AppStat label="At-risk" value={row.atRisk} tone="rose" />
      </div>

      <AnalyticsInsightsCard
        title="Board insights"
        bullets={boardInsightBullets(boardReport)}
        className="mb-6"
      />

      <div className="grid md:grid-cols-2 gap-4">
        <AppCard>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Best subject</div>
          <div className="font-display text-2xl mt-1">{row.topSubject}</div>
          <div className="text-sm text-muted-foreground mt-2">Promote this in admissions material.</div>
        </AppCard>
        <AppCard>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Weakest subject</div>
          <div className="font-display text-2xl mt-1">{row.weakSubject}</div>
          <Link to="/admin/reports/subjects" className="text-sm text-accent mt-2 inline-flex items-center gap-1">
            Open subject drill-down <ArrowRight className="w-3 h-3" />
          </Link>
        </AppCard>
      </div>
    </>
  )
}