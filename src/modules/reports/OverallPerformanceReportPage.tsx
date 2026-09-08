import { useEffect, useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { ReportLoader } from '@/components/ui/PrismLoader'
import { analyticsApi } from '@/lib/api/analyticsApi'
import type { AssessmentReport, OverallPerformanceReport } from '@/types'
import { ReportNarrative } from '@/components/reports/ReportLanguageToggle'
import { fallbackOverallSummaryTa } from '@/lib/reportBilingual'
import {
  formatHeroQuickFacts,
  formatReportDate,
  studentInsightBulletsLocalized,
} from '@/lib/reportFormatters'
import { translateHealthStatus, translateSeverity } from '@/lib/reportLabels'
import { useReportLabels } from '@/lib/useReportLabels'
import {
  LgBoardTable,
  LgFooter,
  LgHero,
  LgInsightFeed,
  LgReportLayout,
  LgSection,
} from '@/modules/reports/learningGenome/LearningGenomeShell'
import { StudentAssessmentInsightsBody } from '@/modules/reports/learningGenome/StudentAssessmentInsightsBody'
import { KnowledgeChapterTopicBars } from '@/modules/reports/learningGenome/KnowledgeDistribution'

interface OverallPerformanceReportPageProps {
  studentId?: string
  backHref: string
  backLabel: string
}

function OverallReportContent({
  report,
  assessmentReports,
  backHref,
  backLabel,
  embedded = false,
}: {
  report: OverallPerformanceReport
  assessmentReports: AssessmentReport[]
  backHref: string
  backLabel: string
  embedded?: boolean
}) {
  const { L, language, forecastHeaders } = useReportLabels()

  const latest = [...assessmentReports].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  )[0]

  const dates = assessmentReports
    .map((a) => a.submittedAt)
    .filter(Boolean)
    .sort()
  const windowLabel =
    dates.length === 0
      ? `${report.board} · ${report.grade}`
      : dates.length === 1
        ? formatReportDate(dates[0], language)
        : `${formatReportDate(dates[0], language)} – ${formatReportDate(dates[dates.length - 1], language)}`

  const knowledgeItems = useMemo(() => {
    const fromOverall = report.topicBreakdown.map((t) => ({
      concept: t.topic,
      subject: t.subject,
      chapter: t.chapter,
      masteryPct: t.currentMastery ?? t.mastery,
    }))
    if (fromOverall.length > 0) return fromOverall
    return assessmentReports.flatMap((exam) =>
      (exam.topicScores ?? []).map((t) => ({
        concept: t.concept,
        subject: t.subject,
        chapter: t.chapter,
        masteryPct: t.masteryPct,
        correct: t.correct,
        total: t.total,
      })),
    )
  }, [report.topicBreakdown, assessmentReports])

  const topicChartData = report.topicBreakdown.slice(0, 6).map((t) => ({
    name: t.topic.length > 14 ? `${t.topic.slice(0, 12)}…` : t.topic,
    mastery: t.currentMastery ?? t.mastery,
    predicted: t.predictedScore ?? t.mastery,
  }))

  const insightBullets = studentInsightBulletsLocalized(
    { overall: report.health, status: report.status, trend: report.improving ? 1 : -1 },
    report.learningGaps,
    report.readinessPredictions,
    language,
  )

  const tagForIndex = (i: number) =>
    i === 0 ? L.tagPriority : i === 1 ? L.tagStrength : L.tagWatch

  return (
    <>
      {!embedded && (
      <LgHero
        reportKind={L.reportKindOverall}
        title={report.studentName}
        quickFacts={formatHeroQuickFacts(
          { board: report.board, grade: report.grade, batch: report.batch, status: report.status },
          language,
        )}
        detailLines={[
          `${L.assessmentWindow}: ${windowLabel}`,
          latest
            ? `${L.thisAssessment}: ${latest.assessmentTitle} · ${L.conducted} ${formatReportDate(latest.submittedAt, language)}`
            : `${L.criticalGaps}: ${report.criticalGaps} · ${L.improving}: ${report.improving ? L.yes : L.no}`,
        ]}
        stats={[
          { value: `${report.avgAccuracy}%`, label: L.overallScore },
          { value: translateHealthStatus(report.status, language), label: L.consistency },
          { value: report.improving ? L.improving : L.stable, label: L.learningTrend },
          { value: `${report.readiness}%`, label: L.predictedNext },
          { value: `${report.health}`, label: L.confidenceScore },
          { value: `+${report.improvement}%`, label: L.growthPotential },
        ]}
        statsPlacement="below"
        showSeal
        backHref={backHref}
        backLabel={backLabel}
      />
      )}

      <StudentAssessmentInsightsBody
        overall={report}
        assessments={assessmentReports}
        variant="overall"
      />

      <LgSection
        id="summary"
        eyebrow={L.eyebrowExecutive}
        title={L.titleAiNarrative}
        description={report.summarySource === 'vertex' ? L.descLiveSummary : L.descRuleSummary}
      >
        <ReportNarrative
          english={report.summary}
          tamil={
            report.summaryTa ||
            fallbackOverallSummaryTa(
              report.studentName,
              report.health,
              report.improving,
              report.criticalGaps,
            )
          }
          englishNote={report.summarySource === 'vertex' ? L.noteEnglishLiveAi : L.noteEnglishRule}
          tamilNote={report.summarySource === 'vertex' ? L.noteTamilLiveAi : L.noteTamilRule}
        />
      </LgSection>

      <LgSection
        id="insights"
        eyebrow={L.eyebrowKeySignals}
        title={L.titleInsightFeed}
        description={L.descInsightFeed}
      >
        <LgInsightFeed
          title={L.todaysInsights}
          dateLabel={L.overallProfile}
          rows={insightBullets.slice(0, 4).map((text, i) => ({
            tag: tagForIndex(i),
            tagClass: i === 0 ? 'lg-tag-risk' : i === 1 ? 'lg-tag-up' : 'lg-tag-watch',
            content: text,
          }))}
        />
      </LgSection>

      {topicChartData.length > 0 && (
        <LgSection
          id="forecast"
          eyebrow={L.eyebrowForecast}
          title={L.titleTopicReadiness}
          description={L.descTopicReadiness}
        >
          <div className="lg-chart-panel mb-3">
            <div className="lg-chart-frame" style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={topicChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,26,21,0.12)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#3f3c34' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#3f3c34' }} />
                  <Bar dataKey="mastery" fill="#E4DCC4" radius={[4, 4, 0, 0]} name={L.thMastery} />
                  <Bar dataKey="predicted" fill="#C5A059" radius={[4, 4, 0, 0]} name={L.thPredicted} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <LgBoardTable
            headers={forecastHeaders}
            rows={report.topicBreakdown.slice(0, 8).map((t) => [
              t.chapter ? `${t.chapter} · ${t.topic}` : t.topic,
              t.subject,
              `${t.currentMastery ?? t.mastery}%`,
              `${t.predictedScore ?? t.mastery}%`,
              typeof t.delta === 'number' ? `${t.delta > 0 ? '+' : ''}${t.delta}` : '—',
              <span key={`${t.topic}-c`} className="capitalize">
                {translateSeverity(t.confidence ?? 'low', language)}
              </span>,
            ])}
          />
        </LgSection>
      )}

      <section className="lg-section lg-kl-section" id="knowledge-layer">
        <div className="lg-eyebrow">Level 2 · Knowledge Layer</div>
        <h2 className="lg-section-title">The Knowledge Layer</h2>
        <p className="lg-section-desc">
          Chapter and topic mastery from tagged questions across this student&apos;s assessments.
        </p>
        <KnowledgeChapterTopicBars
          items={knowledgeItems}
          emptyNote="Chapter and topic scores appear after tagged question attempts."
        />
      </section>

      <LgFooter windowLabel={windowLabel} cohortNote={report.batch} />
    </>
  )
}

export { OverallReportContent }

export function OverallPerformanceReportPage({
  studentId,
  backHref,
  backLabel,
}: OverallPerformanceReportPageProps) {
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<OverallPerformanceReport | null>(null)
  const [assessmentReports, setAssessmentReports] = useState<AssessmentReport[]>([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void Promise.all([
      analyticsApi.overallReport(studentId),
      analyticsApi.assessmentReports(studentId).catch(() => [] as AssessmentReport[]),
    ])
      .then(([overallData, assessmentData]) => {
        if (cancelled) return
        setReport(overallData)
        setAssessmentReports(assessmentData)
      })
      .catch(() => {
        if (!cancelled) {
          setReport(null)
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

  if (loading && !report) {
    return <ReportLoader label="Building overall performance report…" />
  }

  if (!report) {
    return (
      <LgReportLayout backHref={backHref} backLabel={backLabel} showExport={false}>
        <LgHero
          reportKind="AI Academic Profiling Engine"
          title="Report unavailable"
          backHref={backHref}
          backLabel={backLabel}
          showSeal
        />
      </LgReportLayout>
    )
  }

  return (
    <LgReportLayout
      bilingual
      printTitle={`${report.studentName} — Overall performance report`}
      backHref={backHref}
      backLabel={backLabel}
      navLinks={(L) => [
        { href: '#trend-map', label: L.navTrend },
        { href: '#history', label: L.navHistory },
        { href: '#summary', label: L.navSummary },
        { href: '#insights', label: L.navAssessment },
        { href: '#forecast', label: L.navForecast },
        { href: '#knowledge-layer', label: L.navKnowledge },
      ]}
    >
      <OverallReportContent
        report={report}
        assessmentReports={assessmentReports}
        backHref={backHref}
        backLabel={backLabel}
      />
    </LgReportLayout>
  )
}
