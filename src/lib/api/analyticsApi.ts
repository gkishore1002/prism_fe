import { apiFetch, ApiError } from '@/lib/apiClient'
import type {
  AcademicHealth,
  AssessmentResult,
  AssessmentReport,
  StudentAssessmentSummary,
  BatchTopicWeakness,
  ClassInsight,
  Institution,
  InstitutionCenter,
  LearningGap,
  OverallPerformanceReport,
  ReadinessPrediction,
  RecoveryStep,
  StudentWiseReport,
  TopicReadinessPrediction,
} from '@/types'

export interface InstitutionOverview {
  institution: Institution
  totalStudents: number
  tutorCount: number
  byBoard: { board: string; count: number }[]
  avgImprovement: number
  parentNps: number
  retention: number
  avgHealth: number
  avgReadiness: number
}

export interface InstitutionOperationalStats {
  totalStudents: number
  activeStudents: number
  inactiveStudents: number
  totalCenters: number
  totalStaff?: number
  tutorCount?: number
  adminCount?: number
  activeStaff?: number
  staffUnassigned?: number
  assessmentsTotal?: number
  assessmentsLive?: number
  assessmentsScheduled?: number
  assessmentsCompleted?: number
  assessmentsDraft?: number
  assessmentsOverdue?: number
  studentHealthExcellent?: number
  studentHealthGood?: number
  studentHealthSupport?: number
  studentHealthAtRisk?: number
  curriculumProgress?: number
  cscDueSoon: number
  cscInactive: number
  cscNeverVisited: number
  reassignmentPending: number
  reassignmentApproved: number
  reassignmentRejected: number
}

export interface BranchSubjectMatrix {
  subjects: string[]
  branches: Record<string, string | number>[]
  series: { subject: string; points: { branch: string; health: number }[] }[]
}

export interface StudentProfileAnalytics {
  id: string
  name: string
  board: string
  grade: string
  batch: string
  centerId?: string
  academicYear?: string
  healthScore: number
  readiness: number
  improvement: number
  streak: number
  status: string
}

export interface CenterAnalytics extends InstitutionCenter {
  students: number
  avg: number
  retention: number
  nps: number
  growth: number
  topicMastery?: number
}

export interface BoardReportRow {
  board: string
  students: number
  avg: number
  improvement: number
  atRisk: number
  syllabus: number
  topSubject: string
  weakSubject: string
}

export interface TeacherRow {
  id: string
  name: string
  email?: string
  subject: string
  students: number
  improved: number
  growth: number
  readiness: number
}

export interface TutorCopilotAnalytics {
  headline: string
  subject: string
  batchName: string
  studentCount: number
  avgScore: number
  strongTopics: string[]
  weakTopics: string[]
  expectedImprovement: number
}

export interface AtRiskStudent {
  name: string
  grade: number
  board: string
  reason: string
  risk: number
}

export interface StudentMasterRow {
  id: string
  name: string
  board: string
  grade: string
  batch: string
  batchIds?: string[]
  centerId: string
  academicYear: string
  schoolName?: string | null
  email?: string | null
  status: 'active' | 'inactive'
  lastCscInteractionAt?: string | null
  disableReason?: string | null
  daysUntilCscDisable?: number | null
}

function withScopeQuery(path: string, centerId?: string, academicYearId?: string): string {
  const params = new URLSearchParams()
  if (centerId) params.set('center_id', centerId)
  if (academicYearId) params.set('academic_year_id', academicYearId)
  const qs = params.toString()
  if (!qs) return path
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}${qs}`
}

export const analyticsApi = {
  institutionOverview: (centerId?: string, academicYearId?: string) =>
    apiFetch<InstitutionOverview>(withScopeQuery('/analytics/institution/overview', centerId, academicYearId)),
  institutionOperationalStats: (centerId?: string, academicYearId?: string) =>
    apiFetch<InstitutionOperationalStats>(
      withScopeQuery('/analytics/institution/operational-stats', centerId, academicYearId),
    ),
  institutionCenters: (centerId?: string, academicYearId?: string) =>
    apiFetch<CenterAnalytics[]>(withScopeQuery('/analytics/institution/centers', centerId, academicYearId)),
  branchSubjectMatrix: (centerId?: string, academicYearId?: string) =>
    apiFetch<BranchSubjectMatrix>(
      withScopeQuery('/analytics/institution/branch-subject-matrix', centerId, academicYearId),
    ),
  institutionBoards: (centerId?: string, academicYearId?: string) =>
    apiFetch<BoardReportRow[]>(withScopeQuery('/analytics/institution/boards', centerId, academicYearId)),
  institutionTeachers: (centerId?: string, academicYearId?: string) =>
    apiFetch<TeacherRow[]>(withScopeQuery('/analytics/institution/teachers', centerId, academicYearId)),
  hardestTopics: (centerId?: string, academicYearId?: string) =>
    apiFetch<{ topic: string; correct: number }[]>(
      withScopeQuery('/analytics/institution/hardest-topics', centerId, academicYearId),
    ),
  syllabusCompletion: (centerId?: string, academicYearId?: string) =>
    apiFetch<Record<string, number | string>[]>(
      withScopeQuery('/analytics/institution/syllabus', centerId, academicYearId),
    ),
  monthlyTrend: (centerId?: string, academicYearId?: string) =>
    apiFetch<{ month: string; score: number }[]>(
      withScopeQuery('/analytics/institution/monthly-trend', centerId, academicYearId),
    ),
  subjectHealth: (centerId?: string, academicYearId?: string) =>
    apiFetch<{ subject: string; health: number }[]>(
      withScopeQuery('/analytics/institution/subject-health', centerId, academicYearId),
    ),
  studentMaster: (centerId?: string, academicYearId?: string) =>
    apiFetch<StudentMasterRow[]>(withScopeQuery('/analytics/students/master', centerId, academicYearId)),
  tutorNames: () => apiFetch<Record<string, string>>('/analytics/users/tutor-names'),

  studentProfile: (studentId?: string) =>
    apiFetch<StudentProfileAnalytics>(`/analytics/student/profile${studentId ? `?student_id=${studentId}` : ''}`),
  studentHealth: (studentId?: string) =>
    apiFetch<AcademicHealth>(`/analytics/student/health${studentId ? `?student_id=${studentId}` : ''}`),
  learningGaps: (studentId?: string) =>
    apiFetch<LearningGap[]>(`/analytics/student/gaps${studentId ? `?student_id=${studentId}` : ''}`),
  recoveryPlan: (studentId?: string) =>
    apiFetch<RecoveryStep[]>(`/analytics/student/recovery${studentId ? `?student_id=${studentId}` : ''}`),
  readiness: (studentId?: string) =>
    apiFetch<ReadinessPrediction[]>(`/analytics/student/readiness${studentId ? `?student_id=${studentId}` : ''}`),
  improvementTrend: (studentId?: string) =>
    apiFetch<{ month: string; score: number }[]>(`/analytics/student/improvement-trend${studentId ? `?student_id=${studentId}` : ''}`),
  topicBreakdown: (studentId?: string) =>
    apiFetch<TopicReadinessPrediction[]>(`/analytics/student/topic-breakdown${studentId ? `?student_id=${studentId}` : ''}`),
  topicReadiness: (studentId?: string) =>
    apiFetch<TopicReadinessPrediction[]>(`/analytics/student/topic-readiness${studentId ? `?student_id=${studentId}` : ''}`),
  studentSubjects: (studentId?: string) =>
    apiFetch<{ name: string; health: number; status: string }[]>(`/analytics/student/subjects${studentId ? `?student_id=${studentId}` : ''}`),
  recentAssessments: (studentId?: string) =>
    apiFetch<AssessmentResult[]>(`/analytics/student/recent-assessments${studentId ? `?student_id=${studentId}` : ''}`),
  studentReport: (studentId?: string) =>
    apiFetch<StudentWiseReport>(`/analytics/student/report${studentId ? `?student_id=${studentId}` : ''}`),
  overallReport: (studentId?: string) =>
    apiFetch<OverallPerformanceReport>(`/analytics/student/overall-report${studentId ? `?student_id=${studentId}` : ''}`),
  assessmentReports: (studentId?: string) =>
    apiFetch<AssessmentReport[]>(`/analytics/student/assessment-reports${studentId ? `?student_id=${studentId}` : ''}`),
  assessmentReport: (assessmentId: string, studentId?: string) =>
    apiFetch<AssessmentReport>(
      `/analytics/student/assessment-reports/${encodeURIComponent(assessmentId)}${studentId ? `?student_id=${studentId}` : ''}`,
    ),
  assessmentReportSummary: (assessmentId: string, studentId?: string) =>
    apiFetch<StudentAssessmentSummary>(
      `/analytics/student/assessment-reports/${encodeURIComponent(assessmentId)}/summary${studentId ? `?student_id=${studentId}` : ''}`,
    ),
  monthlyReports: (studentId?: string) =>
    apiFetch<{ period: string; health: number; readiness: number; improvement: number }[]>(`/analytics/student/monthly-reports${studentId ? `?student_id=${studentId}` : ''}`),
  progressAlerts: (studentId?: string) =>
    apiFetch<{ type: string; message: string; href: string }[]>(`/analytics/student/alerts${studentId ? `?student_id=${studentId}` : ''}`),

  /** Non-critical fetches — returns null/empty on failure instead of throwing */
  studentReportSafe: async (studentId?: string) => {
    try {
      return await apiFetch<StudentWiseReport>(`/analytics/student/report${studentId ? `?student_id=${studentId}` : ''}`)
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null
      throw e
    }
  },

  tutorTopicWeakness: (batchId?: string, batchName?: string, centerId?: string, academicYearId?: string) => {
    const params = new URLSearchParams()
    if (batchId) params.set('batch_id', batchId)
    else if (batchName) params.set('batch_name', batchName)
    if (centerId) params.set('center_id', centerId)
    if (academicYearId) params.set('academic_year_id', academicYearId)
    const qs = params.toString()
    return apiFetch<BatchTopicWeakness[]>(`/analytics/tutor/topic-weakness${qs ? `?${qs}` : ''}`)
  },
  tutorAtRisk: (batchId?: string, batchName?: string, centerId?: string, academicYearId?: string) => {
    const params = new URLSearchParams()
    if (batchId) params.set('batch_id', batchId)
    else if (batchName) params.set('batch_name', batchName)
    if (centerId) params.set('center_id', centerId)
    if (academicYearId) params.set('academic_year_id', academicYearId)
    const qs = params.toString()
    return apiFetch<AtRiskStudent[]>(`/analytics/tutor/at-risk${qs ? `?${qs}` : ''}`)
  },
  tutorBatchHeatmap: (batchId?: string, batchName?: string, centerId?: string, academicYearId?: string) => {
    const params = new URLSearchParams()
    if (batchId) params.set('batch_id', batchId)
    else if (batchName) params.set('batch_name', batchName)
    if (centerId) params.set('center_id', centerId)
    if (academicYearId) params.set('academic_year_id', academicYearId)
    const qs = params.toString()
    return apiFetch<{ topic: string; mastery: number }[]>(
      `/analytics/tutor/batch-heatmap${qs ? `?${qs}` : ''}`,
    )
  },
  classInsights: (centerId?: string, batchId?: string, academicYearId?: string) => {
    const params = new URLSearchParams()
    if (centerId) params.set('center_id', centerId)
    if (batchId) params.set('batch_id', batchId)
    if (academicYearId) params.set('academic_year_id', academicYearId)
    const qs = params.toString()
    return apiFetch<ClassInsight[]>(`/analytics/tutor/class-insights${qs ? `?${qs}` : ''}`)
  },
  tutorCopilot: (batchName?: string, centerId?: string, academicYearId?: string) => {
    const params = new URLSearchParams()
    if (batchName) params.set('batch_name', batchName)
    if (centerId) params.set('center_id', centerId)
    if (academicYearId) params.set('academic_year_id', academicYearId)
    const qs = params.toString()
    return apiFetch<TutorCopilotAnalytics>(`/analytics/tutor/copilot${qs ? `?${qs}` : ''}`)
  },
  subjectStudents: (subject: string) =>
    apiFetch<
      {
        id: string
        name: string
        grade: string
        health: number
        readiness: number
        batch: string
        topics: { name: string; mastery: number }[]
      }[]
    >(`/analytics/subjects/${encodeURIComponent(subject)}/students`),
  subjectTopics: (subject: string) =>
    apiFetch<{ name: string; mastery: number }[]>(
      `/analytics/subjects/${encodeURIComponent(subject)}/topics`,
    ),
}
