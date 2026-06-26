import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { recoveryPlan } from '@/data/mock'
import { CheckCircle2, Clock, TrendingUp } from 'lucide-react'

export function StudentRecoveryPage() {
  const completed = recoveryPlan.filter((s) => s.completed)
  const pending = recoveryPlan.filter((s) => !s.completed)
  const totalGain = recoveryPlan.reduce((sum, s) => sum + (s.completed ? 0 : s.expectedGain), 0)
  const totalHours = pending.reduce((sum, s) => sum + s.estimatedHours, 0)
  const progress = (completed.length / recoveryPlan.length) * 100

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-900">Recovery Plan</h2>
        <p className="text-sm text-zinc-500">Personalized path to close gaps and boost readiness</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="sm">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Plan Progress</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">{Math.round(progress)}%</p>
          <ProgressBar value={progress} className="mt-3" size="sm" />
        </Card>
        <Card padding="sm">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Potential Gain</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">+{totalGain}%</p>
          <p className="text-xs text-zinc-400 mt-1">Across remaining steps</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Time Required</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">{totalHours}h</p>
          <p className="text-xs text-zinc-400 mt-1">Estimated to complete</p>
        </Card>
      </div>

      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Up Next</CardTitle>
            <CardDescription>Prioritized by impact on your academic health</CardDescription>
          </CardHeader>
          <div className="space-y-3">
            {pending.map((step) => (
              <div key={step.id} className="flex items-center gap-4 p-4 rounded-xl border border-zinc-100 hover:border-brand-200 transition-colors">
                <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {step.priority}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900">{step.action}</p>
                  <p className="text-xs text-zinc-500">{step.topicName} · {step.subjectName}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {step.estimatedHours}h
                    </p>
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> +{step.expectedGain}%
                    </p>
                  </div>
                  <Button variant="primary" size="sm">Start</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {completed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {completed.map((step) => (
              <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/50">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-700 line-through">{step.action}</p>
                  <p className="text-xs text-zinc-500">{step.topicName}</p>
                </div>
                <Badge variant="success">+{step.expectedGain}%</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
