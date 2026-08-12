import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ReportLoader } from '@/components/ui/PrismLoader'
import { analyticsApi } from '@/lib/api/analyticsApi'
import type { AssessmentReport, OverallPerformanceReport } from '@/types'
import { fallbackAssessmentSummaryTa } from '@/lib/reportBilingual'
import {
  formatHeroQuickFacts,
  formatReportDate,
} from '@/lib/reportFormatters'
import { translateHealthStatus } from '@/lib/reportLabels'
import { useReportLabels } from '@/lib/useReportLabels'
import {
  LgFooter,
  LgHero,
  LgNarrative,
  LgReportLayout,
  LgSection,
} from '@/modules/reports/learningGenome/LearningGenomeShell'
import { StudentAssessmentInsightsBody } from '@/modules/reports/learningGenome/StudentAssessmentInsightsBody'

interface ReportsHubPageProps {
  studentId?: string
  reportsPathPrefix: string
  title?: string
  subtitle?: string
}

function ReportsHubContent({
  reportsPathPrefix,
  title,
  subtitle,
  overall,
  assessmentReports,
}: {
  reportsPathPrefix: string
  title: string
  subtitle: string
  overall: OverallPerformanceReport | null
  assessmentReports: AssessmentReport[]
}) {
  const { L, language } = useReportLabels()

  const displayName = overall?.studentName ?? title
  const latest = [...assessmentReports].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  )[0]

  const dates = assessmentReports
    .map((a) => a.submittedAt)
    .filter(Boolean)
    .sort()
  const windowLabel =
    dates.length === 0
      ? '—'
      : dates.length === 1
        ? formatReportDate(dates[0], language)
        : `${formatReportDate(dates[0], language)} – ${formatReportDate(dates[dates.length - 1], language)}`

  return (
    <>
      <LgHero
        reportKind={L.reportKindEngine}
        title={displayName}
        quickFacts={
          overall
            ? formatHeroQuickFacts(
                {
                  board: overall.board,
                  grade: overall.grade,
                  batch: overall.batch,
                  status: overall.status,
                },
                language,
              )
            : subtitle
        }
        detailLines={[
          `${L.assessmentWindow}: ${windowLabel}`,
          latest
            ? `${L.thisAssessment}: ${latest.assessmentTitle} · ${L.conducted} ${formatReportDate(latest.submittedAt, language)}`
            : L.awaitingAssessments,
        ]}
        stats={
          overall
            ? [
                { value: `${overall.avgAccuracy}%`, label: L.overallScore },
                { value: translateHealthStatus(overall.status, language), label: L.consistency },
                { value: overall.improving ? L.improving : L.stable, label: L.learningTrend },
                { value: `${overall.readiness}%`, label: L.predictedNext },
                { value: `${overall.health}`, label: L.confidenceScore },
                { value: `+${overall.improvement}%`, label: L.growthPotential },
              ]
            : [
                { value: assessmentReports.length, label: L.assessments },
                { value: '—', label: L.overallScore },
                { value: '—', label: L.learningTrend },
                { value: '—', label: L.predictedNext },
                { value: '—', label: L.confidenceScore },
                { value: '—', label: L.growthPotential },
              ]
        }
        statsPlacement="below"
        showSeal
      />

      {overall && (
        <StudentAssessmentInsightsBody overall={overall} assessments={assessmentReports} />
      )}

      {!overall && assessmentReports.length === 0 && (
        <LgSection eyebrow={L.eyebrowReports} title={L.titleNothingYet}>
          <LgNarrative>{L.descNothingYet}</LgNarrative>
        </LgSection>
      )}

      <LgSection
        id="assessments"
        eyebrow={L.eyebrowAssessmentReports}
        title={L.titleOnePerTest}
        description={L.descOnePerTest}
      >
        {assessmentReports.length === 0 ? (
          <LgNarrative>{L.descCompleteAssessments}</LgNarrative>
        ) : (
          <div className="lg-card-row">
            {assessmentReports.map((report) => (
              <Link
                key={report.id}
                to={`${reportsPathPrefix}/assessment/${report.assessmentId}`}
                className="lg-report-card"
              >
                <div className="bar" />
                <div className="n">
                  {report.accuracy}
                  <span className="text-lg text-[var(--lg-gold)]">%</span>
                </div>
                <div className="lbl">{report.assessmentTitle}</div>
                <div className="desc">
                  {report.subject} · {formatReportDate(report.submittedAt, language)}
                  {report.rankInClass != null && report.totalInClass != null && (
                    <> · {L.rankOf}{report.rankInClass}/{report.totalInClass}</>
                  )}
                </div>
                <p className="desc mt-1 line-clamp-2" lang={language === 'ta' ? 'ta' : 'en'}>
                  {language === 'ta'
                    ? report.summaryTa || fallbackAssessmentSummaryTa(report)
                    : report.summary}
                </p>
              </Link>
            ))}
          </div>
        )}
        {overall && (
          <div className="mt-4">
            <Link to={`${reportsPathPrefix}/overall`} className="lg-back-link print:hidden">
              {L.openFullOverall}
            </Link>
          </div>
        )}
      </LgSection>

      <LgFooter
        windowLabel={windowLabel}
        cohortNote={overall ? `${overall.board} · ${overall.grade} · ${overall.batch}` : undefined}
      />
    </>
  )
}

export function ReportsHubPage({
  studentId,
  reportsPathPrefix,
  title = 'Your reports',
  subtitle = 'Assessment-wise results and your overall performance up to date.',
}: ReportsHubPageProps) {
  const [loading, setLoading] = useState(true)
  const [overall, setOverall] = useState<OverallPerformanceReport | null>(null)
  const [assessmentReports, setAssessmentReports] = useState<AssessmentReport[]>([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void Promise.all([
      analyticsApi.overallReport(studentId),
      analyticsApi.assessmentReports(studentId),
    ])
      .then(([overallData, assessmentData]) => {
        if (cancelled) return
        setOverall(overallData)
        setAssessmentReports(assessmentData)
      })
      .catch(() => {
        if (!cancelled) {
          setOverall(null)
          setAssessmentReports([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [studentId])

  if (loading) {
    return <ReportLoader label="Loading reports…" />
  }

  const displayName = overall?.studentName ?? title

  return (
    <LgReportLayout
      bilingual
      printTitle={`${displayName} — Learning Genome Report`}
      showExport
      navLinks={(L) => [
        { href: '#assessment-wise', label: L.navAssessment },
        { href: '#trend-map', label: L.navTrend },
        { href: '#history', label: L.navHistory },
        { href: '#all-assessments', label: L.navAllTests },
        { href: '#assessments', label: L.navCards },
      ]}
    >
      <ReportsHubContent
        reportsPathPrefix={reportsPathPrefix}
        title={title}
        subtitle={subtitle}
        overall={overall}
        assessmentReports={assessmentReports}
      />
    </LgReportLayout>
  )
}
