import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/PrismLoader'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ScoreRing } from '../components/ScoreRing'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { formatTrend } from '@/lib/constants'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { subjectColor } from '../lib/utils'

export function StudentHealthPage() {
  useAnalyticsPage('studentHealth')
  const { loading, studentHealth } = useAnalytics()

  if (loading) {
    return <PageLoader />
  }

  if (!studentHealth) {
    return <p className="text-sm text-muted-foreground p-4">No health data available yet.</p>
  }

  const sorted = [...studentHealth.subjects].sort((a, b) => a.health - b.health)
  const weakest = sorted[0]

  return (
    <>
      <PageHeader
        eyebrow="Academic health"
        title="Subject health"
        sub="Track mastery and trends across all your subjects"
      />

      <AppCard className="accent-blue p-6 mb-6 bg-gradient-to-br from-blue-50/60 via-card to-accent/5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-display">Overall health</p>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-[36px] font-mono-data font-bold text-ink leading-none">{studentHealth.overall}%</p>
            <HealthBadge status={studentHealth.status} size="md" />
          </div>
          <p className="text-[12px] text-leaf font-medium mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {formatTrend(studentHealth.trend)} this month
          </p>
        </div>
        <ScoreRing value={studentHealth.overall} size={96} color="brand" />
      </AppCard>

      {weakest && weakest.health < 70 && (
        <div className="px-4 py-3 rounded-xl bg-rose/5 border border-rose/10 text-[12px] text-rose mb-6">
          <span className="font-medium">{weakest.subjectName}</span> needs attention — focus here to lift your overall
          score fastest.
        </div>
      )}

      <div className="space-y-3">
        {studentHealth.subjects.map((subject) => (
          <AppCard key={subject.subjectId} className="overflow-hidden">
            <div className="flex items-center gap-3">
              <div
                className="w-1 self-stretch rounded-full shrink-0"
                style={{ backgroundColor: subjectColor(subject.subjectId) }}
              />
              <div className="flex-1 min-w-0 py-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] font-medium text-foreground">{subject.subjectName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[18px] font-mono-data font-semibold text-foreground">{subject.health}%</span>
                    <HealthBadge status={subject.status} size="sm" showLabel={false} />
                  </div>
                </div>
                <ProgressBar value={subject.health} color="brand" size="md" />
                <p
                  className={`text-[11px] mt-2 font-medium flex items-center gap-1 ${subject.trend >= 0 ? 'text-leaf' : 'text-rose'}`}
                >
                  {subject.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {formatTrend(subject.trend)} vs last month
                </p>
              </div>
            </div>
          </AppCard>
        ))}
      </div>
    </>
  )
}