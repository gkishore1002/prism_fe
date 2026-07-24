export type SubjectCode = 'TAM' | 'ENG' | 'MAT' | 'SCI' | 'SOC'

export interface GenomeDailyPoint {
  date: string
  subject: SubjectCode
  score: number
}

export interface GenomeStudentProfile {
  overall: number
  subj_avg: Partial<Record<SubjectCode, number>>
  strongest: SubjectCode
  weakest: SubjectCode
  best_day: { date: string; score: number }
  worst_day: { date: string; score: number }
  consistency: 'High' | 'Medium' | 'Low'
  consistency_sd: number
  trend: 'Improving' | 'Declining' | 'Stable'
  velocity: number
  predicted: number
  recovery: string
  exam_shock: string[]
  attendance_pct: number
  absent_count: number
  attendance_impact: number | null
  balance: string
  growth_potential: number
  confidence: number
  daily_curve: GenomeDailyPoint[]
  rank: number
}

export interface LearningGenomeDataset {
  meta: {
    class_avg: number
    dates: string[]
    subj_seq: SubjectCode[]
    total_students: number
    window_label?: string
    subjects_label?: string
    total_marks?: number
    subjects_count?: number
  }
  clusters: Record<string, string[]>
  students: Record<string, GenomeStudentProfile>
}

export type InsightTag = 'up' | 'watch' | 'pattern'

export interface CohortInsightRow {
  tag: InsightTag
  html: string
}
