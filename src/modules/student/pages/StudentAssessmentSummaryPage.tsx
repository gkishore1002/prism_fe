import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ReportLoader } from '@/components/ui/PrismLoader'
import { AppCard } from '@/components/layout/AppShell'
import { analyticsApi } from '@/lib/api/analyticsApi'
import type { StudentAssessmentSummary } from '@/types'
import { formatReportDate } from '@/modules/reports/learningGenome/StudentAssessmentInsightsBody'

interface StudentAssessmentSummaryPageProps {
  assessmentId: string
  backHref?: string
  backLabel?: string
}

export function StudentAssessmentSummaryPage({
  assessmentId,
  backHref = '/student/reports',
  backLabel = 'All reports',
}: StudentAssessmentSummaryPageProps) {
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<StudentAssessmentSummary | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void analyticsApi
      .assessmentReportSummary(assessmentId)
      .then((data) => {
        if (!cancelled) setReport(data)
      })
      .catch(() => {
        if (!cancelled) setReport(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [assessmentId])

  if (loading && !report) {
    return <ReportLoader label="Loading assessment summary…" />
  }

  if (!report) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <AppCard className="text-center py-10">
          <p className="text-sm text-muted-foreground">Report not available yet.</p>
          <Link to={backHref} className="text-sm text-accent hover:underline mt-4 inline-block">
            {backLabel}
          </Link>
        </AppCard>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-4">
      <Link to={backHref} className="text-sm text-accent hover:underline print:hidden">
        ← {backLabel}
      </Link>

      <AppCard className="space-y-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-accent font-medium mb-1">
            Assessment summary
          </p>
          <h1 className="font-display text-2xl text-foreground">{report.assessmentTitle}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {report.subject} · {formatReportDate(report.submittedAt)}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">English</p>
            <p className="text-sm text-foreground leading-relaxed">{report.studentMessageEn}</p>
            <p className="text-sm text-muted-foreground mt-2 italic">{report.cscReferralEn}</p>
          </div>
          <div className="border-t border-border pt-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Tamil</p>
            <p className="text-sm text-foreground leading-relaxed">{report.studentMessageTa}</p>
            <p className="text-sm text-muted-foreground mt-2 italic">{report.cscReferralTa}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Score: {report.accuracy}% · Detailed analysis is available at your CSC center.
        </p>
      </AppCard>
    </div>
  )
}
