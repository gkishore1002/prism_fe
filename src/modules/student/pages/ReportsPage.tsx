import { Link } from 'react-router-dom'
import { Download } from 'lucide-react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { getStudentWiseReport, monthlyReports } from '@/data/mock'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'
import { monthToSlug } from '../components/StudentFullReportView'

export function StudentReportsPage() {
  const { user } = useAuth()
  const report = getStudentWiseReport(user.id) ?? getStudentWiseReport('stu-1')!

  return (
    <>
      <PageHeader
        eyebrow="Academic reports"
        title="Your reports"
        sub="Monthly snapshots. Open a report for full AI insights, gaps, and readiness."
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 p-4 rounded-xl border border-border bg-secondary/30">
        <HealthBadge status={report.status} score={report.health} />
        <div className="flex-1 grid grid-cols-3 gap-4">
          <AppStat label="Health" value={report.health} unit="/100" />
          <AppStat label="Readiness" value={report.readiness} unit="%" tone="accent" />
          <AppStat label="Improvement" value={`+${report.improvement}`} unit="%" tone="leaf" />
        </div>
      </div>

      <h3 className="font-display font-bold mb-3">Monthly reports</h3>
      <div className="space-y-3">
        {monthlyReports.map((r, i) => (
          <AppCard
            key={r.month}
            className={cn(
              'flex flex-col sm:flex-row sm:items-center gap-4',
              i === 0 && 'border-accent/40 bg-accent/5',
            )}
          >
            <div className="sm:w-40">
              <p className="font-display text-lg font-bold">{r.month}</p>
              {i === 0 && (
                <span className="text-[10px] uppercase tracking-widest text-accent font-semibold">
                  Latest
                </span>
              )}
            </div>
            <div className="flex gap-8 flex-1 text-sm">
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Health</p>
                <p className="font-mono-data font-bold">{r.health}/100</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Improvement</p>
                <p className="font-mono-data font-bold text-leaf">+{r.improvement}%</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Readiness</p>
                <p className="font-mono-data font-bold">{r.readiness}%</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link
                to={`/student/reports/${monthToSlug(r.month)}`}
                className="text-sm font-medium px-4 py-2 rounded-lg border border-border hover:bg-secondary"
              >
                View report
              </Link>
              <button
                type="button"
                className="text-sm font-semibold inline-flex items-center gap-1.5 bg-ink text-paper px-4 py-2 rounded-lg hover:opacity-90"
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </AppCard>
        ))}
      </div>
    </>
  )
}
