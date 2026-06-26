// ─── Academic Hierarchy ───────────────────────────────────────────────────────
// Board → Grade → Subject → Chapter → Topic → Question

export type UserRole = 'student' | 'tutor' | 'admin'

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
}

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
}

export interface Institution {
  id: string
  name: string
  type: 'school' | 'coaching' | 'tuition' | 'training'
  boardIds: string[]
  studentCount: number
  tutorCount: number
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
}

export interface InstitutionCenter {
  id: string
  name: string
  city: string
  studentCount: number
  batchCount: number
}

export interface StudentMasterProfile {
  id: string
  name: string
  board: string
  grade: string
  batch: string
  centerId: string
  academicYear: string
  schoolName?: string
  email?: string
  status: 'active' | 'inactive'
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
}

export type StudyPlanTaskType = 'Revise' | 'Practice' | 'Assessment' | 'Review'

export interface StudyPlanDay {
  id: string
  day: number
  focus: string
  type: StudyPlanTaskType
  mins: number
  topic?: string
  done: boolean
}

export interface StudyPlan {
  id: string
  title: string
  board: string
  grade: string
  subject: string
  batchName?: string
  studentIds: string[]
  targetScore?: number
  baselineScore?: number
  durationDays: number
  days: StudyPlanDay[]
  status: 'draft' | 'active' | 'completed'
  createdByTutorId: string
  createdAt: string
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
  source: 'upload' | 'custom'
  parentPaperId?: string
}

export interface AssessmentAttendanceRecord {
  studentId: string
  studentName: string
  status: 'attended' | 'absent' | 'pending'
  score?: number
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
  valid: boolean
  errors: string[]
}

export interface BatchTopicWeakness {
  rank: number
  topic: string
  avgMastery: number
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
