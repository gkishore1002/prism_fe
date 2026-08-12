import { apiFetch, isApiEnabled } from '@/lib/apiClient'
import type {
  GenomeDailyPoint,
  GenomeStudentProfile,
  LearningGenomeDataset,
  SubjectCode,
} from '@/modules/tutor/lib/learningGenomeTypes'
import type { ConceptNotMastered } from '@/modules/tutor/lib/learningGenomeConcepts'

export interface ApiGenomeStudentProfile {
  overall: number
  subjAvg: Partial<Record<SubjectCode, number>>
  strongest: SubjectCode
  weakest: SubjectCode
  bestDay: { date: string; score: number }
  worstDay: { date: string; score: number }
  consistency: GenomeStudentProfile['consistency']
  consistencySd: number
  trend: GenomeStudentProfile['trend']
  velocity: number
  predicted: number
  recovery: string
  examShock: string[]
  attendancePct: number
  absentCount: number
  attendanceImpact: number | null
  balance: string
  growthPotential: number
  confidence: number
  dailyCurve: { date: string; subject: SubjectCode; score: number; title?: string }[]
  examHistory?: {
    title: string
    date: string
    overall: number
    subjectCount: number
    vsPrev: number | null
    subjects: {
      name: string
      code: SubjectCode
      pct: number
      scored?: number | null
      maxMarks?: number | null
      grade: string
      classAvg?: number | null
      vsClass?: number | null
    }[]
    assessmentId?: string | null
  }[]
  latestAssessment?: {
    title: string
    date: string
    overall: number
    assessmentId?: string | null
    subjects: {
      name: string
      code: SubjectCode
      pct: number
      scored?: number | null
      maxMarks?: number | null
      grade: string
      classAvg?: number | null
      vsClass?: number | null
    }[]
  } | null
  rank: number
  studentId?: string
}

export interface ApiCohortReport {
  batchId?: string | null
  batchName?: string | null
  meta: {
    classAvg: number
    dates: string[]
    subjSeq: SubjectCode[]
    totalStudents: number
    batchStudentCount?: number
    scoredStudentCount?: number
    assessmentResultCount?: number
    savedMarksCount?: number
    windowLabel?: string
    subjectsLabel?: string
    totalMarks?: number
    subjectsCount?: number
  }
  clusters: Record<string, string[]>
  students: Record<string, ApiGenomeStudentProfile>
  conceptsNotMastered: ConceptNotMastered[]
  dataSource: 'live' | 'empty'
}

export interface ApiStudentGenome {
  name: string
  profile: ApiGenomeStudentProfile
  totalStudents: number
  batchLabel?: string | null
  source: 'live' | 'synthesized' | 'empty'
  message?: string
  narrative?: string | null
  narrativeTa?: string | null
  narrativeSource?: 'vertex' | 'rule-based'
}

function mapProfile(p: ApiGenomeStudentProfile): GenomeStudentProfile {
  return {
    overall: p.overall,
    subj_avg: p.subjAvg,
    strongest: p.strongest,
    weakest: p.weakest,
    best_day: p.bestDay,
    worst_day: p.worstDay,
    consistency: p.consistency,
    consistency_sd: p.consistencySd,
    trend: p.trend,
    velocity: p.velocity,
    predicted: p.predicted,
    recovery: p.recovery,
    exam_shock: p.examShock,
    attendance_pct: p.attendancePct,
    absent_count: p.absentCount,
    attendance_impact:
      typeof p.attendanceImpact === 'number' ? p.attendanceImpact : null,
    balance: p.balance,
    growth_potential: p.growthPotential,
    confidence: p.confidence,
    daily_curve: p.dailyCurve as GenomeDailyPoint[],
    exam_history: p.examHistory,
    latest_assessment: p.latestAssessment ?? null,
    rank: p.rank,
  }
}

export function mapCohortReportToDataset(report: ApiCohortReport): LearningGenomeDataset {
  const students: LearningGenomeDataset['students'] = {}
  for (const [name, profile] of Object.entries(report.students)) {
    students[name] = mapProfile(profile)
  }
  return {
    meta: {
      class_avg: report.meta.classAvg,
      dates: report.meta.dates,
      subj_seq: report.meta.subjSeq,
      total_students: report.meta.totalStudents,
      window_label: report.meta.windowLabel,
      subjects_label: report.meta.subjectsLabel,
      total_marks: report.meta.totalMarks,
      subjects_count: report.meta.subjectsCount,
    },
    clusters: report.clusters,
    students,
  }
}

export async function fetchCohortReport(batchId?: string): Promise<ApiCohortReport> {
  const qs = batchId ? `?batch_id=${encodeURIComponent(batchId)}` : ''
  return apiFetch<ApiCohortReport>(`/analytics/tutor/cohort-report${qs}`)
}

export async function fetchStudentGenome(studentId: string): Promise<ApiStudentGenome> {
  return apiFetch<ApiStudentGenome>(`/analytics/student/genome?student_id=${encodeURIComponent(studentId)}`)
}

export function cohortReportApiAvailable(): boolean {
  return isApiEnabled()
}

export { mapProfile as mapApiGenomeProfile }
