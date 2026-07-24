import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { PageLoader } from '@/components/ui/PrismLoader'
import { analyticsApi } from '@/lib/api/analyticsApi'
import type { AssessmentReport, OverallPerformanceReport } from '@/types'
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
    return <PageLoader label="Loading reports…" />
  }

  const displayName = overall?.studentName ?? title

  return (
    <LgReportLayout>
      <LgHero
        reportKind="Academic reports"
        title={displayName}
        description={subtitle}
        meta={
          overall
            ? [
                { label: 'Board', value: overall.board },
                { label: 'Grade', value: overall.grade },
                { label: 'Batch', value: overall.batch },
              ]
            : undefined
        }
        stats={
          overall
            ? [
                { value: overall.health, unit: '/100', label: 'Health' },
                { value: overall.readiness, unit: '%', label: 'Readiness' },
                { value: `+${overall.improvement}`, unit: '%', label: 'Improvement' },
                { value: assessmentReports.length, label: 'Assessments' },
              ]
            : undefined
        }
      />

      {overall && (
        <LgSection
          eyebrow="Overall performance"
          title="Cumulative academic profile"
          description="All metrics up to date — trends, gaps, readiness, and live AI summary."
        >
          <LgNarrative
            note={
              overall.summarySource === 'vertex'
                ? 'Live AI summary · refreshes each view'
                : undefined
            }
          >
            {overall.summary}
          </LgNarrative>
          <div className="mt-3">
            <Link to={`${reportsPathPrefix}/overall`} className="lg-back-link">
              View full overall report →
            </Link>
          </div>
        </LgSection>
      )}

      <LgSection
        eyebrow="Assessment reports"
        title="One report per test"
        description="Subject score and summary stored when each assessment is submitted."
      >
        {assessmentReports.length === 0 ? (
          <LgNarrative>Complete assessments to generate assessment-wise reports.</LgNarrative>
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
                  {report.subject} · {report.submittedAt}
                  {report.rankInClass != null && report.totalInClass != null && (
                    <> · Rank #{report.rankInClass}/{report.totalInClass}</>
                  )}
                </div>
                <p className="desc mt-1 line-clamp-2">{report.summary}</p>
              </Link>
            ))}
          </div>
        )}
      </LgSection>

      <LgFooter />
    </LgReportLayout>
  )
}
