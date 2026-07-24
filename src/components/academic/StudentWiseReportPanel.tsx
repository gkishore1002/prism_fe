import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageLoader } from '@/components/ui/PrismLoader'
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { AppCard, AppStat } from '@/components/layout/AppShell'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { AnalyticsInsightsCard } from '@/components/ui/AnalyticsInsightsCard'
import { useAnalytics } from '@/hooks/useAnalytics'
import type { StudentWiseReport } from '@/types'
import { cn } from '@/lib/cn'

interface StudentWiseReportPanelProps {
  studentId: string
  className?: string
  overallReportHref?: string
}

export function StudentWiseReportPanel({ studentId, className, overallReportHref }: StudentWiseReportPanelProps) {
  const { studentMaster, loadStudentReport, loading: masterLoading } = useAnalytics()
  const [report, setReport] = useState<StudentWiseReport | null>(null)
  const [reportLoading, setReportLoading] = useState(true)

  const profile = studentMaster.find((s) => s.id === studentId)

  useEffect(() => {
    setReportLoading(true)
    void loadStudentReport(studentId)
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setReportLoading(false))
  }, [studentId, loadStudentReport])

  if (masterLoading || reportLoading) {
    return (
      <AppCard className={className}>
        <PageLoader />
      </AppCard>
    )
  }

  if (!profile || !report) {
    return (
      <AppCard className={className}>
        <p className="text-sm text-muted-foreground">No report data available for this student.</p>
      </AppCard>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      <AppCard>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-accent">Student report</div>
            <div className="font-display text-2xl mt-1">{profile.name}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {profile.board} · Grade {profile.grade} · {profile.batch} · {profile.academicYear}
            </p>
            {profile.schoolName && (
              <p className="text-xs text-muted-foreground mt-0.5">{profile.schoolName}</p>
            )}
          </div>
          <HealthBadge status={report.status} score={report.health} />
        </div>
      </AppCard>

      <div className="grid md:grid-cols-4 gap-4">
        <AppStat label="Academic health" value={report.health} unit="/100" tone="accent" />
        <AppStat label="Readiness" value={report.readiness} unit="%" />
        <AppStat
          label="Improvement"
          value={`${report.improvement > 0 ? '+' : ''}${report.improvement}%`}
          tone={report.improvement >= 0 ? 'leaf' : 'rose'}
        />
        <AppStat label="Avg accuracy" value={report.avgAccuracy} unit="%" />
      </div>

      <AnalyticsInsightsCard
        title="Report highlights"
        bullets={[
          report.insight,
          report.strongTopics.length > 0
            ? `Strong in ${report.strongTopics.slice(0, 2).join(', ')}.`
            : 'Strong topics will appear after more assessments.',
          report.weakTopics.length > 0
            ? `Focus on ${report.weakTopics.slice(0, 2).join(', ')}.`
            : 'No weak topics flagged yet.',
        ].filter(Boolean)}
      />

      <AppCard>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h3 className="font-display text-lg">Quick insight</h3>
          </div>
          {overallReportHref && (
            <Link to={overallReportHref} className="text-xs text-accent hover:underline">
              Overall report →
            </Link>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{report.insight}</p>
      </AppCard>

      <div className="grid md:grid-cols-2 gap-4">
        <AppCard>
          <div className="flex items-center gap-2 text-leaf mb-3">
            <TrendingUp className="w-4 h-4" />
            <h4 className="font-medium">Strong topics</h4>
          </div>
          <ul className="text-sm space-y-1">
            {report.strongTopics.map((t) => (
              <li key={t}>· {t}</li>
            ))}
          </ul>
        </AppCard>
        <AppCard>
          <div className="flex items-center gap-2 text-rose mb-3">
            <TrendingDown className="w-4 h-4" />
            <h4 className="font-medium">Weak topics</h4>
          </div>
          <ul className="text-sm space-y-1">
            {report.weakTopics.map((t) => (
              <li key={t}>· {t}</li>
            ))}
          </ul>
        </AppCard>
      </div>

      {report.recentTests.length > 0 && (
        <AppCard>
          <h3 className="font-display text-lg mb-4">Recent tests</h3>
          <div className="space-y-2">
            {report.recentTests.map((test) => (
              <div key={`${test.title}-${test.date}`} className="flex justify-between text-sm border-b border-border pb-2">
                <div>
                  <p className="font-medium">{test.title}</p>
                  <p className="text-xs text-muted-foreground">{test.date} · {test.subject}</p>
                </div>
                <span className="font-mono-data">{test.accuracy}%</span>
              </div>
            ))}
          </div>
        </AppCard>
      )}

      {report.criticalGaps > 0 && (
        <AppCard className="border-rose/30">
          <div className="flex items-center gap-2 text-rose">
            <AlertTriangle className="w-4 h-4" />
            <p className="text-sm font-medium">{report.criticalGaps} critical gap{report.criticalGaps !== 1 ? 's' : ''} need attention</p>
          </div>
        </AppCard>
      )}
    </div>
  )
}