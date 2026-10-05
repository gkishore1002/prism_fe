import { useEffect, useMemo, useState } from 'react'
import { ReportLoader } from '@/components/ui/PrismLoader'
import { analyticsApi } from '@/lib/api/analyticsApi'
import {
  fetchStudentGenome,
  mapApiGenomeProfile,
  type ApiStudentGenome,
} from '@/lib/api/cohortReportApi'
import type { AssessmentReport, OverallPerformanceReport } from '@/types'
import { ReportNarrative } from '@/components/reports/ReportLanguageToggle'
import { fallbackOverallSummaryTa } from '@/lib/reportBilingual'
import {
  formatHeroQuickFacts,
  formatReportDate,
} from '@/lib/reportFormatters'
import { translateHealthStatus, translateTrendValue } from '@/lib/reportLabels'
import { useReportLabels } from '@/lib/useReportLabels'
import {
  LgBoardTable,
  LgFooter,
  LgHero,
  LgReportLayout,
  LgSection,
} from '@/modules/reports/learningGenome/LearningGenomeShell'
import { KnowledgeChapterTopicBars } from '@/modules/reports/learningGenome/KnowledgeDistribution'
import { DailyCurveChart, TrendMark } from '@/modules/tutor/components/learningGenome/GenomeCharts'
import { SUBJECT_COLORS, subjectFullLabel } from '@/modules/tutor/lib/learningGenomeData'
import type { GenomeDailyPoint, GenomeStudentProfile, SubjectCode } from '@/modules/tutor/lib/learningGenomeTypes'

interface OverallPerformanceReportPageProps {
  studentId?: string
  backHref: string
  backLabel: string
}

function AffinityFromSubjects({
  subjects,
}: {
  subjects: { name: string; health: number }[]
}) {
  return (
    <>
      {subjects.map((s) => (
        <div key={s.name} className="lg-affinity-row">
          <div className="sname">{s.name}</div>
          <div className="lg-affinity-track">
            <div
              className="lg-affinity-fill"
              style={{ width: `${Math.max(0, Math.min(100, s.health))}%`, background: '#C5A059' }}
            />
          </div>
          <div className="lg-affinity-val">{s.health.toFixed(1)}%</div>
        </div>
      ))}
    </>
  )
}

function AffinityFromGenome({ profile }: { profile: GenomeStudentProfile }) {
  const codes = Object.keys(profile.subj_avg) as SubjectCode[]
  return (
    <>
      {codes.map((code) => {
        const value = profile.subj_avg[code]
        if (value === undefined) return null
        return (
          <div key={code} className="lg-affinity-row">
            <div className="sname">{subjectFullLabel(code, profile.subject_names)}</div>
            <div className="lg-affinity-track">
              <div
                className="lg-affinity-fill"
                style={{ width: `${value}%`, background: SUBJECT_COLORS[code] ?? '#C5A059' }}
              />
            </div>
            <div className="lg-affinity-val">{value.toFixed(1)}%</div>
          </div>
        )
      })}
    </>
  )
}

function OverallReportContent({
  report,
  assessmentReports,
  genome = null,
  backHref,
  backLabel,
  embedded = false,
}: {
  report: OverallPerformanceReport
  assessmentReports: AssessmentReport[]
  genome?: ApiStudentGenome | null
  backHref: string
  backLabel: string
  embedded?: boolean
}) {
  const { L, language, historyHeaders } = useReportLabels()
  const profile = genome?.profile ? mapApiGenomeProfile(genome.profile) : null

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
    const fromGenome = genome?.topicMastery ?? []
    if (fromGenome.length > 0) {
      return fromGenome.map((t) => ({
        concept: t.concept,
        subject: t.subject,
        chapter: t.chapter,
        masteryPct: t.masteryPct,
      }))
    }
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
  }, [genome?.topicMastery, report.topicBreakdown, assessmentReports])

  const orderedAssessments = useMemo(
    () =>
      [...assessmentReports].sort(
        (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
      ),
    [assessmentReports],
  )

  const fallbackCurve: GenomeDailyPoint[] = useMemo(() => {
    if (profile && profile.daily_curve.length > 0) return profile.daily_curve
    if (report.improvementTrend.length > 0) {
      return report.improvementTrend.map((p) => ({
        date: p.month,
        score: p.score,
        subject: 'MAT' as SubjectCode,
      }))
    }
    return orderedAssessments.map((a) => ({
      date: formatReportDate(a.submittedAt, language),
      score: a.accuracy,
      subject: 'MAT' as SubjectCode,
    }))
  }, [profile, report.improvementTrend, orderedAssessments, language])

  const riskLabel = profile
    ? translateTrendValue(
        profile.consistency === 'Low' ? 'Declining' : profile.trend,
        language,
      )
    : translateHealthStatus(report.status, language)

  const kpiStats = profile
    ? [
        { value: `${profile.overall}%`, label: L.overallScore },
        { value: translateTrendValue(profile.consistency, language), label: L.consistency },
        { value: translateTrendValue(profile.trend, language), label: L.learningTrend },
        { value: `${profile.predicted}%`, label: L.predictedNext },
        { value: `${profile.confidence}%`, label: L.confidenceScore },
        { value: `${profile.growth_potential}%`, label: L.growthPotential },
      ]
    : [
        { value: `${report.avgAccuracy}%`, label: L.overallScore },
        { value: translateHealthStatus(report.status, language), label: L.consistency },
        { value: report.improving ? L.improving : L.stable, label: L.learningTrend },
        { value: `${report.readiness}%`, label: L.predictedNext },
        { value: `${report.health}%`, label: L.confidenceScore },
        {
          value: `${report.improvement >= 0 ? '+' : ''}${report.improvement}%`,
          label: L.growthPotential,
        },
      ]

  const quickFacts = profile
    ? `${L.rankOf}${profile.rank}${genome?.totalStudents ? ` ${L.of.toUpperCase()} ${genome.totalStudents}` : ''} · ${L.attendance.toUpperCase()} ${profile.attendance_pct}% · ${L.risk.toUpperCase()} ${riskLabel.toUpperCase()}`
    : formatHeroQuickFacts(
        { board: report.board, grade: report.grade, batch: report.batch, status: report.status },
        language,
      )

  const narrativeEn =
    genome?.narrative ||
    report.summary
  const narrativeTa =
    genome?.narrativeTa ||
    report.summaryTa ||
    fallbackOverallSummaryTa(
      report.studentName,
      report.health,
      report.improving,
      report.criticalGaps,
    )
  const narrativeSource = genome?.narrativeSource || report.summarySource

  const detailBody = (
    <div className={embedded ? 'lg-detail-body' : 'lg-detail-body lg-overall-detail'}>
      {embedded && (
        <div className="lg-kpi-row" data-pdf-block>
          {kpiStats.map((stat) => (
            <div key={stat.label} className="lg-kpi">
              <div className="v">{stat.value}</div>
              <div className="l">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="lg-detail-grid" data-pdf-block>
        <div className="lg-panel-block">
          <h4>{L.subjectAffinity}</h4>
          {profile && Object.keys(profile.subj_avg).length > 0 ? (
            <AffinityFromGenome profile={profile} />
          ) : report.subjectHealth.length > 0 ? (
            <AffinityFromSubjects subjects={report.subjectHealth} />
          ) : (
            <p className="text-sm" style={{ color: 'var(--lg-text-muted)' }}>
              {L.trendAfterMore}
            </p>
          )}
        </div>
        <div className="lg-panel-block">
          <h4>{L.examPerformanceTrend}</h4>
          {fallbackCurve.length > 0 ? (
            <DailyCurveChart curve={fallbackCurve} height={180} />
          ) : (
            <p className="text-sm" style={{ color: 'var(--lg-text-muted)' }}>
              {L.trendAfterMore}
            </p>
          )}
        </div>
      </div>

      <div data-pdf-block id="summary-wrap">
        <ReportNarrative
          id="summary"
          english={narrativeEn}
          tamil={narrativeTa}
          englishNote={
            narrativeSource === 'vertex' ? L.noteEnglishAiNarrative : L.noteEnglishRule
          }
          tamilNote={narrativeSource === 'vertex' ? L.noteTamilAiNarrative : L.noteTamilRule}
        />
      </div>

      <div className="lg-panel-block" style={{ marginTop: '1.25rem' }} data-pdf-block>
        <h4>{L.fullMetricSet}</h4>
        <div className="lg-metric-strip">
          {profile ? (
            <>
              <div className="lg-mstrip-item">
                <div className="l">{L.bestExam}</div>
                <div className="v">
                  {profile.best_day.date} · {profile.best_day.score}%
                </div>
              </div>
              <div className="lg-mstrip-item">
                <div className="l">{L.lowestExam}</div>
                <div className="v">
                  {profile.worst_day.date} · {profile.worst_day.score}%
                </div>
              </div>
              <div className="lg-mstrip-item">
                <div className="l">{L.recoveryAbility}</div>
                <div className="v">{profile.recovery || L.na}</div>
              </div>
              <div className="lg-mstrip-item">
                <div className="l">{L.subjectBalance}</div>
                <div className="v">{profile.balance}</div>
              </div>
              <div className="lg-mstrip-item">
                <div className="l">{L.velocity}</div>
                <div className="v">
                  <TrendMark trend={profile.trend} velocity={profile.velocity} />
                </div>
              </div>
              <div className="lg-mstrip-item">
                <div className="l">{L.absences}</div>
                <div className="v">
                  {profile.absent_count}{' '}
                  {language === 'ta' ? 'தேர்வு' : `test${profile.absent_count === 1 ? '' : 's'}`}
                </div>
              </div>
              <div className="lg-mstrip-item">
                <div className="l">{L.examShock}</div>
                <div className="v">
                  {profile.exam_shock.length ? profile.exam_shock.join(', ') : L.noneDetected}
                </div>
              </div>
              <div className="lg-mstrip-item">
                <div className="l">{L.attendanceImpact}</div>
                <div className="v">
                  {profile.attendance_impact === null
                    ? L.na
                    : `${profile.attendance_impact > 0 ? '+' : ''}${profile.attendance_impact}%`}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="lg-mstrip-item">
                <div className="l">{L.overallScore}</div>
                <div className="v">{report.avgAccuracy}%</div>
              </div>
              <div className="lg-mstrip-item">
                <div className="l">{L.predictedNext}</div>
                <div className="v">{report.readiness}%</div>
              </div>
              <div className="lg-mstrip-item">
                <div className="l">{L.growthPotential}</div>
                <div className="v">
                  {report.improvement >= 0 ? '+' : ''}
                  {report.improvement}%
                </div>
              </div>
              <div className="lg-mstrip-item">
                <div className="l">{L.criticalGaps}</div>
                <div className="v">{report.criticalGaps}</div>
              </div>
              <div className="lg-mstrip-item">
                <div className="l">{L.improving}</div>
                <div className="v">{report.improving ? L.yes : L.no}</div>
              </div>
              <div className="lg-mstrip-item">
                <div className="l">{L.consistency}</div>
                <div className="v">{translateHealthStatus(report.status, language)}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="lg-overall-page" data-pdf-root-page>
      {!embedded && (
        <LgHero
          compact
          reportKind={L.reportKindOverall}
          title={report.studentName}
          quickFacts={quickFacts}
          description={
            language === 'ta'
              ? 'ஒட்டுமொத்த கற்றல் சுயவிவரம் — பாட ஈர்ப்பு, போக்கு மற்றும் அறிவு அடுக்கு.'
              : 'Overall learning profile — subject affinity, performance trend, and knowledge layer.'
          }
          detailLines={[
            `${L.assessmentWindow}: ${windowLabel}`,
            latest
              ? `${L.thisAssessment}: ${latest.assessmentTitle} · ${L.conducted} ${formatReportDate(latest.submittedAt, language)}`
              : `${report.board} · ${report.grade}${report.batch ? ` · ${report.batch}` : ''}`,
          ]}
          stats={kpiStats}
          statsPlacement="below"
          showSeal
          backHref={backHref}
          backLabel={backLabel}
        />
      )}

      {embedded && (
        <div className="lg-detail-head" data-pdf-block>
          <div>
            <h2>{report.studentName}</h2>
            <div className="sub">{quickFacts}</div>
          </div>
        </div>
      )}

      {detailBody}

      {orderedAssessments.length > 0 && (
        <LgSection
          id="history"
          eyebrow={L.eyebrowKeySignals}
          title={L.navHistory}
          description={
            language === 'ta'
              ? 'இந்த மாணவரின் தேர்வு வரலாறு — ஒட்டுமொத்த செயல்திறன் சுயவிவரத்திற்கு அடிப்படை.'
              : 'Assessment history feeding this overall performance profile.'
          }
        >
          <LgBoardTable
            headers={historyHeaders}
            rows={orderedAssessments.map((a, idx, arr) => {
              const prev = idx > 0 ? arr[idx - 1] : null
              const delta = prev == null ? null : a.accuracy - prev.accuracy
              return [
                a.assessmentTitle,
                formatReportDate(a.submittedAt, language),
                `${a.accuracy}%`,
                String(Math.max(1, a.subjectScores.length)),
                delta == null ? '—' : `${delta > 0 ? '+' : ''}${delta}%`,
              ]
            })}
          />
        </LgSection>
      )}

      <section className="lg-section lg-kl-section" id="knowledge-layer">
        <div className="lg-eyebrow">Level 2 · Knowledge Layer</div>
        <h2 className="lg-section-title">The Knowledge Layer</h2>
        <p className="lg-section-desc">
          Chapter and topic mastery from tagged questions across this student&apos;s assessments.
        </p>
        {genome?.knowledgeSummary && (
          <div className="lg-kl-banner">
            <b>Summary.</b> {genome.knowledgeSummary}
          </div>
        )}
        <KnowledgeChapterTopicBars
          items={knowledgeItems}
          emptyNote="Chapter and topic scores appear after tagged question attempts."
        />
      </section>

      <LgFooter windowLabel={windowLabel} cohortNote={report.batch} />
    </div>
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
  const [genome, setGenome] = useState<ApiStudentGenome | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const genomePromise = studentId
      ? fetchStudentGenome(studentId).catch(() => null)
      : Promise.resolve(null)

    void Promise.all([
      analyticsApi.overallReport(studentId),
      analyticsApi.assessmentReports(studentId).catch(() => [] as AssessmentReport[]),
      genomePromise,
    ])
      .then(([overallData, assessmentData, genomeData]) => {
        if (cancelled) return
        setReport(overallData)
        setAssessmentReports(assessmentData)
        setGenome(genomeData)
      })
      .catch(() => {
        if (!cancelled) {
          setReport(null)
          setAssessmentReports([])
          setGenome(null)
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
          compact
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
      navLinks={(labels) => [
        { href: '#summary', label: labels.navSummary },
        { href: '#history', label: labels.navHistory },
        { href: '#knowledge-layer', label: labels.navKnowledge },
      ]}
    >
      <OverallReportContent
        report={report}
        assessmentReports={assessmentReports}
        genome={genome}
        backHref={backHref}
        backLabel={backLabel}
      />
    </LgReportLayout>
  )
}
