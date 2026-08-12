// ─── Academic Hierarchy ───────────────────────────────────────────────────────
// Board → Grade → Subject → Chapter → Topic → Question

export type UserRole = 'student' | 'tutor' | 'admin' | 'super_user'

export interface Board {
  id: string
  name: string
  code: string
}

export interface Grade {
  id: string
  boardId: string
  name: string
  level: number
}

export interface Subject {
  id: string
  gradeId: string
  name: string
  icon: string
  color: string
}

export interface Chapter {
  id: string
  subjectId: string
  name: string
  order: number
}

export interface Topic {
  id: string
  chapterId: string
  name: string
  weight: number
}

export interface Question {
  id: string
  topicId: string
  text: string
  difficulty: 'easy' | 'medium' | 'hard'
  marks: number
}

// ─── Intelligence Models ─────────────────────────────────────────────────────

export type HealthStatus = 'excellent' | 'good' | 'fair' | 'weak' | 'critical'

export interface TopicMastery {
  topicId: string
  topicName: string
  chapterName: string
  subjectName: string
  mastery: number
  trend: number
  questionsAttempted: number
  status: HealthStatus
}

/** Per-topic predictive readiness (current mastery → likely exam %). */
export interface TopicReadinessPrediction {
  topic: string
  topicId?: string
  subject: string
  mastery: number
  currentMastery?: number
  predictedScore?: number
  delta?: number
  confidence?: 'high' | 'medium' | 'low'
  attemptCount?: number
  drivers?: string[]
  status: string
}

export interface LearningGap {
  id: string
  topicId: string
  topicName: string
  subjectName: string
  severity: 'high' | 'medium' | 'low'
  impactOnScore: number
  rootCause: string
  recommendedAction: string
}

export interface RecoveryStep {
  id: string
  topicName: string
  subjectName: string
  action: string
  estimatedHours: number
  expectedGain: number
  priority: number
  completed: boolean
}

export interface ReadinessPrediction {
  subjectId: string
  subjectName: string
  currentReadiness: number
  projectedReadiness: number
  examDate: string
  confidenceLevel: 'high' | 'medium' | 'low'
}

export interface AssessmentResult {
  id: string
  assessmentId?: string
  title: string
  subjectName: string
  date: string
  score: number
  maxScore: number
  accuracy: number
  timeSpent: number
  weakTopics: string[]
  strongTopics: string[]
  insight: string
}

export interface StudentWiseReport {
  studentId: string
  health: number
  readiness: number
  improvement: number
  avgAccuracy: number
  status: HealthStatus
  criticalGaps: number
  strongTopics: string[]
  weakTopics: string[]
  recentTests: { title: string; date: string; accuracy: number; subject: string }[]
  insight: string
  summary?: string
  summarySource?: 'vertex' | 'rule-based'
  reportType?: 'snapshot' | 'overall'
}

export interface AssessmentSubjectScore {
  subject: string
  score: number
  maxScore: number
  accuracy: number
}

export interface AssessmentReport {
  id: string
  assessmentId: string
  studentId: string
  submissionId?: string | null
  assessmentTitle: string
  subject: string
  score: number
  maxScore: number
  accuracy: number
  classAvg?: number | null
  rankInClass?: number | null
  totalInClass?: number | null
  timeSpentMin: number
  submittedAt: string
  subjectScores: AssessmentSubjectScore[]
  strongTopics: string[]
  weakTopics: string[]
  summary: string
  summaryTa?: string
  studentMessageEn?: string
  studentMessageTa?: string
  summarySource: 'vertex' | 'rule-based'
  computedAt: string
  reportType: 'assessment'
}

export interface OverallPerformanceReport {
  studentId: string
  studentName: string
  board: string
  grade: string
  batch: string
  health: number
  readiness: number
  improvement: number
  avgAccuracy: number
  status: HealthStatus
  criticalGaps: number
  improving: boolean
  subjectHealth: { name: string; health: number; status: string }[]
  learningGaps: LearningGap[]
  readinessPredictions: ReadinessPrediction[]
  improvementTrend: { month: string; score: number }[]
  topicBreakdown: TopicReadinessPrediction[]
  monthlyReports: { period: string; health: number; readiness: number; improvement: number }[]
  recoveryPlan: RecoveryStep[]
  recentAssessments: AssessmentResult[]
  strongTopics: string[]
  weakTopics: string[]
  summary: string
  summaryTa?: string
  summarySource: 'vertex' | 'rule-based'
  reportType: 'overall'
}

export interface StudentAssessmentSummary {
  assessmentId: string
  assessmentTitle: string
  subject: string
  submittedAt: string
  accuracy: number
  studentMessageEn: string
  studentMessageTa: string
  cscReferralEn: string
  cscReferralTa: string
}

export interface AssessmentAccessRequest {
  id: string
  assessmentId: string
  assessmentTitle: string
  studentId: string
  studentName: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: string
  reviewedBy?: string | null
  reviewedAt?: string | null
  reviewNotes?: string | null
  accessGrantedUntil?: string | null
}

export interface AssessmentPolicy {
  defaultExtensionDays: number
  maxExtensionDays: number
  allowTutorExtension: boolean
  allowAdminOverride: boolean
  requireRejectionReason: boolean
  allowMultipleRequests: boolean
}

export interface CscPolicy {
  inactivityThresholdDays: number
  warningThresholdDays: number
  reminder30Days: boolean
  reminder14Days: boolean
  reminder7Days: boolean
  autoDisable: boolean
  autoReactivateOnCollection: boolean
}

export interface InstitutionPolicies {
  assessment: AssessmentPolicy
  csc: CscPolicy
}

export interface AccessRequestReviewContext {
  request: {
    id: string
    status: string
    reason: string
    requestedAt: string
    reviewedAt?: string | null
    reviewNotes?: string | null
    accessGrantedUntil?: string | null
  }
  student: { id: string; name: string; board: string; grade: string }
  assessment: {
    id: string
    title: string
    subject: string
    deadline?: string | null
    deadlineFormatted?: string | null
    today: string
    todayFormatted?: string | null
    daysOverdue?: number | null
  }
  requestDetails: {
    studentName: string
    assessmentTitle: string
    deadline?: string | null
    deadlineFormatted?: string | null
    daysOverdue?: number | null
    previousAttemptsOnAssessment: number
    reason: string
    requestedOn: string
    previousRequestsOnAssessment: number
  }
  studentPerformance: {
    averagePct?: number | null
    previousAttempts: number
    attendancePct?: number | null
  }
  previousRequests: {
    total: number
    approved: number
    rejected: number
    pending: number
    items: {
      id: string
      assessmentId: string
      assessmentTitle: string
      status: string
      requestedAt: string
      reviewedAt?: string | null
    }[]
  }
  policies: AssessmentPolicy
}

export interface ReportCollectionLog {
  id: string
  studentId: string
  reportKind: 'assessment' | 'overall' | 'monthly'
  reportRef: string
  collectedAt: string
  collectedByUserId: string
  collectedByName: string
  guardianName?: string | null
  notes?: string | null
}

export interface StudentExamAttendance {
  assessmentId: string
  assessmentTitle: string
  subject: string
  submittedAt: string
  score: number
  maxScore: number
  accuracyPct: number
  timeSpentMin: number
  status: string
}

export interface StudentAccessRequest {
  id: string
  assessmentId: string
  assessmentTitle: string
  studentId: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: string
  reviewedBy?: string | null
  reviewedByName?: string | null
  reviewedAt?: string | null
  reviewNotes?: string | null
  accessGrantedUntil?: string | null
}

export interface StudentTracking {
  studentId: string
  studentName: string
  lastCscInteractionAt?: string | null
  daysUntilCscDisable?: number | null
  lastCollectedByName?: string | null
  lastCollectionGuardianName?: string | null
  examAttendances: StudentExamAttendance[]
  reportCollections: ReportCollectionLog[]
  accessRequests: StudentAccessRequest[]
}

export type ReportLanguage = 'en' | 'ta'

export interface AcademicHealth {
  overall: number
  status: HealthStatus
  trend: number
  subjects: {
    subjectId: string
    subjectName: string
    health: number
    status: HealthStatus
    trend: number
  }[]
}

// ─── User Models ─────────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  institutionId: string
  gradeId?: string
  boardId?: string
  isOwner?: boolean
}

export interface Institution {
  /** Whole coaching chain / school — one Prism tenant (e.g. BrightPath Academy). */
  id: string
  name: string
  /** Internal org code — visible to organization owner and platform super user only. */
  code?: string
  type: 'school' | 'coaching' | 'tuition' | 'training'
  boardIds: string[]
  studentCount: number
  tutorCount: number
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationKind = 'info' | 'success' | 'warning' | 'risk' | 'ai'

export type NotificationType =
  | 'general'
  | 'reassignment_requested'
  | 'reassignment_approved'
  | 'reassignment_rejected'
  | 'csc_reminder_30'
  | 'csc_reminder_14'
  | 'csc_reminder_7'
  | 'csc_inactive'
  | 'csc_student_reminder_30'
  | 'csc_student_reminder_14'
  | 'csc_student_reminder_7'
  | 'csc_student_inactive'

export interface AppNotification {
  id: string
  userId?: string | null
  role: UserRole
  type: NotificationType | string
  kind: NotificationKind
  title: string
  message: string
  entityType?: string | null
  entityId?: string | null
  createdAt: string // ISO string
  read: boolean
  href?: string
}

// ─── Tutor Intelligence ──────────────────────────────────────────────────────

export interface StudentSummary {
  id: string
  name: string
  grade: string
  health: number
  status: HealthStatus
  readiness: number
  lastAssessment: string
  criticalGaps: number
  improving: boolean
  board?: string
  batch?: string
  centerId?: string
  academicYear?: string
  lastCscInteractionAt?: string | null
  daysUntilCscDisable?: number | null
  lastCollectedByName?: string | null
  lastCollectionGuardianName?: string | null
}

export interface InstitutionCenter {
  /** Physical branch within an organization (internal: center). */
  id: string
  name: string
  code?: string
  city: string
  active?: boolean
  studentCount: number
  batchCount: number
}

export interface StudentMasterProfile {
  id: string
  name: string
  board: string
  grade: string
  batch: string
  batchIds?: string[]
  centerId?: string
  academicYear: string
  schoolName?: string
  email?: string
  status: 'active' | 'inactive'
  lastCscInteractionAt?: string | null
  disableReason?: string | null
  daysUntilCscDisable?: number | null
}

export interface ClassInsight {
  id: string
  title: string
  description: string
  affectedStudents: number
  topicName: string
  subjectName: string
  severity: 'high' | 'medium' | 'low'
  suggestedIntervention: string
}

export interface TutorBatch {
  id: string
  name: string
  board: string
  grade: string
  subject?: string
  scheduleTiming?: string
  studentIds: string[]
  avgScore?: number
}

export interface TutorCopilotSummary {
  board: string
  grade: string
  subject: string
  batchName: string
  studentCount: number
  strongTopics: string[]
  weakTopics: string[]
  nextClass: string
  expectedImprovement: number
  avgScore: number
}

export interface TutorAssessmentSchedule {
  id: string
  title: string
  board: string
  grade: string
  subject: string
  scope: 'subject' | 'chapter' | 'topic'
  mode: 'practice' | 'assessment'
  batchName: string
  questionCount: number
  durationMinutes: number
  scheduledAt: string
  availableUntil?: string
  status: 'draft' | 'scheduled' | 'live' | 'completed'
  classAvg?: number
  centerIds: string[]
  selectedQuestionIds: string[]
  assignedStudentIds: string[]
  createdByTutorId?: string
  chapter?: string
  topic?: string
  questionPaperId?: string
  paperCoverage?: 'full' | 'selected_topics'
  selectedTopics?: string[]
  /** True when this student has already submitted (cannot retake). */
  studentSubmitted?: boolean
  timingOver?: boolean
  accessRequestStatus?: 'pending' | 'approved' | 'rejected' | null
  canAttend?: boolean
}

export interface QuestionBankEntry {
  id: string
  board: string
  grade: string
  subject: string
  chapter: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  marks: number
  questionType: 'mcq' | 'short' | 'long'
  text: string
  status: 'active' | 'draft'
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
  correctAnswer?: string
}

export interface QuestionPaper {
  id: string
  name: string
  board: string
  grade: string
  subject: string
  questionIds: string[]
  topics: string[]
  totalMarks: number
  createdAt: string
  createdBy?: string
  source: 'upload' | 'custom' | 'manual'
  parentPaperId?: string
}

export interface AssessmentAttendanceRecord {
  studentId: string
  studentName: string
  status: 'attended' | 'absent' | 'pending'
  score?: number
  maxScore?: number
  timeSpentMin?: number
  submittedAt?: string
}

export interface QuestionUploadRow {
  row: number
  board: string
  grade: string
  subject: string
  chapter: string
  topic: string
  difficulty: string
  marks: number
  questionType: string
  text: string
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
  correctAnswer?: string
  valid: boolean
  errors: string[]
}

export interface BatchTopicWeakness {
  rank: number
  topic: string
  avgMastery: number
  avgPredictedScore?: number
  suggestedNextClass: string
  expectedGain?: number
}

// ─── Admin Intelligence ──────────────────────────────────────────────────────

export interface InstitutionMetric {
  label: string
  value: number | string
  change: number
  trend: 'up' | 'down' | 'neutral'
}

export interface BoardPerformance {
  boardId: string
  boardName: string
  avgHealth: number
  studentCount: number
  assessmentCount: number
  improvementRate: number
}

export interface NavItem {
  label: string
  href: string
  icon: string
  badge?: number
}
