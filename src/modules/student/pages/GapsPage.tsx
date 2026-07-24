import { Link } from 'react-router-dom'
import { PageLoader } from '@/components/ui/PrismLoader'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { AlertTriangle, ArrowRight } from 'lucide-react'

const severityVariant = {
  high: 'danger' as const,
  medium: 'warning' as const,
  low: 'neutral' as const,
}

export function StudentGapsPage() {
  useAnalyticsPage('studentGaps')
  const { loading, learningGaps } = useAnalytics()
  const totalImpact = learningGaps.reduce((sum, g) => sum + g.impactOnScore, 0)

  if (loading) {
    return <PageLoader />
  }

  if (learningGaps.length === 0) {
    return (
      <>
        <PageHeader title="Learning gaps" sub="No gaps identified yet — keep practicing!" />
        <AppCard className="text-center py-10">
          <p className="text-sm text-muted-foreground">Great work. Your diagnostics look clear.</p>
        </AppCard>
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Diagnostics"
        title="Learning gaps"
        sub="Diagnosed weaknesses with root causes and recovery actions"
      />

      <AppCard className="accent-yellow mb-6 bg-gradient-to-r from-accent/5 to-indigo-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total recoverable score potential</p>
            <p className="text-3xl font-bold text-accent mt-1">+{totalImpact}%</p>
            <p className="text-xs text-muted-foreground mt-1">If all identified gaps are addressed</p>
          </div>
          <Link to="/student/recovery">
            <Button variant="gradient" className="gap-2">
              View recovery plan <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </AppCard>

      <div className="space-y-4">
        {learningGaps.map((gap) => (
          <AppCard key={gap.id} className={gap.severity === 'high' ? 'accent-rose' : 'accent-yellow'}>
            <div className="flex items-start gap-4">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  gap.severity === 'high'
                    ? 'bg-rose/10 text-rose'
                    : gap.severity === 'medium'
                      ? 'bg-accent/15 text-accent'
                      : 'bg-secondary text-muted-foreground'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{gap.topicName}</h3>
                  <Badge variant="neutral">{gap.subjectName}</Badge>
                  <Badge variant={severityVariant[gap.severity]}>{gap.severity} severity</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="rounded-lg bg-rose/5 border border-rose/10 p-3">
                    <p className="text-xs font-medium text-rose mb-1">Root cause</p>
                    <p className="text-sm text-foreground">{gap.rootCause}</p>
                  </div>
                  <div className="rounded-lg bg-leaf/5 border border-leaf/10 p-3">
                    <p className="text-xs font-medium text-leaf mb-1">Recommended action</p>
                    <p className="text-sm text-foreground">{gap.recommendedAction}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Score impact</span>
                      <span className="font-semibold text-rose">-{gap.impactOnScore}%</span>
                    </div>
                    <ProgressBar value={gap.impactOnScore} max={15} color="rose" size="sm" />
                  </div>
                  <Button variant="primary" size="sm">
                    Start fix
                  </Button>
                </div>
              </div>
            </div>
          </AppCard>
        ))}
      </div>
    </>
  )
}