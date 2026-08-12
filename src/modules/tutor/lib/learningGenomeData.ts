import type {
  LearningGenomeDataset,
  SubjectCode,
} from './learningGenomeTypes'

/** Bar / chart fills (decorative). Prefer darker ink tokens when these appear as text. */
export const SUBJECT_COLORS: Record<SubjectCode, string> = {
  TAM: '#C9A24B',
  ENG: '#2F6B4F',
  MAT: '#A8402F',
  SCI: '#3E6B9C',
  SOC: '#7A5AA8',
}

export const SUBJECT_FULL: Record<SubjectCode, string> = {
  TAM: 'Tamil',
  ENG: 'English',
  MAT: 'Mathematics',
  SCI: 'Science',
  SOC: 'Social Science',
}

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
  const codes: SubjectCode[] = ['TAM', 'ENG', 'MAT', 'SCI', 'SOC']
  const names = Object.keys(data.students)
  if (!names.length) return []

  return codes
    .map((code) => {
      const masteryVals: number[] = []
      const predictedVals: number[] = []
      for (const name of names) {
        const s = data.students[name]
        const m = s.subj_avg[code]
        if (m != null && m > 0) masteryVals.push(m)
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
        name: SUBJECT_FULL[code],
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
