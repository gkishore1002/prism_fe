import type {
  GenomeExamSubjectRow,
  GenomeStudentProfile,
} from '@/modules/tutor/lib/learningGenomeTypes'
import {
  SUBJECT_COLORS,
  SUBJECT_FULL,
  deriveRiskLevel,
} from '@/modules/tutor/lib/learningGenomeData'
import { buildStudentNarrative } from '@/modules/tutor/lib/learningGenomeNarrative'
import { DailyCurveChart, TrendMark } from './GenomeCharts'
import { LgBoardTable, LgSection } from '@/modules/reports/learningGenome/LearningGenomeShell'
import { fallbackGenomeNarrativeTa } from '@/lib/reportBilingual'
import { formatVsClass } from '@/lib/reportFormatters'
import { formatSubjectCount, translateRisk, translateTrendValue } from '@/lib/reportLabels'
import { useReportLabels } from '@/lib/useReportLabels'
import { ReportNarrative } from '@/components/reports/ReportLanguageToggle'

const SUBJECT_ORDER_LIST = ['TAM', 'ENG', 'MAT', 'SCI', 'SOC'] as const

function pctGrade(pct: number): string {
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B+'
  if (pct >= 60) return 'B'
  if (pct >= 50) return 'C'
  if (pct >= 40) return 'D'
  return 'E'
}

function barColor(pct: number): string {
  if (pct >= 75) return '#3E6B9C'
  if (pct >= 60) return '#B7862E'
  return '#A8402F'
}

function AffinityBars({ subjAvg }: { subjAvg: GenomeStudentProfile['subj_avg'] }) {
  return (
    <>
      {SUBJECT_ORDER_LIST.map((code) => {
        const value = subjAvg[code]
        if (value === undefined) return null
        return (
          <div key={code} className="lg-affinity-row">
            <div className="sname">{SUBJECT_FULL[code]}</div>
            <div className="lg-affinity-track">
              <div
                className="lg-affinity-fill"
                style={{ width: `${value}%`, background: SUBJECT_COLORS[code] }}
              />
            </div>
            <div className="lg-affinity-val">{value.toFixed(1)}%</div>
          </div>
        )
      })}
    </>
  )
}

function ScoreBar({ pct, gold }: { pct: number; gold?: boolean }) {
  return (
    <div className="lg-score-bar">
      <span
        style={{
          width: `${Math.min(100, pct)}%`,
          background: gold
            ? 'linear-gradient(90deg, var(--lg-gold), var(--lg-gold-bright))'
            : barColor(pct),
        }}
      />
    </div>
  )
}

function VsClass({ delta, language }: { delta: number | null | undefined; language: 'en' | 'ta' }) {
  if (delta == null) return <span className="lg-vs-flat">—</span>
  const text = formatVsClass(delta === 0 ? 0 : delta, language)
  if (delta > 0) return <span className="lg-vs-up">{text}</span>
  if (delta < 0) return <span className="lg-vs-down">{text}</span>
  return <span className="lg-vs-up">{text}</span>
}

function subjectRowsFrom(rows: GenomeExamSubjectRow[], language: 'en' | 'ta') {
  return rows.map((row) => {
    const marks =
      row.scored != null && row.maxMarks != null
        ? `${Number(row.scored).toFixed(1)} / ${Number(row.maxMarks).toFixed(1)}`
        : `${row.pct.toFixed(1)}%`
    return [
      <span key={`${row.code}-n`} className="lg-subj-cell">
        {row.name || SUBJECT_FULL[row.code] || row.code}
      </span>,
      <span key={`${row.code}-m`}>{marks}</span>,
      <span key={`${row.code}-p`}>{row.pct.toFixed(1)}%</span>,
      <ScoreBar key={`${row.code}-b`} pct={row.pct} />,
      <span key={`${row.code}-g`} className="lg-serif font-semibold">
        {row.grade || pctGrade(row.pct)}
      </span>,
      <VsClass key={`${row.code}-v`} delta={row.vsClass} language={language} />,
    ]
  })
}

interface StudentGenomeDetailProps {
  name: string
  profile: GenomeStudentProfile
  totalStudents: number
  batchLabel?: string
  narrative?: string | null
  narrativeTa?: string | null
  narrativeSource?: 'vertex' | 'rule-based'
  onClose?: () => void
  embedded?: boolean
  hideHeader?: boolean
  hideKpis?: boolean
}

export function StudentGenomeDetail({
  name,
  profile,
  totalStudents,
  batchLabel,
  narrative: narrativeFromApi,
  narrativeTa: narrativeTaFromApi,
  narrativeSource,
  onClose,
  embedded = false,
  hideHeader = false,
  hideKpis = false,
}: StudentGenomeDetailProps) {
  const { L, language, subjectHeaders, historyHeaders } = useReportLabels()
  const narrative = narrativeFromApi ?? buildStudentNarrative(name, profile, totalStudents)
  const narrativeTa =
    narrativeTaFromApi ??
    fallbackGenomeNarrativeTa(name, profile.overall, profile.rank, totalStudents)
  const risk = deriveRiskLevel(profile, {}, name)
  const exams = profile.exam_history?.length
    ? profile.exam_history
    : (() => {
        const byDate = new Map<string, { date: string; points: typeof profile.daily_curve; overall: number }>()
        for (const point of profile.daily_curve) {
          const list = byDate.get(point.date) ?? { date: point.date, points: [], overall: 0 }
          list.points.push(point)
          byDate.set(point.date, list)
        }
        return [...byDate.values()].map((exam, idx, arr) => {
          const overall =
            exam.points.reduce((sum, p) => sum + p.score, 0) / Math.max(exam.points.length, 1)
          const prev = idx > 0 ? arr[idx - 1] : null
          const prevOverall = prev
            ? prev.points.reduce((s, p) => s + p.score, 0) / Math.max(prev.points.length, 1)
            : null
          return {
            title: exam.points[0]?.title ?? `Assessment ${idx + 1}`,
            date: exam.date,
            overall,
            subjectCount: exam.points.length,
            vsPrev: prevOverall == null ? null : overall - prevOverall,
            subjects: exam.points.map((p) => ({
              name: SUBJECT_FULL[p.subject],
              code: p.subject,
              pct: p.score,
              grade: pctGrade(p.score),
            })),
          }
        })
      })()

  const latest = profile.latest_assessment
  const assessmentSubjects =
    latest?.subjects ??
    (exams.length > 0 ? exams[exams.length - 1].subjects : null) ??
    SUBJECT_ORDER_LIST.filter((code) => profile.subj_avg[code] != null).map((code) => ({
      name: SUBJECT_FULL[code],
      code,
      pct: profile.subj_avg[code] ?? 0,
      grade: pctGrade(profile.subj_avg[code] ?? 0),
    }))

  const assessmentTitle = latest?.title ?? (exams.length ? exams[exams.length - 1].title : 'Subject mastery')
  const assessmentDate = latest?.date ?? (exams.length ? exams[exams.length - 1].date : undefined)

  const content = (
    <>
      {!hideHeader && (
        <div className="lg-detail-head">
          <div>
            <h2>{name}</h2>
            <div className="sub">
              {L.rankOf}{profile.rank} {L.of.toUpperCase()} {totalStudents}
              {batchLabel ? ` · ${batchLabel}` : ''} · {L.attendance.toUpperCase()} {profile.attendance_pct}% · {L.risk.toUpperCase()}{' '}
              {translateRisk(risk, language).toUpperCase()}
            </div>
          </div>
          {onClose && (
            <button type="button" className="lg-close-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </div>
      )}
      <div className={embedded ? '' : 'lg-detail-body'}>
        {!hideKpis && (
          <div className="lg-kpi-strip">
            <div className="lg-kpi">
              <div className="v">{profile.overall}%</div>
              <div className="l">{L.overallScore}</div>
            </div>
            <div className="lg-kpi">
              <div className="v">{translateTrendValue(profile.consistency, language)}</div>
              <div className="l">{L.consistency}</div>
            </div>
            <div className="lg-kpi">
              <div className="v">{translateTrendValue(profile.trend, language)}</div>
              <div className="l">{L.learningTrend}</div>
            </div>
            <div className="lg-kpi">
              <div className="v">{profile.predicted}%</div>
              <div className="l">{L.predictedNext}</div>
            </div>
            <div className="lg-kpi">
              <div className="v">{profile.confidence}%</div>
              <div className="l">{L.confidenceScore}</div>
            </div>
            <div className="lg-kpi">
              <div className="v">{profile.growth_potential}%</div>
              <div className="l">{L.growthPotential}</div>
            </div>
          </div>
        )}

        {assessmentSubjects.length > 0 && (
          <LgSection
            id="assessment-wise"
            eyebrow={L.eyebrowAssessmentWise}
            title={assessmentTitle}
            description={
              language === 'ta'
                ? 'இந்த தேர்வுக்கான பாட மதிப்பெண்கள் — வகுப்பு சராசரியுடன் ஒப்பீடு.'
                : 'Subject marks for this assessment — compared to the class average on the same test.'
            }
          >
            <LgBoardTable
              headers={subjectHeaders}
              rows={subjectRowsFrom(assessmentSubjects, language)}
            />
            {assessmentDate && (
              <p className="lg-kl-note mt-2" style={{ color: 'var(--lg-text-muted)' }}>
                {L.conducted} {assessmentDate}
              </p>
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
              <AffinityBars subjAvg={profile.subj_avg} />
            </div>
            <div className="lg-panel-block">
              <h4>{L.examPerformanceTrend}</h4>
              {profile.daily_curve.length > 0 ? (
                <DailyCurveChart curve={profile.daily_curve} height={180} />
              ) : (
                <p className="text-sm" style={{ color: 'var(--lg-text-muted)' }}>
                  {L.trendAfterMore}
                </p>
              )}
            </div>
          </div>
        </section>

        {exams.length > 0 && (
          <LgSection
            id="history"
            eyebrow={L.eyebrowExamHistory}
            title={L.titlePastExams}
            description={L.descPastExams}
          >
            <LgBoardTable
              headers={historyHeaders}
              rows={exams.map((exam, idx) => [
                String(idx + 1),
                exam.title,
                exam.date,
                `${exam.overall.toFixed(1)}%`,
                <ScoreBar key={`${exam.date}-bar`} pct={exam.overall} gold />,
                formatSubjectCount(exam.subjectCount, language),
                exam.vsPrev == null ? (
                  <span key={`${exam.date}-d`} className="lg-vs-flat">
                    —
                  </span>
                ) : (
                  <span
                    key={`${exam.date}-d`}
                    className={exam.vsPrev >= 0 ? 'lg-vs-up' : 'lg-vs-down'}
                  >
                    {exam.vsPrev >= 0 ? '▲' : '▼'} {exam.vsPrev >= 0 ? '+' : ''}
                    {exam.vsPrev.toFixed(1)}%
                  </span>
                ),
              ])}
            />
          </LgSection>
        )}

        <section className="lg-section" id="narrative" style={{ paddingTop: 0 }}>
          <ReportNarrative
            id="report-lang-focus"
            english={narrative}
            tamil={narrativeTa}
            englishNote={narrativeSource === 'vertex' ? L.noteEnglishAiNarrative : undefined}
            tamilNote={narrativeSource === 'vertex' ? L.noteTamilAiNarrative : undefined}
          />

          <div className="lg-panel-block" style={{ marginTop: '1.25rem' }}>
            <h4>{L.fullMetricSet}</h4>
            <div className="lg-metric-strip">
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
              <div className="lg-mstrip-item">
                <div className="l">{L.absences}</div>
                <div className="v">
                  {profile.absent_count} {language === 'ta' ? 'தேர்வு' : `test${profile.absent_count === 1 ? '' : 's'}`}
                </div>
              </div>
            </div>
          </div>

          <div className="lg-profile-status">
            <span
              className={`dot ${risk === 'High' ? 'dot-high' : risk === 'Medium' ? 'dot-medium' : ''}`}
            />
            {translateRisk(risk, language)} {L.genomeProfile}
            {latest ? ` · ${L.latestPct} ${latest.overall.toFixed(1)}%` : ''}
          </div>
        </section>
      </div>
    </>
  )

  if (embedded) {
    return <>{content}</>
  }

  return <div className="lg-report lg-detail-panel">{content}</div>
}
