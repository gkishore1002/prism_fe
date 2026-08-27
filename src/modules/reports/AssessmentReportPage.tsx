import { useEffect, useState } from 'react'
import { ReportLoader } from '@/components/ui/PrismLoader'
import { analyticsApi } from '@/lib/api/analyticsApi'
import type { AssessmentReport } from '@/types'
import { AssessmentReportNarratives } from '@/components/reports/AssessmentReportNarratives'
import { formatReportDate } from '@/lib/reportFormatters'
import { useReportLabels } from '@/lib/useReportLabels'
import {
  LgHero,
  LgReportLayout,
} from '@/modules/reports/learningGenome/LearningGenomeShell'
import {
  KnowledgeChapterTopicBars,
  knowledgeFill,
  type KnowledgeItem,
} from '@/modules/reports/learningGenome/KnowledgeDistribution'
import { subjectColorForName } from '@/modules/tutor/lib/learningGenomeData'

interface AssessmentReportPageProps {
  assessmentId: string
  studentId?: string
  backHref: string
  backLabel: string
}

function barColorForName(name: string): string {
  return subjectColorForName(name)
}

export function AssessmentReportBody({
  report,
}: {
  report: AssessmentReport
  backHref?: string
  backLabel?: string
  embedded?: boolean
}) {
  const { L, language } = useReportLabels()
  const topics: KnowledgeItem[] = (report.topicScores ?? []).map((row) => ({
    concept: row.concept,
    subject: row.subject,
    chapter: row.chapter,
    masteryPct: row.masteryPct,
    correct: row.correct,
    total: row.total,
  }))
  const vsClass =
    report.classAvg == null ? null : Math.round((report.accuracy - report.classAvg) * 10) / 10
  const displayName = report.studentName || report.assessmentTitle
  const weakTopics = [...topics].sort((a, b) => a.masteryPct - b.masteryPct).slice(0, 5)

  return (
    <div className="lg-student-page">
      <div className="lg-detail-head">
        <div>
          <h2>{displayName}</h2>
          <div className="sub">
            {report.rankInClass != null && report.totalInClass
              ? `${L.rankOf}${report.rankInClass} ${L.of.toUpperCase()} ${report.totalInClass}  ·  `
              : ''}
            {report.assessmentTitle.toUpperCase()}  ·  {report.subject.toUpperCase()}  ·  {formatReportDate(report.submittedAt, language)}  ·  {report.accuracy}%
          </div>
        </div>
      </div>

      <div className="lg-detail-body">
        <div className="lg-kpi-row">
          <div className="lg-kpi">
            <div className="v">{report.accuracy}%</div>
            <div className="l">{L.yourScore}</div>
          </div>
          <div className="lg-kpi">
            <div className="v">
              {report.score}/{report.maxScore}
            </div>
            <div className="l">{L.rawMarks}</div>
          </div>
          <div className="lg-kpi">
            <div className="v">{report.classAvg != null ? `${report.classAvg}%` : '—'}</div>
            <div className="l">{L.classAverage}</div>
          </div>
          <div className="lg-kpi">
            <div className="v">
              {report.rankInClass != null && report.totalInClass
                ? `#${report.rankInClass}`
                : '—'}
            </div>
            <div className="l">{L.classRank}</div>
          </div>
          <div className="lg-kpi">
            <div className="v">{vsClass == null ? '—' : `${vsClass > 0 ? '+' : ''}${vsClass}%`}</div>
            <div className="l">{L.vsClass}</div>
          </div>
          <div className="lg-kpi">
            <div className="v">{report.timeSpentMin}m</div>
            <div className="l">{L.timeSpent}</div>
          </div>
        </div>

        <div className="lg-detail-grid">
          <div className="lg-panel-block">
            <h4>{L.subjectAffinity}</h4>
            {report.subjectScores.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--lg-text-muted)' }}>
                {L.reportUnavailable}
              </p>
            ) : (
              report.subjectScores.map((row) => (
                <div key={row.subject} className="lg-affinity-row">
                  <div className="sname">{row.subject}</div>
                  <div className="lg-affinity-track">
                    <div
                      className="lg-affinity-fill"
                      style={{ width: `${row.accuracy}%`, background: barColorForName(row.subject) }}
                    />
                  </div>
                  <div className="lg-affinity-val">{row.accuracy}%</div>
                </div>
              ))
            )}
          </div>
          <div className="lg-panel-block">
            <h4>Topic mastery — this exam</h4>
            {topics.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--lg-text-muted)' }}>
                Topic scores appear once questions on this paper are tagged.
              </p>
            ) : (
              topics.map((row) => (
                <div key={`${row.subject}-${row.chapter}-${row.concept}`} className="lg-affinity-row">
                  <div className="sname" title={row.chapter ? `${row.chapter} · ${row.concept}` : row.concept}>
                    {row.chapter ? `${row.chapter} · ${row.concept}` : row.concept}
                  </div>
                  <div className="lg-affinity-track">
                    <div
                      className="lg-affinity-fill"
                      style={{
                        width: `${row.masteryPct}%`,
                        background: knowledgeFill(row.masteryPct, row.subject),
                      }}
                    />
                  </div>
                  <div className="lg-affinity-val">{row.masteryPct}%</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div id="narrative">
          <AssessmentReportNarratives report={report} />
        </div>

        <div className="lg-panel-block" style={{ marginTop: '0.5rem' }}>
          <h4>{L.fullMetricSet}</h4>
          <div className="lg-metric-strip">
            <div className="lg-mstrip-item">
              <div className="l">{L.strongTopics}</div>
              <div className="v">
                {report.strongTopics.length ? report.strongTopics.slice(0, 2).join(', ') : L.noneIdentified}
              </div>
            </div>
            <div className="lg-mstrip-item">
              <div className="l">{L.focusTopics}</div>
              <div className="v">
                {report.weakTopics.length ? report.weakTopics.slice(0, 2).join(', ') : L.noneFlagged}
              </div>
            </div>
            <div className="lg-mstrip-item">
              <div className="l">{L.thSubject}</div>
              <div className="v">{report.subject}</div>
            </div>
            <div className="lg-mstrip-item">
              <div className="l">{L.thisAssessment}</div>
              <div className="v">{report.assessmentTitle}</div>
            </div>
          </div>
        </div>
      </div>

      <section className="lg-section lg-kl-section" id="knowledge-layer">
        <div className="lg-eyebrow">Level 2 · This exam</div>
        <h2 className="lg-section-title">Knowledge Layer</h2>
        <p className="lg-section-desc">
          Chapter and topic breakdown for {report.assessmentTitle} only — not the full-term genome.
        </p>
        <div className="lg-kl-banner">
          <b>Summary.</b> {report.knowledgeSummary || 'Topic measures appear after tagged questions on this paper.'}
        </div>
        <KnowledgeChapterTopicBars
          items={topics}
          emptyNote="No tagged chapters or topics on this exam yet."
        />
        <div className="lg-kl-grid lg-kl-grid-pair" style={{ marginTop: '0.85rem' }}>
          <div className="lg-kl-card">
            <h4>Most-missed topics</h4>
            {weakTopics.length === 0 ? (
              <p className="lg-kl-note">No topic error pattern on this paper.</p>
            ) : (
              <ul className="lg-kl-error-list">
                {weakTopics.map((item) => (
                  <li key={`${item.subject}-${item.chapter}-${item.concept}`}>
                    {item.chapter ? `${item.chapter} · ${item.concept}` : item.concept}
                    <span className="pct">{item.masteryPct}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {report.knowledgeSummary && (
          <div className="lg-kl-narrative">
            <b>Exam narrative — {report.assessmentTitle}</b>
            <br />
            {report.knowledgeSummary}
          </div>
        )}
      </section>
    </div>
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
      navLinks={[
        { href: '#narrative', label: 'Summary' },
        { href: '#knowledge-layer', label: 'Knowledge Layer' },
      ]}
    >
      <AssessmentReportBody report={report} backHref={backHref} backLabel={backLabel} />
    </LgReportLayout>
  )
}
