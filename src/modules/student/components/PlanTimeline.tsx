import { Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { RecoveryStep } from '@/types'
import { cn } from '@/lib/cn'

interface PlanTimelineProps {
  pending: RecoveryStep[]
  completed: RecoveryStep[]
}

export function PlanTimeline({ pending, completed }: PlanTimelineProps) {
  return (
    <div className="space-y-0">
      {pending.map((step, i) => (
        <div key={step.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className="w-8 h-8 rounded-full bg-yellow-100 border-2 border-yellow-300 text-yellow-800 flex items-center justify-center text-[12px] font-display font-bold shrink-0">
              {i + 1}
            </span>
            {(i < pending.length - 1 || completed.length > 0) && (
              <div className="w-0.5 flex-1 min-h-[24px] bg-surface-200 my-1" />
            )}
          </div>
          <div className={cn('flex-1 pb-5', i === pending.length - 1 && completed.length === 0 && 'pb-0')}>
            <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-sm">
              <p className="text-[14px] font-medium text-text-primary">{step.action}</p>
              <p className="text-[11px] text-text-muted mt-0.5">{step.topicName} · {step.subjectName}</p>
              <div className="flex items-center justify-between mt-3 gap-3">
                <div className="flex gap-2">
                  <span className="text-[10px] font-mono-data px-2 py-0.5 rounded-full bg-surface-50 text-text-muted border border-surface-100">
                    {step.estimatedHours}h
                  </span>
                  <span className="text-[10px] font-mono-data px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    +{step.expectedGain}%
                  </span>
                </div>
                <Button variant="action" size="sm">Start</Button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {completed.map((step, i) => (
        <div key={step.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-emerald-600" />
            </span>
            {i < completed.length - 1 && <div className="w-0.5 flex-1 min-h-[16px] bg-emerald-100 my-1" />}
          </div>
          <div className={cn('flex-1 pb-4', i === completed.length - 1 && 'pb-0')}>
            <p className="text-[13px] text-text-muted line-through pt-1.5">{step.action}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
