import type {
  LearningGenomeDataset,
  SubjectCode,
} from './learningGenomeTypes'

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
    color: '#2F6B4F',
    desc: 'Consistently high scores with stable performance across cycles.',
  },
  'Fast Improvers': {
    color: '#3E6B9C',
    desc: 'Sharp upward velocity between the first and second test cycle.',
  },
  'Steady Performers': {
    color: '#C9A24B',
    desc: 'Reliable mid-to-high band performance, low volatility.',
  },
  'Inconsistent Learners': {
    color: '#B7862E',
    desc: 'Wide score swings — same student, very different days.',
  },
  'Hidden Talent': {
    color: '#7A5AA8',
    desc: 'Below-average score today, but strong underlying growth potential.',
  },
  'Needs Immediate Support': {
    color: '#A8402F',
    desc: 'Combined academic and consistency signals flag focused attention.',
  },
}

export function rankedStudentNames(data: LearningGenomeDataset): string[] {
  return Object.keys(data.students).sort(
    (a, b) => data.students[a].rank - data.students[b].rank,
  )
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
  clusters: {},
  students: {},
}
