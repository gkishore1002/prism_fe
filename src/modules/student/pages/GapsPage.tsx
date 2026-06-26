import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { learningGaps } from '@/data/mock'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const severityVariant = {
  high: 'danger' as const,
  medium: 'warning' as const,
  low: 'neutral' as const,
}

export function StudentGapsPage() {
  const totalImpact = learningGaps.reduce((sum, g) => sum + g.impactOnScore, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-900">Learning Gaps</h2>
        <p className="text-sm text-zinc-500">Diagnosed weaknesses with root causes and recovery actions</p>
      </div>

      <Card className="border-brand-200/60 bg-gradient-to-r from-brand-50/30 to-violet-50/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-600">Total recoverable score potential</p>
            <p className="text-3xl font-bold text-brand-700 mt-1">+{totalImpact}%</p>
            <p className="text-xs text-zinc-500 mt-1">If all identified gaps are addressed</p>
          </div>
          <Link to="/student/recovery">
            <Button variant="gradient" className="gap-2">
              View Recovery Plan <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </Card>

      <div className="space-y-4">
        {learningGaps.map((gap) => (
          <Card key={gap.id}>
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                gap.severity === 'high' ? 'bg-red-50 text-red-600' :
                gap.severity === 'medium' ? 'bg-amber-50 text-amber-600' :
                'bg-zinc-100 text-zinc-600'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-zinc-900">{gap.topicName}</h3>
                  <Badge variant="neutral">{gap.subjectName}</Badge>
                  <Badge variant={severityVariant[gap.severity]}>{gap.severity} severity</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="rounded-lg bg-red-50/50 border border-red-100 p-3">
                    <p className="text-xs font-medium text-red-700 mb-1">Root Cause</p>
                    <p className="text-sm text-zinc-700">{gap.rootCause}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 p-3">
                    <p className="text-xs font-medium text-emerald-700 mb-1">Recommended Action</p>
                    <p className="text-sm text-zinc-700">{gap.recommendedAction}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-500">Score impact</span>
                      <span className="font-semibold text-red-600">-{gap.impactOnScore}%</span>
                    </div>
                    <ProgressBar value={gap.impactOnScore} max={15} color="rose" size="sm" />
                  </div>
                  <Button variant="primary" size="sm">Start Fix</Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
