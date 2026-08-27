import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Award, Eye, FileText, TrendingUp } from 'lucide-react'
import { ReportLoader } from '@/components/ui/PrismLoader'
import { AppModal } from '@/components/ui/AppModal'
import { btnClass } from '@/components/ui/Button'
import { analyticsApi } from '@/lib/api/analyticsApi'
import type { AssessmentReport, OverallPerformanceReport } from '@/types'
import { fallbackAssessmentSummaryTa } from '@/lib/reportBilingual'
import { formatReportDate } from '@/lib/reportFormatters'
import { useReportLabels } from '@/lib/useReportLabels'
import { cn } from '@/lib/cn'
import { LgReportLayout } from '@/modules/reports/learningGenome/LearningGenomeShell'
import { OverallReportContent } from '@/modules/reports/OverallPerformanceReportPage'
import { AssessmentReportBody } from '@/modules/reports/AssessmentReportPage'

type ReportTab = 'overview' | 'academic'

interface StudentPerformanceReportPageProps {
  studentId?: string
  reportsPathPrefix: string
  reportsListHref: string
}

export function StudentPerformanceReportPage({
  studentId,
  reportsPathPrefix,
  reportsListHref,
}: StudentPerformanceReportPageProps) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { L, language } = useReportLabels()

  const tabParam = searchParams.get('tab')
  const activeTab: ReportTab = tabParam === 'academic' ? 'academic' : 'overview'
  const previewId = searchParams.get('preview')

  const [loading, setLoading] = useState(true)
  const [overall, setOverall] = useState<OverallPerformanceReport | null>(null)
  const [assessmentReports, setAssessmentReports] = useState<AssessmentReport[]>([])
  const [previewReport, setPreviewReport] = useState<AssessmentReport | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void Promise.all([
      analyticsApi.overallReport(studentId).catch(() => null),
      analyticsApi.assessmentReports(studentId).catch(() => [] as AssessmentReport[]),
    ])
      .then(([overallData, assessments]) => {
        if (cancelled) return
        setOverall(overallData)
        setAssessmentReports(assessments)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [studentId])

  const setTab = useCallback(
    (tab: ReportTab) => {
      const next = new URLSearchParams(searchParams)
      next.set('tab', tab)
      next.delete('preview')
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const openPreview = useCallback(
    (assessmentId: string) => {
      const next = new URLSearchParams(searchParams)
      next.set('tab', 'academic')
      next.set('preview', assessmentId)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const closePreview = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    next.delete('preview')
    setSearchParams(next, { replace: true })
    setPreviewReport(null)
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (!previewId) {
      setPreviewReport(null)
      return
    }
    let cancelled = false
    setPreviewLoading(true)
    void analyticsApi
      .assessmentReport(previewId, studentId)
      .then((data) => {
        if (!cancelled) setPreviewReport(data)
      })
      .catch(() => {
        if (!cancelled) setPreviewReport(null)
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [previewId, studentId])

  const studentName = overall?.studentName ?? 'Student'
  const avgScore = overall?.avgAccuracy ?? 0
  const topScore = useMemo(
    () =>
      assessmentReports.length
        ? Math.max(...assessmentReports.map((r) => r.accuracy))
        : avgScore,
    [assessmentReports, avgScore],
  )

  if (loading) {
    return <ReportLoader label="Loading student report…" />
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="rounded-2xl border border-border bg-secondary/20 p-4 sm:p-5">
        <header className="flex flex-col gap-4 border-b border-border/80 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={() => navigate(reportsListHref)}
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-secondary"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <FileText className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                {L.reportForStudent} · {studentName}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {overall
                  ? `${overall.board} · ${overall.grade} · ${overall.batch}`
                  : 'Assessment-wise and overall performance reports'}
              </p>
            </div>
          </div>
        </header>

        <div className="mt-5 overflow-hidden rounded-xl border border-border bg-background">
          <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <StatCell
              icon={FileText}
              value={assessmentReports.length || '—'}
              label={L.assessments}
            />
            <StatCell icon={TrendingUp} value={`${avgScore}%`} label={L.overallScore} />
            <StatCell icon={Award} value={`${topScore}%`} label={L.yourScore} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background p-2">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Report sections">
          {(
            [
              { id: 'overview' as const, label: L.tabOverview },
              { id: 'academic' as const, label: L.tabAcademicReport },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setTab(id)}
              className={cn(
                'rounded-lg px-4 py-2.5 text-sm font-medium transition',
                activeTab === id
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h3 className="font-display text-lg font-semibold text-foreground">{L.titleOverallSection}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{L.descOverallSection}</p>
          </section>

          {overall ? (
            <LgReportLayout
              bilingual
              printTitle={`${studentName} — Overall performance report`}
              showExport
              navLinks={(labels) => [
                { href: '#trend-map', label: labels.navTrend },
                { href: '#history', label: labels.navHistory },
                { href: '#summary', label: labels.navSummary },
                { href: '#forecast', label: labels.navForecast },
                { href: '#knowledge-layer', label: labels.navKnowledge },
              ]}
            >
              <OverallReportContent
                report={overall}
                assessmentReports={assessmentReports}
                backHref={reportsListHref}
                backLabel="All students"
                embedded
              />
            </LgReportLayout>
          ) : (
            <section className="rounded-xl border border-border bg-background p-6 text-sm text-muted-foreground">
              {L.reportUnavailable}
            </section>
          )}
        </div>
      )}

      {activeTab === 'academic' && (
        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h3 className="font-display text-lg font-semibold text-foreground">{L.titleAcademicSection}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{L.descAcademicSection}</p>
          </section>

          {assessmentReports.length === 0 ? (
            <section className="rounded-xl border border-border bg-background p-6 text-sm text-muted-foreground">
              {L.descCompleteAssessments}
            </section>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {assessmentReports.map((report) => (
                <article
                  key={report.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm sm:flex-row"
                >
                  <div className="flex min-w-0 flex-1 gap-3 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-display font-semibold text-foreground line-clamp-2">
                        {report.assessmentTitle}
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {L.reportKindAssessment}
                        {' · '}
                        {formatReportDate(report.submittedAt, language)}
                        {' · '}
                        {report.accuracy}%
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                        {language === 'ta'
                          ? report.summaryTa || fallbackAssessmentSummaryTa(report)
                          : report.summary}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 border-t border-border p-3 sm:flex-col sm:justify-center sm:border-l sm:border-t-0">
                    <button
                      type="button"
                      onClick={() => openPreview(report.assessmentId)}
                      className={`${btnClass.secondary} text-xs px-3 py-1.5 inline-flex items-center gap-1.5 w-full sm:w-auto justify-center`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {L.viewReport}
                    </button>
                    <Link
                      to={`${reportsPathPrefix}/assessment/${report.assessmentId}`}
                      className={`${btnClass.primary} text-xs px-3 py-1.5 inline-flex items-center gap-1.5 w-full sm:w-auto justify-center`}
                    >
                      {L.openFullReport}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      <AppModal
        open={Boolean(previewId)}
        onClose={closePreview}
        title={previewReport?.assessmentTitle ?? L.reportKindAssessment}
        description={
          previewReport
            ? `${previewReport.subject} · ${formatReportDate(previewReport.submittedAt, language)}`
            : undefined
        }
        size="full"
        bodyClassName="max-h-[75vh] overflow-y-auto"
      >
        {previewLoading ? (
          <ReportLoader label="Loading assessment report…" />
        ) : previewReport ? (
          <LgReportLayout
            bilingual
            printTitle={`${previewReport.assessmentTitle} — Assessment report`}
            showExport
            navLinks={(labels) => [
              { href: '#narrative', label: labels.navNarrative },
              { href: '#knowledge-layer', label: labels.navKnowledge },
            ]}
          >
            <AssessmentReportBody
              report={previewReport}
              backHref={reportsPathPrefix}
              backLabel="Reports"
              embedded
            />
          </LgReportLayout>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">{L.reportNotFound}</p>
        )}
      </AppModal>
    </div>
  )
}

function StatCell({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof FileText
  value: string | number
  label: string
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-xl font-semibold leading-none text-foreground">{value}</p>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  )
}
