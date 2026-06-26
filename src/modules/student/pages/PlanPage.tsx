import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ScoreRing } from '../components/ScoreRing'
import { PlanTimeline } from '../components/PlanTimeline'
import { learningGaps, recoveryPlan, readinessPredictions } from '@/data/mock'
import { Target } from 'lucide-react'

export function StudentPlanPage() {
  const pending = recoveryPlan.filter((s) => !s.completed)
  const completed = recoveryPlan.filter((s) => s.completed)
  const avgReadiness = Math.round(
    readinessPredictions.reduce((s, r) => s + r.currentReadiness, 0) / readinessPredictions.length,
  )
  const completedPct = Math.round((completed.length / recoveryPlan.length) * 100)

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 gap-3">
        <Card padding="sm" className="bg-white/90 flex flex-col items-center py-4">
          <ScoreRing value={avgReadiness} size={88} color="brand" />
          <p className="text-[10px] text-text-muted mt-2 font-display uppercase tracking-wide">Exam ready</p>
        </Card>
        <Card padding="sm" className="bg-white/90 flex flex-col justify-center py-4 px-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-yellow-600" />
            <p className="text-[11px] font-display font-semibold text-text-primary">Plan progress</p>
          </div>
          <p className="text-[28px] font-mono-data font-bold text-text-primary">{completedPct}%</p>
          <ProgressBar value={completedPct} color="yellow" size="sm" className="mt-2" />
          <p className="text-[10px] text-text-muted mt-1.5">{completed.length} of {recoveryPlan.length} done</p>
        </Card>
      </div>

      {/* Gaps */}
      {learningGaps.length > 0 && (
        <div>
          <p className="text-[11px] font-display font-semibold uppercase tracking-wide text-text-muted mb-2.5 px-0.5">
            Fix these first
          </p>
          <div className="space-y-2">
            {learningGaps.map((gap, i) => (
              <Card
                key={gap.id}
                padding="sm"
                accent={gap.severity === 'high' ? 'rose' : 'yellow'}
                className="bg-white/90"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-md bg-surface-100 text-[11px] font-display font-bold text-text-muted flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[14px] font-medium text-text-primary">{gap.topicName}</p>
                      <p className="text-[11px] text-text-muted">{gap.subjectName}</p>
                      <p className="text-[12px] text-text-secondary mt-1.5 leading-relaxed">{gap.recommendedAction}</p>
                    </div>
                  </div>
                  <Badge variant={gap.severity === 'high' ? 'danger' : 'warning'}>
                    +{gap.impactOnScore}%
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div>
        <p className="text-[11px] font-display font-semibold uppercase tracking-wide text-text-muted mb-3 px-0.5">
          Your steps
        </p>
        <PlanTimeline pending={pending} completed={completed} />
      </div>
    </div>
  )
}
