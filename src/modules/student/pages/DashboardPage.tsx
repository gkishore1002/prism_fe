import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Clock, Zap } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ScoreRing } from '../components/ScoreRing'
import { SubjectStrip } from '../components/SubjectStrip'
import { studentHealth, learningGaps, recoveryPlan } from '@/data/mock'
import { useAuth } from '@/hooks/useAuth'
import { getGreeting } from '../lib/utils'

export function StudentDashboardPage() {
  const { user } = useAuth()
  const firstName = user.name.split(' ')[0]
  const topGap = learningGaps[0]
  const nextStep = recoveryPlan.find((s) => !s.completed)
  const completedSteps = recoveryPlan.filter((s) => s.completed).length
  const planPct = Math.round((completedSteps / recoveryPlan.length) * 100)

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] text-text-muted font-sans">{getGreeting()}</p>
          <h2 className="text-[26px] font-display font-bold text-text-primary leading-tight mt-0.5">
            {firstName} <span className="text-yellow-500">✦</span>
          </h2>
          <p className="text-[13px] text-text-secondary mt-1 font-sans">
            Grade 8 · CBSE · BrightPath Academy
          </p>
        </div>
      </div>

      {/* Dual rings — health + plan progress */}
      <Card className="p-5 bg-white/90 backdrop-blur-sm border-surface-200 shadow-sm">
        <div className="flex items-center justify-around gap-4">
          <ScoreRing value={studentHealth.overall} label="Health" color="brand" size={110} />
          <div className="w-px h-20 bg-surface-200 hidden sm:block" />
          <ScoreRing value={planPct} label="Plan done" color="gold" size={110} sublabel={`${completedSteps}/${recoveryPlan.length}`} />
        </div>
      </Card>

      {/* Subject quick view */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <p className="text-[11px] font-display font-semibold uppercase tracking-wide text-text-muted">Subjects</p>
          <Link to="/student/health" className="text-[11px] text-blue-600 font-display font-medium hover:underline">
            See all
          </Link>
        </div>
        <SubjectStrip subjects={studentHealth.subjects} />
      </div>

      {/* Today's focus */}
      {topGap && (
        <Card accent="yellow" className="overflow-hidden border-yellow-200 bg-gradient-to-br from-yellow-50 to-white shadow-sm">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-300/40 flex items-center justify-center">
                <Zap className="w-4 h-4 text-yellow-700" />
              </div>
              <div>
                <p className="text-[11px] font-display font-semibold uppercase tracking-wide text-yellow-700">Today&apos;s focus</p>
                <p className="text-[16px] font-display font-bold text-text-primary">{topGap.topicName}</p>
              </div>
            </div>
            <p className="text-[13px] text-text-secondary font-sans leading-relaxed mb-4">
              {topGap.recommendedAction}
            </p>
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-yellow-100">
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wide">If you fix this</p>
                <p className="text-[20px] font-mono-data font-bold text-yellow-700">+{topGap.impactOnScore}%</p>
              </div>
              <Link to="/student/plan">
                <Button variant="action" size="md" className="gap-2 shadow-sm">
                  Start now <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Up next */}
      {nextStep && (
        <Link to="/student/plan" className="block group">
          <Card padding="sm" className="group-hover:border-blue-200 group-hover:shadow-sm transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-text-muted uppercase tracking-wide font-display">Up next in your plan</p>
                <p className="text-[14px] font-medium text-text-primary truncate">{nextStep.action}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="neutral">{nextStep.estimatedHours}h</Badge>
                  <Badge variant="success">+{nextStep.expectedGain}%</Badge>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-text-faint group-hover:text-blue-600 transition-colors shrink-0" />
            </div>
          </Card>
        </Link>
      )}

      {/* AI nudge */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
        <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <p className="text-[12px] text-text-secondary leading-relaxed font-sans">
          <span className="font-medium text-indigo-700">Tip:</span> 30 minutes on Linear Equations today could move your math health above 75%.
        </p>
      </div>
    </div>
  )
}
