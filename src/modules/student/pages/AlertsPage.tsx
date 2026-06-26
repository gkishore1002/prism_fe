import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { progressAlerts } from '@/data/mock'
import { AlertTriangle, Bell, TrendingDown, Activity } from 'lucide-react'
import { cn } from '@/lib/cn'

const ICONS = {
  'Score Drop': TrendingDown,
  'Consistency Drop': Activity,
  'Readiness Risk': AlertTriangle,
  'Missed Practice': Bell,
}

const SEV: Record<string, string> = {
  high: 'bg-rose/10 text-rose border-rose/30',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-secondary text-muted-foreground border-border',
}

export function StudentAlertsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Early Warning System"
        title="Alerts"
        sub="What needs attention — in plain language, in your student portal."
      />
      <div className="space-y-3">
        {progressAlerts.map((a) => {
          const Icon = ICONS[a.type as keyof typeof ICONS] || Bell
          return (
            <AppCard key={`${a.type}-${a.date}`} className="flex items-start gap-4">
              <div className={cn('w-10 h-10 rounded-md border grid place-items-center shrink-0', SEV[a.severity])}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-medium text-foreground">{a.type}</div>
                  <span className={cn('text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded', SEV[a.severity])}>
                    {a.severity}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {a.topic} — {a.detail}
                </div>
              </div>
              <div className="text-xs text-muted-foreground shrink-0">{a.date}</div>
            </AppCard>
          )
        })}
      </div>
    </>
  )
}
