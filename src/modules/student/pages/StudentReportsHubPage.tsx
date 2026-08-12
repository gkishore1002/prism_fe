import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ReportLoader } from '@/components/ui/PrismLoader'
import { AppCard } from '@/components/layout/AppShell'
import { analyticsApi } from '@/lib/api/analyticsApi'
import type { StudentAssessmentSummary } from '@/types'
import { formatReportDate } from '@/modules/reports/learningGenome/StudentAssessmentInsightsBody'

export function StudentReportsHubPage() {
  const [loading, setLoading] = useState(true)
  const [summaries, setSummaries] = useState<
    (StudentAssessmentSummary & { id?: string })[]
  >([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void analyticsApi
      .assessmentReports()
      .then(async (reports) => {
        const items = await Promise.all(
          reports.map(async (r) => {
            try {
              return await analyticsApi.assessmentReportSummary(r.assessmentId)
            } catch {
              return {
                assessmentId: r.assessmentId,
                assessmentTitle: r.assessmentTitle,
                subject: r.subject,
                submittedAt: r.submittedAt,
                accuracy: r.accuracy,
                studentMessageEn:
                  r.studentMessageEn ?? `You scored ${r.accuracy}% on ${r.assessmentTitle}.`,
                studentMessageTa:
                  r.studentMessageTa ??
                  `${r.assessmentTitle} தேர்வில் நீங்கள் ${r.accuracy}% மதிப்பெண் பெற்றுள்ளீர்கள்.`,
                cscReferralEn: 'For a detailed report, please visit your CSC center.',
                cscReferralTa: 'விரிவான அறிக்கைக்கு CSC மையத்தை அணுகவும்.',
              }
            }
          }),
        )
        if (!cancelled) setSummaries(items)
      })
      .catch(() => {
        if (!cancelled) setSummaries([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <ReportLoader label="Loading your reports…" />
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-accent font-medium mb-1">
          Your reports
        </p>
        <h1 className="font-display text-2xl text-foreground">Assessment summaries</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Short results only. For detailed reports, visit your CSC center with a parent or guardian.
        </p>
      </header>

      {summaries.length === 0 ? (
        <AppCard className="text-center py-10">
          <p className="text-sm text-muted-foreground">No assessment reports yet.</p>
        </AppCard>
      ) : (
        <div className="space-y-3">
          {summaries.map((report) => (
            <Link
              key={report.assessmentId}
              to={`/student/reports/assessment/${report.assessmentId}`}
              className="block"
            >
              <AppCard className="hover:border-accent/40 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">{report.assessmentTitle}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {report.subject} · {formatReportDate(report.submittedAt)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {report.studentMessageEn}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-2xl text-accent">{report.accuracy}%</p>
                  </div>
                </div>
              </AppCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
