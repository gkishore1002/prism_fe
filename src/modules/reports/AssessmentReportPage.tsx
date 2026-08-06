import { useEffect, useState } from 'react'
import { PageLoader } from '@/components/ui/PrismLoader'
import { analyticsApi } from '@/lib/api/analyticsApi'
import type { AssessmentReport } from '@/types'
import {
  LgBoardTable,
  LgFooter,
  LgHero,
  LgKpiRow,
  LgNarrative,
  LgReportLayout,
  LgSection,
} from '@/modules/reports/learningGenome/LearningGenomeShell'

interface AssessmentReportPageProps {
  assessmentId: string
  studentId?: string
  backHref: string
  backLabel: string
}

export function AssessmentReportPage({
  assessmentId,
  studentId,
  backHref,
  backLabel,
}: AssessmentReportPageProps) {
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<AssessmentReport | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void analyticsApi
      .assessmentReport(assessmentId, studentId)
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
  }, [assessmentId, studentId])

  if (loading) {
    return <PageLoader label="Loading assessment report…" />
  }

  if (!report) {
    return (
      <LgReportLayout>
        <LgHero
          reportKind="Assessment report"
          title="Report not found"
          backHref={backHref}
          backLabel={backLabel}
        />
      </LgReportLayout>
    )
  }

  const stats: { value: string | number; unit?: string; label: string }[] = [
    { value: report.accuracy, unit: '%', label: 'Your score' },
    { value: `${report.score}/${report.maxScore}`, label: 'Raw marks' },
  ]
  if (report.classAvg != null) {
    stats.push({ value: report.classAvg, unit: '%', label: 'Class average' })
  }
  if (report.rankInClass != null && report.totalInClass != null) {
    stats.push({
      value: `#${report.rankInClass}`,
      unit: `of ${report.totalInClass}`,
      label: 'Class rank',
    })
  }

  return (
    <LgReportLayout>
      <LgHero
        reportKind="Assessment report"
        title={report.assessmentTitle}
        description={`${report.subject} · Score, class standing, and stored AI summary for this test.`}
        meta={[
          { label: 'Subject', value: report.subject },
          { label: 'Submitted', value: report.submittedAt },
          { label: 'Time spent', value: `${report.timeSpentMin} min` },
        ]}
        stats={stats}
        backHref={backHref}
        backLabel={backLabel}
      />

      <LgSection
        eyebrow="Summary"
        title="Assessment narrative"
        description={
          report.summarySource === 'vertex'
            ? 'AI summary stored when this assessment was submitted.'
            : 'Rule-based summary for this assessment.'
        }
      >
        <LgNarrative
          note={report.summarySource === 'vertex' ? 'Stored in database' : undefined}
        >
          {report.summary}
        </LgNarrative>
      </LgSection>

      <LgSection eyebrow="Scores" title="Subject breakdown">
        <LgBoardTable
          headers={['Subject', 'Marks', 'Accuracy']}
          rows={report.subjectScores.map((row) => [
            row.subject,
            `${row.score} / ${row.maxScore}`,
            <span key={row.subject} className="lg-mono font-semibold">
              {row.accuracy}%
            </span>,
          ])}
        />
      </LgSection>

      <LgSection eyebrow="Topics" title="Strong & focus areas">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <h4 className="lg-mono text-[0.62rem] uppercase tracking-widest text-[var(--lg-emerald)] mb-2">
              Strong topics
            </h4>
            <LgKpiRow
              items={
                report.strongTopics.length > 0
                  ? report.strongTopics.map((t) => ({ value: '✓', label: t }))
                  : [{ value: '—', label: 'None identified yet' }]
              }
            />
          </div>
          <div>
            <h4 className="lg-mono text-[0.62rem] uppercase tracking-widest text-[#EF4444] mb-2">
              Focus topics
            </h4>
            <LgKpiRow
              items={
                report.weakTopics.length > 0
                  ? report.weakTopics.map((t) => ({ value: '!', label: t }))
                  : [{ value: '—', label: 'None flagged' }]
              }
            />
          </div>
        </div>
      </LgSection>

      <LgFooter />
    </LgReportLayout>
  )
}
