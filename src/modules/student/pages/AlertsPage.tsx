import { Link, useNavigate } from 'react-router-dom'
import { PageLoader } from '@/components/ui/PrismLoader'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { AlertTriangle, Bell, TrendingDown, Activity } from 'lucide-react'

const ICONS = {
  'Score Drop': TrendingDown,
  'Consistency Drop': Activity,
  'Readiness Risk': AlertTriangle,
  'Missed Practice': Bell,
}

export function StudentAlertsPage() {
  const navigate = useNavigate()
  useAnalyticsPage('studentAlerts')
  const { loading, progressAlerts } = useAnalytics()

  if (loading) {
    return <PageLoader />
  }

  return (
    <>
      <PageHeader
        eyebrow="Early Warning System"
        title="Alerts"
        sub="What needs attention — in plain language, in your student portal."
      />
      {progressAlerts.length === 0 ? (
        <AppCard>
          <p className="text-sm text-muted-foreground">No alerts right now — you&apos;re on track.</p>
        </AppCard>
      ) : (
        <div className="space-y-3">
          {progressAlerts.map((a, idx) => {
            const Icon = ICONS[a.type as keyof typeof ICONS] || Bell
            const content = (
              <>
                <div className="w-10 h-10 rounded-md border border-border bg-secondary/50 grid place-items-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground">{a.type}</div>
                  <div className="text-sm text-muted-foreground mt-1">{a.message}</div>
                </div>
              </>
            )

            if (a.href) {
              return (
                <button
                  key={`${a.type}-${idx}`}
                  type="button"
                  onClick={() => navigate(a.href)}
                  className="w-full text-left rounded-lg border border-border bg-card p-4 flex items-start gap-4 hover:bg-secondary/50 transition-colors"
                >
                  {content}
                </button>
              )
            }

            return (
              <AppCard key={`${a.type}-${idx}`} className="flex items-start gap-4">
                {content}
              </AppCard>
            )
          })}
        </div>
      )}
      <div className="mt-6 text-xs text-muted-foreground">
        <Link to="/student/plan" className="text-accent hover:underline">
          View your recovery plan →
        </Link>
      </div>
    </>
  )
}