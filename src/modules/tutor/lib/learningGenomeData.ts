import type {
  LearningGenomeDataset,
  SubjectCode,
} from './learningGenomeTypes'

/** Subject bar / chart fills — cream-report palette. */
export const SUBJECT_COLORS: Record<SubjectCode, string> = {
  TAM: '#C5A059',
  ENG: '#2D5A41',
  MAT: '#9B4437',
  SCI: '#3A6191',
  SOC: '#7A5197',
  OTH: '#6B7280',
}

export function subjectColorForName(name: string | undefined | null): string {
  const n = (name || '').toLowerCase()
  if (n.includes('tamil') || n === 'tam') return SUBJECT_COLORS.TAM
  if (n.includes('english') || n === 'eng') return SUBJECT_COLORS.ENG
  if (n.includes('math') || n === 'mat') return SUBJECT_COLORS.MAT
  if (n.includes('social') || n === 'soc' || n.includes('history') || n.includes('geography')) {
    return SUBJECT_COLORS.SOC
  }
  if (
    n.includes('sci') ||
    n.includes('physics') ||
    n.includes('chemistry') ||
    n.includes('biology')
  ) {
    return SUBJECT_COLORS.SCI
  }
  if (n === 'oth' || n.includes('other') || n.includes('computer') || n.includes('hindi')) {
    return SUBJECT_COLORS.OTH
  }
  return SUBJECT_COLORS.OTH
}

export const SUBJECT_FULL: Record<SubjectCode, string> = {
  TAM: 'Tamil',
  ENG: 'English',
  MAT: 'Mathematics',
  SCI: 'Science',
  SOC: 'Social Science',
  OTH: 'Other',
}

/** Prefer live subject label from the report payload; fall back to canonical name. */
export function subjectFullLabel(
  code: SubjectCode | string | undefined | null,
  names?: Partial<Record<SubjectCode, string>> | null,
): string {
  if (!code) return 'Subject'
  const key = code as SubjectCode
  const fromPayload = names?.[key]
  if (fromPayload && fromPayload.trim()) return fromPayload.trim()
  return SUBJECT_FULL[key] ?? String(code)
}

export const SUBJECT_CODES: SubjectCode[] = ['TAM', 'ENG', 'MAT', 'SCI', 'SOC', 'OTH']

export const CLUSTER_META: Record<string, { color: string; desc: string }> = {
  'High Performers': {
    color: '#1f5a3f',
    desc: 'Consistently high scores with stable performance across cycles.',
  },
  'Fast Improvers': {
    color: '#2a5080',
    desc: 'Sharp upward velocity between the first and second test cycle.',
  },
  'Steady Performers': {
    color: '#8a6420',
    desc: 'Reliable mid-to-high band performance, low volatility.',
  },
  'Inconsistent Learners': {
    color: '#7a5618',
    desc: 'Wide score swings — same student, very different days.',
  },
  'Hidden Talent': {
    color: '#5c3d85',
    desc: 'Below-average score today, but strong underlying growth potential.',
  },
  'Needs Immediate Support': {
    color: '#8f3426',
    desc: 'Combined academic and consistency signals flag focused attention.',
  },
}

export function rankedStudentNames(data: LearningGenomeDataset): string[] {
  return Object.keys(data.students).sort(
    (a, b) => data.students[a].rank - data.students[b].rank,
  )
}

/** Cohort-level subject mastery + predicted readiness (subject measures). */
export function cohortSubjectMeasures(data: LearningGenomeDataset): {
  code: SubjectCode
  name: string
  mastery: number
  predicted: number
  color: string
}[] {
  const codes: SubjectCode[] = ['TAM', 'ENG', 'MAT', 'SCI', 'SOC', 'OTH']
  const names = Object.keys(data.students)
  if (!names.length) return []

  return codes
    .map((code) => {
      const masteryVals: number[] = []
      const predictedVals: number[] = []
      let displayName = SUBJECT_FULL[code]
      for (const name of names) {
        const s = data.students[name]
        const m = s.subj_avg[code]
        if (m != null && m > 0) masteryVals.push(m)
        if (s.subject_names?.[code]) displayName = s.subject_names[code] as string
        // Blend subject mastery with student predicted for subject outlook
        if (m != null && m > 0) {
          const lift = (s.predicted - s.overall) * 0.5
          predictedVals.push(Math.min(100, Math.max(0, Math.round(m + lift))))
        }
      }
      if (!masteryVals.length) return null
      const mastery = Math.round(masteryVals.reduce((a, b) => a + b, 0) / masteryVals.length)
      const predicted = Math.round(
        predictedVals.reduce((a, b) => a + b, 0) / Math.max(1, predictedVals.length),
      )
      return {
        code,
        name: displayName,
        mastery,
        predicted,
        color: SUBJECT_COLORS[code],
      }
    })
    .filter((row): row is NonNullable<typeof row> => row != null)
}

export function deriveRiskLevel(
  profile: LearningGenomeDataset['students'][string],
  clusters: LearningGenomeDataset['clusters'],
  name: string,
): 'Low' | 'Medium' | 'High' {
  if (profile.risk_level) return profile.risk_level
  const support = clusters['Needs Immediate Support'] ?? []
  if (support.includes(name) || profile.overall < 55) return 'High'
  if (
    profile.trend === 'Declining' ||
    profile.consistency === 'Low' ||
    profile.overall < 70 ||
    profile.exam_shock.length >= 2
  ) {
    return 'Medium'
  }
  return 'Low'
}

export const EMPTY_GENOME_DATASET: LearningGenomeDataset = {
  meta: {
    class_avg: 0,
    dates: [],
    subj_seq: [],
    total_students: 0,
    window_label: 'No data yet',
    subjects_label: '—',
    total_marks: 0,
    subjects_count: 0,
  },
  clusters: {
    'High Performers': [],
    'Fast Improvers': [],
    'Steady Performers': [],
    'Inconsistent Learners': [],
    'Hidden Talent': [],
    'Needs Immediate Support': [],
  },
  students: {},
}
