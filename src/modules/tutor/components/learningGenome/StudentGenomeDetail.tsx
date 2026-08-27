import type { GenomeStudentProfile } from '@/modules/tutor/lib/learningGenomeTypes'
import type { ConceptNotMastered } from '@/modules/tutor/lib/learningGenomeConcepts'
import {
  SUBJECT_COLORS,
  SUBJECT_FULL,
  deriveRiskLevel,
} from '@/modules/tutor/lib/learningGenomeData'
import { buildStudentNarrative } from '@/modules/tutor/lib/learningGenomeNarrative'
import { DailyCurveChart, GenomeFingerprintChart, TrendMark } from './GenomeCharts'
import { fallbackGenomeNarrativeTa } from '@/lib/reportBilingual'
import { translateRisk, translateTrendValue } from '@/lib/reportLabels'
import { useReportLabels } from '@/lib/useReportLabels'
import { ReportNarrative } from '@/components/reports/ReportLanguageToggle'
import { KnowledgeChapterTopicBars } from '@/modules/reports/learningGenome/KnowledgeDistribution'

const SUBJECT_ORDER_LIST = ['TAM', 'ENG', 'MAT', 'SCI', 'SOC'] as const

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

interface StudentGenomeDetailProps {
  name: string
  profile: GenomeStudentProfile
  totalStudents: number
  batchLabel?: string
  narrative?: string | null
  narrativeTa?: string | null
  narrativeSource?: 'vertex' | 'rule-based'
  topicMastery?: ConceptNotMastered[]
  knowledgeSummary?: string
  onClose?: () => void
  embedded?: boolean
  hideHeader?: boolean
  hideKpis?: boolean
  pageLayout?: boolean
}

export function StudentGenomeDetail({
  name,
  profile,
  totalStudents,
  batchLabel,
  narrative: narrativeFromApi,
  narrativeTa: narrativeTaFromApi,
  narrativeSource,
  topicMastery = [],
  knowledgeSummary,
  onClose,
  embedded = false,
  hideHeader = false,
  hideKpis = false,
  pageLayout = false,
}: StudentGenomeDetailProps) {
  const { L, language } = useReportLabels()
  const narrative = narrativeFromApi ?? buildStudentNarrative(name, profile, totalStudents)
  const narrativeTa =
    narrativeTaFromApi ??
    fallbackGenomeNarrativeTa(name, profile.overall, profile.rank, totalStudents)
  const risk = deriveRiskLevel(profile, {}, name)
  const weakTopics = [...topicMastery].sort((a, b) => a.masteryPct - b.masteryPct).slice(0, 5)
  const genomeSummary = `${name}'s five-point subject fingerprint is strongest in ${SUBJECT_FULL[profile.strongest]} (${(profile.subj_avg[profile.strongest] ?? 0).toFixed(0)}%) and has the most room to grow in ${SUBJECT_FULL[profile.weakest]} (${(profile.subj_avg[profile.weakest] ?? 0).toFixed(0)}%).`

  const content = (
    <>
      {!hideHeader && (
        <div className="lg-detail-head">
          <div>
            <h2>{name}</h2>
            <div className="sub">
              {L.rankOf}
              {profile.rank} {L.of.toUpperCase()} {totalStudents}
              {batchLabel ? ` · ${batchLabel}` : ''} · {L.attendance.toUpperCase()}{' '}
              {profile.attendance_pct}% · {L.risk.toUpperCase()}{' '}
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
      <div className={embedded && !pageLayout ? '' : 'lg-detail-body'}>
        {!hideKpis && (
          <div className="lg-kpi-row">
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
          </div>
        </div>

        <section className="lg-genome-block" id="genome">
          <h4>Learning Genome</h4>
          <div className="lg-genome-fingerprint">
            <GenomeFingerprintChart subjAvg={profile.subj_avg} />
            <p>{genomeSummary}</p>
          </div>
        </section>
      </div>

      <section className="lg-section lg-kl-section" id="knowledge-layer">
        <div className="lg-eyebrow">Level 2 · Knowledge Layer</div>
        <h2 className="lg-section-title">The Knowledge Layer</h2>
        <p className="lg-section-desc">
          Topic and subject mastery from tagged questions — what this student knows now, and where
          to focus next.
        </p>
        <div className="lg-kl-banner">
          <b>Summary.</b> {knowledgeSummary || 'Topic measures appear after assessments with tagged questions.'}
        </div>
        <KnowledgeChapterTopicBars
          items={topicMastery}
          emptyNote="No tagged chapter or topic attempts yet for this student."
        />
        <div className="lg-kl-grid lg-kl-grid-pair" style={{ marginTop: '0.85rem' }}>
          <div className="lg-kl-card">
            <h4>Subject mastery</h4>
            {SUBJECT_ORDER_LIST.map((code) => {
              const pct = profile.subj_avg[code]
              if (pct == null) return null
              return (
                <div key={code} className="lg-kl-bar-row">
                  <span className="n">{SUBJECT_FULL[code]}</span>
                  <div className="lg-kl-bar-track">
                    <div
                      className="lg-kl-bar-fill"
                      style={{ width: `${pct}%`, background: SUBJECT_COLORS[code] }}
                    />
                  </div>
                  <span className="lg-kl-bar-val">{pct.toFixed(0)}%</span>
                </div>
              )
            })}
          </div>
          <div className="lg-kl-card">
            <h4>Most-missed topics</h4>
            {weakTopics.length === 0 ? (
              <p className="lg-kl-note">No topic error pattern yet.</p>
            ) : (
              <ul className="lg-kl-error-list">
                {weakTopics.map((item) => (
                  <li key={`${item.subject}-${item.chapter}-${item.concept}`}>
                    {item.chapter ? `${item.chapter} · ${item.concept}` : item.concept}
                    <span className="pct">{item.masteryPct}% mastery</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {knowledgeSummary && (
          <div className="lg-kl-narrative">
            <b>AI Narrative — {name}</b>
            <br />
            {knowledgeSummary}
          </div>
        )}
      </section>
    </>
  )

  if (embedded) {
    return <div className={pageLayout ? 'lg-student-page' : undefined}>{content}</div>
  }

  return <div className="lg-report lg-detail-panel">{content}</div>
}
