import type { ReactNode } from 'react'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts'
import type { AssessmentReport, OverallPerformanceReport } from '@/types'
import { fallbackAssessmentSummaryTa } from '@/lib/reportBilingual'
import { formatReportDate } from '@/lib/reportFormatters'
import { formatSubjectCount } from '@/lib/reportLabels'
import { useReportLabels } from '@/lib/useReportLabels'
import { ReportNarrative } from '@/components/reports/ReportLanguageToggle'
import {
  LgBoardTable,
  LgSection,
} from '@/modules/reports/learningGenome/LearningGenomeShell'
import {
  barColor,
  pctGrade,
  ReportScoreBar,
  ReportVsClass,
} from '@/modules/reports/learningGenome/reportShared'

export { formatReportDate } from '@/lib/reportFormatters'

function subjectTableRows(report: AssessmentReport): ReactNode[][] {
  return report.subjectScores.map((row) => [
    <span key={`${report.id}-${row.subject}-n`} className="lg-subj-cell">
      {row.subject}
    </span>,
    `${row.score} / ${row.maxScore}`,
    `${row.accuracy}%`,
    <ReportScoreBar key={`${report.id}-${row.subject}-b`} pct={row.accuracy} />,
    <span key={`${report.id}-${row.subject}-g`} className="lg-serif font-semibold">
      {pctGrade(row.accuracy)}
    </span>,
    <ReportVsClass
      key={`${report.id}-${row.subject}-v`}
      studentPct={row.accuracy}
      classAvg={report.classAvg}
    />,
  ])
}

/** Full assessment insights: per-test tables, history, trend + affinity graphs. */
export function StudentAssessmentInsightsBody({
  overall,
  assessments,
}: {
  overall: OverallPerformanceReport
  assessments: AssessmentReport[]
}) {
  const { L, language, subjectHeaders, historyHeaders } = useReportLabels()

  const ordered = [...assessments].sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
  )
  const latest = ordered.length > 0 ? ordered[ordered.length - 1] : null

  const examHistory = ordered.map((a, idx, arr) => {
    const prev = idx > 0 ? arr[idx - 1] : null
    const delta = prev == null ? null : a.accuracy - prev.accuracy
    return {
      title: a.assessmentTitle,
      date: formatReportDate(a.submittedAt, language),
      overall: a.accuracy,
      subjects: Math.max(1, a.subjectScores.length),
      vsPrev: delta,
      raw: a,
    }
  })

  const trendData = examHistory.map((e) => ({
    month: e.date,
    score: e.overall,
  }))

  const comparisonBars = ordered.map((a) => ({
    name:
      a.assessmentTitle.length > 14
        ? `${a.assessmentTitle.slice(0, 12)}…`
        : a.assessmentTitle,
    score: a.accuracy,
    classAvg: a.classAvg ?? 0,
  }))

  return (
    <>
      {latest && (
        <LgSection
          id="assessment-wise"
          eyebrow={L.eyebrowAssessmentWise}
          title={latest.assessmentTitle}
          description={
            language === 'ta'
              ? 'இந்த தேர்வுக்கான பாட மதிப்பெண்கள் — அதே தேர்வில் வகுப்பு சராசரியுடன் ஒப்பீடு.'
              : 'Subject marks for this assessment — compared to the class average on the same test.'
          }
        >
          {latest.subjectScores.length > 0 ? (
            <LgBoardTable headers={subjectHeaders} rows={subjectTableRows(latest)} />
          ) : (
            <LgBoardTable
              headers={subjectHeaders}
              rows={[
                [
                  <span key="s" className="lg-subj-cell">
                    {latest.subject}
                  </span>,
                  `${latest.score} / ${latest.maxScore}`,
                  `${latest.accuracy}%`,
                  <ReportScoreBar key="b" pct={latest.accuracy} />,
                  <span key="g" className="lg-serif font-semibold">
                    {pctGrade(latest.accuracy)}
                  </span>,
                  <ReportVsClass key="v" studentPct={latest.accuracy} classAvg={latest.classAvg} />,
                ],
              ]}
            />
          )}
          {latest.summary && (
            <div className="mt-4">
              <ReportNarrative
                id="report-lang-focus"
                english={latest.summary}
                tamil={latest.summaryTa || fallbackAssessmentSummaryTa(latest)}
              />
            </div>
          )}
        </LgSection>
      )}

      <section className="lg-section" id="trend-map">
        <div className="lg-eyebrow">{L.eyebrowTrendMap}</div>
        <h2 className="lg-section-title lg-serif">{L.titleSubjectAffinity}</h2>
        <p className="lg-section-desc">{L.descSubjectAffinity}</p>
        <div className="lg-detail-grid">
          <div className="lg-panel-block">
            <h4>{L.subjectAffinity}</h4>
            {overall.subjectHealth.length === 0 ? (
              <p className="text-sm text-[color:var(--lg-text-muted)]">{L.noSubjectScores}</p>
            ) : (
              overall.subjectHealth.map((s) => (
                <div key={s.name} className="lg-affinity-row">
                  <div className="sname">{s.name}</div>
                  <div className="lg-affinity-track">
                    <div
                      className="lg-affinity-fill"
                      style={{ width: `${s.health}%`, background: barColor(s.health) }}
                    />
                  </div>
                  <div className="lg-affinity-val">{s.health}%</div>
                </div>
              ))
            )}
          </div>
          <div className="lg-panel-block">
            <h4>{L.examPerformanceTrend}</h4>
            {trendData.length > 0 ? (
              <div style={{ width: '100%', minWidth: 280, height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,26,21,0.12)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#3f3c34' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#3f3c34' }} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#0B1F3A"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#C9A24B' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-[color:var(--lg-text-muted)]">{L.trendAfterMore}</p>
            )}
          </div>
        </div>

        {comparisonBars.length > 0 && (
          <div className="lg-chart-panel mt-4">
            <h4 className="lg-mono text-[0.62rem] uppercase tracking-widest text-[var(--lg-amber)] mb-2">
              {L.allAssessmentsChart}
            </h4>
            <div style={{ width: '100%', minWidth: 280, height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonBars}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,26,21,0.12)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#3f3c34' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#3f3c34' }} />
                  <Bar dataKey="score" fill="#0B1F3A" name={L.chartYourScore} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="classAvg" fill="#C9A24B" name={L.chartClassAvg} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      {examHistory.length > 0 && (
        <LgSection
          id="history"
          eyebrow={L.eyebrowExamHistory}
          title={L.titlePastExams}
          description={L.descPastExams}
        >
          <LgBoardTable
            headers={historyHeaders}
            rows={examHistory.map((exam, idx) => [
              String(idx + 1),
              exam.title,
              exam.date,
              `${exam.overall}%`,
              <ReportScoreBar key={`${exam.title}-bar`} pct={exam.overall} gold />,
              formatSubjectCount(exam.subjects, language),
              exam.vsPrev == null ? (
                <span key={`${idx}-d`} className="lg-vs-flat">
                  —
                </span>
              ) : (
                <span key={`${idx}-d`} className={exam.vsPrev >= 0 ? 'lg-vs-up' : 'lg-vs-down'}>
                  {exam.vsPrev >= 0 ? '▲' : '▼'} {exam.vsPrev >= 0 ? '+' : ''}
                  {exam.vsPrev.toFixed(1)}%
                </span>
              ),
            ])}
          />
        </LgSection>
      )}

      {ordered.length > 0 && (
        <LgSection
          id="all-assessments"
          eyebrow={L.eyebrowAllAssessments}
          title={L.titleEveryAssessment}
          description={L.descEveryAssessment}
        >
          {ordered.map((a) => (
            <div key={a.id} className="mb-6 last:mb-0" data-pdf-block>
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                <h3 className="lg-serif text-lg font-semibold text-[var(--lg-navy)]">
                  {a.assessmentTitle}
                </h3>
                <p className="lg-mono text-[0.65rem] uppercase tracking-wider text-[color:var(--lg-text-muted)]">
                  {a.subject} · {formatReportDate(a.submittedAt, language)}
                  {a.rankInClass != null && a.totalInClass != null
                    ? ` · ${L.rankOf}${a.rankInClass}/${a.totalInClass}`
                    : ''}
                  {` · ${a.accuracy}%`}
                </p>
              </div>
              <LgBoardTable
                headers={subjectHeaders}
                rows={
                  a.subjectScores.length > 0
                    ? subjectTableRows(a)
                    : [
                        [
                          <span key={`${a.id}-n`} className="lg-subj-cell">
                            {a.subject}
                          </span>,
                          `${a.score} / ${a.maxScore}`,
                          `${a.accuracy}%`,
                          <ReportScoreBar key={`${a.id}-b`} pct={a.accuracy} />,
                          <span key={`${a.id}-g`} className="lg-serif font-semibold">
                            {pctGrade(a.accuracy)}
                          </span>,
                          <ReportVsClass
                            key={`${a.id}-v`}
                            studentPct={a.accuracy}
                            classAvg={a.classAvg}
                          />,
                        ],
                      ]
                }
              />
              {a.summary && (
                <ReportNarrative
                  english={a.summary}
                  tamil={a.summaryTa || fallbackAssessmentSummaryTa(a)}
                  className="mt-3"
                />
              )}
              {(a.strongTopics.length > 0 || a.weakTopics.length > 0) && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="lg-panel-block">
                    <h4>{L.strongTopics}</h4>
                    <p className="text-sm text-[color:var(--lg-text-muted)]">
                      {a.strongTopics.length > 0 ? a.strongTopics.join(' · ') : L.noneFlagged}
                    </p>
                  </div>
                  <div className="lg-panel-block">
                    <h4>{L.focusTopics}</h4>
                    <p className="text-sm text-[color:var(--lg-text-muted)]">
                      {a.weakTopics.length > 0 ? a.weakTopics.join(' · ') : L.noneFlagged}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </LgSection>
      )}
    </>
  )
}
