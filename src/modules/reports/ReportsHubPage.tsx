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
          `${L.assessments}: ${assessmentReports.length}`,
        ]}
        stats={
          overall
            ? [
                { value: `${overall.avgAccuracy}%`, label: L.overallScore },
                { value: translateHealthStatus(overall.status, language), label: L.consistency },
                { value: overall.improving ? L.improving : L.stable, label: L.learningTrend },
                { value: `${overall.readiness}%`, label: L.predictedNext },
              ]
            : [
                { value: assessmentReports.length, label: L.assessments },
                { value: '—', label: L.overallScore },
                { value: '—', label: L.learningTrend },
                { value: '—', label: L.predictedNext },
              ]
        }
        statsPlacement="below"
        showSeal
      />

      {overall && (
        <LgSection
          id="overall"
          eyebrow={L.eyebrowExecutive}
          title={L.reportKindOverall}
          description={L.descOnePerTest}
        >
          <Link to={`${reportsPathPrefix}/overall`} className="lg-report-card block max-w-md">
            <div className="bar" />
            <div className="n">
              {overall.avgAccuracy}
              <span className="text-lg text-[var(--lg-gold)]">%</span>
            </div>
            <div className="lbl">{L.overallProfile}</div>
            <div className="desc">
              {overall.board} · {overall.grade} · {windowLabel}
            </div>
            <p className="desc mt-1">{L.openFullOverall}</p>
          </Link>
        </LgSection>
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
    // Load independently so a slow/failed overall report does not blank the hub.
    void analyticsApi
      .assessmentReports(studentId)
      .then((assessmentData) => {
        if (!cancelled) setAssessmentReports(assessmentData)
      })
      .catch(() => {
        if (!cancelled) setAssessmentReports([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    void analyticsApi
      .overallReport(studentId)
      .then((overallData) => {
        if (!cancelled) setOverall(overallData)
      })
      .catch(() => {
        if (!cancelled) setOverall(null)
      })

    return () => {
      cancelled = true
    }
  }, [studentId])

  if (loading && assessmentReports.length === 0 && !overall) {
    return <ReportLoader label="Loading reports…" />
  }

  const displayName = overall?.studentName ?? title

  return (
    <LgReportLayout
      bilingual
      printTitle={`${displayName} — Reports`}
      showExport
      navLinks={(L) => [
        ...(overall ? [{ href: '#overall', label: L.overallProfile }] : []),
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
