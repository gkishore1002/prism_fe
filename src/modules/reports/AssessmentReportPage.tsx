import { useEffect, useState } from 'react'
import { ReportLoader } from '@/components/ui/PrismLoader'
import { analyticsApi } from '@/lib/api/analyticsApi'
import type { AssessmentReport } from '@/types'
import { AssessmentReportNarratives } from '@/components/reports/AssessmentReportNarratives'
import { formatReportDate, formatVsClass } from '@/lib/reportFormatters'
import { useReportLabels } from '@/lib/useReportLabels'
import {
  LgBoardTable,
  LgFooter,
  LgHero,
  LgKpiRow,
  LgReportLayout,
  LgSection,
} from '@/modules/reports/learningGenome/LearningGenomeShell'
import { pctGrade, ReportScoreBar } from '@/modules/reports/learningGenome/reportShared'

interface AssessmentReportPageProps {
  assessmentId: string
  studentId?: string
  backHref: string
  backLabel: string
}

function AssessmentReportBody({
  report,
  backHref,
  backLabel,
}: {
  report: AssessmentReport
  backHref: string
  backLabel: string
}) {
  const { L, language, subjectHeaders } = useReportLabels()

  const stats: { value: string | number; unit?: string; label: string }[] = [
    { value: report.accuracy, unit: '%', label: L.yourScore },
    { value: `${report.score}/${report.maxScore}`, label: L.rawMarks },
  ]
  if (report.classAvg != null) {
    stats.push({ value: report.classAvg, unit: '%', label: L.classAverage })
  }
  if (report.rankInClass != null && report.totalInClass != null) {
    stats.push({
      value: `#${report.rankInClass}`,
      unit: `${L.of} ${report.totalInClass}`,
      label: L.classRank,
    })
  }

  return (
    <>
      <LgHero
        reportKind={L.reportKindEngine}
        title={report.assessmentTitle}
        quickFacts={`${report.subject} · ${L.submitted} ${formatReportDate(report.submittedAt, language)}`}
        detailLines={[
          `${L.thisAssessment}: ${report.assessmentTitle} · ${report.timeSpentMin} ${L.min}`,
          report.rankInClass != null && report.totalInClass != null
            ? `${L.classStanding}: #${report.rankInClass} ${L.of} ${report.totalInClass}`
            : `${L.thSubject}: ${report.subject}`,
        ]}
        stats={[
          ...stats.map((s) => ({
            value: `${s.value}${s.unit ?? ''}`,
            label: s.label,
          })),
          ...(stats.length < 6
            ? [{ value: `${report.timeSpentMin}m`, label: L.timeSpent }]
            : []),
        ].slice(0, 6)}
        statsPlacement="below"
        showSeal
        backHref={backHref}
        backLabel={backLabel}
      />

      <LgSection
        id="narrative"
        eyebrow={L.eyebrowSummary}
        title={L.titleAssessmentNarrative}
        description={report.summarySource === 'vertex' ? L.descAiStored : L.descRuleAssessment}
      >
        <AssessmentReportNarratives report={report} />
      </LgSection>

      <LgSection
        id="scores"
        eyebrow={L.eyebrowAssessmentWise}
        title={L.titleSubjectBreakdown}
        description={L.descSubjectBreakdown}
      >
        <LgBoardTable
          headers={subjectHeaders}
          rows={report.subjectScores.map((row) => {
            const grade = pctGrade(row.accuracy)
            const delta =
              report.classAvg == null ? null : Math.round((row.accuracy - report.classAvg) * 10) / 10
            return [
              <span key={`${row.subject}-n`} className="lg-subj-cell">
                {row.subject}
              </span>,
              `${row.score} / ${row.maxScore}`,
              `${row.accuracy}%`,
              <ReportScoreBar key={`${row.subject}-b`} pct={row.accuracy} />,
              <span key={`${row.subject}-g`} className="lg-serif font-semibold">
                {grade}
              </span>,
              delta == null ? (
                <span key={`${row.subject}-v`} className="lg-vs-flat">
                  —
                </span>
              ) : (
                <span
                  key={`${row.subject}-v`}
                  className={delta >= 0 ? 'lg-vs-up' : 'lg-vs-down'}
                >
                  {formatVsClass(delta, language)}
                </span>
              ),
            ]
          })}
        />
      </LgSection>

      <LgSection eyebrow={L.eyebrowTopics} title={L.titleStrongFocus}>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <h4 className="lg-mono text-[0.62rem] uppercase tracking-widest text-[var(--lg-emerald)] mb-2">
              {L.strongTopics}
            </h4>
            <LgKpiRow
              items={
                report.strongTopics.length > 0
                  ? report.strongTopics.map((t) => ({ value: '✓', label: t }))
                  : [{ value: '—', label: L.noneIdentified }]
              }
            />
          </div>
          <div>
            <h4 className="lg-mono text-[0.62rem] uppercase tracking-widest text-[#EF4444] mb-2">
              {L.focusTopics}
            </h4>
            <LgKpiRow
              items={
                report.weakTopics.length > 0
                  ? report.weakTopics.map((t) => ({ value: '!', label: t }))
                  : [{ value: '—', label: L.noneFlagged }]
              }
            />
          </div>
        </div>
      </LgSection>

      <LgFooter />
    </>
  )
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
    return <ReportLoader label="Loading assessment report…" />
  }

  if (!report) {
    return (
      <LgReportLayout backHref={backHref} backLabel={backLabel}>
        <LgHero
          reportKind="Assessment report"
          title="Report not found"
          backHref={backHref}
          backLabel={backLabel}
        />
      </LgReportLayout>
    )
  }

  return (
    <LgReportLayout
      bilingual
      printTitle={`${report.assessmentTitle} — Assessment report`}
      backHref={backHref}
      backLabel={backLabel}
      navLinks={(L) => [
        { href: '#narrative', label: L.navNarrative },
        { href: '#scores', label: L.navAssessmentWise },
      ]}
    >
      <AssessmentReportBody
        report={report}
        backHref={backHref}
        backLabel={backLabel}
      />
    </LgReportLayout>
  )
}
