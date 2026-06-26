import { Card } from '@/components/ui/Card'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ScoreRing } from '../components/ScoreRing'
import { studentHealth } from '@/data/mock'
import { formatTrend } from '@/lib/constants'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { subjectColor } from '../lib/utils'

export function StudentHealthPage() {
  const sorted = [...studentHealth.subjects].sort((a, b) => a.health - b.health)
  const weakest = sorted[0]

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-blue-50 via-white to-yellow-50/40 border-blue-100 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-text-muted font-display">Overall health</p>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-[36px] font-mono-data font-bold text-blue-800 leading-none">{studentHealth.overall}%</p>
            <HealthBadge status={studentHealth.status} size="md" />
          </div>
          <p className="text-[12px] text-emerald-600 font-medium mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {formatTrend(studentHealth.trend)} this month
          </p>
        </div>
        <ScoreRing value={studentHealth.overall} size={96} color="brand" />
      </Card>

      {weakest && weakest.health < 70 && (
        <div className="px-4 py-3 rounded-xl bg-rose-50/80 border border-rose-100 text-[12px] text-rose-800 font-sans">
          <span className="font-medium">{weakest.subjectName}</span> needs attention — focus here to lift your overall score fastest.
        </div>
      )}

      <div className="space-y-3">
        {studentHealth.subjects.map((subject) => (
          <Card key={subject.subjectId} padding="sm" className="bg-white/90 overflow-hidden">
            <div className="flex items-center gap-3">
              <div
                className="w-1 self-stretch rounded-full shrink-0"
                style={{ backgroundColor: subjectColor(subject.subjectId) }}
              />
              <div className="flex-1 min-w-0 py-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] font-medium text-text-primary">{subject.subjectName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[18px] font-mono-data font-semibold text-text-primary">{subject.health}%</span>
                    <HealthBadge status={subject.status} size="sm" showLabel={false} />
                  </div>
                </div>
                <ProgressBar value={subject.health} color="brand" size="md" />
                <p className={`text-[11px] mt-2 font-medium flex items-center gap-1 ${subject.trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {subject.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {formatTrend(subject.trend)} vs last month
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
