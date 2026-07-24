import type { GenomeStudentProfile } from '@/modules/tutor/lib/learningGenomeTypes'
import {
  SUBJECT_COLORS,
  SUBJECT_FULL,
} from '@/modules/tutor/lib/learningGenomeData'
import { buildStudentNarrative } from '@/modules/tutor/lib/learningGenomeNarrative'
import { DailyCurveChart } from './GenomeCharts'

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
            <div className="lg-affinity-val">{value}%</div>
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
  narrativeSource?: 'vertex' | 'rule-based'
  onClose?: () => void
  embedded?: boolean
  hideHeader?: boolean
}

export function StudentGenomeDetail({
  name,
  profile,
  totalStudents,
  batchLabel,
  narrative: narrativeFromApi,
  narrativeSource,
  onClose,
  embedded = false,
  hideHeader = false,
}: StudentGenomeDetailProps) {
  const narrative = narrativeFromApi ?? buildStudentNarrative(name, profile, totalStudents)

  const content = (
    <>
      {!hideHeader && (
        <div className="lg-detail-head">
          <div>
            <h2>{name}</h2>
            <div className="sub">
              RANK #{profile.rank} OF {totalStudents}
              {batchLabel ? ` · ${batchLabel}` : ''} · ATTENDANCE {profile.attendance_pct}%
            </div>
          </div>
          {onClose && (
            <button type="button" className="lg-close-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </div>
      )}
      <div className="lg-detail-body">
        <div className="lg-kpi-row">
          <div className="lg-kpi">
            <div className="v">{profile.overall}%</div>
            <div className="l">Overall Score</div>
          </div>
          <div className="lg-kpi">
            <div className="v">{profile.consistency}</div>
            <div className="l">Consistency</div>
          </div>
          <div className="lg-kpi">
            <div className="v">{profile.trend}</div>
            <div className="l">Learning Trend</div>
          </div>
          <div className="lg-kpi">
            <div className="v">{profile.predicted}%</div>
            <div className="l">Predicted Next</div>
          </div>
          <div className="lg-kpi">
            <div className="v">{profile.confidence}%</div>
            <div className="l">Confidence Score</div>
          </div>
          <div className="lg-kpi">
            <div className="v">{profile.growth_potential}%</div>
            <div className="l">Growth Potential</div>
          </div>
        </div>

        <div className="lg-detail-grid">
          <div className="lg-panel-block">
            <h4>Subject Affinity</h4>
            <AffinityBars subjAvg={profile.subj_avg} />
          </div>
          <div className="lg-panel-block">
            <h4>Daily Performance Curve</h4>
            <DailyCurveChart curve={profile.daily_curve} />
          </div>
        </div>

        <div className="lg-narrative">
          {narrative}
          {narrativeSource === 'vertex' && (
            <p className="text-[10px] text-muted-foreground mt-2 opacity-80">AI-generated narrative</p>
          )}
        </div>

        <div className="lg-panel-block">
          <h4>Full Metric Set</h4>
          <div className="lg-metric-strip">
            <div className="lg-mstrip-item">
              <div className="l">Best Day</div>
              <div className="v">
                {profile.best_day.date} · {profile.best_day.score}%
              </div>
            </div>
            <div className="lg-mstrip-item">
              <div className="l">Lowest Day</div>
              <div className="v">
                {profile.worst_day.date} · {profile.worst_day.score}%
              </div>
            </div>
            <div className="lg-mstrip-item">
              <div className="l">Recovery Ability</div>
              <div className="v">{profile.recovery}</div>
            </div>
            <div className="lg-mstrip-item">
              <div className="l">Subject Balance</div>
              <div className="v">{profile.balance}</div>
            </div>
            <div className="lg-mstrip-item">
              <div className="l">Velocity</div>
              <div className="v">
                {profile.velocity > 0 ? '+' : ''}
                {profile.velocity}%
              </div>
            </div>
            <div className="lg-mstrip-item">
              <div className="l">Absences</div>
              <div className="v">
                {profile.absent_count} test{profile.absent_count === 1 ? '' : 's'}
              </div>
            </div>
            <div className="lg-mstrip-item">
              <div className="l">Exam Shock</div>
              <div className="v">
                {profile.exam_shock.length ? profile.exam_shock.join(', ') : 'None detected'}
              </div>
            </div>
            <div className="lg-mstrip-item">
              <div className="l">Attendance Impact</div>
              <div className="v">
                {profile.attendance_impact === null
                  ? 'N/A'
                  : `${profile.attendance_impact > 0 ? '+' : ''}${profile.attendance_impact}%`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  if (embedded) {
    return <>{content}</>
  }

  return <div className="lg-report lg-detail-panel">{content}</div>
}